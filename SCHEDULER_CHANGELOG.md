# 📅 Message Scheduler - Changelog

## Version 1.0.0 - January 2026

### ✨ New Features

#### Message Scheduler System
- **Automated Messages**: Schedule recurring messages with flexible time intervals
- **Role Pings**: Support for automatic Discord role mentions
- **Flexible Intervals**: Configurable in minutes, hours, and days
- **Custom Start Times**: Set specific start times (e.g., every Sunday at 6 PM)
- **Activation Toggle**: Pause/activate messages without deleting them

#### Discord Commands (Administrator)
- `/schedule_list` - Show all scheduled messages
- `/schedule_add` - Add a new scheduled message
- `/schedule_remove` - Remove a scheduled message
- `/schedule_toggle` - Enable/disable message

#### Backend
- **Background Task**: Checks every minute for due messages
- **Database Integration**: New `scheduled_messages` table in SQLite
- **Persistence**: Messages survive bot restarts
- **Logging**: Complete activity logs

---

## 📂 Changed/New Files

### New Files
```
src/bot/cogs/scheduler.py          # Scheduler Cog with all commands
MESSAGE_SCHEDULER_GUIDE.md         # User documentation
SCHEDULER_TEST_GUIDE.md            # Testing and troubleshooting guide
SCHEDULER_CHANGELOG.md             # This file
```

### Changed Files
```
src/bot/main.py                    # Added scheduler cog
src/database/database.py           # New database functions
README.md                          # Updated feature list and commands
```

---

## 🗄️ Database Schema

### New Table: `scheduled_messages`

```sql
CREATE TABLE scheduled_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    channel_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    role_ids TEXT,                     -- Comma-separated list
    interval_days INTEGER DEFAULT 0,
    interval_hours INTEGER DEFAULT 0,
    interval_minutes INTEGER DEFAULT 60,
    next_run TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    last_sent TIMESTAMP
);
```

### Indexes
```sql
CREATE INDEX idx_scheduled_messages_guild ON scheduled_messages (guild_id);
CREATE INDEX idx_scheduled_messages_next_run ON scheduled_messages (next_run);
```

---

## 🔧 Technical Details

### Background Task
- **Frequency**: Every 60 seconds
- **Method**: `discord.ext.tasks.loop`
- **Error Handling**: Try-catch to isolate individual message errors
- **Startup**: Waits for `bot.wait_until_ready()`

### Database Functions
```python
add_scheduled_message()              # Create new message
get_scheduled_messages()             # All messages for a guild
get_messages_to_send()              # Fetch due messages
update_scheduled_message_next_run() # Calculate next execution
remove_scheduled_message()          # Delete message
toggle_scheduled_message()          # Enable/Disable
```

### Permissions
- All commands require `administrator=True`
- Bot needs `Send Messages` permission in target channels
- Bot needs `Mention Roles` for role pings

---

## 🎯 Use Cases

### ✅ Perfect for:
- Regular announcements
- Event reminders
- Community engagement
- Server maintenance notices
- Automatic welcome messages
- Raid calls and timers
- Daily/Weekly challenges
- Specific day/time messages (e.g., every Sunday at 6 PM)

### ⚠️ Not suitable for:
- One-time messages (use Discord's own Scheduled Events)
- Very short intervals (< 1 minute)
- Complex messages with embeds (coming in v2.0)

---

## 🚀 Deployment

### Development
```bash
# Restart bot
docker-compose -f docker-compose.dev.yml restart bot

# Sync commands
/sync
```

### Production
```bash
# Deploy with new scheduler
docker-compose -f docker-compose.prod.yml up -d --build

# Check logs
docker logs requiem-bot -f
```

### Migration
No manual migration needed - the database table is automatically created on bot startup.

---

## 📊 Performance

### Resource Usage
- **CPU**: < 1% (Background task is very efficient)
- **Memory**: +5-10 MB for scheduler code
- **Disk**: Negligible (only text in SQLite)

### Scaling
- Tested with: 50+ concurrent scheduled messages
- Recommended: < 100 messages per guild for optimal performance

---

## 🐛 Known Limitations

1. **Precision**: ±60 seconds (since background task runs every 60s)
2. **Embeds**: Currently only text messages (v2.0 feature)
3. **Mentions**: Roles must be "mentionable"
4. **Timezone**: All times in UTC (local timezones in v2.0)

---

## 🔮 Planned Features (v2.0)

### Priority: High
- [ ] Embed support for rich messages
- [ ] Timezone support for local schedules
- [ ] Cron expression support (e.g., "Every Monday at 10:00")
- [ ] Edit message instead of creating new

### Priority: Medium
- [ ] Template system for reusable messages
- [ ] Webhook integration
- [ ] Discord thread creation
- [ ] Statistics (success rate, send history)

### Priority: Low
- [ ] Web interface in dashboard
- [ ] Export/Import of scheduled messages
- [ ] Multi-language messages
- [ ] Conditional scheduling (e.g., only if online count > X)

---

## 📚 Documentation

### Complete Guides
- [MESSAGE_SCHEDULER_GUIDE.md](MESSAGE_SCHEDULER_GUIDE.md) - User manual
- [SCHEDULER_TEST_GUIDE.md](SCHEDULER_TEST_GUIDE.md) - Testing & Troubleshooting
- [README.md](README.md) - General project overview

### Code Documentation
```python
# All functions are fully documented with:
# - Docstrings
# - Type hints
# - Parameter descriptions
# - Return values
```

---

## ✅ Testing Checklist

### Functional Tests
- [x] Message is sent at the correct time
- [x] Role pings work
- [x] Intervals are calculated correctly
- [x] Toggle enables/disables
- [x] Remove deletes message
- [x] List shows all messages
- [x] Bot restart preserves scheduled messages
- [x] Faulty channels are logged
- [x] Custom start times work correctly
- [x] Past start times calculate next occurrence

### Permission Tests
- [x] Administrator check works
- [x] Bot without Send permission is handled
- [x] Non-mentionable roles are handled

### Edge Cases
- [x] Deleted channels
- [x] Deleted roles
- [x] Very long messages (Discord limit: 2000 chars)
- [x] Interval = 0 is rejected
- [x] Invalid message_id
- [x] Invalid time formats

---

## 🎓 Lessons Learned

### What worked well
- Discord.py's `tasks.loop` is perfect for background tasks
- SQLite is sufficient for these requirements
- Simple string storage for role IDs works well
- Start time feature greatly improves usability

### What could be improved
- Plan embed support from the beginning
- Consider timezone handling earlier
- Replace command parameter limit with modal (for longer messages)

---

## 🙏 Credits

**Developed for:** Requiem Manager Bot  
**Version:** 1.0.0  
**Date:** January 2026  

---

## 📞 Support

For questions or problems:
1. Read [MESSAGE_SCHEDULER_GUIDE.md](MESSAGE_SCHEDULER_GUIDE.md)
2. Check [SCHEDULER_TEST_GUIDE.md](SCHEDULER_TEST_GUIDE.md)
3. Check the bot logs
4. Contact the bot administrator

---

**Happy Scheduling! 📅🤖**
