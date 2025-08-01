import 'dotenv/config';
import express from "express";
import { DiscordBot } from "./discordBot";
import logger from "./logger";

const app = express();

// Health check endpoint
app.get("/health", (_, res) => {
  res.json({ 
    status: "ok", 
    message: "Discord bot is running",
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get("/", (_, res) => {
  res.send("Discord Bot is running!");
});

const PORT = Number(process.env.PORT) || 3000;

// Initialize and start the Discord bot
const discordBot = new DiscordBot();

// Start the bot
discordBot.connect().catch((error) => {
  logger.error('Failed to start Discord bot:', error);
  process.exit(1);
});

// Start the web server
app.listen(PORT, "0.0.0.0", () => {
  logger.info(`Web server started on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await discordBot.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await discordBot.disconnect();
  process.exit(0);
});
