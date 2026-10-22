"""Staff reminders with bounded delivery and a public delivery report."""

import asyncio
import logging
import math
import os
import time
from dataclasses import dataclass

import discord
from discord import app_commands
from discord.ext import commands

logger = logging.getLogger(__name__)

MAX_RECIPIENTS = 25
SEND_INTERVAL = 2.0
BATCH_COOLDOWN = 60.0
REQUEST_TIMEOUT = 15.0


@dataclass(frozen=True)
class DeliveryResult:
    user_id: int
    status: str
    reason: str = ""


def delivery_report(sender_id: int, results: list[DeliveryResult]) -> discord.Embed:
    """List every recipient without publishing the private reminder text."""
    counts = {status: sum(result.status == status for result in results)
              for status in ("Sent", "Failed", "Unknown", "Not sent")}
    lines = [f"Requested by <@{sender_id}>", ""]
    for result in results:
        reason = f" - {result.reason}" if result.reason else ""
        lines.append(f"**{result.status}** <@{result.user_id}>{reason}")
    embed = discord.Embed(
        title="Direct message delivery report",
        description="\n".join(lines),
        colour=discord.Colour.green() if counts["Sent"] == len(results)
        else discord.Colour.orange(),
    )
    embed.add_field(
        name="Summary",
        value=" | ".join(f"{status}: {count}" for status, count in counts.items()),
        inline=False,
    )
    embed.set_footer(text="Sent means accepted by Discord; it does not confirm the message was read.")
    return embed


class ReminderView(discord.ui.View):
    """Keep the composition private and require an explicit send action."""

    def __init__(self, cog, interaction: discord.Interaction, message: str):
        super().__init__(timeout=300)
        self.cog = cog
        self.origin = interaction
        self.message = message
        self.recipient_ids: list[int] = []
        self.submitted = False
        self.send.disabled = True

    def preview(self) -> discord.Embed:
        embed = discord.Embed(title="Direct message preview", description=self.message)
        embed.add_field(
            name=f"Recipients ({len(self.recipient_ids)}/{MAX_RECIPIENTS})",
            value=" ".join(f"<@{user_id}>" for user_id in self.recipient_ids)
            or "Choose members below.",
            inline=False,
        )
        embed.set_footer(text="The delivery report will be public in this channel. Preview expires in 5 minutes.")
        return embed

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if (interaction.user.id != self.origin.user.id
                or interaction.guild_id != self.origin.guild_id
                or not self.cog.has_permission(interaction.user)):
            await interaction.response.send_message(
                "Only the authorized author of this reminder can use these controls.", ephemeral=True,
            )
            return False
        if self.submitted or self.is_finished():
            await interaction.response.send_message("This reminder is already closed.", ephemeral=True)
            return False
        return True

    @discord.ui.select(cls=discord.ui.UserSelect, placeholder="Select reminder recipients...",
                       min_values=1, max_values=MAX_RECIPIENTS, row=0)
    async def recipients(self, interaction: discord.Interaction, select: discord.ui.UserSelect):
        self.recipient_ids = list(dict.fromkeys(user.id for user in select.values))
        select.default_values = [discord.Object(id=user_id) for user_id in self.recipient_ids]
        self.send.disabled = False
        await interaction.response.edit_message(embed=self.preview(), view=self)

    @discord.ui.button(label="Send reminder", style=discord.ButtonStyle.primary, row=1)
    async def send(self, interaction: discord.Interaction, button: discord.ui.Button):
        # Set this before yielding so simultaneous clicks cannot submit twice.
        if self.submitted:
            await interaction.response.send_message("This reminder is already closed.", ephemeral=True)
            return
        self.submitted = True
        self.stop()
        recipient_ids = tuple(self.recipient_ids)
        await interaction.response.defer()
        await interaction.edit_original_response(content="Preparing reminder delivery...", embed=None, view=None)
        await self.cog.send_reminder(interaction, self.message, recipient_ids)

    @discord.ui.button(label="Cancel", style=discord.ButtonStyle.secondary, row=1)
    async def cancel(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.submitted = True
        self.stop()
        await interaction.response.edit_message(content="Reminder cancelled.", embed=None, view=None)

    async def on_timeout(self):
        self.submitted = True
        try:
            await self.origin.edit_original_response(content="Reminder preview expired. Run /dm again.",
                                                     embed=None, view=None)
        except discord.HTTPException:
            logger.warning("Could not remove an expired DM preview")

    async def on_error(self, interaction, error, item):
        # Do not log exception bodies, interaction tokens, or reminder text.
        logger.error("DM control failed: %s", type(error).__name__)
        text = "The reminder could not be completed. Check the bot logs before trying again."
        if interaction.response.is_done():
            await interaction.followup.send(text, ephemeral=True)
        else:
            await interaction.response.send_message(text, ephemeral=True)


class DirectMessagesCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.admin_users = self._configured_ids("ADMIN_USER_IDS")
        self.staff_roles = self._configured_ids("ADMIN_ROLE_IDS") | self._configured_ids("MOD_ROLE_IDS")
        self.send_lock = asyncio.Lock()
        self.next_batch_at = 0.0

    @staticmethod
    def _configured_ids(key: str) -> set[int]:
        return {int(value.strip()) for value in os.getenv(key, "").split(",")
                if value.strip().isdigit()}

    def has_permission(self, user: discord.Member) -> bool:
        # Use the same configured staff identities as the scheduler and sound bot.
        return isinstance(user, discord.Member) and (
            user.id in self.admin_users
            or user.guild_permissions.administrator
            or any(role.id in self.staff_roles for role in user.roles)
        )

    @app_commands.command(name="dm", description="Send a reminder to selected members and publish a delivery report")
    @app_commands.guild_only()
    @app_commands.describe(message="Reminder text (up to 2000 characters)")
    async def dm(self, interaction: discord.Interaction,
                 message: app_commands.Range[str, 1, 2000]):
        if interaction.guild is None or not self.has_permission(interaction.user):
            await interaction.response.send_message(
                "You need administrator permissions or a configured admin/mod role to use /dm.",
                ephemeral=True,
            )
            return
        if not message.strip() or len(message) > 2000:
            await interaction.response.send_message(
                "Enter a reminder between 1 and 2000 characters.", ephemeral=True,
            )
            return
        view = ReminderView(self, interaction, message)
        await interaction.response.send_message(embed=view.preview(), view=view, ephemeral=True,
                                                allowed_mentions=discord.AllowedMentions.none())

    async def deliver(self, guild: discord.Guild, sender_id: int, message: str,
                      recipient_ids: tuple[int, ...]) -> list[DeliveryResult]:
        results = []
        context = discord.Embed(description=f"Sent by <@{sender_id}>")
        context.set_footer(text=guild.name[:100])
        for index, user_id in enumerate(recipient_ids):
            if index:
                await asyncio.sleep(SEND_INTERVAL)
            try:
                member = await asyncio.wait_for(guild.fetch_member(user_id), REQUEST_TIMEOUT)
                if member.bot:
                    results.append(DeliveryResult(user_id, "Not sent", "Bot accounts are excluded."))
                    continue
                await asyncio.wait_for(
                    member.send(content=message, embed=context, allowed_mentions=discord.AllowedMentions.none()),
                    REQUEST_TIMEOUT,
                )
                results.append(DeliveryResult(user_id, "Sent"))
            except discord.NotFound:
                results.append(DeliveryResult(user_id, "Failed", "Member or DM channel is unavailable."))
            except discord.Forbidden as error:
                results.append(DeliveryResult(user_id, "Failed", "Discord did not allow this direct message."))
                if error.code == 20026:  # Discord anti-spam enforcement: stop the batch.
                    break
            except discord.RateLimited:
                results.append(DeliveryResult(user_id, "Failed", "Discord rate limit; delivery stopped."))
                break
            except asyncio.TimeoutError:
                # Discord may have accepted a timed-out send. Never retry it automatically.
                results.append(DeliveryResult(user_id, "Unknown", "Request timed out; check before resending."))
                break
            except discord.HTTPException as error:
                results.append(DeliveryResult(user_id, "Failed", f"Discord request failed (code {error.code})."))
                if error.status == 429 or error.code in {20026, 40003, 40004}:
                    break
            except Exception as error:
                logger.error("DM delivery interrupted: %s", type(error).__name__)
                results.append(DeliveryResult(user_id, "Unknown", "Unexpected error; check before resending."))
                break
        for user_id in recipient_ids[len(results):]:
            results.append(DeliveryResult(user_id, "Not sent", "Delivery stopped before this recipient."))
        return results

    async def send_reminder(self, interaction: discord.Interaction, message: str,
                            recipient_ids: tuple[int, ...]):
        if (interaction.guild is None or not message.strip() or len(message) > 2000
                or not 1 <= len(recipient_ids) <= MAX_RECIPIENTS
                or len(set(recipient_ids)) != len(recipient_ids)):
            await interaction.edit_original_response(content="The reminder or recipient list is invalid. Nothing was sent.")
            return
        if self.send_lock.locked():
            await interaction.edit_original_response(content="Another reminder is being sent. Try /dm after it finishes.")
            return
        async with self.send_lock:
            remaining = self.next_batch_at - time.monotonic()
            if remaining > 0:
                await interaction.edit_original_response(
                    content=f"Please wait {math.ceil(remaining)} seconds before sending another reminder.")
                return
            # Refresh membership and authorization at the point where delivery starts.
            try:
                member = await asyncio.wait_for(
                    interaction.guild.fetch_member(interaction.user.id), REQUEST_TIMEOUT,
                )
            except (discord.HTTPException, asyncio.TimeoutError):
                await interaction.edit_original_response(content="Could not verify your current server permissions. Nothing was sent.")
                return
            if not self.has_permission(member):
                await interaction.edit_original_response(content="You no longer have permission to send reminders. Nothing was sent.")
                return
            try:
                # Establish the public report before sending any DMs. A missing channel
                # permission must not leave a completed batch without a visible report.
                report_message = await interaction.followup.send(
                    embed=discord.Embed(
                        title="Sending direct message reminder",
                        description=f"Requested by <@{interaction.user.id}> for {len(recipient_ids)} members. "
                                    "Delivery results will appear here.",
                    ),
                    ephemeral=False, wait=True, allowed_mentions=discord.AllowedMentions.none(),
                )
            except discord.HTTPException:
                await interaction.edit_original_response(content="Could not publish the delivery report in this channel. Nothing was sent.")
                return
            self.next_batch_at = time.monotonic() + BATCH_COOLDOWN
            try:
                results = await self.deliver(interaction.guild, interaction.user.id, message, recipient_ids)
                logger.info("DM reminder completed: guild=%s sender=%s sent=%s total=%s",
                            interaction.guild_id, interaction.user.id,
                            sum(result.status == "Sent" for result in results), len(results))
                try:
                    await report_message.edit(content=None, embed=delivery_report(interaction.user.id, results),
                                              allowed_mentions=discord.AllowedMentions.none())
                except discord.HTTPException:
                    # The placeholder may have been deleted while delivery was running.
                    await interaction.followup.send(embed=delivery_report(interaction.user.id, results),
                                                    ephemeral=False, allowed_mentions=discord.AllowedMentions.none())
                await interaction.edit_original_response(content="Delivery finished. The report is public in this channel.")
            finally:
                self.next_batch_at = time.monotonic() + BATCH_COOLDOWN


async def setup(bot: commands.Bot):
    await bot.add_cog(DirectMessagesCog(bot))
