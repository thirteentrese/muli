# Discord Bot - Kabayans Abroad Server Management

A comprehensive Discord server management bot designed for the Kabayans Abroad community, featuring advanced voice channel management, interactive welcome systems, raffle functionality, and Filipino community engagement features.

## 🚀 Quick Start

### Local Development
1. Clone this repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your Discord bot credentials
4. Run: `npm run dev`

### Production Deployment (Render)
See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.

## ✨ Features

### Core Management
- **Interactive Welcome System**: Automated welcome messages with role selection dropdowns
- **Advanced Role Management**: Seamless role assignment with verification workflow
- **Message Moderation**: Delete messages with automatic DM notifications
- **Warning System**: Issue and track user warnings with persistence
- **Ticketing System**: Create interactive support tickets

### Voice Channel Innovation
- **Join-to-Create (JTC) System**: 
  - Public channels visible to all members
  - Private invite-only channels with owner control
  - Automatic cleanup of empty channels
  - Security: Tambay role cannot abuse drag permissions

### Community Engagement
- **Interactive Raffle System**: Multi-winner support, custom prizes, flexible durations
- **Filipino Community Features**: `/tagay` and `/tagay-topics` for cultural interaction
- **Christmas Countdown**: Automated holiday messaging

### Media Management
- **Media-Only Channels**: Enforce media content with automatic thread creation
- **Smart Content Detection**: Automatically handle text vs media posts

## 🔧 Technical Stack

- **Runtime**: Node.js with TypeScript
- **Discord API**: Discord.js v14
- **Logging**: Winston with console and file outputs
- **Web Server**: Express.js for health monitoring
- **Deployment**: Optimized for Render hosting platform

## 🛡️ Permission System

### Two-Tier Access Control
- **Community Commands**: Accessible to all server members
  - `/raffle`, `/tagay`, `/tagay-topics`, `/raffle-enter`
- **Moderation Commands**: Restricted to staff with appropriate permissions
  - Requires: Manage Messages, Kick Members, Moderate Members, Administrator, or "♡." role

## 📁 Project Structure

```
├── server/
│   ├── bot-only.ts          # Main entry point
│   ├── discordBot.ts        # Discord client and events
│   ├── discordCommands.ts   # Slash command definitions
│   ├── roleManager.ts       # Role assignment logic
│   ├── welcomeRoles.ts      # Welcome system
│   └── logger.ts            # Centralized logging
├── render.yaml              # Render deployment config
├── Dockerfile               # Container deployment option
├── DEPLOYMENT.md            # Deployment guide
└── README.md                # This file
```

## 🚀 Deployment Options

### 1. Render (Recommended)
- Free tier available
- Automatic deployments from GitHub
- Built-in health monitoring
- See [DEPLOYMENT.md](DEPLOYMENT.md) for setup

### 2. Docker
```bash
docker build -t discord-bot .
docker run -d --env-file .env -p 3000:3000 discord-bot
```

### 3. Railway
```bash
railway login
railway new
railway add
railway up
```

## 🔑 Environment Variables

```env
# Required
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id

# Optional (Twitch features)
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret

# Environment
NODE_ENV=production
```

## 🎯 Bot Permissions Required

When inviting the bot to your Discord server:
- Read Messages/View Channels
- Send Messages
- Manage Messages
- Manage Channels
- Manage Roles
- Connect & Speak
- Move Members
- Use Slash Commands
- Read Message History
- Add Reactions

## 📊 Health Monitoring

The bot includes an Express.js server for monitoring:
- **Health Check**: `GET /health`
- **Status**: Returns bot uptime and connection status
- **Port**: 3000 (configurable via PORT environment variable)

## 🐛 Troubleshooting

### Common Issues
1. **Commands Not Appearing**: Discord API may take up to 1 hour to register commands
2. **Bot Offline**: Verify DISCORD_BOT_TOKEN is correct
3. **Permission Errors**: Ensure bot has required server permissions
4. **JTC Not Working**: Check voice channel permissions and bot role hierarchy

### Logging
- Console output for real-time monitoring
- File logging to `combined.log` and `error.log`
- Winston logger with timestamp and level formatting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test thoroughly in a development Discord server
4. Submit a pull request

## 📝 License

This project is created for the Kabayans Abroad Discord community. For licensing questions, please contact the repository maintainers.

---

**Kabayans Abroad Discord Bot** - Bringing Filipino community management to the next level! 🇵🇭