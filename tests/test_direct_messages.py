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
    MemberSearchModal,
    ReminderView,
    delivery_report,
    find_members,
    parse_recipients,
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
    user.name = f"user{user_id}"
    user.display_name = user.name
    user.global_name = None
    user.roles = [SimpleNamespace(id=role_id) for role_id in roles]
    user.guild_permissions = discord.Permissions(administrator=admin)
    user.bot = bot
    user.send = AsyncMock()
    return user


def interaction(user):
    return SimpleNamespace(
        user=user,
        guild_id=123,
        guild=SimpleNamespace(name="Test server", fetch_member=AsyncMock(), chunked=True, chunk=AsyncMock(),
                              members=[member(FIRST), member(SECOND), member(THIRD)]),
        response=SimpleNamespace(send_message=AsyncMock(), edit_message=AsyncMock(), defer=AsyncMock(),
                                 send_modal=AsyncMock()),
        followup=SimpleNamespace(send=AsyncMock()),
        edit_original_response=AsyncMock(),
    )


class RecipientTests(unittest.TestCase):
    def test_mentions_ids_and_duplicates(self):
        self.assertEqual(parse_recipients(f"<@{FIRST}> <@!{SECOND}>,{FIRST}; {THIRD}"),
                         [FIRST, SECOND, THIRD])

    def test_invalid_recipients_are_rejected(self):
        for value in ("", " ", "@everyone", f"<@&{FIRST}>", "@nickname", "123", "99999999999999999999"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                parse_recipients(value)

    def test_recipient_and_input_limits(self):
        self.assertEqual(len(parse_recipients(" ".join(str(FIRST + i) for i in range(25)))), 25)
        for value in (" ".join(str(FIRST + i) for i in range(26)), "1" * 1001):
            with self.assertRaises(ValueError):
                parse_recipients(value)

    def test_worst_case_report_fits_discord_limits(self):
        results = [DeliveryResult(FIRST + i, "Unknown", "Unexpected error; check before resending.")
                   for i in range(25)]
        embed = delivery_report(SENDER, results)
        self.assertLessEqual(len(embed.description), 4096)
        self.assertLessEqual(len(embed), 6000)
        self.assertEqual(embed.description.count("**Unknown**"), 25)
        self.assertIn("does not confirm", embed.footer.text)

    def test_server_search_matches_names_nicknames_and_ids(self):
        alice, bob, charlie = member(FIRST), member(SECOND), member(THIRD)
        alice.name, alice.display_name = "alice", "Raid Captain"
        bob.name, bob.global_name = "bob", "ALICE Fan"
        for query, expected in (("aLiCe", [FIRST, SECOND]), ("captain", [FIRST]), (str(THIRD), [THIRD])):
            matches, count = find_members([alice, bob, charlie], query, [])
            self.assertEqual({user.id for user in matches}, set(expected))
            self.assertEqual(count, len(expected))

    def test_server_search_limits_results_and_excludes_bots_and_selected(self):
        users = [member(FIRST + i) for i in range(40)] + [member(SECOND, bot=True)]
        matches, total = find_members(users, "", [FIRST])
        self.assertEqual(len(matches), 25)
        self.assertEqual(total, 39)
        self.assertNotIn(FIRST, [user.id for user in matches])


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
            self.assertEqual([option["name"] for option in schema["options"]], ["message", "recipients"])
            self.assertEqual(schema["options"][0]["max_length"], 2000)
            self.assertFalse(schema["options"][1]["required"])

    async def test_preview_is_private_with_prefilled_recipients(self):
        await self.cog.dm.callback(self.cog, self.interaction, "Private text", f"<@{FIRST}> {SECOND}")
        self.interaction.response.defer.assert_awaited_once_with(ephemeral=True)
        kwargs = self.interaction.edit_original_response.call_args.kwargs
        self.assertEqual(kwargs["view"].recipient_ids, [FIRST, SECOND])
        self.assertFalse(kwargs["view"].send.disabled)
        self.interaction.followup.send.assert_not_awaited()
        kwargs["view"].stop()

    async def test_picker_starts_with_send_disabled(self):
        await self.cog.dm.callback(self.cog, self.interaction, "Private text")
        view = self.interaction.edit_original_response.call_args.kwargs["view"]
        self.assertIsInstance(view.recipients, discord.ui.Select)
        self.assertEqual(view.recipients.max_values, 3)
        self.assertTrue(view.send.disabled)
        view.stop()

    async def test_unauthorized_command_does_not_create_a_preview(self):
        self.interaction.user = member(FIRST)
        await self.cog.dm.callback(self.cog, self.interaction, "Private text")
        self.assertNotIn("view", self.interaction.response.send_message.call_args.kwargs)
        self.interaction.guild.fetch_member.assert_not_awaited()

    async def test_invalid_input_does_not_send(self):
        for message, recipients in (("   ", None), ("x" * 2001, None), ("Reminder", "@everyone")):
            await self.cog.dm.callback(self.cog, self.interaction, message, recipients)
            self.assertNotIn("view", self.interaction.response.send_message.call_args.kwargs)
        self.interaction.followup.send.assert_not_awaited()

    async def test_only_author_can_operate_preview(self):
        view = ReminderView(self.cog, self.interaction, "Private text", [FIRST])
        outsider = interaction(member(FIRST, admin=True))
        self.assertFalse(await view.interaction_check(outsider))
        self.assertTrue(await view.interaction_check(self.interaction))
        view.stop()

    async def test_selection_adds_to_existing_recipients(self):
        view = ReminderView(self.cog, self.interaction, "Private text", [])
        view.recipients._values = [str(FIRST)]
        await view.recipients.callback(self.interaction)
        view.recipients._values = [str(SECOND)]
        await view.recipients.callback(self.interaction)
        self.assertEqual(view.recipient_ids, [FIRST, SECOND])
        self.assertFalse(view.send.disabled)
        view.stop()

    async def test_name_filter_searches_members_without_channel_access(self):
        invisible = member(FIRST)
        invisible.display_name = "Outside channel"
        self.interaction.guild.members = [invisible, member(SECOND)]
        self.interaction.channel = SimpleNamespace(
            permissions_for=Mock(return_value=discord.Permissions.none()),
        )
        await self.cog.dm.callback(self.cog, self.interaction, "Private text", "outside")
        view = self.interaction.edit_original_response.call_args.kwargs["view"]
        self.assertEqual([option.value for option in view.recipients.options], [str(FIRST)])
        self.assertEqual(view.query, "outside")
        self.interaction.channel.permissions_for.assert_not_called()
        view.stop()

    async def test_member_cache_is_completed_before_search(self):
        self.interaction.guild.chunked = False
        await self.cog.dm.callback(self.cog, self.interaction, "Private text", "user")
        self.interaction.guild.chunk.assert_awaited_once_with(cache=True)
        view = self.interaction.edit_original_response.call_args.kwargs["view"]
        view.stop()

    async def test_member_cache_failure_does_not_create_partial_picker(self):
        self.interaction.guild.chunked = False
        self.interaction.guild.chunk.side_effect = asyncio.TimeoutError()
        await self.cog.dm.callback(self.cog, self.interaction, "Private text", "user")
        self.assertNotIn("view", self.interaction.edit_original_response.call_args.kwargs)
        self.interaction.followup.send.assert_not_awaited()

    async def test_search_modal_changes_results_and_preserves_selection(self):
        view = ReminderView(self.cog, self.interaction, "Private text", [FIRST])
        await view.search.callback(self.interaction)
        modal = self.interaction.response.send_modal.call_args.args[0]
        self.assertIsInstance(modal, MemberSearchModal)
        modal.query._value = str(SECOND)
        await modal.on_submit(self.interaction)
        self.assertEqual([option.value for option in view.recipients.options], [str(SECOND)])
        self.assertEqual(view.recipient_ids, [FIRST])
        await view.clear.callback(self.interaction)
        self.assertEqual(view.recipient_ids, [])
        self.assertTrue(view.send.disabled)
        modal.stop()
        view.stop()

    async def test_search_modal_rejects_other_users_and_closed_reminders(self):
        view = ReminderView(self.cog, self.interaction, "Private text", [])
        modal = MemberSearchModal(view)
        modal.query._value = "Changed"
        await modal.on_submit(interaction(member(FIRST, admin=True)))
        self.assertEqual(view.query, "")
        view.stop()
        await modal.on_submit(self.interaction)
        self.assertEqual(view.query, "")
        modal.stop()

    async def test_no_matches_disable_picker_but_allow_another_search(self):
        view = ReminderView(self.cog, self.interaction, "Private text", [], "no-such-member")
        self.assertTrue(view.recipients.disabled)
        self.assertFalse(view.search.disabled)
        self.assertTrue(view.send.disabled)
        view.stop()

    async def test_full_selection_cannot_add_more_recipients(self):
        self.interaction.guild.members = [member(FIRST + i) for i in range(26)]
        view = ReminderView(self.cog, self.interaction, "Private text", [FIRST + i for i in range(25)])
        self.assertTrue(view.recipients.disabled)
        self.assertTrue(view.search.disabled)
        view.recipients._values = [str(FIRST + 25)]
        await view.recipients.callback(self.interaction)
        self.assertEqual(len(view.recipient_ids), 25)
        self.interaction.response.send_message.assert_awaited_once()
        view.stop()

    async def test_values_outside_search_results_are_rejected(self):
        view = ReminderView(self.cog, self.interaction, "Private text", [])
        view.recipients._values = [str(SECOND + 1)]
        await view.recipients.callback(self.interaction)
        self.assertEqual(view.recipient_ids, [])
        self.interaction.response.send_message.assert_awaited_once()
        view.stop()

    async def test_cancel_and_timeout_never_deliver(self):
        self.cog.send_reminder = AsyncMock()
        view = ReminderView(self.cog, self.interaction, "Private text", [FIRST])
        await view.cancel.callback(self.interaction)
        self.assertTrue(view.is_finished())
        self.cog.send_reminder.assert_not_awaited()
        view = ReminderView(self.cog, self.interaction, "Private text", [FIRST])
        await view.on_timeout()
        self.assertTrue(view.submitted)
        self.assertFalse(await view.interaction_check(self.interaction))
        self.cog.send_reminder.assert_not_awaited()
        view.stop()

    async def test_double_click_sends_only_once(self):
        self.cog.send_reminder = AsyncMock()
        view = ReminderView(self.cog, self.interaction, "Private text", [FIRST])
        await asyncio.gather(view.send.callback(self.interaction), view.send.callback(self.interaction))
        self.cog.send_reminder.assert_awaited_once()

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
