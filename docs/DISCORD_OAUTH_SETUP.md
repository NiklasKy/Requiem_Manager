# 🔐 Discord OAuth2 Setup Guide

Complete guide to configure Discord OAuth2 authentication for the Requiem Manager.

## Step 1: Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Enter a name (e.g., "Requiem Manager")
4. Click "Create"

## Step 2: Configure OAuth2

1. In your application settings, go to **OAuth2** → **General**
2. Add the following redirect URI:
   ```
   http://localhost:3001/auth/callback
   ```
   For production, use your actual domain:
   ```
   https://yourdomain.com/auth/callback
   ```

3. Note down:
   - **CLIENT ID** (visible in General Information)
   - **CLIENT SECRET** (click "Reset Secret" if needed)

## Step 3: Update Environment Variables

Copy `.env.example` to `.env` and update these values:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_GUILD_ID=your_guild_id_here

# Discord OAuth2 Configuration
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_REDIRECT_URI=http://localhost:3001/auth/callback

# JWT Secret (generate a strong random key)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Admin Configuration
ADMIN_ROLE_IDS=123456789012345678,987654321098765432
ADMIN_USER_IDS=242292116833697792
```

For the frontend, create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_DEFAULT_GUILD_ID=your_guild_id_here
REACT_APP_DISCORD_CLIENT_ID=your_client_id_here
```

## Step 4: Required Permissions

The application requests these OAuth2 scopes:
- `identify` - Get basic user information
- `guilds` - Check which servers the user is in

### Bot Permissions Required
Ensure your Discord bot has these permissions:
- **Read Messages/View Channels** - To see server structure
- **Send Messages** - For command responses
- **Use Slash Commands** - For bot commands
- **Manage Roles** - To track role changes (if needed)
- **View Audit Log** - To track detailed changes (optional)

### Privileged Gateway Intents
Enable these intents in the Discord Developer Portal:
- **Server Members Intent** - To track member changes
- **Message Content Intent** - If bot needs to read message content

## Step 5: Security & Access Control

### Role-Based Access Control

The system automatically assigns admin privileges based on:
1. **Discord Role IDs** defined in `ADMIN_ROLE_IDS`
2. **Discord User IDs** defined in `ADMIN_USER_IDS`

### Guild Restriction

Only members of your configured Discord server (`DISCORD_GUILD_ID`) can access the application.

### JWT Token Security

- Tokens expire after 24 hours
- Use a strong, unique `JWT_SECRET` in production
- Consider rotating the secret periodically
- Tokens include user roles and admin status

## Step 6: Testing

1. Start the application with `./start.bat` or `./start.sh`
2. Navigate to `http://localhost:3001`
3. You should be redirected to the login page
4. Click "Sign in with Discord"
5. Authorize the application
6. You should be redirected back and logged in

### Verification Steps
- Check that your username appears in the top-right corner
- Verify admin badge appears if you have admin rights
- Try accessing the admin panel if you're an admin
- Test navigation between different pages

## Troubleshooting

### "Discord OAuth2 not configured"
- Check that `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` are set
- Restart the API container after changing environment variables
- Verify environment variables are passed to Docker containers

### "You must be a member of the required Discord server"
- Ensure the user is a member of the guild specified in `DISCORD_GUILD_ID`
- Check that the guild ID is correct (18-digit number)
- Verify the bot is in the same server

### "Invalid redirect URI"
- Ensure the redirect URI in Discord matches exactly
- Check for trailing slashes or HTTP vs HTTPS
- Verify port numbers match (3001 for frontend)

### "Failed to get user info from Discord"
- Check that the OAuth2 scopes are correct
- Verify the Discord application is not restricted
- Check API logs for detailed error messages

### "Authorization code has already been used"
- This is normal - it prevents replay attacks
- Simply try logging in again
- Clear browser cache if the issue persists

### Login Loop or React Errors
- Check browser console for JavaScript errors
- Ensure React frontend is properly configured
- Verify API and frontend can communicate

## Production Deployment

For production environments:

### Security Considerations
1. **Use HTTPS** for all redirect URIs
2. **Generate strong JWT secret:** `openssl rand -hex 32`
3. **Set proper CORS origins** in FastAPI
4. **Use environment-specific Discord applications**
5. **Implement proper logging and monitoring**

### Environment Variables
```env
# Production OAuth2 Configuration
DISCORD_REDIRECT_URI=https://yourdomain.com/auth/callback
JWT_SECRET=randomly-generated-64-character-hex-string

# Production Admin Configuration
ADMIN_ROLE_IDS=production_role_id_1,production_role_id_2
ADMIN_USER_IDS=production_admin_user_id
```

### Docker Configuration
Ensure production Docker containers:
- Use secure base images
- Run as non-root user
- Have proper resource limits
- Include health checks

## Additional Features

### Theme Integration
The login page includes:
- Modern glassmorphism design
- Dark/Light mode support
- Custom Requiem logo
- Animated Discord branding

### Error Handling
The system includes comprehensive error handling for:
- Network failures
- Invalid credentials
- Expired tokens
- Server maintenance

### User Experience
- Automatic redirect after login
- Remember login state
- Graceful logout
- Protected route handling

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review container logs: `docker-compose logs api`
3. Verify Discord application configuration
4. Test with Discord Developer Tools
5. Create GitHub issue with logs and configuration details

---

**Security Note:** Never share your `CLIENT_SECRET` or `JWT_SECRET` publicly. Store them securely and rotate them regularly.