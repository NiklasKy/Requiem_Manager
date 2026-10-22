# Direct Message Reminders

The `/dm` command sends the same reminder to explicitly selected server members. It publishes a delivery report in the channel where the command was invoked. Recipient selection and the reminder preview are visible only to the requester. The public report does not include the reminder text.

## Usage

Run the command with the reminder text:

```text
/dm message:Please sign up for Saturday's raid.
```

1. Submit the command. The bot opens a private preview with Discord's native searchable member picker.
2. Choose up to 25 members in that picker. Changing the selection replaces the previous selection.
3. Review the reminder and selected recipients. **Send reminder** becomes available after selecting at least one person.
4. Click **Send reminder**, or **Cancel** to discard it. The preview expires after five minutes.
5. The bot posts a public progress placeholder in the invocation channel, then sends the DMs sequentially and replaces the placeholder with each person's result.

The slash command has only the required `message` option. Recipient selection happens in the private response after submitting the command.

Each recipient receives the reminder text together with a small context embed containing only `Sent by @requester` and the server name, without a title. Mentions are disabled in reminders and reports.

## Access

The command works only inside a server. It is available to members with Discord's **Administrator** permission, users listed in `ADMIN_USER_IDS`, or members with a role listed in `ADMIN_ROLE_IDS` or `MOD_ROLE_IDS`. These environment variables already exist in the bot's Compose configuration.

Only the requester can use their preview's controls. The bot fetches the requester's current server membership and checks their authorization again immediately before starting delivery. It also fetches each recipient's current server membership before sending; users outside that server and bot accounts do not receive reminders.

If Discord command permissions were restricted manually, allow the configured staff roles to use `/dm` under **Server Settings → Integrations → the bot**. The bot does not require Administrator permission to send DMs. Its existing slash-command installation and access to the invocation channel are sufficient when Discord allows the interactions and embedded reports.

## Limits and report meaning

- At most **25 unique recipients** and **2,000 message characters** per reminder.
- One active reminder batch per bot process, with a **two-second interval** between recipients and a **60-second cooldown** after delivery finishes.
- `discord.py` handles Discord's normal API rate-limit responses. Surfaced rate-limit or anti-spam errors stop the batch. Privacy restrictions are respected.
- Each recipient lookup and DM request has a 15-second timeout. A timeout stops delivery without an automatic retry because a send may already have succeeded.
- No message contents, preview contents, or raw upstream error bodies are added to application logs. Completion logs contain the guild/requester IDs and aggregate counts.

The public report lists every selected person:

| Status | Meaning |
| --- | --- |
| **Sent** | Discord accepted the message. This is not a read receipt. |
| **Failed** | Discord rejected the request, or the member/DM channel was unavailable. The bot cannot reliably distinguish closed DMs from a block. |
| **Unknown** | A timeout or unexpected error left delivery uncertain. Check before resending. |
| **Not sent** | A bot account was skipped, or the batch stopped before this recipient. |

A rejected DM does not prevent delivery to other selected people. Rate limits, anti-spam enforcement, and ambiguous failures stop the remaining batch. The public placeholder must be created successfully before any DM is sent. If it is deleted during delivery, the bot attempts to publish a replacement report in the same channel.

Previews, active delivery, and cooldowns are held in memory. Restarting the bot discards them; it does not resume or retry a partially completed batch. Check the existing report and recipients before starting another batch after a restart. If the channel becomes unavailable, report publication can fail after some DMs were sent; the requester receives a private error and should check before retrying.

Use this feature for community reminders that recipients have explicitly agreed to receive. It does not bypass privacy settings, blocks, or anti-spam enforcement. See the [Discord Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy) and [Discord API rate limits](https://docs.discord.com/developers/topics/rate-limits).

## Deployment and verification

The cog is loaded by `src/bot/main.py` and included in the existing bot image. In the deployed checkout, rebuild and recreate only the bot service:

```bash
docker compose -f docker-compose.prod.yml up -d --build bot
docker compose -f docker-compose.prod.yml logs --tail=100 bot
```

The existing startup process synchronizes slash commands to `DISCORD_GUILD_ID` when configured, otherwise globally. Verify that the `direct_messages` cog loaded and command synchronization succeeded.

Offline verification, using an environment with `discord.py` 2.7.1 installed:

```bash
python -m unittest discover -s tests -v
```

These tests use mocked Discord requests and never send real DMs. For live verification, use consenting test accounts: one that accepts bot DMs and one that rejects them. Confirm that `/dm` has only the `message` option, the private response includes the native member picker, and changing its selection updates the preview. Check the received message and sender context, the public report in the invocation channel, authorization restrictions, and that the report never includes reminder text.
