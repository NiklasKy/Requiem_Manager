# 🛡️ Admin Configuration Guide

## Overview
The Requiem Tracking System supports flexible admin configuration via environment variables.

## Environment Variables

### ADMIN_ROLE_IDS
Defines Discord role IDs that receive admin privileges.

**Format:** Comma-separated list of Discord role IDs
```env
ADMIN_ROLE_IDS=123456789012345678,987654321098765432
```

**Examples:**
```env
# Development Environment
ADMIN_ROLE_IDS=123456789012345678,456789012345678901

# Production Environment  
ADMIN_ROLE_IDS=987654321098765432,789012345678901234
```

**⚡ Advantage:** Role IDs remain constant even when role names are changed!

### ADMIN_USER_IDS
Defines specific Discord user IDs that receive admin privileges (fallback for server owners).

**Format:** Comma-separated list of Discord user IDs
```env
ADMIN_USER_IDS=242292116833697792,123456789012345678
```

**Examples:**
```env
# Single Admin
ADMIN_USER_IDS=242292116833697792

# Multiple Admins
ADMIN_USER_IDS=242292116833697792,123456789012345678,987654321098765432
```

## Configuration Steps

### 1. Edit .env File
```bash
# Copy .env.example to .env if not already done
cp .env.example .env

# Edit .env and set your admin configuration
nano .env
```

### 2. Set Admin Roles for Your Environment

**Development:**
```env
ADMIN_ROLE_IDS=123456789012345678,456789012345678901
ADMIN_USER_IDS=242292116833697792
```

**Production:**
```env
ADMIN_ROLE_IDS=987654321098765432,789012345678901234
ADMIN_USER_IDS=242292116833697792,123456789012345678
```

### 3. Restart Containers
```bash
# Development
./stop.bat && ./start.bat

# Or individually
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

## Admin Rights Verification

### Automatic Detection
The system checks admin rights in the following order:

1. **Role ID-based:** User has one of the `ADMIN_ROLE_IDS` in Discord
2. **User ID-based:** User ID is defined in `ADMIN_USER_IDS`

### Debug Information
Admin status is stored in the JWT token and displayed in the navbar:
- ✅ **Admin Badge** when admin rights are present
- 🚫 **No Badge** when no admin rights

## Troubleshooting

### Issue: No Admin Rights Despite Correct Role
1. **Check Role in Discord:** Ensure you actually have the role
2. **Check Role Names:** Case-insensitive, but exact spelling
3. **Reload Bot:** Bot must first synchronize role changes
4. **Re-login:** JWT token must be recreated

### Issue: 0 Roles Displayed
1. **Check Bot Inventory:** Execute `/initial_inventory`
2. **Check Database:** Roles must be present in `roles` table
3. **Check Container Logs:** Errors in auth processing

### Finding Discord User ID
1. **Enable Discord Developer Mode**
2. **Right-click on your name → "Copy ID"**
3. **Enter ID in ADMIN_USER_IDS**

### Finding Discord Role ID
1. **Enable Discord Developer Mode** (Settings → Advanced → Developer Mode)
2. **Open Server Settings → Roles**
3. **Right-click on desired role → "Copy ID"**
4. **Enter ID in ADMIN_ROLE_IDS**

**Alternative via Bot Commands:**
```
/info role @RoleName
```

## Security Best Practices

1. **Minimal Rights:** Only define necessary roles as admin
2. **User ID Backup:** At least one user ID as fallback
3. **Environment Separation:** Different admin configuration for Dev/Prod
4. **Regular Review:** Review admin list regularly

## Examples

### Gaming Guild Setup
```env
ADMIN_ROLE_IDS=123456789012345678,456789012345678901,789012345678901234
ADMIN_USER_IDS=242292116833697792
```

### Development Team Setup
```env
ADMIN_ROLE_IDS=987654321098765432,654321098765432109
ADMIN_USER_IDS=242292116833697792,123456789012345678
```

### Community Server Setup
```env
ADMIN_ROLE_IDS=111222333444555666,777888999000111222,333444555666777888
ADMIN_USER_IDS=242292116833697792
```

## Admin Features

### Available Admin Functions
- **Admin Panel:** System statistics and status overview
- **Database Management:** View database statistics and health
- **User Data Export:** Export user data for analysis
- **Data Cleanup:** Clean up old data and duplicate entries
- **Bot Commands:** Access to admin-only slash commands

### Admin-Only Pages
- `/admin` - Admin panel with system overview
- Protected routes automatically check admin status
- Admin badge displayed in navigation bar

### Admin-Only Bot Commands
- `/database_stats` - Database statistics
- `/cleanup_old_data [days]` - Clean up old data
- `/export_user_data <user>` - Export user data
- `/cleanup_duplicate_roles` - Clean up duplicate initial role entries
- `/sync` - Synchronize slash commands