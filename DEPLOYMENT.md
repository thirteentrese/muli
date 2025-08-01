# Deployment Guide - Render Hosting

## Prerequisites

1. **Discord Bot Setup**:
   - Create a Discord application at https://discord.com/developers/applications
   - Get your `DISCORD_BOT_TOKEN` and `DISCORD_CLIENT_ID`
   - Invite the bot to your server with appropriate permissions

2. **Render Account**:
   - Sign up at https://render.com
   - Connect your GitHub repository

## Deployment Steps

### 1. Fork or Import Repository
- Fork this repository to your GitHub account
- Or upload the code to a new GitHub repository

### 2. Create Render Service
1. Go to Render dashboard
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `discord-bot-kabayans`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npx tsx server/bot-only.ts`
   - **Plan**: Free (or paid for better performance)

### 3. Set Environment Variables
In Render dashboard, add these environment variables:

```
DISCORD_BOT_TOKEN=your_actual_bot_token
DISCORD_CLIENT_ID=your_actual_client_id
NODE_ENV=production
```

Optional (for Twitch features):
```
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
```

### 4. Configure Health Check
- **Health Check Path**: `/health`
- The bot includes an Express server for health monitoring

### 5. Deploy
- Click "Create Web Service"
- Render will automatically build and deploy your bot
- Monitor the logs for any issues

## Bot Permissions Required

When inviting the bot to your Discord server, ensure these permissions:
- Read Messages/View Channels
- Send Messages
- Manage Messages
- Manage Channels
- Manage Roles
- Connect
- Speak
- Move Members
- Use Slash Commands
- Manage Webhooks
- Read Message History
- Add Reactions

## Post-Deployment

1. **Verify Bot Status**: Check that the bot appears online in Discord
2. **Test Commands**: Try `/help` to verify slash commands are working
3. **Test Features**: 
   - Join voice channels to test JTC system
   - Test welcome messages in new member flow
   - Verify role selection works

## Troubleshooting

### Common Issues

1. **Bot Offline**: Check environment variables are set correctly
2. **Commands Not Working**: Discord API may need time to register commands (up to 1 hour)
3. **Permission Errors**: Ensure bot has required permissions in Discord server
4. **Build Failures**: Check logs for missing dependencies

### Log Monitoring
- Use Render's log viewer to monitor bot activity
- Health check endpoint: `https://your-app.onrender.com/health`

## File Structure for Render

```
├── server/                 # Bot source code
├── render.yaml            # Render configuration
├── Dockerfile             # Alternative container deployment
├── .env.example           # Environment variables template
├── DEPLOYMENT.md          # This file
└── package.json           # Dependencies and scripts
```

## Support

For deployment issues:
- Check Render documentation
- Monitor bot logs in Render dashboard
- Verify Discord bot permissions and tokens

The bot is designed to work seamlessly on Render's free tier with automatic restarts and health monitoring.