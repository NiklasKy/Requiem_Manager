# 📅 Message Scheduler Guide

The Message Scheduler allows you to schedule automated recurring messages in Discord channels.

## ✨ Features

- ⏰ **Flexible Time Intervals** - Schedule messages in minutes, hours, or days
- 👥 **Role Pings** - Automatically mention Discord roles in messages
- 🔄 **Recurring** - Messages automatically repeat after the defined interval
- 🎛️ **Control** - Enable/Disable scheduled messages without deleting them
- 📋 **Overview** - View all scheduled messages with details
- 🕐 **Custom Start Time** - Set specific start times (e.g., every Sunday at 6 PM)

## 📝 Commands

All commands require **Administrator permissions**.

### `/schedule_list`
Shows all scheduled messages for the current server.

**Example:**
```
/schedule_list
```

**Display includes:**
- Message ID
- Name/Description
- Target channel
- Interval
- Next send time
- Pinged roles
- Message preview
- Status (active/inactive)

---

### `/schedule_add`
Adds a new scheduled message.

**Parameters:**
- `name` - Name/description for this message *(required)*
- `channel` - Channel where the message should be sent *(required)*
- `message` - The message content to send *(required)*
- `interval_days` - Interval in days (default: 0)
- `interval_hours` - Interval in hours (default: 0)
- `interval_minutes` - Interval in minutes (default: 60)
- `start_time` - **NEW!** First execution (Format: `YYYY-MM-DD HH:MM`) *(optional)*
- `roles` - Roles to ping (select with @Role)

**Examples:**

```
# ⭐ Every Sunday at 6:00 PM (solves your problem!)
/schedule_add 
  name: Weekly Raid Meeting
  channel: #raids
  message: 🗓️ Time for our weekly raid meeting!
  interval_days: 7
  start_time: 2026-02-02 18:00
  roles: @Raider
```

```
# Every day at 8:00 PM
/schedule_add 
  name: Daily Reminder
  channel: #announcements
  message: Don't forget the daily quests!
  interval_days: 1
  start_time: 2026-01-27 20:00
  roles: @Everyone
```

```
# Simple message every 60 minutes (starts immediately)
/schedule_add 
  name: Welcome Message
  channel: #general
  message: Welcome to our server!
  interval_minutes: 60
```

```
# Every Monday at 10:00 AM
/schedule_add 
  name: Weekly Check
  channel: #admin
  message: Time for the weekly server check!
  interval_days: 7
  start_time: 2026-01-27 10:00
  roles: @Admin
```

---

### `/schedule_remove`
Permanently removes a scheduled message.

**Parameters:**
- `message_id` - ID of the message to remove *(required)*

**Example:**
```
/schedule_remove message_id: 5
```

> 💡 **Tip:** Find the message ID with `/schedule_list`

---

### `/schedule_toggle`
Enables or disables a scheduled message without deleting it.

**Parameters:**
- `message_id` - ID of the message *(required)*

**Example:**
```
/schedule_toggle message_id: 3
```

**Usage:**
- ✅ **Enabled** - Message will be sent at the next scheduled time
- ⏸️ **Disabled** - Message will be skipped but remains in the database

---

## 🎯 Use Cases

### 1. Every Sunday at 6:00 PM - Raid Meeting
```
/schedule_add
  name: Weekly Raid
  channel: #raids
  message: 🗓️ Raid meeting starts now!
  interval_days: 7
  start_time: 2026-02-02 18:00
  roles: @Raider
```
> 💡 **Tip:** Find the next Sunday and set the date with your desired time!

### 2. Daily at 8:00 PM - Daily Quest Reminder
```
/schedule_add
  name: Daily Quest
  channel: #announcements
  message: 🎯 Don't forget the daily quests!
  interval_days: 1
  start_time: 2026-01-27 20:00
  roles: @Member
```

### 3. Every Monday at 10:00 AM - Weekly Check
```
/schedule_add
  name: Weekly Check
  channel: #admin
  message: ⚙️ Time for the weekly server check
  interval_days: 7
  start_time: 2026-01-27 10:00
  roles: @Admin
```

### 4. Every 30 minutes - Starting immediately
```
/schedule_add
  name: Welcome
  channel: #welcome
  message: 👋 Welcome! Read the rules in #rules
  interval_minutes: 30
```
> 💡 **Without `start_time`** the message starts immediately and repeats every 30 minutes.

### 5. Every 4 hours starting at 8:00 AM tomorrow
```
/schedule_add
  name: Status Check
  channel: #status
  message: 📊 Server status is being checked...
  interval_hours: 4
  start_time: 2026-01-28 08:00
```

---

## ⚙️ Technical Details

### Start Time Feature (NEW!)
- **With `start_time`**: The first message is sent at the specified time
- **Without `start_time`**: The first message is sent after the interval (from now)
- **Time Format**: `YYYY-MM-DD HH:MM` (e.g., `2026-02-02 18:00`)
- **Alternative**: `DD.MM.YYYY HH:MM` (e.g., `02.02.2026 18:00`)
- **Past Times**: If the start time is in the past, the next occurrence is automatically calculated

**Example - Every Sunday at 6:00 PM:**
```
# Today is Wednesday, but you want Sunday 6:00 PM
/schedule_add
  name: Sunday Meeting
  channel: #meeting
  message: Meeting time!
  interval_days: 7
  start_time: 2026-02-02 18:00  # Next Sunday
```

### Time Intervals
- **Minimum:** 1 minute
- **Combinable:** You can combine days, hours, and minutes
  - Example: `interval_days: 1, interval_hours: 12` = every 36 hours

### Role Pings
- Multiple roles can be pinged simultaneously
- Format: `@Role1 @Role2 @Role3`
- Roles are automatically mentioned at the beginning of the message

### Automatic Execution
- The bot checks every minute if messages need to be sent
- After sending, the next execution time is automatically calculated
- All scheduled messages continue after bot restart

### Database
All scheduled messages are stored in the SQLite database:
- Table: `scheduled_messages`
- Persistence: Survives bot restarts
- Logging: All activities are logged

---

## 🔍 Troubleshooting

### Message not being sent
1. ✅ Check with `/schedule_list` if the message is **active**
2. ✅ Ensure the bot has write permissions in the target channel
3. ✅ Verify that the `next_run` time is in the future
4. ✅ Check the bot logs: `docker logs requiem-bot`

### Roles not being pinged
1. ✅ Ensure the roles are **mentionable**
2. ✅ The bot needs "Mention Roles" permission
3. ✅ Check if role IDs are correctly stored

### "Permission Denied" Error
- The command requires **Administrator permissions**
- Ensure your account has this permission

---

## 📚 Best Practices

### ✅ DO
- Use descriptive names for scheduled messages
- Test new messages with short intervals first
- Disable messages instead of deleting them (for later reuse)
- Combine intervals for flexible schedules
- Use `start_time` for specific times (e.g., every Sunday at 6 PM)

### ❌ DON'T
- Don't set very short intervals (< 5 minutes) for general messages
- Don't ping @everyone too frequently (annoys the community)
- Don't create duplicates - use toggle instead

---

## 🆘 Support

For problems:
1. Check the logs: `docker-compose logs -f bot`
2. Use `/schedule_list` for diagnosis
3. Contact an administrator

---

**Version:** 1.0.0  
**Created:** January 2026  
**Bot:** Requiem Manager
