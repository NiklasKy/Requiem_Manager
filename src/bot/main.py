import asyncio
import os
import logging
from pathlib import Path
import discord
from discord.ext import commands
from dotenv import load_dotenv
from src.database.database import Database

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('bot.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class RequiemBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.members = True
        intents.message_content = True
        intents.presences = True
        
        super().__init__(
            command_prefix='!',
            intents=intents,
            help_command=None
        )
        
        self.db = None
        
    async def setup_hook(self):
        """Called when the bot is starting up"""
        logger.info("Setting up bot...")
        
        # Initialize database
        db_path = os.getenv('DATABASE_PATH', './data/tracking.db')
        self.db = Database(db_path)
        await self.db.initialize()
        
        # Load cogs
        cogs_to_load = [
            'src.bot.cogs.tracking',
            'src.bot.cogs.admin',
            'src.bot.cogs.activity_recognition'
        ]
        
        for cog in cogs_to_load:
            try:
                await self.load_extension(cog)
                logger.info(f"Loaded cog: {cog}")
            except Exception as e:
                logger.error(f"Failed to load cog {cog}: {e}")
        
        # Sync slash commands
        try:
            guild_id = os.getenv('DISCORD_GUILD_ID')
            if guild_id:
                guild = discord.Object(id=int(guild_id))
                # Copy global commands to guild before syncing
                self.tree.copy_global_to(guild=guild)
                synced = await self.tree.sync(guild=guild)
                logger.info(f"Synced {len(synced)} commands to guild {guild_id}")
            else:
                synced = await self.tree.sync()
                logger.info(f"Synced {len(synced)} commands globally")
        except Exception as e:
            logger.error(f"Failed to sync commands: {e}")
    
    async def on_ready(self):
        """Called when the bot is ready"""
        logger.info(f'{self.user} has connected to Discord!')
        logger.info(f'Bot is in {len(self.guilds)} guilds')
        
        # Set bot activity
        await self.change_presence(
            activity=discord.Activity(
                type=discord.ActivityType.watching,
                name="user activities"
            )
        )
        
        # Clean up any duplicate initial role entries from previous runs
        await self.db.cleanup_duplicate_initial_roles()
        
        # Initial inventory of all guild members
        await self.initial_inventory()
    
    async def initial_inventory(self):
        """Perform initial inventory of all guild members"""
        if not self.db:
            logger.error("Database not available for initial inventory")
            return
        
        logger.info("Starting initial inventory of all guild members...")
        
        total_members = 0
        for guild in self.guilds:
            logger.info(f"Inventorying guild: {guild.name} (ID: {guild.id})")
            
            try:
                # First, sync all roles in the guild
                logger.info(f"Syncing {len(guild.roles)} roles for {guild.name}")
                for role in guild.roles:
                    if role.name != "@everyone":  # Skip @everyone role
                        await self.db.upsert_role(role)
                
                # Get all members (this might take a while for large servers)
                members = []
                async for member in guild.fetch_members(limit=None):
                    members.append(member)
                
                logger.info(f"Found {len(members)} members in {guild.name}")
                
                # Process members in batches to avoid overwhelming the database
                batch_size = 50
                for i in range(0, len(members), batch_size):
                    batch = members[i:i + batch_size]
                    
                    for member in batch:
                        try:
                            # Add/update user and guild member info
                            await self.db.upsert_guild_member(member)
                            total_members += 1
                            
                            # Log current roles for this member
                            if len(member.roles) > 1:  # Exclude @everyone role
                                for role in member.roles[1:]:  # Skip @everyone
                                    await self.db._log_initial_role(member, role)
                            
                        except Exception as e:
                            logger.error(f"Error processing member {member.display_name}: {e}")
                    
                    # Small delay between batches
                    await asyncio.sleep(0.1)
                
                logger.info(f"Completed inventory for {guild.name}: {len(members)} members")
                
            except Exception as e:
                logger.error(f"Error inventorying guild {guild.name}: {e}")
        
        logger.info(f"Initial inventory completed! Processed {total_members} total members.")
    
    async def on_member_join(self, member):
        """Called when a member joins the guild"""
        if self.db:
            await self.db.log_user_join(member)
            logger.info(f"Logged join event for {member.display_name}")
    
    async def on_member_remove(self, member):
        """Called when a member leaves the guild"""
        if self.db:
            await self.db.log_user_leave(member)
            logger.info(f"Logged leave event for {member.display_name}")
    
    async def on_member_update(self, before, after):
        """Called when a member's profile is updated"""
        if self.db:
            # Check for nickname changes
            if before.display_name != after.display_name:
                await self.db.log_nickname_change(before, after)
                logger.info(f"Logged nickname change for {after.id}: {before.display_name} -> {after.display_name}")
            
            # Check for role changes
            if before.roles != after.roles:
                await self.db.log_role_change(before, after)
                logger.info(f"Logged role change for {after.display_name}")
    
    async def on_user_update(self, before, after):
        """Called when a user's profile is updated"""
        if self.db and before.name != after.name:
            await self.db.log_username_change(before, after)
            logger.info(f"Logged username change for {after.id}: {before.name} -> {after.name}")

async def main():
    """Main function to run the bot"""
    # Create data directory if it doesn't exist
    data_dir = Path('./data')
    data_dir.mkdir(exist_ok=True)
    
    # Get Discord token
    token = os.getenv('DISCORD_TOKEN')
    if not token:
        logger.error("DISCORD_TOKEN not found in environment variables")
        return
    
    # Create and run bot
    bot = RequiemBot()
    
    try:
        await bot.start(token)
    except KeyboardInterrupt:
        logger.info("Bot shutdown requested")
    except Exception as e:
        logger.error(f"Bot encountered an error: {e}")
    finally:
        if bot.db:
            await bot.db.close()
        await bot.close()

if __name__ == '__main__':
    asyncio.run(main())
