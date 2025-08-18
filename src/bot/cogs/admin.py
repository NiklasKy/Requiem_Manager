import discord
from discord.ext import commands
from discord import app_commands
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class AdminCog(commands.Cog):
    """Administrative commands for the bot"""
    
    def __init__(self, bot):
        self.bot = bot
    
    @app_commands.command(name="sync", description="Sync slash commands (Admin only)")
    @app_commands.default_permissions(administrator=True)
    async def sync(self, interaction: discord.Interaction):
        """Sync slash commands to the current guild"""
        try:
            synced = await self.bot.tree.sync(guild=interaction.guild)
            await interaction.response.send_message(
                f"✅ Synced {len(synced)} commands to this guild.",
                ephemeral=True
            )
            logger.info(f"Synced {len(synced)} commands to guild {interaction.guild.id}")
        except Exception as e:
            logger.error(f"Error syncing commands: {e}")
            await interaction.response.send_message(
                f"❌ Error syncing commands: {e}",
                ephemeral=True
            )
    
    @app_commands.command(name="database_stats", description="Get database statistics (Admin only)")
    @app_commands.default_permissions(administrator=True)
    async def database_stats(self, interaction: discord.Interaction):
        """Get database statistics"""
        try:
            stats = await self.bot.db.get_database_stats()
            
            embed = discord.Embed(
                title="Database Statistics",
                color=discord.Color.blue(),
                timestamp=datetime.utcnow()
            )
            
            embed.add_field(
                name="Table Counts",
                value=f"**Users:** {stats.get('user_count', 0)}\n"
                      f"**Username Changes:** {stats.get('username_changes', 0)}\n"
                      f"**Nickname Changes:** {stats.get('nickname_changes', 0)}\n"
                      f"**Role Changes:** {stats.get('role_changes', 0)}\n"
                      f"**Join/Leave Events:** {stats.get('join_leave_events', 0)}",
                inline=False
            )
            
            await interaction.response.send_message(embed=embed, ephemeral=True)
            
        except Exception as e:
            logger.error(f"Error getting database stats: {e}")
            await interaction.response.send_message(
                "❌ An error occurred while fetching database statistics.",
                ephemeral=True
            )
    
    @app_commands.command(name="cleanup_old_data", description="Clean up old tracking data (Admin only)")
    @app_commands.describe(days="Number of days to keep (default: 90)")
    @app_commands.default_permissions(administrator=True)
    async def cleanup_old_data(self, interaction: discord.Interaction, days: int = 90):
        """Clean up old tracking data"""
        if days < 7:
            await interaction.response.send_message(
                "❌ Minimum retention period is 7 days.",
                ephemeral=True
            )
            return
        
        try:
            deleted_count = await self.bot.db.cleanup_old_data(days)
            
            embed = discord.Embed(
                title="Data Cleanup Complete",
                color=discord.Color.green(),
                timestamp=datetime.utcnow()
            )
            
            embed.add_field(
                name="Results",
                value=f"**Records deleted:** {deleted_count}\n"
                      f"**Retention period:** {days} days",
                inline=False
            )
            
            await interaction.response.send_message(embed=embed, ephemeral=True)
            logger.info(f"Cleaned up {deleted_count} old records (>{days} days)")
            
        except Exception as e:
            logger.error(f"Error cleaning up data: {e}")
            await interaction.response.send_message(
                f"❌ Error cleaning up data: {e}",
                ephemeral=True
            )
    
    @app_commands.command(name="export_user_data", description="Export all data for a user (Admin only)")
    @app_commands.describe(user="The user to export data for")
    @app_commands.default_permissions(administrator=True)
    async def export_user_data(self, interaction: discord.Interaction, user: discord.Member):
        """Export all tracking data for a specific user"""
        try:
            data = await self.bot.db.export_user_data(user.id)
            
            if not data:
                await interaction.response.send_message(
                    f"No tracking data found for {user.display_name}.",
                    ephemeral=True
                )
                return
            
            # Create a summary embed
            embed = discord.Embed(
                title=f"Data Export for {user.display_name}",
                color=discord.Color.blue(),
                timestamp=datetime.utcnow()
            )
            
            embed.add_field(
                name="Export Summary",
                value=f"**Username Changes:** {len(data.get('username_changes', []))}\n"
                      f"**Nickname Changes:** {len(data.get('nickname_changes', []))}\n"
                      f"**Role Changes:** {len(data.get('role_changes', []))}\n"
                      f"**Join/Leave Events:** {len(data.get('join_leave_events', []))}",
                inline=False
            )
            
            # For now, just send the summary
            # In a production environment, you might want to create a file and send it
            await interaction.response.send_message(embed=embed, ephemeral=True)
            
        except Exception as e:
            logger.error(f"Error exporting user data: {e}")
            await interaction.response.send_message(
                f"❌ Error exporting user data: {e}",
                ephemeral=True
            )
    
    @app_commands.command(name="info", description="Get bot information")
    async def info(self, interaction: discord.Interaction):
        """Get information about the bot"""
        embed = discord.Embed(
            title="Requiem Tracking Bot",
            description="A Discord bot for tracking user activities and changes",
            color=discord.Color.blue(),
            timestamp=datetime.utcnow()
        )
        
        embed.set_thumbnail(url=self.bot.user.display_avatar.url)
        
        embed.add_field(
            name="Bot Information",
            value=f"**Guilds:** {len(self.bot.guilds)}\n"
                  f"**Users:** {len(self.bot.users)}\n"
                  f"**Latency:** {round(self.bot.latency * 1000)}ms",
            inline=True
        )
        
        embed.add_field(
            name="Features",
            value="• User activity tracking\n"
                  "• Username/nickname change logs\n"
                  "• Role change tracking\n"
                  "• Join/leave event logging\n"
                  "• Web dashboard",
            inline=True
        )
        
        embed.add_field(
            name="Commands",
            value="`/user_stats` - User statistics\n"
                  "`/server_stats` - Server statistics\n"
                  "`/recent_changes` - Recent changes\n"
                  "`/role_history` - Role history",
            inline=False
        )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="cleanup_duplicate_roles", description="Clean up duplicate initial role entries (Admin only)")
    @app_commands.default_permissions(administrator=True)
    async def cleanup_duplicate_roles(self, interaction: discord.Interaction):
        """Clean up duplicate 'initial' role entries from the database"""
        try:
            await interaction.response.defer(ephemeral=True)
            
            # Run the cleanup function
            await self.bot.db.cleanup_duplicate_initial_roles()
            
            embed = discord.Embed(
                title="🧹 Database Cleanup Completed",
                description="Successfully cleaned up duplicate initial role entries from the database.",
                color=discord.Color.green(),
                timestamp=datetime.utcnow()
            )
            
            embed.add_field(
                name="What was cleaned?",
                value="• Removed duplicate 'initial' role entries\n"
                      "• Kept only the oldest entry per user/role\n"
                      "• Role history is now cleaner",
                inline=False
            )
            
            await interaction.followup.send(embed=embed, ephemeral=True)
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
            await interaction.followup.send(
                "❌ An error occurred during cleanup. Check the logs for details.",
                ephemeral=True
            )

async def setup(bot):
    await bot.add_cog(AdminCog(bot))
