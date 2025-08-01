
import { Client, Events, GatewayIntentBits, REST, Routes, Message, MessageType, EmbedBuilder, TextChannel, ChannelType, PermissionFlagsBits } from 'discord.js';
import logger from './logger';
import { registerSlashCommands, handleSlashCommand } from './discordCommands';
import { handleRoleSelection } from './roleManager';

// Define a global interface to ensure TypeScript understands our global variables
declare global {
  var moderatedChannels: Map<string, {
    defaultReason: string;
    guildId: string;
  }>;
  var logChannels: Map<string, string>;
  var userWarnings: Map<string, Array<{
    id: number;
    reason: string;
    moderator: string;
    timestamp: string;
  }>>;
  var paskoChannels: Map<string, string>;
  var ticketCounter: Map<string, number>;
  var activeTickets: Map<string, {
    channelId: string;
    userId: string;
    type: string;
    timestamp: string;
  }>;
  var discordClient: Client;
}

class DiscordBot {
  private client: Client;
  private token: string;
  private clientId: string;
  private rest: REST;
  private isConnected: boolean = false;
  private startTime: Date | null = null;

  constructor() {
    // Get token from environment variables
    this.token = process.env.DISCORD_BOT_TOKEN || '';
    this.clientId = process.env.DISCORD_CLIENT_ID || '';

    if (!this.token || !this.clientId) {
      throw new Error('Missing Discord bot token or client ID. Set DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID env variables.');
    }

    // Create new Discord client with necessary intents
    this.client = new Client({ 
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
      ]
    });

    // Create REST API instance
    this.rest = new REST({ version: '10' }).setToken(this.token);

    // Register event handlers
    this.registerEventHandlers();
  }

  private registerEventHandlers(): void {
    // Ready event - when bot successfully connects to Discord
    this.client.once(Events.ClientReady, async (c) => {
      this.isConnected = true;
      this.startTime = new Date();
      logger.info(`Bot logged in as ${c.user.tag}`);

      try {
        // Register slash commands for all guilds
        await registerSlashCommands(this.rest, this.clientId);

        // Start Christmas countdown interval (runs daily at midnight)
        this.startChristmasCountdown();
      } catch (error) {
        logger.error('Failed to register slash commands:', error);
      }
    });

    // Guild delete event - when bot leaves a server
    this.client.on(Events.GuildDelete, async (guild) => {
      logger.info(`Bot left guild: ${guild.name} (${guild.id})`);
    });

    // Interaction create event - handles slash commands and button/menu interactions
    this.client.on(Events.InteractionCreate, async (interaction) => {
      try {
        if (interaction.isChatInputCommand()) {
          await handleSlashCommand(interaction);
        } else if (interaction.isStringSelectMenu()) {
          if (interaction.customId === 'ticket_select') {
            await this.handleTicketSelection(interaction);
          } else {
            await handleRoleSelection(interaction);
          }
        } else if (interaction.isButton()) {
          if (interaction.customId.startsWith('close_ticket_')) {
            await this.handleTicketClose(interaction);
          }
        }
      } catch (error) {
        logger.error('Error handling interaction:', error);
      }
    });

    // Error event - log errors
    this.client.on(Events.Error, (error) => {
      logger.error('Discord client error:', error);
    });

    // Initialize global variables
    if (typeof global.moderatedChannels === 'undefined') {
      global.moderatedChannels = new Map();
    }
    if (typeof global.logChannels === 'undefined') {
      global.logChannels = new Map();
    }
    if (typeof global.userWarnings === 'undefined') {
      global.userWarnings = new Map();
    }
    if (typeof global.paskoChannels === 'undefined') {
      global.paskoChannels = new Map();
    }
    if (typeof global.ticketCounter === 'undefined') {
      global.ticketCounter = new Map();
    }
    if (typeof global.activeTickets === 'undefined') {
      global.activeTickets = new Map();
    }

    // Store client reference globally for logging
    global.discordClient = this.client;
  }

  // Connect to Discord
  async connect(): Promise<void> {
    try {
      logger.info('Connecting to Discord...');
      await this.client.login(this.token);
    } catch (error) {
      logger.error('Failed to connect to Discord:', error);
      throw error;
    }
  }

  // Disconnect from Discord
  async disconnect(): Promise<void> {
    try {
      logger.info('Disconnecting from Discord...');
      this.client.destroy();
      this.isConnected = false;
    } catch (error) {
      logger.error('Failed to disconnect from Discord:', error);
      throw error;
    }
  }

  // Get bot status
  getStatus(): { connected: boolean; uptime: number | null; guilds: number } {
    const uptime = this.startTime ? Date.now() - this.startTime.getTime() : null;
    return {
      connected: this.isConnected,
      uptime,
      guilds: this.client.guilds.cache.size
    };
  }

  // Get Discord client
  getClient(): Client {
    return this.client;
  }

  // Start Christmas countdown interval
  private startChristmasCountdown(): void {
    // Run every 24 hours (86400000 ms)
    setInterval(async () => {
      const now = new Date();
      const month = now.getMonth() + 1;

      // Only run between September and December
      if (month >= 9 && month <= 12) {
        await this.sendChristmasCountdown();
      }
    }, 86400000); // 24 hours

    // Also run immediately if it's the right time of year
    const now = new Date();
    const month = now.getMonth() + 1;
    if (month >= 9 && month <= 12) {
      setTimeout(() => this.sendChristmasCountdown(), 5000); // 5 second delay on startup
    }
  }

  // Send Christmas countdown to all configured channels
  private async sendChristmasCountdown(): Promise<void> {
    if (!global.paskoChannels) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const christmas = new Date(currentYear, 11, 25); // December 25th

    // If Christmas has passed this year, calculate for next year
    if (now > christmas) {
      christmas.setFullYear(currentYear + 1);
    }

    const timeUntilChristmas = christmas.getTime() - now.getTime();
    const daysUntilChristmas = Math.ceil(timeUntilChristmas / (1000 * 60 * 60 * 24));

    for (const [guildId, channelId] of global.paskoChannels) {
      try {
        const channel = await this.client.channels.fetch(channelId) as TextChannel;

        if (channel) {
          let message = '';
          let color = 0x00ff00;

          if (daysUntilChristmas === 0) {
            message = '🎄🎅 **MERRY CHRISTMAS!** 🎅🎄\nMaligayang Pasko sa lahat!';
            color = 0xff0000;
          } else if (daysUntilChristmas === 1) {
            message = '🎄 **TOMORROW IS CHRISTMAS!** 🎄\nIsa na lang ang araw! 🎅';
            color = 0xff6600;
          } else {
            message = `🎄 **${daysUntilChristmas} days** until Christmas! 🎅\nMga araw na lang! ✨`;
          }

          const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('🎄 Daily Christmas Countdown')
            .setDescription(message)
            .addFields(
              { name: 'Christmas Date', value: `<t:${Math.floor(christmas.getTime() / 1000)}:F>`, inline: true }
            )
            .setFooter({ text: 'Maligayang Pasko!' })
            .setTimestamp();

          await channel.send({ embeds: [embed] });
          logger.info(`Christmas countdown sent to ${channel.name} in ${channel.guild.name}`);
        }
      } catch (error) {
        logger.error(`Failed to send Christmas countdown to channel ${channelId}:`, error);
      }
    }
  }

  // Handle ticket selection
  private async handleTicketSelection(interaction: any): Promise<void> {
    const selectedValue = interaction.values[0];
    const user = interaction.user;
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply({
        content: 'This can only be used in a server.',
        ephemeral: true
      });
      return;
    }

    try {
      // Initialize ticket counter for this guild
      if (!global.ticketCounter) global.ticketCounter = new Map();
      if (!global.activeTickets) global.activeTickets = new Map();

      const currentCount = global.ticketCounter.get(guild.id) || 0;
      const newCount = currentCount + 1;
      global.ticketCounter.set(guild.id, newCount);

      // Get ticket type label
      const ticketTypes: { [key: string]: string } = {
        'report_concern': 'Report Concern',
        'host_event': 'Host Event',
        'promote_event': 'Promote Event',
        'suggestion': 'Suggestion',
        'partnership': 'Partnership',
        'other': 'Other'
      };

      const ticketType = ticketTypes[selectedValue] || 'Other';
      const channelName = `ticket-${newCount}-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

      // Create ticket channel under specified category (ID: 1400294589599846511)
      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        topic: `Ticket #${newCount} - ${ticketType} - ${user.tag}`,
        parent: '1400294589599846511',
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          },
          // Allow users with manage channels permission (mods/admins)
          ...guild.roles.cache
            .filter(role => role.permissions.has(PermissionFlagsBits.ManageChannels))
            .map(role => ({
              id: role.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages]
            }))
        ]
      });

      // Store ticket info
      global.activeTickets.set(ticketChannel.id, {
        channelId: ticketChannel.id,
        userId: user.id,
        type: selectedValue,
        timestamp: new Date().toISOString()
      });

      // Send welcome message in ticket channel
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🎫 Ticket #${newCount} - ${ticketType}`)
        .setDescription(`Hello ${user}! Thank you for creating a ticket.\n\nA moderator will be with you shortly. Please describe your ${ticketType.toLowerCase()} in detail.`)
        .addFields(
          { name: 'Ticket Type', value: ticketType, inline: true },
          { name: 'Created By', value: `${user.tag}`, inline: true },
          { name: 'Created At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setTimestamp();

      const closeButton = {
        type: 1,
        components: [
          {
            type: 2,
            style: 4,
            label: 'Close Ticket',
            custom_id: `close_ticket_${ticketChannel.id}`,
            emoji: '🔒'
          }
        ]
      };

      await ticketChannel.send({ 
        embeds: [embed], 
        components: [closeButton] 
      });

      await interaction.reply({
        content: `✅ Ticket created! Please check ${ticketChannel} for further assistance.`,
        ephemeral: true
      });

      logger.info(`Ticket #${newCount} created by ${user.tag} in ${guild.name}`);
    } catch (error) {
      logger.error('Error creating ticket:', error);
      await interaction.reply({
        content: '❌ Failed to create ticket. Please try again or contact an administrator.',
        ephemeral: true
      });
    }
  }

  // Handle ticket close
  private async handleTicketClose(interaction: any): Promise<void> {
    const channelId = interaction.customId.replace('close_ticket_', '');
    const channel = interaction.channel;
    const user = interaction.user;

    if (!global.activeTickets || !global.activeTickets.has(channelId)) {
      await interaction.reply({
        content: '❌ This ticket is not found in the system.',
        ephemeral: true
      });
      return;
    }

    try {
      const ticketInfo = global.activeTickets.get(channelId)!;
      const ticketCreator = await this.client.users.fetch(ticketInfo.userId);

      // Log to archived-tickets channel (ID: 1400295230099558421)
      try {
        const archivedTicketsChannel = await this.client.channels.fetch('1400295230099558421') as TextChannel;

        if (archivedTicketsChannel) {
          const ticketTypes: { [key: string]: string } = {
            'report_concern': 'Report Concern',
            'host_event': 'Host Event',
            'promote_event': 'Promote Event',
            'suggestion': 'Suggestion',
            'partnership': 'Partnership',
            'other': 'Other'
          };

          const ticketType = ticketTypes[ticketInfo.type] || 'Other';

          const archiveEmbed = new EmbedBuilder()
            .setColor(0xff6b6b)
            .setTitle('🔒 Ticket Closed')
            .setDescription(`**Ticket:** ${channel.name}`)
            .addFields(
              { name: 'Ticket Type', value: ticketType, inline: true },
              { name: 'Requester', value: `${ticketCreator.tag} (${ticketCreator.id})`, inline: true },
              { name: 'Closed By', value: `${user.tag} (${user.id})`, inline: true },
              { name: 'Created At', value: `<t:${Math.floor(new Date(ticketInfo.timestamp).getTime() / 1000)}:F>`, inline: true },
              { name: 'Closed At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
              { name: 'Channel ID', value: channelId, inline: true }
            )
            .setTimestamp();

          await archivedTicketsChannel.send({ embeds: [archiveEmbed] });
          logger.info(`Ticket ${channel.name} logged to archived-tickets channel`);
        }
      } catch (archiveError) {
        logger.error('Failed to log ticket to archived-tickets channel:', archiveError);
      }

      // Create close confirmation embed
      const embed = new EmbedBuilder()
        .setColor(0xff6b6b)
        .setTitle('🔒 Ticket Closed')
        .setDescription('This ticket has been closed and logged to the archived-tickets channel.')
        .addFields(
          { name: 'Closed By', value: user.tag, inline: true },
          { name: 'Closed At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      // Remove from active tickets
      global.activeTickets.delete(channelId);

      // Delete the channel after 10 seconds
      setTimeout(async () => {
        try {
          await channel.delete();
          logger.info(`Ticket channel ${channel.name} deleted by ${user.tag}`);
        } catch (error) {
          logger.error('Error deleting ticket channel:', error);
        }
      }, 10000);

    } catch (error) {
      logger.error('Error closing ticket:', error);
      await interaction.reply({
        content: '❌ Failed to close ticket. Please try again.',
        ephemeral: true
      });
    }
  }
}

// Global function to handle ticket interactions
global.handleTicketSelection = async (interaction: any) => {
  // This will be handled by the bot instance
};

// Create and export bot instance
const bot = new DiscordBot();
export default bot;

// Auto-connect when module is imported
bot.connect().catch((error) => {
  logger.error('Failed to start Discord bot:', error);
});
