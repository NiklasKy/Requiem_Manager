import discord
from discord.ext import commands
from discord import app_commands
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class TrackingCog(commands.Cog):
    """Cog for tracking user activities and providing statistics"""
    
    def __init__(self, bot):
        self.bot = bot
    
    @app_commands.command(name="user_stats", description="Get statistics for a specific user")
    @app_commands.describe(user="The user to get statistics for")
    async def user_stats(self, interaction: discord.Interaction, user: discord.Member = None):
        """Get statistics for a specific user"""
        if user is None:
            user = interaction.user
        
        try:
            stats = await self.bot.db.get_user_stats(user.id)
            
            embed = discord.Embed(
                title=f"User Statistics for {user.display_name}",
                color=discord.Color.blue(),
                timestamp=datetime.utcnow()
            )
            
            embed.set_thumbnail(url=user.display_avatar.url)
            
            # Basic info
            embed.add_field(
                name="User Info",
                value=f"**ID:** {user.id}\n**Username:** {user.name}\n**Display Name:** {user.display_name}",
                inline=False
            )
            
            # Join info
            if user.joined_at:
                embed.add_field(
                    name="Joined Server",
                    value=f"<t:{int(user.joined_at.timestamp())}:F>",
                    inline=True
                )
            
            # Account creation
            embed.add_field(
                name="Account Created",
                value=f"<t:{int(user.created_at.timestamp())}:F>",
                inline=True
            )
            
            # Statistics from database
            if stats:
                embed.add_field(
                    name="Activity Statistics",
                    value=f"**Username Changes:** {stats.get('username_changes', 0)}\n"
                          f"**Nickname Changes:** {stats.get('nickname_changes', 0)}\n"
                          f"**Role Changes:** {stats.get('role_changes', 0)}",
                    inline=False
                )
                
                # Last activity
                last_activity = stats.get('last_activity')
                if last_activity:
                    embed.add_field(
                        name="Last Activity",
                        value=f"<t:{int(last_activity.timestamp())}:R>",
                        inline=True
                    )
            
            # Current roles
            if user.roles[1:]:  # Exclude @everyone role
                roles = [role.mention for role in user.roles[1:]]
                embed.add_field(
                    name=f"Roles ({len(roles)})",
                    value=" ".join(roles) if len(" ".join(roles)) <= 1024 else f"{len(roles)} roles",
                    inline=False
                )
            
            await interaction.response.send_message(embed=embed)
            
        except Exception as e:
            logger.error(f"Error getting user stats: {e}")
            await interaction.response.send_message(
                "❌ An error occurred while fetching user statistics.",
                ephemeral=True
            )
    
    @app_commands.command(name="server_stats", description="Get server tracking statistics")
    async def server_stats(self, interaction: discord.Interaction):
        """Get overall server statistics"""
        try:
            stats = await self.bot.db.get_server_stats(interaction.guild.id)
            
            embed = discord.Embed(
                title=f"Server Statistics for {interaction.guild.name}",
                color=discord.Color.green(),
                timestamp=datetime.utcnow()
            )
            
            if interaction.guild.icon:
                embed.set_thumbnail(url=interaction.guild.icon.url)
            
            # Server info
            embed.add_field(
                name="Server Info",
                value=f"**Members:** {interaction.guild.member_count}\n"
                      f"**Created:** <t:{int(interaction.guild.created_at.timestamp())}:F>",
                inline=False
            )
            
            # Tracking statistics
            if stats:
                embed.add_field(
                    name="Tracking Statistics",
                    value=f"**Total Users Tracked:** {stats.get('total_users', 0)}\n"
                          f"**Username Changes:** {stats.get('total_username_changes', 0)}\n"
                          f"**Nickname Changes:** {stats.get('total_nickname_changes', 0)}\n"
                          f"**Role Changes:** {stats.get('total_role_changes', 0)}",
                    inline=False
                )
                
                # Recent activity
                embed.add_field(
                    name="Recent Activity (Last 24h)",
                    value=f"**New Members:** {stats.get('new_members_24h', 0)}\n"
                          f"**Left Members:** {stats.get('left_members_24h', 0)}\n"
                          f"**Name Changes:** {stats.get('name_changes_24h', 0)}",
                    inline=False
                )
            
            await interaction.response.send_message(embed=embed)
            
        except Exception as e:
            logger.error(f"Error getting server stats: {e}")
            await interaction.response.send_message(
                "❌ An error occurred while fetching server statistics.",
                ephemeral=True
            )
    
    @app_commands.command(name="recent_changes", description="Show recent username/nickname changes")
    @app_commands.describe(limit="Number of changes to show (max 25)")
    async def recent_changes(self, interaction: discord.Interaction, limit: int = 10):
        """Show recent username and nickname changes"""
        if limit > 25:
            limit = 25
        
        try:
            changes = await self.bot.db.get_recent_changes(interaction.guild.id, limit)
            
            embed = discord.Embed(
                title="Recent Name Changes",
                color=discord.Color.orange(),
                timestamp=datetime.utcnow()
            )
            
            if not changes:
                embed.description = "No recent name changes found."
            else:
                for change in changes:
                    user = interaction.guild.get_member(change['user_id'])
                    user_mention = user.mention if user else f"<@{change['user_id']}>"
                    
                    change_type = "Username" if change['type'] == 'username' else "Nickname"
                    
                    embed.add_field(
                        name=f"{change_type} Change",
                        value=f"**User:** {user_mention}\n"
                              f"**From:** {change['old_value']}\n"
                              f"**To:** {change['new_value']}\n"
                              f"**When:** <t:{int(change['timestamp'].timestamp())}:R>",
                        inline=False
                    )
            
            await interaction.response.send_message(embed=embed)
            
        except Exception as e:
            logger.error(f"Error getting recent changes: {e}")
            await interaction.response.send_message(
                "❌ An error occurred while fetching recent changes.",
                ephemeral=True
            )
    
    @app_commands.command(name="role_history", description="Show role change history for a user")
    @app_commands.describe(user="The user to get role history for")
    async def role_history(self, interaction: discord.Interaction, user: discord.Member):
        """Show role change history for a specific user"""
        try:
            history = await self.bot.db.get_role_history(user.id, interaction.guild.id)
            
            embed = discord.Embed(
                title=f"Role History for {user.display_name}",
                color=discord.Color.purple(),
                timestamp=datetime.utcnow()
            )
            
            embed.set_thumbnail(url=user.display_avatar.url)
            
            if not history:
                embed.description = "No role changes found for this user."
            else:
                for change in history[:10]:  # Limit to last 10 changes
                    action = "Added" if change['action'] == 'added' else "Removed"
                    role_name = change['role_name'] or f"<@&{change['role_id']}>"
                    
                    embed.add_field(
                        name=f"Role {action}",
                        value=f"**Role:** {role_name}\n"
                              f"**When:** <t:{int(change['timestamp'].timestamp())}:R>",
                        inline=True
                    )
            
            await interaction.response.send_message(embed=embed)
            
        except Exception as e:
            logger.error(f"Error getting role history: {e}")
            await interaction.response.send_message(
                "❌ An error occurred while fetching role history.",
                ephemeral=True
            )

async def setup(bot):
    await bot.add_cog(TrackingCog(bot))
