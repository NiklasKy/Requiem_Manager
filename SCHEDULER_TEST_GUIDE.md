# Message Scheduler - Quick Test Guide

This guide shows you how to quickly test the Message Scheduler.

## 🚀 Quick Start

### 1. Restart the Bot
After installation, the bot must be restarted:

```bash
# Development
docker-compose -f docker-compose.dev.yml restart bot

# Production
docker-compose -f docker-compose.prod.yml restart bot
```

### 2. Sync Commands
After restart, synchronize the commands:

```
/sync
```

### 3. Create Test Message

**Simple test (every 2 minutes):**
```
/schedule_add
  name: Test Message
  channel: #general  (or a test channel)
  message: 🤖 This is a test message from the scheduler!
  interval_minutes: 2
```

**Test with role ping:**
```
/schedule_add
  name: Test with Role
  channel: #test
  message: Hello! This is a test.
  interval_minutes: 3
  roles: @Member
```

### 4. Check

**Show list:**
```
/schedule_list
```

You should see your test message with:
- ✅ Status: Active
- ⏰ Next run: In ~2 minutes

### 5. Wait

Wait 2-3 minutes. The message should automatically appear in the selected channel.

### 6. Toggle Test

**Pause message:**
```
/schedule_toggle message_id: 1
```

The message will no longer be sent but remains in the list.

**Reactivate:**
```
/schedule_toggle message_id: 1
```

### 7. Clean Up

**Delete message:**
```
/schedule_remove message_id: 1
```

---

## 🔍 Check Logs

### Show Container Logs
```bash
# Last 100 lines
docker logs requiem-bot --tail 100

# Follow live logs
docker logs requiem-bot -f
```

### Search for Scheduler Activity
```bash
docker logs requiem-bot 2>&1 | grep -i "scheduler"
docker logs requiem-bot 2>&1 | grep -i "scheduled message"
```

**What you should see:**
```
INFO - Scheduler Cog initialized
INFO - Sent scheduled message 1 to channel general
INFO - Added scheduled message 2 in guild 123456789
```

---

## ✅ Expected Behavior

### On Bot Start
```
INFO - Loading cog: src.bot.cogs.scheduler
INFO - Loaded cog: src.bot.cogs.scheduler
INFO - Scheduler Cog initialized
INFO - Background task 'check_scheduled_messages' started
```

### When Adding a Message
```
INFO - Added scheduled message 1 in guild 123456789
```

### When Sending
```
INFO - Sent scheduled message 1 to channel general
```

### When Removing
```
INFO - Removed scheduled message 1 from guild 123456789
```

---

## 🐛 Troubleshooting

### Bot doesn't load the cog
```bash
# Check for errors in logs
docker logs requiem-bot 2>&1 | grep -i "error"

# Restart bot
docker-compose -f docker-compose.prod.yml restart bot
```

### Commands don't appear
```bash
# Synchronize commands
/sync

# Wait (can take up to 1 hour for global commands)
# Or set Guild ID in .env for instant synchronization
```

### Message not being sent
```bash
# 1. Check if scheduler is running
docker logs requiem-bot 2>&1 | grep "check_scheduled_messages"

# 2. Check bot permissions
# - Bot needs "Send Messages" in target channel
# - Bot needs "Mention Roles" for role pings

# 3. Check database
docker exec -it requiem-bot python -c "
import asyncio
from src.database.database import Database
async def check():
    db = Database('./data/tracking.db')
    await db.initialize()
    messages = await db.get_scheduled_messages(YOUR_GUILD_ID)
    print(messages)
asyncio.run(check())
"
```

### Database Error
```bash
# Check database schema
docker exec -it requiem-bot sqlite3 /app/data/tracking.db "
.schema scheduled_messages
"

# Should show the table. If not:
docker-compose -f docker-compose.prod.yml restart bot
```

---

## 📊 Example Scenarios

### Scenario 1: Daily Announcement
```
/schedule_add
  name: Daily Announcement
  channel: #announcements
  message: 📢 Daily reminder: Check the event board!
  interval_days: 1
  roles: @Everyone
```

### Scenario 2: Hourly Raid Info
```
/schedule_add
  name: Raid Reminder
  channel: #raids
  message: ⚔️ Raid time! Be ready!
  interval_hours: 1
  roles: @Raider
```

### Scenario 3: Weekly Meeting
```
/schedule_add
  name: Weekly Meeting
  channel: #meetings
  message: 🗓️ Weekly team meeting in 1 hour!
  interval_days: 7
  roles: @Admin @Moderator
```

---

## 💾 Database Inspection

### Show all scheduled messages
```bash
docker exec -it requiem-bot sqlite3 /app/data/tracking.db "
SELECT id, name, channel_id, interval_minutes, next_run, is_active 
FROM scheduled_messages;
"
```

### Next messages to be sent
```bash
docker exec -it requiem-bot sqlite3 /app/data/tracking.db "
SELECT id, name, next_run 
FROM scheduled_messages 
WHERE is_active = 1 
ORDER BY next_run 
LIMIT 5;
"
```

---

## 🎯 Performance Test

### Multiple messages simultaneously
Create 3-5 test messages with different intervals:
- 2 minutes
- 3 minutes
- 5 minutes

Watch the logs and verify all are sent correctly.

### Under Load
```bash
# CPU & Memory Usage
docker stats requiem-bot

# Should be minimal - the scheduler is very efficient
```

---

**Status Check:** ✅ Scheduler is running when you see in the logs:
```
INFO - Background task 'check_scheduled_messages' is running
```
