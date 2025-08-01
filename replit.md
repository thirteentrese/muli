# Discord Bot - Server Management Application

## Overview
This project develops a streamlined Discord bot for essential server management, including interactive welcome messages with role selection, message moderation, member management, and a comprehensive raffle system. Built with Node.js and Discord.js v14, it also incorporates an Express.js server for health monitoring. The bot aims to enhance community engagement and streamline administrative tasks within Discord servers, designed for efficient deployment on free hosting platforms.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
The bot is built with Node.js and TypeScript (using `tsx` for execution). It utilizes Express.js for health monitoring endpoints and Discord.js v14 for all Discord API interactions. Logging is managed by Winston, configured for console and file outputs, and environment variables are handled with `dotenv`.

### Application Structure
The application follows a modular design:
- **Entry Point**: `server/bot-only.ts` manages both the web server and Discord bot initialization.
- **Bot Core**: `server/discordBot.ts` handles the main Discord client and event processing.
- **Commands**: `server/discordCommands.ts` defines and handles slash commands.
- **Role Management**: `server/roleManager.ts` manages role selection and assignment.
- **Welcome System**: `server/welcomeRoles.ts` is responsible for welcome message and dropdown creation.
- **Logging**: `server/logger.ts` centralizes logging configuration.

### Key Features and Specifications
1.  **Welcome System**: Automated, interactive welcome messages with role selection dropdowns, including image integration and verification.
2.  **Message Moderation**: `/manage-msg` command for deleting messages with DM notifications.
3.  **Media-Only Channels**: `/media-only` and `/manage-media` commands to enforce media-only content, with automatic thread creation for media posts and deletion of text-only messages.
4.  **Ticketing System**: `/ticket` command for creating interactive support tickets.
5.  **Join-to-Create Voice Channels**: Automatic voice channel creation with public or invite-only access, including automatic cleanup of empty channels.
6.  **Raffle System**: Comprehensive raffle management with `/raffle-start`, `/raffle-pick`, and `/raffle-enter` commands, supporting custom prizes, multiple winners, and interactive buttons for entry and management.
7.  **Community Engagement**: `/tagay` and `/tagay-topics` commands for Filipino-themed interaction and discussion prompts.
8.  **Minimal Streaming Detection**: Silent role assignment for Twitch streaming without notifications.
9.  **Help System**: `/help` command with role-based access control.
10. **Health Monitoring**: An Express.js web server provides a `/health` endpoint for deployment monitoring.

### Permission System
- **Community Commands**: `/raffle`, `/tagay`, `/tagay-topics`, and `/raffle-enter` are accessible to all server members.
- **Moderator/Administrator Commands**: All other commands require elevated permissions (Manage Messages, Kick Members, Moderate Members, Administrator, or the custom "♡." role).

## External Dependencies

### Core Dependencies
-   `discord.js`
-   `express`
-   `winston`
-   `dotenv`
-   `tsx`

### Discord API Integration
The bot leverages Discord.js v14 for real-time event handling via Gateway Intents (Guilds, Guild Members, Guild Messages, Message Content, GuildPresences, GuildMessageReactions, GuildVoiceStates). It uses the Discord REST API for slash command registration and management, and webhook-style interactions for command processing.

## Deployment Configuration

### Render Hosting Setup
The project is fully configured for deployment on Render hosting platform:
- **Configuration**: `render.yaml` with automatic build and start commands
- **Environment Variables**: Configured for Discord bot tokens and optional Twitch integration
- **Health Monitoring**: Express.js server provides `/health` endpoint for Render's monitoring
- **Build Process**: `npm install` followed by `npx tsx server/bot-only.ts`
- **Documentation**: Complete deployment guide in `DEPLOYMENT.md`

### Alternative Deployment Options
- **Docker**: `Dockerfile` configured for containerized deployment
- **Railway**: Compatible with Railway's auto-deployment
- **Manual**: Can run on any Node.js hosting with environment variables

### Production Considerations
- Bot designed to handle Discord API rate limiting and timeouts gracefully
- All core features (JTC, welcome, verification) work independently of slash command registration
- Automatic restart tolerance with persistent logging
- Free tier hosting compatible with proper resource management