# Discord OAuth2 Setup Guide

To enable authentication for the Requiem Manager, you need to configure a Discord OAuth2 application.

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
# Discord OAuth2 Configuration
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_REDIRECT_URI=http://localhost:3001/auth/callback

# JWT Secret (generate a strong random key)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
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

## Step 5: Security Notes

### Role-Based Access Control

The system automatically assigns admin privileges to users with these roles:
- `Host`
- `Staff` 
- `Admin`

### Guild Restriction

Only members of your configured Discord server (`DISCORD_GUILD_ID`) can access the application.

### JWT Token Security

- Tokens expire after 24 hours
- Use a strong, unique `JWT_SECRET` in production
- Consider rotating the secret periodically

## Step 6: Testing

1. Start the application with `./start.sh` or `start.bat`
2. Navigate to `http://localhost:3001`
3. You should be redirected to the login page
4. Click "Sign in with Discord"
5. Authorize the application
6. You should be redirected back and logged in

## Troubleshooting

### "Discord OAuth2 not configured"
- Check that `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` are set
- Restart the API container after changing environment variables

### "You must be a member of the required Discord server"
- Ensure the user is a member of the guild specified in `DISCORD_GUILD_ID`
- Check that the guild ID is correct

### "Invalid redirect URI"
- Ensure the redirect URI in Discord matches exactly
- Check for trailing slashes or HTTP vs HTTPS

### "Failed to get user info from Discord"
- Check that the OAuth2 scopes are correct
- Verify the Discord application is not restricted

## Production Deployment

For production:

1. Use HTTPS for all redirect URIs
2. Generate a strong JWT secret: `openssl rand -hex 32`
3. Set proper CORS origins in FastAPI
4. Consider using environment-specific Discord applications
5. Implement proper logging and monitoring
