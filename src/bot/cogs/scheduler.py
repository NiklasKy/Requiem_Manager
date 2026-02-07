import discord
from discord import app_commands
from discord.ext import commands, tasks
import logging
from datetime import datetime, timedelta
from typing import Optional, List
import asyncio
import os

logger = logging.getLogger(__name__)

class ScheduleAddModal(discord.ui.Modal, title="Add Scheduled Message"):
    """Modal for adding a scheduled message with multiline input"""
    
    message = discord.ui.TextInput(
        label="Message Content",
        style=discord.TextStyle.paragraph,
        placeholder="Enter your message here...\nSupports **Markdown** formatting and emojis! 🎉",
        required=True,
        max_length=2000
    )
    
    def __init__(self, bot, scheduler_cog, name, channel, interval_days, interval_hours, interval_minutes, start_time, roles):
        super().__init__()
        self.bot = bot
        self.scheduler_cog = scheduler_cog
        self.name = name
        self.channel = channel
        self.interval_days = interval_days
        self.interval_hours = interval_hours
        self.interval_minutes = interval_minutes
        self.start_time = start_time
        self.roles = roles
    
    async def on_submit(self, interaction: discord.Interaction):
        """Called when the modal is submitted"""
        try:
            await interaction.response.defer()
            
            message_content = self.message.value
            
            # Validate interval
            if self.interval_days == 0 and self.interval_hours == 0 and self.interval_minutes == 0:
                await interaction.followup.send(
                    "❌ The interval must be at least 1 minute!",
                    ephemeral=True
                )
                return
            
            # Parse start_time if provided
            next_run = None
            if self.start_time:
                try:
                    formats = [
                        "%Y-%m-%d %H:%M",
                        "%Y-%m-%d %H:%M:%S",
                        "%d.%m.%Y %H:%M",
                        "%d.%m.%Y %H:%M:%S"
                    ]
                    
                    for fmt in formats:
                        try:
                            next_run = datetime.strptime(self.start_time, fmt)
                            break
                        except ValueError:
                            continue
                    
                    if next_run is None:
                        await interaction.followup.send(
                            "❌ Invalid time format! Use: `YYYY-MM-DD HH:MM` (e.g. 2026-02-02 18:00)\n"
                            "Or: `DD.MM.YYYY HH:MM` (e.g. 02.02.2026 18:00)\n"
                            "⚠️ **Important: Times must be in UTC timezone!**",
                            ephemeral=True
                        )
                        return
                    
                    # Check if start_time is in the past
                    if next_run < datetime.utcnow():
                        total_minutes = self.interval_days * 24 * 60 + self.interval_hours * 60 + self.interval_minutes
                        minutes_delta = timedelta(minutes=total_minutes)
                        
                        time_diff = datetime.utcnow() - next_run
                        intervals_to_skip = int(time_diff.total_seconds() / minutes_delta.total_seconds()) + 1
                        next_run = next_run + (minutes_delta * intervals_to_skip)
                        
                        logger.info(f"Start time was in the past, adjusted to next occurrence: {next_run}")
                    
                except Exception as e:
                    await interaction.followup.send(
                        f"❌ Error parsing start time: {str(e)}\n"
                        "Format: `YYYY-MM-DD HH:MM` (e.g. 2026-02-02 18:00)\n"
                        "⚠️ **Important: Times must be in UTC timezone!**",
                        ephemeral=True
                    )
                    return
            else:
                # Calculate next run time from now
                next_run = datetime.utcnow() + timedelta(
                    days=self.interval_days,
                    hours=self.interval_hours,
                    minutes=self.interval_minutes
                )
            
            # Parse roles if provided
            role_ids = []
            if self.roles:
                role_mentions = self.roles.split()
                for mention in role_mentions:
                    if mention.startswith('<@&') and mention.endswith('>'):
                        role_id = int(mention[3:-1])
                        role = interaction.guild.get_role(role_id)
                        if role:
                            role_ids.append(role_id)
                        else:
                            await interaction.followup.send(
                                f"❌ Role with ID {role_id} not found!",
                                ephemeral=True
                            )
                            return
            
            # Add to database
            message_id = await self.bot.db.add_scheduled_message(
                guild_id=interaction.guild_id,
                name=self.name,
                channel_id=self.channel.id,
                message=message_content,
                interval_days=self.interval_days,
                interval_hours=self.interval_hours,
                interval_minutes=self.interval_minutes,
                role_ids=role_ids,
                next_run=next_run,
                embed_title=self.name
            )
            
            # Build confirmation embed
            role_mentions = []
            for role_id in role_ids:
                role = interaction.guild.get_role(role_id)
                if role:
                    role_mentions.append(role.mention)
            
            interval_text = self.scheduler_cog._format_interval(self.interval_minutes, self.interval_hours, self.interval_days)
            next_run_text = discord.utils.format_dt(next_run, style='R')
            next_run_full = discord.utils.format_dt(next_run, style='F')
            
            embed = discord.Embed(
                title="✅ Scheduled Message Added",
                color=discord.Color.green()
            )
            embed.add_field(name="ID", value=str(message_id), inline=True)
            embed.add_field(name="Title", value=self.name, inline=True)
            embed.add_field(name="Channel", value=self.channel.mention, inline=True)
            embed.add_field(name="Interval", value=interval_text, inline=True)
            embed.add_field(name="First Run (UTC)", value=f"{next_run_full}\n({next_run_text})", inline=False)
            
            if role_mentions:
                embed.add_field(
                    name="Roles to Ping",
                    value=", ".join(role_mentions),
                    inline=False
                )
            
            embed.add_field(name="Message Preview", value=message_content[:1024], inline=False)
            embed.add_field(name="Format", value="📋 Will be sent as embed with nice formatting", inline=False)
            
            if self.start_time:
                embed.set_footer(text="💡 Custom start time was used (UTC timezone)")
            else:
                embed.set_footer(text="⏰ All times are in UTC timezone")
            
            await interaction.followup.send(embed=embed)
            
            logger.info(f"Added scheduled message {message_id} in guild {interaction.guild_id}")
            
        except Exception as e:
            logger.error(f"Error in ScheduleAddModal: {e}")
            await interaction.followup.send(
                f"❌ Error adding scheduled message: {str(e)}",
                ephemeral=True
            )


class ScheduleEditModal(discord.ui.Modal, title="Edit Scheduled Message"):
    """Modal for editing a scheduled message with multiline input"""
    
    message = discord.ui.TextInput(
        label="Message Content (leave empty to keep current)",
        style=discord.TextStyle.paragraph,
        placeholder="Enter new message...\nSupports **Markdown** and emojis! Leave empty to keep current.",
        required=False,
        max_length=2000
    )
    
    def __init__(self, bot, scheduler_cog, message_id, guild_id, current_message, name, channel, interval_days, interval_hours, interval_minutes, start_time, roles):
        super().__init__()
        self.bot = bot
        self.scheduler_cog = scheduler_cog
        self.message_id = message_id
        self.guild_id = guild_id
        self.current_message = current_message
        self.name = name
        self.channel = channel
        self.interval_days = interval_days
        self.interval_hours = interval_hours
        self.interval_minutes = interval_minutes
        self.start_time = start_time
        self.roles = roles
        
        # Pre-fill with current message
        if current_message and 'message' in current_message:
            self.message.default = current_message['message']
    
    async def on_submit(self, interaction: discord.Interaction):
        """Called when the modal is submitted"""
        try:
            await interaction.response.defer()
            
            message_content = self.message.value if self.message.value else None
            
            # Validate interval if provided
            if self.interval_days is not None or self.interval_hours is not None or self.interval_minutes is not None:
                check_days = self.interval_days if self.interval_days is not None else self.current_message.get('interval_days', 0)
                check_hours = self.interval_hours if self.interval_hours is not None else self.current_message.get('interval_hours', 0)
                check_minutes = self.interval_minutes if self.interval_minutes is not None else self.current_message.get('interval_minutes', 60)
                
                if check_days == 0 and check_hours == 0 and check_minutes == 0:
                    await interaction.followup.send(
                        "❌ The interval must be at least 1 minute!",
                        ephemeral=True
                    )
                    return
            
            # Parse start_time if provided
            next_run = None
            if self.start_time:
                try:
                    formats = [
                        "%Y-%m-%d %H:%M",
                        "%Y-%m-%d %H:%M:%S",
                        "%d.%m.%Y %H:%M",
                        "%d.%m.%Y %H:%M:%S"
                    ]
                    
                    for fmt in formats:
                        try:
                            next_run = datetime.strptime(self.start_time, fmt)
                            break
                        except ValueError:
                            continue
                    
                    if next_run is None:
                        await interaction.followup.send(
                            "❌ Invalid time format! Use: `YYYY-MM-DD HH:MM` (e.g. 2026-02-02 18:00)\n"
                            "Or: `DD.MM.YYYY HH:MM` (e.g. 02.02.2026 18:00)\n"
                            "⚠️ **Important: Times must be in UTC timezone!**",
                            ephemeral=True
                        )
                        return
                    
                    # Check if start_time is in the past
                    if next_run < datetime.utcnow():
                        use_days = self.interval_days if self.interval_days is not None else self.current_message['interval_days']
                        use_hours = self.interval_hours if self.interval_hours is not None else self.current_message['interval_hours']
                        use_minutes = self.interval_minutes if self.interval_minutes is not None else self.current_message['interval_minutes']
                        
                        total_minutes = use_days * 24 * 60 + use_hours * 60 + use_minutes
                        minutes_delta = timedelta(minutes=total_minutes)
                        
                        time_diff = datetime.utcnow() - next_run
                        intervals_to_skip = int(time_diff.total_seconds() / minutes_delta.total_seconds()) + 1
                        next_run = next_run + (minutes_delta * intervals_to_skip)
                        
                        logger.info(f"Start time was in the past, adjusted to next occurrence: {next_run}")
                    
                except Exception as e:
                    await interaction.followup.send(
                        f"❌ Error parsing start time: {str(e)}\n"
                        "Format: `YYYY-MM-DD HH:MM` (e.g. 2026-02-02 18:00)\n"
                        "⚠️ **Important: Times must be in UTC timezone!**",
                        ephemeral=True
                    )
                    return
            
            # Parse roles if provided
            role_ids = None
            if self.roles is not None:
                if self.roles.lower() == 'none':
                    role_ids = []
                else:
                    role_ids = []
                    role_mentions = self.roles.split()
                    for mention in role_mentions:
                        if mention.startswith('<@&') and mention.endswith('>'):
                            role_id = int(mention[3:-1])
                            role = interaction.guild.get_role(role_id)
                            if role:
                                role_ids.append(role_id)
                            else:
                                await interaction.followup.send(
                                    f"❌ Role with ID {role_id} not found!",
                                    ephemeral=True
                                )
                                return
            
            # Update in database
            success = await self.bot.db.update_scheduled_message(
                message_id=self.message_id,
                guild_id=self.guild_id,
                name=self.name,
                channel_id=self.channel.id if self.channel else None,
                message=message_content,
                interval_days=self.interval_days,
                interval_hours=self.interval_hours,
                interval_minutes=self.interval_minutes,
                role_ids=role_ids,
                next_run=next_run
            )
            
            if success:
                # Build confirmation embed
                embed = discord.Embed(
                    title="✅ Scheduled Message Updated",
                    description=f"Successfully updated message ID {self.message_id}",
                    color=discord.Color.green()
                )
                
                # Show what was updated
                changes = []
                if self.name:
                    changes.append(f"**Title:** {self.name}")
                if self.channel:
                    changes.append(f"**Channel:** {self.channel.mention}")
                if message_content:
                    preview = message_content[:100] + "..." if len(message_content) > 100 else message_content
                    changes.append(f"**Message:** {preview}")
                if self.interval_days is not None or self.interval_hours is not None or self.interval_minutes is not None:
                    use_days = self.interval_days if self.interval_days is not None else self.current_message['interval_days']
                    use_hours = self.interval_hours if self.interval_hours is not None else self.current_message['interval_hours']
                    use_minutes = self.interval_minutes if self.interval_minutes is not None else self.current_message['interval_minutes']
                    interval_text = self.scheduler_cog._format_interval(use_minutes, use_hours, use_days)
                    changes.append(f"**Interval:** {interval_text}")
                if next_run:
                    next_run_text = discord.utils.format_dt(next_run, style='F')
                    changes.append(f"**Next Run (UTC):** {next_run_text}")
                if role_ids is not None:
                    if role_ids:
                        role_mentions = []
                        for role_id in role_ids:
                            role = interaction.guild.get_role(role_id)
                            if role:
                                role_mentions.append(role.mention)
                        changes.append(f"**Roles:** {', '.join(role_mentions)}")
                    else:
                        changes.append(f"**Roles:** None (removed)")
                
                if changes:
                    embed.add_field(
                        name="Updated Fields",
                        value="\n".join(changes),
                        inline=False
                    )
                
                embed.set_footer(text="⏰ All times are in UTC timezone")
                
                await interaction.followup.send(embed=embed)
                logger.info(f"Updated scheduled message {self.message_id} in guild {self.guild_id}")
            else:
                await interaction.followup.send(
                    f"❌ Failed to update scheduled message!",
                    ephemeral=True
                )
            
        except Exception as e:
            logger.error(f"Error in ScheduleEditModal: {e}")
            await interaction.followup.send(
                f"❌ Error editing scheduled message: {str(e)}",
                ephemeral=True
            )


class SchedulerCog(commands.Cog):
    """Message Scheduler Cog for scheduling recurring messages"""
    
    def __init__(self, bot):
        self.bot = bot
        
        # Load authorized role IDs and user IDs from environment
        self.admin_role_ids = self._parse_ids(os.getenv('ADMIN_ROLE_IDS', ''))
        self.mod_role_ids = self._parse_ids(os.getenv('MOD_ROLE_IDS', ''))
        self.admin_user_ids = self._parse_ids(os.getenv('ADMIN_USER_IDS', ''))
        
        logger.info(f"Scheduler - Admin roles: {len(self.admin_role_ids)}, Mod roles: {len(self.mod_role_ids)}, Admin users: {len(self.admin_user_ids)}")
        
        self.check_scheduled_messages.start()
        logger.info("Scheduler Cog initialized")
    
    def _parse_ids(self, ids_str: str) -> set:
        """Parse comma-separated IDs (role or user) from environment variable"""
        if not ids_str:
            return set()
        try:
            return {int(id_val.strip()) for id_val in ids_str.split(',') if id_val.strip()}
        except ValueError as e:
            logger.error(f"Error parsing IDs from '{ids_str}': {e}")
            return set()
    
    def _has_admin_authorization(self, member: discord.Member) -> bool:
        """Check if member has admin/moderator role OR is an admin user"""
        # Check if user is in admin user list
        if member.id in self.admin_user_ids:
            return True
        
        # Check if user has admin or moderator role
        member_role_ids = {role.id for role in member.roles}
        return bool(member_role_ids & (self.admin_role_ids | self.mod_role_ids))
    
    def cog_unload(self):
        """Clean up when cog is unloaded"""
        self.check_scheduled_messages.cancel()
    
    @tasks.loop(minutes=1)
    async def check_scheduled_messages(self):
        """Background task that checks for messages to send every minute"""
        try:
            if not self.bot.db:
                return
            
            # Get all messages that should be sent now
            messages = await self.bot.db.get_messages_to_send()
            
            for msg_data in messages:
                try:
                    # Get the channel
                    channel = self.bot.get_channel(msg_data['channel_id'])
                    if not channel:
                        logger.warning(f"Channel {msg_data['channel_id']} not found for scheduled message {msg_data['id']}")
                        continue
                    
                    # Build role mentions if specified
                    role_mentions_str = None
                    if msg_data['role_ids']:
                        role_ids = [int(rid) for rid in msg_data['role_ids'].split(',')]
                        mentions = []
                        
                        for role_id in role_ids:
                            role = channel.guild.get_role(role_id)
                            if role:
                                mentions.append(role.mention)
                            else:
                                logger.warning(f"Role {role_id} not found")
                        
                        if mentions:
                            role_mentions_str = ' '.join(mentions)
                    
                    # Always send as embed
                    embed = discord.Embed(
                        title=msg_data.get('embed_title') or msg_data['name'],
                        description=msg_data['message'],
                        color=msg_data.get('embed_color', 3447003)  # Default blue color
                    )
                    
                    # Send with role mentions as content (for pings)
                    if role_mentions_str:
                        await channel.send(content=role_mentions_str, embed=embed)
                    else:
                        await channel.send(embed=embed)
                    
                    logger.info(f"Sent scheduled message {msg_data['id']} to channel {channel.name}")
                    
                    # Update next run time
                    await self.bot.db.update_scheduled_message_next_run(msg_data['id'])
                    
                except Exception as e:
                    logger.error(f"Error sending scheduled message {msg_data['id']}: {e}")
                    
        except Exception as e:
            logger.error(f"Error in check_scheduled_messages: {e}")
    
    @check_scheduled_messages.before_loop
    async def before_check_scheduled_messages(self):
        """Wait for bot to be ready before starting the loop"""
        await self.bot.wait_until_ready()
    
    @app_commands.command(name="schedule_list", description="Show all scheduled messages")
    async def schedule_list(self, interaction: discord.Interaction):
        """List all scheduled messages"""
        # Check authorization
        if not self._has_admin_authorization(interaction.user):
            await interaction.response.send_message(
                "❌ You need administrator permissions to use this command.",
                ephemeral=True
            )
            return
        
        try:
            await interaction.response.defer()
            
            messages = await self.bot.db.get_scheduled_messages(interaction.guild_id)
            
            if not messages:
                embed = discord.Embed(
                    title="📅 Scheduled Messages",
                    description="No scheduled messages found.",
                    color=discord.Color.blue()
                )
                await interaction.followup.send(embed=embed)
                return
            
            # Create embeds (Discord has a limit of 10 fields per embed)
            embeds = []
            current_embed = discord.Embed(
                title="📅 Scheduled Messages",
                color=discord.Color.blue()
            )
            
            for i, msg in enumerate(messages):
                # Get channel name
                channel = self.bot.get_channel(msg['channel_id'])
                channel_name = channel.mention if channel else f"Unknown Channel ({msg['channel_id']})"
                
                # Get role names
                role_names = []
                if msg['role_ids']:
                    role_ids = [int(rid) for rid in msg['role_ids'].split(',')]
                    for role_id in role_ids:
                        role = interaction.guild.get_role(role_id)
                        if role:
                            role_names.append(role.mention)
                
                roles_text = ", ".join(role_names) if role_names else "No roles"
                
                # Format interval
                interval_text = self._format_interval(
                    msg['interval_minutes'],
                    msg['interval_hours'],
                    msg['interval_days']
                )
                
                # Format next run
                next_run = datetime.fromisoformat(msg['next_run'])
                next_run_text = discord.utils.format_dt(next_run, style='R')
                
                # Message preview (max 100 chars)
                message_preview = msg['message']
                if len(message_preview) > 100:
                    message_preview = message_preview[:97] + "..."
                
                field_value = (
                    f"**Channel:** {channel_name}\n"
                    f"**Interval:** {interval_text}\n"
                    f"**Next Run (UTC):** {next_run_text}\n"
                    f"**Roles:** {roles_text}\n"
                    f"**Message:** {message_preview}\n"
                    f"**Active:** {'✅ Yes' if msg['is_active'] else '❌ No'}"
                )
                
                # If we have 10 fields, create a new embed
                if len(current_embed.fields) >= 10:
                    embeds.append(current_embed)
                    current_embed = discord.Embed(
                        title="📅 Scheduled Messages (Continued)",
                        color=discord.Color.blue()
                    )
                
                current_embed.add_field(
                    name=f"ID: {msg['id']} - {msg['name'][:40]}",
                    value=field_value,
                    inline=False
                )
            
            # Add the last embed
            if current_embed.fields:
                embeds.append(current_embed)
            
            # Send all embeds
            for embed in embeds:
                await interaction.followup.send(embed=embed)
            
        except Exception as e:
            logger.error(f"Error in schedule_list: {e}")
            await interaction.followup.send(
                f"❌ Error fetching scheduled messages: {str(e)}",
                ephemeral=True
            )
    
    @app_commands.command(name="schedule_add", description="Add a new scheduled message (always sent as embed)")
    @app_commands.describe(
        name="Title for the embed message",
        channel="Channel where the message should be sent",
        interval_days="Interval in days (0 = no days)",
        interval_hours="Interval in hours (0 = no hours)",
        interval_minutes="Interval in minutes (0 = no minutes)",
        start_time="First execution in UTC (Format: YYYY-MM-DD HH:MM UTC, e.g. 2026-02-02 18:00) - Optional",
        roles="Roles to ping (select with @Role, separate multiple with space) - Sent as separate ping"
    )
    async def schedule_add(
        self,
        interaction: discord.Interaction,
        name: str,
        channel: discord.TextChannel,
        interval_days: int = 0,
        interval_hours: int = 0,
        interval_minutes: int = 0,
        start_time: str = None,
        roles: str = None
    ):
        """Add a new scheduled message - Opens a modal for message input"""
        # Check authorization
        if not self._has_admin_authorization(interaction.user):
            await interaction.response.send_message(
                "❌ You need administrator permissions to use this command.",
                ephemeral=True
            )
            return
        
        # Create a modal for message input
        modal = ScheduleAddModal(
            bot=self.bot,
            scheduler_cog=self,
            name=name,
            channel=channel,
            interval_days=interval_days,
            interval_hours=interval_hours,
            interval_minutes=interval_minutes,
            start_time=start_time,
            roles=roles
        )
        
        await interaction.response.send_modal(modal)
    
    @app_commands.command(name="schedule_remove", description="Remove a scheduled message")
    @app_commands.describe(
        message_id="ID of the message to remove"
    )
    async def schedule_remove(
        self,
        interaction: discord.Interaction,
        message_id: int
    ):
        """Remove a scheduled message"""
        # Check authorization
        if not self._has_admin_authorization(interaction.user):
            await interaction.response.send_message(
                "❌ You need administrator permissions to use this command.",
                ephemeral=True
            )
            return
        
        try:
            await interaction.response.defer()
            
            # Get message info before deletion
            messages = await self.bot.db.get_scheduled_messages(interaction.guild_id)
            message_info = None
            for msg in messages:
                if msg['id'] == message_id:
                    message_info = msg
                    break
            
            if not message_info:
                await interaction.followup.send(
                    f"❌ Scheduled message with ID {message_id} not found!",
                    ephemeral=True
                )
                return
            
            # Remove from database
            success = await self.bot.db.remove_scheduled_message(message_id, interaction.guild_id)
            
            if success:
                embed = discord.Embed(
                    title="✅ Scheduled Message Removed",
                    description=f"**{message_info['name']}** (ID: {message_id}) was successfully deleted.",
                    color=discord.Color.green()
                )
                await interaction.followup.send(embed=embed)
                logger.info(f"Removed scheduled message {message_id} from guild {interaction.guild_id}")
            else:
                await interaction.followup.send(
                    f"❌ Error removing scheduled message!",
                    ephemeral=True
                )
            
        except Exception as e:
            logger.error(f"Error in schedule_remove: {e}")
            await interaction.followup.send(
                f"❌ Error removing scheduled message: {str(e)}",
                ephemeral=True
            )
    
    @app_commands.command(name="schedule_toggle", description="Enable/Disable a scheduled message")
    @app_commands.describe(
        message_id="ID of the message"
    )
    async def schedule_toggle(
        self,
        interaction: discord.Interaction,
        message_id: int
    ):
        """Toggle a scheduled message active/inactive"""
        # Check authorization
        if not self._has_admin_authorization(interaction.user):
            await interaction.response.send_message(
                "❌ You need administrator permissions to use this command.",
                ephemeral=True
            )
            return
        
        try:
            await interaction.response.defer()
            
            # Toggle in database
            new_state = await self.bot.db.toggle_scheduled_message(message_id, interaction.guild_id)
            
            if new_state is not None:
                status_text = "enabled" if new_state else "disabled"
                emoji = "✅" if new_state else "⏸️"
                
                embed = discord.Embed(
                    title=f"{emoji} Scheduled Message {status_text.capitalize()}",
                    description=f"The scheduled message with ID {message_id} was {status_text}.",
                    color=discord.Color.green() if new_state else discord.Color.orange()
                )
                await interaction.followup.send(embed=embed)
                logger.info(f"Toggled scheduled message {message_id} to {new_state}")
            else:
                await interaction.followup.send(
                    f"❌ Scheduled message with ID {message_id} not found!",
                    ephemeral=True
                )
            
        except Exception as e:
            logger.error(f"Error in schedule_toggle: {e}")
            await interaction.followup.send(
                f"❌ Error toggling scheduled message: {str(e)}",
                ephemeral=True
            )
    
    @app_commands.command(name="schedule_edit", description="Edit an existing scheduled message")
    @app_commands.describe(
        message_id="ID of the message to edit",
        name="New title (leave empty to keep current)",
        channel="New channel (leave empty to keep current)",
        interval_days="New interval in days (leave empty to keep current)",
        interval_hours="New interval in hours (leave empty to keep current)",
        interval_minutes="New interval in minutes (leave empty to keep current)",
        start_time="New first execution in UTC (Format: YYYY-MM-DD HH:MM UTC) - Optional",
        roles="New roles to ping (select with @Role) - Use 'none' to remove all roles"
    )
    async def schedule_edit(
        self,
        interaction: discord.Interaction,
        message_id: int,
        name: str = None,
        channel: discord.TextChannel = None,
        interval_days: int = None,
        interval_hours: int = None,
        interval_minutes: int = None,
        start_time: str = None,
        roles: str = None
    ):
        """Edit an existing scheduled message - Opens a modal for message input"""
        # Check authorization
        if not self._has_admin_authorization(interaction.user):
            await interaction.response.send_message(
                "❌ You need administrator permissions to use this command.",
                ephemeral=True
            )
            return
        
        # Get current message to verify it exists
        messages = await self.bot.db.get_scheduled_messages(interaction.guild_id)
        current_msg = None
        for msg in messages:
            if msg['id'] == message_id:
                current_msg = msg
                break
        
        if not current_msg:
            await interaction.response.send_message(
                f"❌ Scheduled message with ID {message_id} not found!",
                ephemeral=True
            )
            return
        
        # Create a modal for message input
        modal = ScheduleEditModal(
            bot=self.bot,
            scheduler_cog=self,
            message_id=message_id,
            guild_id=interaction.guild_id,
            current_message=current_msg,
            name=name,
            channel=channel,
            interval_days=interval_days,
            interval_hours=interval_hours,
            interval_minutes=interval_minutes,
            start_time=start_time,
            roles=roles
        )
        
        await interaction.response.send_modal(modal)
    
    def _format_interval(self, minutes: int, hours: int, days: int) -> str:
        """Format interval as human-readable string"""
        parts = []
        if days > 0:
            parts.append(f"{days} day(s)")
        if hours > 0:
            parts.append(f"{hours} hour(s)")
        if minutes > 0:
            parts.append(f"{minutes} minute(s)")
        
        return ", ".join(parts) if parts else "No interval"


async def setup(bot):
    """Setup function to add the cog to the bot"""
    await bot.add_cog(SchedulerCog(bot))
