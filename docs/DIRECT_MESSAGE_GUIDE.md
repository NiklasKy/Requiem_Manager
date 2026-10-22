# Direct Message Reminders

The `/dm` command sends the same reminder to explicitly selected server members. It publishes a delivery report in the channel where the command was invoked. Recipient selection and the reminder preview are visible only to the requester. The public report does not include the reminder text.

## Usage

With explicit recipients:

```text
/dm message:Please sign up for Saturday's raid. recipients:@Alice @Bob @Charlie
```

The `recipients` option accepts user mentions or Discord user IDs separated by spaces, commas, or semicolons. Duplicate recipients are removed. Role mentions and `@everyone` are rejected. Discord controls native `@` suggestions in this text field; those suggestions can be limited by channel visibility.

To search the entire server, enter a name **without `@`** instead:

```text
/dm message:Please sign up for Saturday's raid. recipients:Alice
```

The bot searches server nicknames, usernames, global display names, and user IDs. Name searches are case-insensitive substring filters, up to 100 characters long. Matching names are shown for explicit selection; they are never sent a message just because their name matches. Names containing spaces are supported as one search phrase. Bots are excluded from search results.

To open the server member picker without an initial filter:

```text
/dm message:Please sign up for Saturday's raid.
```

1. Select members from the results. Each selection **adds** people to the existing recipient list, up to 25 total.
2. Click **Search members** to enter another name or user ID. Search spans the entire server, including offline members and members without access to the invocation channel. Your previous selections are preserved. Leave the search blank to show all unselected members.
3. Up to 25 matching members are shown at a time. Narrow the search if more people match. Nickname, username, and user ID are shown to distinguish similar names. Use **Clear selection** to start over.
4. Review the private message preview and recipient list.
5. Click **Send reminder**, or **Cancel** to discard it. The preview expires after five minutes.
6. The bot posts a public progress placeholder in the invocation channel, then sends the DMs sequentially and replaces the placeholder with each person's result.

Each recipient receives the reminder text together with a small context embed containing only `Sent by @requester` and the server name, without a title. Mentions are disabled in reminders and reports.

## Access

The command works only inside a server. It is available to members with Discord's **Administrator** permission, users listed in `ADMIN_USER_IDS`, or members with a role listed in `ADMIN_ROLE_IDS` or `MOD_ROLE_IDS`. These environment variables already exist in the bot's Compose configuration.

Only the requester can use their preview's controls. The bot fetches the requester's current server membership and checks their authorization again immediately before starting delivery. It also fetches each recipient's current server membership before sending; users outside that server and bot accounts do not receive reminders.

Server member search uses the bot's member cache and its existing **Server Members Intent**. If the cache is incomplete, the command requests the full server member list before opening the picker. If this fails, it reports an error instead of showing a partial list. Keep the already-required Server Members Intent enabled in the Discord Developer Portal. The search does not change anyone's channel permissions.

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

These tests use mocked Discord requests and never send real DMs. For live verification, use consenting test accounts: one that accepts bot DMs and one that rejects them. Include a member without access to the invocation channel and verify that they appear in the server-wide search. Confirm that multiple searches preserve selected recipients, and check the private picker/preview, the received message and sender context, the public report in the invocation channel, authorization restrictions, and that the report never includes reminder text.
