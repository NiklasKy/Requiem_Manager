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
    
    async def get_event_signups(self, event_id: str):
        """Get signups for a specific event"""
        if not self.api_key or not self.server_id:
            raise ValueError("Raid-Helper API not configured")
        
        url = f"https://raid-helper.dev/api/v2/servers/{self.server_id}/events/{event_id}"
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
                
                return await response.json()
    
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
            
            # Filter for upcoming/current events only
            # Raid-Helper API returns timestamps in SECONDS (not milliseconds)
            now_timestamp = int(datetime.now(timezone.utc).timestamp())
            one_day_ago = now_timestamp - (24 * 60 * 60)  # 24 hours ago in seconds
            
            events = []
            for event in all_events:
                start_time = event.get('startTime', 0)
                event_id = event.get('id', 'Unknown')
                title = event.get('title', 'Unknown')
                
                # Include events that:
                # 1. Have a valid startTime (not 0 or None)
                # 2. Are not older than 24 hours
                if start_time and start_time > one_day_ago:
                    events.append(event)
            
            logger.info(f"Filtered events: {len(events)} (from {len(all_events)} total)")
            
            if not events:
                await interaction.followup.send("📅 No upcoming events found.")
                return
            
            # Create embed
            embed = discord.Embed(
                title="📅 Upcoming Raid-Helper Events",
                description=f"Found {len(events)} upcoming event(s)",
                color=discord.Color.blue(),
                timestamp=datetime.now(timezone.utc)
            )
            
            # Sort events by start time
            sorted_events = sorted(events, key=lambda x: x.get('startTime', 0))
            
            # Add events to embed
            for event in sorted_events[:25]:  # Discord limit: 25 fields
                event_id = event.get('id', 'Unknown')
                title = event.get('title', 'Untitled Event')
                start_time = event.get('startTime', 0)
                leader_id = event.get('leaderId', 'Unknown')
                
                # Format start time (API returns seconds, not milliseconds)
                if start_time:
                    time_str = f"<t:{start_time}:F>"
                else:
                    time_str = "No date set"
                
                # Get leader mention
                leader = interaction.guild.get_member(int(leader_id)) if leader_id != 'Unknown' else None
                leader_str = leader.mention if leader else f"<@{leader_id}>"
                
                # Count signups
                signups = event.get('signUps', [])
                signup_count = len(signups)
                
                embed.add_field(
                    name=f"🎯 {title}",
                    value=f"**ID**: `{event_id}`\n"
                          f"**Start**: {time_str}\n"
                          f"**Leader**: {leader_str}\n"
                          f"**Signups**: {signup_count}",
                    inline=False
                )
            
            if len(sorted_events) > 25:
                embed.set_footer(text=f"Showing 25 of {len(sorted_events)} events")
            
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
        event_id="The Raid-Helper event ID (use /events to get IDs)"
    )
    async def check_signups(
        self,
        interaction: discord.Interaction,
        role: discord.Role,
        event_id: str
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
            
            # Get event data
            event_data = await self.get_event_signups(event_id)
            
            # Extract event info
            event_title = event_data.get('title', 'Unknown Event')
            signups = event_data.get('signUps', [])
            
            # Get signed up user IDs
            signed_up_ids = set()
            for signup in signups:
                user_id = signup.get('userId')
                if user_id:
                    signed_up_ids.add(str(user_id))
            
            # Get role members
            role_members = role.members
            role_member_ids = {str(member.id): member for member in role_members}
            
            # Compare
            signed_up = []
            not_signed_up = []
            
            for member_id, member in role_member_ids.items():
                if member_id in signed_up_ids:
                    signed_up.append(member)
                else:
                    not_signed_up.append(member)
            
            # Create embed
            embed = discord.Embed(
                title=f"📊 Signup Check: {event_title}",
                description=f"**Role**: {role.mention}\n"
                           f"**Event ID**: `{event_id}`",
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
            
            # Add signed up members (if not too many)
            if signed_up and len(signed_up) <= 20:
                signed_up_str = "\n".join([f"✅ {member.mention}" for member in signed_up])
                embed.add_field(
                    name=f"✅ Signed Up ({len(signed_up)})",
                    value=signed_up_str[:1024],  # Discord field limit
                    inline=False
                )
            elif signed_up:
                embed.add_field(
                    name=f"✅ Signed Up ({len(signed_up)})",
                    value=f"Too many to list ({len(signed_up)} members)",
                    inline=False
                )
            
            # Add not signed up members (if not too many)
            if not_signed_up and len(not_signed_up) <= 20:
                not_signed_up_str = "\n".join([f"❌ {member.mention}" for member in not_signed_up])
                embed.add_field(
                    name=f"❌ Not Signed Up ({len(not_signed_up)})",
                    value=not_signed_up_str[:1024],  # Discord field limit
                    inline=False
                )
            elif not_signed_up:
                embed.add_field(
                    name=f"❌ Not Signed Up ({len(not_signed_up)})",
                    value=f"Too many to list ({len(not_signed_up)} members)",
                    inline=False
                )
            
            # Add color indicator
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
