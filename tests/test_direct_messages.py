"""Offline behavioral tests. These tests never log in or send real messages."""

import asyncio
import os
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch

import discord
from discord.ext import commands

from src.bot.cogs.direct_messages import (
    DeliveryResult,
    DirectMessagesCog,
    ReminderView,
    delivery_report,
)

SENDER = 111111111111111111
FIRST = 222222222222222222
SECOND = 333333333333333333
THIRD = 444444444444444444


def http_error(cls=discord.HTTPException, status=400, code=50035):
    return cls(SimpleNamespace(status=status, reason="Test failure"),
               {"code": code, "message": "Sensitive upstream response"})


def member(user_id, *, roles=(), admin=False, bot=False):
    user = Mock(spec=discord.Member)
    user.id = user_id
    user.roles = [SimpleNamespace(id=role_id) for role_id in roles]
    user.guild_permissions = discord.Permissions(administrator=admin)
    user.bot = bot
    user.send = AsyncMock()
    return user


def interaction(user):
    return SimpleNamespace(
        user=user,
        guild_id=123,
        guild=SimpleNamespace(name="Test server", fetch_member=AsyncMock()),
        response=SimpleNamespace(send_message=AsyncMock(), edit_message=AsyncMock(), defer=AsyncMock()),
        followup=SimpleNamespace(send=AsyncMock()),
        edit_original_response=AsyncMock(),
    )


class ReportTests(unittest.TestCase):
    def test_worst_case_report_fits_discord_limits(self):
        results = [DeliveryResult(FIRST + i, "Unknown", "Unexpected error; check before resending.")
                   for i in range(25)]
        embed = delivery_report(SENDER, results)
        self.assertLessEqual(len(embed.description), 4096)
        self.assertLessEqual(len(embed), 6000)
        self.assertEqual(embed.description.count("**Unknown**"), 25)
        self.assertIn("does not confirm", embed.footer.text)


class ReminderTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        with patch.dict(os.environ, {"ADMIN_USER_IDS": str(SENDER), "ADMIN_ROLE_IDS": "555",
                                     "MOD_ROLE_IDS": "666"}):
            self.cog = DirectMessagesCog(Mock())
        self.sender = member(SENDER)
        self.interaction = interaction(self.sender)
        self.interaction.guild.fetch_member.return_value = self.sender
        self.public_message = SimpleNamespace(edit=AsyncMock())
        self.interaction.followup.send.return_value = self.public_message

    def test_staff_permissions(self):
        for user in (self.sender, member(FIRST, roles=(555,)), member(FIRST, roles=(666,)),
                     member(FIRST, admin=True)):
            self.assertTrue(self.cog.has_permission(user))
        self.assertFalse(self.cog.has_permission(member(FIRST)))
        self.assertFalse(self.cog.has_permission(SimpleNamespace(id=SENDER)))

    async def test_command_registration_and_schema(self):
        async with commands.Bot(command_prefix="!", intents=discord.Intents.none()) as bot:
            await bot.load_extension("src.bot.cogs.direct_messages")
            command = bot.tree.get_command("dm")
            self.assertIsNotNone(command)
            schema = command.to_dict(bot.tree)
            self.assertTrue(command.guild_only)
            self.assertEqual([option["name"] for option in schema["options"]], ["message"])
            self.assertEqual(schema["options"][0]["max_length"], 2000)
            self.assertTrue(schema["options"][0]["required"])
            self.assertNotIn("autocomplete", schema["options"][0])

    async def test_preview_is_private_with_native_member_picker(self):
        await self.cog.dm.callback(self.cog, self.interaction, "Private text")
        kwargs = self.interaction.response.send_message.call_args.kwargs
        self.assertTrue(kwargs["ephemeral"])
        self.assertEqual(kwargs["view"].recipient_ids, [])
        self.assertTrue(kwargs["view"].send.disabled)
        components = kwargs["view"].to_components()
        self.assertEqual(components[0]["components"][0]["type"], 5)
        self.assertEqual(components[0]["components"][0]["max_values"], 25)
        self.interaction.followup.send.assert_not_awaited()
        kwargs["view"].stop()

    async def test_picker_starts_with_send_disabled(self):
        await self.cog.dm.callback(self.cog, self.interaction, "Private text")
        view = self.interaction.response.send_message.call_args.kwargs["view"]
        self.assertIsInstance(view.recipients, discord.ui.UserSelect)
        self.assertEqual(view.recipients.max_values, 25)
        self.assertTrue(view.send.disabled)
        view.stop()

    async def test_unauthorized_command_does_not_create_a_preview(self):
        self.interaction.user = member(FIRST)
        await self.cog.dm.callback(self.cog, self.interaction, "Private text")
        self.assertNotIn("view", self.interaction.response.send_message.call_args.kwargs)
        self.interaction.guild.fetch_member.assert_not_awaited()

    async def test_invalid_input_does_not_send(self):
        for message in ("   ", "x" * 2001):
            await self.cog.dm.callback(self.cog, self.interaction, message)
            self.assertNotIn("view", self.interaction.response.send_message.call_args.kwargs)
        self.interaction.followup.send.assert_not_awaited()

    async def test_only_author_can_operate_preview(self):
        view = ReminderView(self.cog, self.interaction, "Private text")
        outsider = interaction(member(FIRST, admin=True))
        self.assertFalse(await view.interaction_check(outsider))
        self.assertTrue(await view.interaction_check(self.interaction))
        view.stop()

    async def test_selection_updates_recipient_list(self):
        view = ReminderView(self.cog, self.interaction, "Private text")
        # Supply the users that Discord would resolve for the component interaction.
        view.recipients._values = [member(FIRST), member(SECOND)]
        await view.recipients.callback(self.interaction)
        self.assertEqual(view.recipient_ids, [FIRST, SECOND])
        self.assertFalse(view.send.disabled)
        view.recipients._values = [member(THIRD)]
        await view.recipients.callback(self.interaction)
        self.assertEqual(view.recipient_ids, [THIRD])
        self.assertEqual([value.id for value in view.recipients.default_values], [THIRD])
        view.stop()

    async def test_cancel_and_timeout_never_deliver(self):
        self.cog.send_reminder = AsyncMock()
        view = ReminderView(self.cog, self.interaction, "Private text")
        await view.cancel.callback(self.interaction)
        self.assertTrue(view.is_finished())
        self.cog.send_reminder.assert_not_awaited()
        view = ReminderView(self.cog, self.interaction, "Private text")
        await view.on_timeout()
        self.assertTrue(view.submitted)
        self.assertFalse(await view.interaction_check(self.interaction))
        self.cog.send_reminder.assert_not_awaited()
        view.stop()

    async def test_double_click_sends_only_once(self):
        self.cog.send_reminder = AsyncMock()
        view = ReminderView(self.cog, self.interaction, "Private text")
        view.recipients._values = [member(FIRST)]
        await view.recipients.callback(self.interaction)
        await asyncio.gather(view.send.callback(self.interaction), view.send.callback(self.interaction))
        self.cog.send_reminder.assert_awaited_once_with(self.interaction, "Private text", (FIRST,))

    async def test_successful_delivery_is_paced_and_suppresses_mentions(self):
        users = [member(FIRST), member(SECOND)]
        self.interaction.guild.fetch_member.side_effect = users
        with patch("src.bot.cogs.direct_messages.asyncio.sleep", new_callable=AsyncMock) as sleep:
            results = await self.cog.deliver(self.interaction.guild, SENDER, "@everyone private", (FIRST, SECOND))
        self.assertEqual([result.status for result in results], ["Sent", "Sent"])
        sleep.assert_awaited_once_with(2.0)
        for user in users:
            self.assertEqual(user.send.call_args.kwargs["content"], "@everyone private")
            self.assertEqual(user.send.call_args.kwargs["allowed_mentions"].to_dict(), {"parse": []})
            context = user.send.call_args.kwargs["embed"]
            self.assertIsNone(context.title)
            self.assertEqual(context.description, f"Sent by <@{SENDER}>")
            self.assertEqual(context.footer.text, "Test server")

    async def test_closed_dms_missing_members_and_bots_do_not_block_others(self):
        blocked, bot, reachable = member(FIRST), member(THIRD, bot=True), member(THIRD + 1)
        blocked.send.side_effect = http_error(discord.Forbidden, 403, 50007)
        self.interaction.guild.fetch_member.side_effect = [blocked, http_error(discord.NotFound, 404, 10007), bot, reachable]
        with patch("src.bot.cogs.direct_messages.asyncio.sleep", new_callable=AsyncMock):
            results = await self.cog.deliver(self.interaction.guild, SENDER, "Private text", (FIRST, SECOND, THIRD, THIRD + 1))
        self.assertEqual([result.status for result in results], ["Failed", "Failed", "Not sent", "Sent"])
        bot.send.assert_not_awaited()
        reachable.send.assert_awaited_once()
        self.assertNotIn("Sensitive upstream", str(results))

    async def test_timeout_stops_without_retrying_ambiguous_delivery(self):
        user = member(FIRST)
        user.send.side_effect = asyncio.TimeoutError()
        self.interaction.guild.fetch_member.return_value = user
        results = await self.cog.deliver(self.interaction.guild, SENDER, "Private text", (FIRST, SECOND))
        self.assertEqual([result.status for result in results], ["Unknown", "Not sent"])
        user.send.assert_awaited_once()
        self.interaction.guild.fetch_member.assert_awaited_once()

    async def test_rate_limits_and_anti_spam_stop_the_batch(self):
        for error in (http_error(status=429, code=0), http_error(discord.Forbidden, 403, 20026),
                      http_error(code=40003), discord.RateLimited(10)):
            user = member(FIRST)
            user.send.side_effect = error
            self.interaction.guild.fetch_member.return_value = user
            results = await self.cog.deliver(self.interaction.guild, SENDER, "Private text", (FIRST, SECOND))
            self.assertEqual([result.status for result in results], ["Failed", "Not sent"])
            user.send.assert_awaited_once()

    async def test_public_report_and_private_text_stays_private(self):
        self.cog.deliver = AsyncMock(return_value=[DeliveryResult(FIRST, "Sent")])
        await self.cog.send_reminder(self.interaction, "Private text", (FIRST,))
        self.assertFalse(self.interaction.followup.send.call_args.kwargs["ephemeral"])
        self.public_message.edit.assert_awaited_once()
        report = self.public_message.edit.call_args.kwargs["embed"]
        self.assertIn(str(FIRST), report.description)
        self.assertNotIn("Private text", str(report.to_dict()))
        self.assertFalse(self.cog.send_lock.locked())

    async def test_permission_revoked_after_preview_stops_delivery(self):
        self.interaction.guild.fetch_member.return_value = member(FIRST)
        self.cog.deliver = AsyncMock()
        await self.cog.send_reminder(self.interaction, "Private text", (FIRST,))
        self.cog.deliver.assert_not_awaited()
        self.interaction.followup.send.assert_not_awaited()

    async def test_cannot_publish_report_means_no_dms(self):
        self.interaction.followup.send.side_effect = http_error(discord.Forbidden, 403, 50013)
        self.cog.deliver = AsyncMock()
        await self.cog.send_reminder(self.interaction, "Private text", (FIRST,))
        self.cog.deliver.assert_not_awaited()
        self.assertFalse(self.cog.send_lock.locked())

    async def test_deleted_report_is_republished_publicly(self):
        self.public_message.edit.side_effect = http_error(discord.NotFound, 404, 10008)
        self.cog.deliver = AsyncMock(return_value=[DeliveryResult(FIRST, "Sent")])
        await self.cog.send_reminder(self.interaction, "Private text", (FIRST,))
        self.assertEqual(self.interaction.followup.send.await_count, 2)
        self.assertFalse(self.interaction.followup.send.call_args.kwargs["ephemeral"])

    async def test_overlapping_and_repeated_batches_are_blocked(self):
        started, release = asyncio.Event(), asyncio.Event()

        async def delayed_delivery(*args):
            started.set()
            await release.wait()
            return [DeliveryResult(FIRST, "Sent")]

        self.cog.deliver = AsyncMock(side_effect=delayed_delivery)
        task = asyncio.create_task(self.cog.send_reminder(self.interaction, "Private text", (FIRST,)))
        await started.wait()
        other = interaction(self.sender)
        await self.cog.send_reminder(other, "Private text", (SECOND,))
        self.assertIn("Another reminder", other.edit_original_response.call_args.kwargs["content"])
        release.set()
        await task
        await self.cog.send_reminder(other, "Private text", (SECOND,))
        self.assertIn("Please wait", other.edit_original_response.call_args.kwargs["content"])
        self.cog.deliver.assert_awaited_once()


if __name__ == "__main__":
    unittest.main()
