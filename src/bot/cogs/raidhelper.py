import discord
from discord.ext import commands
from discord import app_commands
import logging
from datetime import datetime, timezone
import aiohttp
import os

logger = logging.getLogger(__name__)

class RaidHelperCog(commands.Cog):
    """Cog for Raid-Helper integration and event management"""
    
    def __init__(self, bot):
        self.bot = bot
        self.api_key = os.getenv('RAIDHELPER_API_KEY')
        self.server_id = os.getenv('DISCORD_GUILD_ID')
        
        if not self.api_key:
            logger.warning("RAIDHELPER_API_KEY not configured. Raid-Helper commands will not work.")
        if not self.server_id:
            logger.warning("DISCORD_GUILD_ID not configured. Raid-Helper commands will not work.")
    
    async def get_raid_helper_events(self):
        """Get all events from Raid-Helper API"""
        if not self.api_key or not self.server_id:
            raise ValueError("Raid-Helper API not configured")
        
        url = f"https://raid-helper.dev/api/v3/servers/{self.server_id}/events"
        headers = {
            "Authorization": self.api_key,
            "Content-Type": "application/json"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Raid-Helper API error: {response.status} - {error_text}")
                    raise Exception(f"Raid-Helper API returned status {response.status}")
                
                data = await response.json()
                return data.get('postedEvents', [])
    
    async def get_event_signups_v2(self, event_id: str):
        """Get signups for a specific event using API v2 (which returns ALL signups)"""
        if not self.api_key:
            raise ValueError("Raid-Helper API not configured")
        
        # Use API v2 for getting event details with ALL signups
        url = f"https://raid-helper.dev/api/v2/events/{event_id}"
        headers = {
            "Authorization": self.api_key,
            "Content-Type": "application/json"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Raid-Helper API v2 error: {response.status} - {error_text}")
                    raise Exception(f"Raid-Helper API v2 returned status {response.status}")
                
                data = await response.json()
                logger.info(f"Successfully fetched event data from API v2")
                return data
    
    @app_commands.command(
        name="events",
        description="List all active Raid-Helper events with their IDs"
    )
    async def list_events(self, interaction: discord.Interaction):
        """List all active events from Raid-Helper"""
        try:
            await interaction.response.defer()
            
            # Check if API is configured
            if not self.api_key or not self.server_id:
                await interaction.followup.send(
                    "❌ Raid-Helper API is not configured. Please set RAIDHELPER_API_KEY and RAIDHELPER_SERVER_ID.",
                    ephemeral=True
                )
                return
            
            # Get events
            all_events = await self.get_raid_helper_events()
            
            logger.info(f"Total events from API: {len(all_events)}")
            
            # Raid-Helper API returns timestamps in SECONDS
            now_timestamp = int(datetime.now(timezone.utc).timestamp())
            one_day_ago = now_timestamp - (24 * 60 * 60)
            
            # Split events into upcoming and recent past
            upcoming_events = []
            past_events = []
            
            for event in all_events:
                start_time = event.get('startTime', 0)
                
                if not start_time:
                    continue
                
                if start_time > now_timestamp:
                    # Future events
                    upcoming_events.append(event)
                elif start_time > one_day_ago:
                    # Past events (last 24h)
                    past_events.append(event)
            
            logger.info(f"Filtered: {len(upcoming_events)} upcoming, {len(past_events)} recent past")
            
            if not upcoming_events and not past_events:
                await interaction.followup.send("📅 No upcoming or recent events found.")
                return
            
            # Create embed
            embed = discord.Embed(
                title="📅 Raid-Helper Events",
                color=discord.Color.blue(),
                timestamp=datetime.now(timezone.utc)
            )
            
            # Sort events by start time
            upcoming_sorted = sorted(upcoming_events, key=lambda x: x.get('startTime', 0))
            past_sorted = sorted(past_events, key=lambda x: x.get('startTime', 0), reverse=True)
            
            # Count total fields we'll add
            total_fields = len(upcoming_sorted) + len(past_sorted)
            
            # Add upcoming events
            if upcoming_sorted:
                for idx, event in enumerate(upcoming_sorted[:15]):  # Limit to 15 upcoming
                    event_id = event.get('id', 'Unknown')
                    title = event.get('title', 'Untitled Event')
                    start_time = event.get('startTime', 0)
                    leader_id = event.get('leaderId', 'Unknown')
                    
                    # Format start time
                    time_str = f"<t:{start_time}:F>" if start_time else "No date set"
                    time_relative = f"<t:{start_time}:R>" if start_time else ""
                    
                    # Get leader mention
                    leader = interaction.guild.get_member(int(leader_id)) if leader_id != 'Unknown' else None
                    leader_str = leader.mention if leader else f"<@{leader_id}>"
                    
                    # Get signup count from advanced field (API v3)
                    # Note: signUps array in v3 only contains YOUR OWN signups, so we use signedUpUserCount
                    advanced = event.get('advanced', {})
                    signup_count = advanced.get('signedUpUserCount', 0)
                    
                    field_name = f"🔜 {title}" if idx == 0 else f"🎯 {title}"
                    
                    embed.add_field(
                        name=field_name,
                        value=f"**ID**: `{event_id}`\n"
                              f"**Start**: {time_str} ({time_relative})\n"
                              f"**Leader**: {leader_str}\n"
                              f"**Signups**: {signup_count}",
                        inline=False
                    )
            
            # Add separator if we have both upcoming and past events
            if upcoming_sorted and past_sorted and (len(upcoming_sorted) + len(past_sorted)) <= 24:
                embed.add_field(
                    name="─────────────────────",
                    value="**Recent Past Events (Last 24h)**",
                    inline=False
                )
            
            # Add past events (recent)
            if past_sorted:
                remaining_slots = 25 - len(upcoming_sorted) - (1 if upcoming_sorted and past_sorted else 0)
                for event in past_sorted[:remaining_slots]:
                    event_id = event.get('id', 'Unknown')
                    title = event.get('title', 'Untitled Event')
                    start_time = event.get('startTime', 0)
                    leader_id = event.get('leaderId', 'Unknown')
                    
                    # Format start time
                    time_str = f"<t:{start_time}:F>" if start_time else "No date set"
                    time_relative = f"<t:{start_time}:R>" if start_time else ""
                    
                    # Get leader mention
                    leader = interaction.guild.get_member(int(leader_id)) if leader_id != 'Unknown' else None
                    leader_str = leader.mention if leader else f"<@{leader_id}>"
                    
                    # Get signup count from advanced field (API v3)
                    # Note: signUps array in v3 only contains YOUR OWN signups, so we use signedUpUserCount
                    advanced = event.get('advanced', {})
                    signup_count = advanced.get('signedUpUserCount', 0)
                    
                    embed.add_field(
                        name=f"⏱️ {title}",
                        value=f"**ID**: `{event_id}`\n"
                              f"**Start**: {time_str} ({time_relative})\n"
                              f"**Leader**: {leader_str}\n"
                              f"**Signups**: {signup_count}",
                        inline=False
                    )
            
            # Update description with counts
            embed.description = f"**Upcoming**: {len(upcoming_sorted)} | **Recent Past**: {len(past_sorted)}"
            
            if total_fields > 25:
                embed.set_footer(text=f"Showing 25 of {total_fields} events (limited by Discord)")
            
            await interaction.followup.send(embed=embed)
            
        except Exception as e:
            logger.error(f"Error listing events: {e}")
            await interaction.followup.send(
                f"❌ Error fetching events: {str(e)}",
                ephemeral=True
            )
    
    @app_commands.command(
        name="checksignups",
        description="Compare role members with Raid-Helper event signups"
    )
    @app_commands.describe(
        role="The Discord role to check",
        event_id="The Raid-Helper event ID (use /events to get IDs)",
        filter="Filter results: all (default), signed (only signed up), or notsigned (only not signed up)"
    )
    @app_commands.choices(filter=[
        app_commands.Choice(name="All members", value="all"),
        app_commands.Choice(name="Only signed up", value="signed"),
        app_commands.Choice(name="Only NOT signed up", value="notsigned")
    ])
    async def check_signups(
        self,
        interaction: discord.Interaction,
        role: discord.Role,
        event_id: str,
        filter: str = "all"
    ):
        """Check which role members have signed up for an event"""
        try:
            await interaction.response.defer()
            
            # Check if API is configured
            if not self.api_key or not self.server_id:
                await interaction.followup.send(
                    "❌ Raid-Helper API is not configured. Please set RAIDHELPER_API_KEY and RAIDHELPER_SERVER_ID.",
                    ephemeral=True
                )
                return
            
            # Get event data from API v2 (which returns ALL signups, not just yours)
            event_data = await self.get_event_signups_v2(event_id)
            
            # Extract event info
            event_title = event_data.get('title', 'Unknown Event')
            
            # Get role members
            role_members = role.members
            role_member_ids = {str(member.id): member for member in role_members}
            
            # API v2 structure: signUps array contains ALL signups
            signups = event_data.get('signUps', [])
            
            logger.info(f"Found {len(signups)} total signups for event '{event_title}'")
            
            # Get signed up user IDs
            signed_up_ids = set()
            
            for signup in signups:
                user_id = signup.get('userId')
                if user_id:
                    signed_up_ids.add(str(user_id))
            
            logger.info(f"Extracted {len(signed_up_ids)} unique user IDs from signups")
            logger.info(f"Role has {len(role_member_ids)} members")
            
            # Compare
            signed_up = []
            not_signed_up = []
            
            for member_id, member in role_member_ids.items():
                if member_id in signed_up_ids:
                    signed_up.append(member)
                else:
                    not_signed_up.append(member)
            
            # Create embed
            filter_text = {
                "all": "All members",
                "signed": "Only signed up members",
                "notsigned": "Only NOT signed up members"
            }.get(filter, "All members")
            
            embed = discord.Embed(
                title=f"📊 Signup Check: {event_title}",
                description=f"**Role**: {role.mention}\n"
                           f"**Event ID**: `{event_id}`\n"
                           f"**Filter**: {filter_text}",
                color=discord.Color.green() if len(not_signed_up) == 0 else discord.Color.orange(),
                timestamp=datetime.now(timezone.utc)
            )
            
            # Add statistics
            total_members = len(role_members)
            signed_up_count = len(signed_up)
            not_signed_up_count = len(not_signed_up)
            percentage = (signed_up_count / total_members * 100) if total_members > 0 else 0
            
            embed.add_field(
                name="📈 Statistics",
                value=f"**Total Members**: {total_members}\n"
                      f"**Signed Up**: {signed_up_count} ({percentage:.1f}%)\n"
                      f"**Not Signed Up**: {not_signed_up_count}",
                inline=False
            )
            
            # Determine how many members to show based on filter
            # If showing both lists, limit to 20 each. If only one list, allow up to 50
            max_members_per_list = 50 if filter != "all" else 20
            
            # Add signed up members based on filter
            if filter in ["all", "signed"]:
                if signed_up:
                    if len(signed_up) <= max_members_per_list:
                        signed_up_str = "\n".join([f"✅ {member.mention}" for member in signed_up])
                        embed.add_field(
                            name=f"✅ Signed Up ({len(signed_up)})",
                            value=signed_up_str[:1024],  # Discord field limit
                            inline=False
                        )
                        # If still more to show, split into multiple fields
                        if len(signed_up_str) > 1024:
                            remaining = signed_up_str[1024:]
                            embed.add_field(
                                name="✅ Signed Up (continued)",
                                value=remaining[:1024],
                                inline=False
                            )
                    else:
                        # Show first members and indicate there are more
                        shown_members = signed_up[:max_members_per_list]
                        signed_up_str = "\n".join([f"✅ {member.mention}" for member in shown_members])
                        embed.add_field(
                            name=f"✅ Signed Up ({len(signed_up)})",
                            value=f"{signed_up_str[:1024]}\n... and {len(signed_up) - max_members_per_list} more",
                            inline=False
                        )
                elif filter == "signed":
                    embed.add_field(
                        name="✅ Signed Up",
                        value="No members signed up yet.",
                        inline=False
                    )
            
            # Add not signed up members based on filter
            if filter in ["all", "notsigned"]:
                if not_signed_up:
                    if len(not_signed_up) <= max_members_per_list:
                        not_signed_up_str = "\n".join([f"❌ {member.mention}" for member in not_signed_up])
                        embed.add_field(
                            name=f"❌ Not Signed Up ({len(not_signed_up)})",
                            value=not_signed_up_str[:1024],  # Discord field limit
                            inline=False
                        )
                        # If still more to show, split into multiple fields
                        if len(not_signed_up_str) > 1024:
                            remaining = not_signed_up_str[1024:]
                            embed.add_field(
                                name="❌ Not Signed Up (continued)",
                                value=remaining[:1024],
                                inline=False
                            )
                    else:
                        # Show first members and indicate there are more
                        shown_members = not_signed_up[:max_members_per_list]
                        not_signed_up_str = "\n".join([f"❌ {member.mention}" for member in shown_members])
                        embed.add_field(
                            name=f"❌ Not Signed Up ({len(not_signed_up)})",
                            value=f"{not_signed_up_str[:1024]}\n... and {len(not_signed_up) - max_members_per_list} more",
                            inline=False
                        )
                elif filter == "notsigned":
                    embed.add_field(
                        name="❌ Not Signed Up",
                        value="All members have signed up! 🎉",
                        inline=False
                    )
            
            # Add footer based on filter and status
            if filter == "signed":
                if signed_up_count > 0:
                    embed.set_footer(text=f"Showing {min(len(signed_up), max_members_per_list)} of {signed_up_count} signed up member(s)")
                else:
                    embed.set_footer(text="No signed up members to display")
            elif filter == "notsigned":
                if not_signed_up_count > 0:
                    embed.set_footer(text=f"⚠️ Showing {min(len(not_signed_up), max_members_per_list)} of {not_signed_up_count} member(s) who haven't signed up")
                else:
                    embed.set_footer(text="🎉 Everyone has signed up!")
            else:  # filter == "all"
                if not_signed_up_count == 0:
                    embed.set_footer(text="🎉 Everyone has signed up!")
                else:
                    embed.set_footer(text=f"⚠️ {not_signed_up_count} member(s) haven't signed up yet")
            
            await interaction.followup.send(embed=embed)
            
        except Exception as e:
            logger.error(f"Error checking signups: {e}")
            await interaction.followup.send(
                f"❌ Error checking signups: {str(e)}\n\nPlease verify the event ID is correct.",
                ephemeral=True
            )

async def setup(bot):
    await bot.add_cog(RaidHelperCog(bot))
