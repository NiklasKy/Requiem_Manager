import asyncio
import os
import logging

import discord
from discord import app_commands
from discord.ext import commands

logger = logging.getLogger(__name__)


class SoundBotCog(commands.Cog):
    """Jungle Sound Bot - plays audio in voice channels on a repeating schedule"""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

        # Try to load libopus as fallback (not required when using FFmpegOpusAudio)
        if not discord.opus.is_loaded():
            try:
                discord.opus.load_opus("libopus.so.0")
                logger.info("libopus loaded successfully")
            except Exception as e:
                logger.info(f"libopus not loaded via explicit call ({e}) — using FFmpegOpusAudio (no libopus needed)")

        # Channel IDs from environment
        self.channel_1_id = self._parse_int_env("JUNGLE_CHANNEL_1_ID")
        self.channel_2_id = self._parse_int_env("JUNGLE_CHANNEL_2_ID")

        # Sound file paths from environment
        self.intro_file = os.getenv("SOUNDBOT_INTRO_FILE", "sounds/jungle_intro.mp3")
        self.loop_file = os.getenv("SOUNDBOT_LOOP_FILE", "sounds/jungle.mp3")

        # Interval between full rotations in seconds
        self.interval = int(os.getenv("JUNGLE_INTERVAL_SECONDS", "300"))

        # Per-guild active task tracking
        self._active_tasks: dict[int, asyncio.Task] = {}

        # Permission role/user IDs (same system as scheduler cog)
        self.admin_role_ids = self._parse_ids("ADMIN_ROLE_IDS")
        self.admin_user_ids = self._parse_ids("ADMIN_USER_IDS")
        self.mod_role_ids = self._parse_ids("MOD_ROLE_IDS")

        if not self.channel_1_id:
            logger.warning("JUNGLE_CHANNEL_1_ID not set — /js will not work")
        if not self.channel_2_id:
            logger.warning("JUNGLE_CHANNEL_2_ID not set — only CH1 will be used")

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _parse_int_env(key: str) -> int | None:
        value = os.getenv(key, "").strip()
        if value.isdigit():
            return int(value)
        return None

    @staticmethod
    def _parse_ids(env_key: str) -> set[int]:
        raw = os.getenv(env_key, "")
        ids = set()
        for part in raw.split(","):
            part = part.strip()
            if part.isdigit():
                ids.add(int(part))
        return ids

    def _has_permission(self, user: discord.Member) -> bool:
        if user.id in self.admin_user_ids:
            return True
        member_role_ids = {role.id for role in user.roles}
        return bool(member_role_ids & (self.admin_role_ids | self.mod_role_ids))

    async def _play_and_wait(self, voice_client: discord.VoiceClient, filepath: str) -> None:
        """Play an audio file and block until playback is complete.
        Uses FFmpegOpusAudio so libopus does not need to be loaded separately."""
        if not voice_client.is_connected():
            logger.error("Cannot play audio: bot is not connected to a voice channel")
            return

        if not os.path.isfile(filepath):
            logger.error(f"Sound file not found: {filepath}")
            return

        # FFmpegOpusAudio encodes to opus via ffmpeg directly — no libopus needed
        source = await discord.FFmpegOpusAudio.from_probe(filepath)
        voice_client.play(source)
        logger.info(f"Playing: {filepath}")

        while voice_client.is_playing() and voice_client.is_connected():
            await asyncio.sleep(0.5)

        logger.info(f"Finished playing: {filepath}")

    async def _connect_and_play(self, channel: discord.VoiceChannel, filepath: str) -> None:
        """Join a voice channel, play a file, then disconnect."""
        voice_client: discord.VoiceClient | None = None
        try:
            logger.info(f"Attempting to connect to voice channel: {channel.name} ({channel.id})")
            voice_client = await asyncio.wait_for(
                channel.connect(timeout=30.0, reconnect=False),
                timeout=35.0
            )
            if not voice_client.is_connected():
                logger.error(f"connect() returned but voice_client is not connected for {channel.name}")
                return
            logger.info(f"Joined voice channel: {channel.name} ({channel.id})")
            await self._play_and_wait(voice_client, filepath)
        except asyncio.TimeoutError:
            logger.error(
                f"Timed out connecting to voice channel {channel.name} ({channel.id}). "
                "Check that the bot has Connect + Speak permissions and that UDP traffic "
                "is not blocked in your Docker/firewall setup."
            )
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.error(f"Error playing in channel {channel.name}: {e}", exc_info=True)
        finally:
            if voice_client and voice_client.is_connected():
                await voice_client.disconnect()
                logger.info(f"Left voice channel: {channel.name} ({channel.id})")

    async def _jungle_loop(self, guild: discord.Guild) -> None:
        """
        Main jungle loop:
          1. Play intro sound in CH1, then in CH2 (welcome round).
          2. Wait interval seconds.
          3. Play loop sound in CH1, then immediately in CH2.
          4. Go to 2.
        """
        channel_1: discord.VoiceChannel | None = guild.get_channel(self.channel_1_id)
        channel_2: discord.VoiceChannel | None = (
            guild.get_channel(self.channel_2_id) if self.channel_2_id else None
        )

        if channel_1 is None:
            logger.error(f"JUNGLE_CHANNEL_1_ID {self.channel_1_id} not found in guild {guild.name}")
            return

        try:
            # --- Initial welcome round: play intro in both channels ---
            logger.info("Jungle: playing intro in CH1")
            await self._connect_and_play(channel_1, self.intro_file)

            if channel_2 is not None:
                logger.info("Jungle: playing intro in CH2")
                await self._connect_and_play(channel_2, self.intro_file)

            # --- Repeating loop: always CH1 → CH2 ---
            # Track the cycle start so playback time doesn't accumulate into the interval.
            next_cycle = asyncio.get_event_loop().time() + self.interval
            while True:
                # Sleep until the next scheduled cycle start
                sleep_time = max(0.0, next_cycle - asyncio.get_event_loop().time())
                logger.info(f"Jungle: next cycle in {sleep_time:.1f}s")
                await asyncio.sleep(sleep_time)

                cycle_start = asyncio.get_event_loop().time()

                logger.info(f"Jungle: playing loop sound in CH1 ({channel_1.name})")
                await self._connect_and_play(channel_1, self.loop_file)

                if channel_2 is not None:
                    logger.info(f"Jungle: playing loop sound in CH2 ({channel_2.name})")
                    await self._connect_and_play(channel_2, self.loop_file)

                elapsed = asyncio.get_event_loop().time() - cycle_start
                logger.info(f"Jungle: cycle took {elapsed:.1f}s, scheduling next in {self.interval}s")
                # Schedule next cycle relative to this cycle's start, not its end
                next_cycle = cycle_start + self.interval

        except asyncio.CancelledError:
            logger.info(f"Jungle loop cancelled for guild {guild.name}")
            client = guild.voice_client
            if client and client.is_connected():
                await client.disconnect()
        except Exception as e:
            logger.error(f"Unexpected error in jungle loop for guild {guild.name}: {e}")
            self._active_tasks.pop(guild.id, None)

    # ------------------------------------------------------------------
    # Commands
    # ------------------------------------------------------------------

    @app_commands.command(name="js", description="Start the Jungle Sound Bot")
    async def jungle_start(self, interaction: discord.Interaction) -> None:
        """Join the configured voice channels and start the jungle sound loop."""
        if not self._has_permission(interaction.user):
            await interaction.response.send_message(
                "❌ You need administrator or moderator permissions to use this command.",
                ephemeral=True,
            )
            return

        if not self.channel_1_id:
            await interaction.response.send_message(
                "❌ `JUNGLE_CHANNEL_1_ID` is not configured in the environment.",
                ephemeral=True,
            )
            return

        guild_id = interaction.guild_id
        if guild_id in self._active_tasks and not self._active_tasks[guild_id].done():
            await interaction.response.send_message(
                "⚠️ The Jungle Sound Bot is already running! Use `/je` to stop it first.",
                ephemeral=True,
            )
            return

        # Validate channels exist
        channel_1 = interaction.guild.get_channel(self.channel_1_id)
        if channel_1 is None:
            await interaction.response.send_message(
                f"❌ Voice channel with ID `{self.channel_1_id}` not found.",
                ephemeral=True,
            )
            return

        channel_2 = interaction.guild.get_channel(self.channel_2_id) if self.channel_2_id else None

        # Start the loop as a background task
        task = asyncio.create_task(self._jungle_loop(interaction.guild))
        self._active_tasks[guild_id] = task

        ch2_text = f" and **{channel_2.name}**" if channel_2 else ""
        embed = discord.Embed(
            title="🌿 Jungle Sound Bot Started",
            description=(
                f"Playing intro in **{channel_1.name}**{ch2_text}.\n"
                f"Loop interval: **{self.interval // 60} min**"
            ),
            color=discord.Color.green(),
        )
        embed.set_footer(text="Use /je to stop the bot")
        await interaction.response.send_message(embed=embed)
        logger.info(f"/js started by {interaction.user} in guild {interaction.guild.name}")

    @app_commands.command(name="je", description="Stop the Jungle Sound Bot and disconnect")
    async def jungle_end(self, interaction: discord.Interaction) -> None:
        """Stop the jungle sound loop and disconnect the bot from voice."""
        if not self._has_permission(interaction.user):
            await interaction.response.send_message(
                "❌ You need administrator or moderator permissions to use this command.",
                ephemeral=True,
            )
            return

        guild_id = interaction.guild_id
        task = self._active_tasks.get(guild_id)

        if task is None or task.done():
            await interaction.response.send_message(
                "⚠️ The Jungle Sound Bot is not running.",
                ephemeral=True,
            )
            return

        task.cancel()
        self._active_tasks.pop(guild_id, None)

        # Also disconnect immediately if still in a channel
        if interaction.guild.voice_client and interaction.guild.voice_client.is_connected():
            await interaction.guild.voice_client.disconnect()

        embed = discord.Embed(
            title="🛑 Jungle Sound Bot Stopped",
            description="The bot has left the voice channel.",
            color=discord.Color.red(),
        )
        await interaction.response.send_message(embed=embed)
        logger.info(f"/je stopped by {interaction.user} in guild {interaction.guild.name}")


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(SoundBotCog(bot))
