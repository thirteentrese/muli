import {
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  Message,
  MessageType,
  EmbedBuilder,
  TextChannel,
  ChannelType,
  PermissionFlagsBits,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ActivityType,
  VoiceState,
  Partials,
} from "discord.js";
import logger from "./logger";
import { registerSlashCommands, handleSlashCommand, handleButtonInteraction } from "./discordCommands";
import { handleRoleSelection } from "./roleManager";
// Streaming features deactivated per user request
// import { TwitchNotificationManager } from "./twitchNotifications";
// import { AutoStreamDetection } from "./autoStreamDetection";

// Define a global interface to ensure TypeScript understands our global variables
declare global {
  var moderatedChannels: Map<
    string,
    {
      defaultReason: string;
      guildId: string;
    }
  >;
  var logChannels: Map<string, string>;
  var userWarnings: Map<
    string,
    Array<{
      id: number;
      reason: string;
      moderator: string;
      timestamp: string;
    }>
  >;
  var paskoChannels: Map<string, string>;
  var ticketCounter: Map<string, number>;
  var activeTickets: Map<
    string,
    {
      channelId: string;
      userId: string;
      type: string;
      timestamp: string;
    }
  >;
  var mediaOnlyChannels: Map<string, { guildId: string; channelName: string }>;
  var joinToCreateChannels: Map<string, {
    guildId: string;
    channelId: string;
    channelName: string;
    isPrivate: boolean;
    createdChannels: Set<string>;
  }>;
  var createdJTCChannels: Map<string, {
    ownerId: string;
    parentJTCId: string;
    isPrivate: boolean;
    createdAt: number;
  }>;
  var discordClient: Client;
  // Streaming features deactivated
  // var twitchNotificationManager: TwitchNotificationManager;
  // var autoStreamDetection: AutoStreamDetection;
}

export class DiscordBot {
  private client: Client;
  private token: string;
  private clientId: string;
  private rest: REST;
  private isConnected: boolean = false;
  private startTime: Date | null = null;

  constructor() {
    // Get token from environment variables
    this.token = process.env.DISCORD_BOT_TOKEN || "";
    this.clientId = process.env.DISCORD_CLIENT_ID || "";

    if (!this.token || !this.clientId) {
      throw new Error(
        "Missing Discord bot token or client ID. Set DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID env variables.",
      );
    }

    // Create new Discord client with necessary intents
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences, // Re-enabled for streaming role detection
      ],
      partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User], // Enable partials for reactions
    });

    // Create REST API instance
    this.rest = new REST({ version: "10" }).setToken(this.token);

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
        // Register slash commands (continue even if fails)
        registerSlashCommands(this.rest, this.clientId).catch(error => {
          logger.error('Failed to register commands, but bot will continue:', error);
        });

        // Start Christmas countdown interval (runs daily at midnight)
        this.startChristmasCountdown();
      } catch (error) {
        logger.error("Failed to register slash commands:", error);
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
          if (interaction.customId === "ticket_select") {
            await this.handleTicketSelection(interaction);
          } else if (interaction.customId === "raffle_select") {
            // Handle raffle selection through button interaction handler
            await handleButtonInteraction(interaction as any);
          } else {
            await handleRoleSelection(interaction);
          }
        } else if (interaction.isButton()) {
          if (interaction.customId.startsWith("close_ticket_")) {
            await this.handleTicketClose(interaction);
          } else if (interaction.customId.startsWith("raffle_")) {
            await handleButtonInteraction(interaction);
          }
        }
      } catch (error) {
        logger.error("Error handling interaction:", error);
      }
    });

    // Message create event - handle media-only channels
    this.client.on(Events.MessageCreate, async (message) => {
      try {
        await this.handleMediaOnlyMessage(message);
      } catch (error) {
        logger.error("Error handling media-only message:", error);
      }
    });

    // Message reaction add event - handle verification
    this.client.on(Events.MessageReactionAdd, async (reaction, user) => {
      try {
        // Fetch partial messages and reactions to ensure we have complete data
        if (reaction.partial) {
          try {
            await reaction.fetch();
          } catch (error) {
            logger.error('Failed to fetch partial reaction:', error);
            return;
          }
        }
        
        if (reaction.message.partial) {
          try {
            await reaction.message.fetch();
          } catch (error) {
            logger.error('Failed to fetch partial message:', error);
            return;
          }
        }
        
        await this.handleVerificationReaction(reaction, user);
      } catch (error) {
        logger.error("Error handling verification reaction:", error);
      }
    });



    // Error event - log errors
    this.client.on(Events.Error, (error) => {
      logger.error("Discord client error:", error);
    });

    // Initialize global variables
    if (typeof global.moderatedChannels === "undefined") {
      global.moderatedChannels = new Map();
    }
    if (typeof global.logChannels === "undefined") {
      global.logChannels = new Map();
    }
    if (typeof global.userWarnings === "undefined") {
      global.userWarnings = new Map();
    }
    if (typeof global.paskoChannels === "undefined") {
      global.paskoChannels = new Map();
    }
    if (typeof global.ticketCounter === "undefined") {
      global.ticketCounter = new Map();
    }
    if (typeof global.activeTickets === "undefined") {
      global.activeTickets = new Map();
    }
    if (typeof global.mediaOnlyChannels === "undefined") {
      global.mediaOnlyChannels = new Map();
    }
    if (typeof global.joinToCreateChannels === "undefined") {
      global.joinToCreateChannels = new Map();
    }
    if (typeof global.createdJTCChannels === "undefined") {
      global.createdJTCChannels = new Map();
    }

    // Store client reference globally for logging
    global.discordClient = this.client;
    
    // Initialize minimal streaming role detection (no notifications)
    this.setupStreamingRoleDetection();
    
    // Initialize join-to-create voice channel system
    this.setupJoinToCreateSystem();
    
    // Initialize Christmas countdown system
    this.initializeChristmasCountdown();
  }

  // Connect to Discord
  async connect(): Promise<void> {
    try {
      logger.info("Connecting to Discord...");
      await this.client.login(this.token);
    } catch (error) {
      logger.error("Failed to connect to Discord:", error);
      throw error;
    }
  }

  // Disconnect from Discord
  async disconnect(): Promise<void> {
    try {
      logger.info("Disconnecting from Discord...");
      this.client.destroy();
      this.isConnected = false;
    } catch (error) {
      logger.error("Failed to disconnect from Discord:", error);
      throw error;
    }
  }

  // Get bot status
  getStatus(): { connected: boolean; uptime: number | null; guilds: number } {
    const uptime = this.startTime
      ? Date.now() - this.startTime.getTime()
      : null;
    return {
      connected: this.isConnected,
      uptime,
      guilds: this.client.guilds.cache.size,
    };
  }

  // Get Discord client
  getClient(): Client {
    return this.client;
  }

  // Generate Christmas countdown message for current date
  private generateChristmasCountdown(): string {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Christmas is December 25
    let christmas = new Date(currentYear, 11, 25); // Month 11 = December
    
    // If we're past Christmas this year, count to next year's Christmas
    if (currentDate > christmas) {
      christmas = new Date(currentYear + 1, 11, 25);
    }
    
    const timeDiff = christmas.getTime() - currentDate.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const currentMonth = currentDate.getMonth() + 1;
    const currentDay = currentDate.getDate();
    const currentMonthName = monthNames[currentDate.getMonth()];
    
    // Only show countdown from September to December
    if (currentMonth < 9) {
      return '';
    }
    
    if (daysLeft < 0) {
      return `🎄✨ **Merry Christmas, @everyone!** ✨🎄\n\nChristmas Day is here! Wishing you all a wonderful day filled with joy, love, and happiness! 🎁🎅`;
    } else if (daysLeft === 0) {
      return `🎄✨ **Merry Christmas, @everyone!** ✨🎄\n\nChristmas Day is here! Wishing you all a wonderful day filled with joy, love, and happiness! 🎁🎅`;
    } else if (daysLeft === 1) {
      return `🎄🎅 **Christmas Eve** 🎅🎄\n\nTomorrow is Christmas Day! Only **1 day** left until the most magical day of the year! 🎁✨`;
    } else {
      const emoji = daysLeft <= 7 ? '🎄🎁' : daysLeft <= 30 ? '🎄❄️' : '🎄🍂';
      return `${emoji} **Christmas Countdown** ${emoji}\n\n📅 Today is **${currentMonthName} ${currentDay}**\n🎅 **${daysLeft} days** until Christmas Day! 🎄`;
    }
  }

  // Start automatic Christmas countdown system
  private startChristmasCountdown(): void {
    // Set up daily interval (runs at 12:00 PM each day)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0); // Send at 12:00 PM each day
    
    const msUntilNextRun = tomorrow.getTime() - now.getTime();
    
    // First run after the calculated delay
    setTimeout(() => {
      this.sendDailyChristmasCountdown();
      
      // Then continue every 24 hours
      setInterval(() => {
        this.sendDailyChristmasCountdown();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, msUntilNextRun);
    
    logger.info(`Christmas countdown scheduled for daily messages at 12:00 PM (next run in ${Math.round(msUntilNextRun / (1000 * 60 * 60))} hours)`);
  }

  // Send Christmas countdown to all configured guilds
  private async sendDailyChristmasCountdown(): Promise<void> {
    const countdownMessage = this.generateChristmasCountdown();
    
    if (!countdownMessage) {
      return; // Not the right time of year
    }
    
    // Send to the main KA server channel (general or announcements)
    const kaServerId = '1184864945142251530';
    const kaAnnouncementsChannelId = '1397748954111672352'; // Update this with actual channel ID
    
    try {
      const guild = this.client.guilds.cache.get(kaServerId);
      if (guild) {
        const channel = guild.channels.cache.get(kaAnnouncementsChannelId) as TextChannel;
        if (channel && channel.type === ChannelType.GuildText) {
          await channel.send(countdownMessage);
          logger.info(`Sent Christmas countdown to ${guild.name}`);
        }
      }
    } catch (error) {
      logger.error('Failed to send Christmas countdown:', error);
    }
  }

  // Initialize the Christmas countdown system when bot starts
  private initializeChristmasCountdown(): void {
    // Start the countdown system
    this.startChristmasCountdown();
  }

  // Placeholder for streaming role detection (deactivated feature)
  private setupStreamingRoleDetection(): void {
    logger.info("Streaming role detection initialized (no notifications)");
    // Streaming features are deactivated per user request
  }

  // Set up join-to-create voice channel system
  private setupJoinToCreateSystem(): void {
    // Initialize global join-to-create channels map
    if (typeof global.joinToCreateChannels === "undefined") {
      global.joinToCreateChannels = new Map();
    }
    if (typeof global.createdJTCChannels === "undefined") {
      global.createdJTCChannels = new Map();
    }

    // Pre-configure the specific JTC channels
    this.configureDefaultJTCChannels();

    // Set up voice state update event handler
    this.client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
      try {
        await this.handleVoiceStateUpdate(oldState, newState);
      } catch (error) {
        logger.error("Error handling voice state update for JTC:", error);
      }
    });

    logger.info("Join-to-create voice channel system initialized");
  }

  // Configure default JTC channels
  private configureDefaultJTCChannels(): void {
    // Configure exclu-vc as private (invite-only)
    global.joinToCreateChannels.set('1336054025925169226', {
      guildId: '1355432987793297498', // KA server ID
      channelId: '1336054025925169226',
      channelName: 'exclu-vc',
      isPrivate: true,
      createdChannels: new Set()
    });

    // Configure inclu-vc as public
    global.joinToCreateChannels.set('1232496558042517534', {
      guildId: '1355432987793297498', // KA server ID
      channelId: '1232496558042517534',
      channelName: 'inclu-vc',
      isPrivate: false,
      createdChannels: new Set()
    });

    logger.info("Pre-configured JTC channels: exclu-vc (private), inclu-vc (public)");
  }

  // Handle voice state updates for JTC system
  private async handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<void> {
    const guild = newState.guild || oldState.guild;
    if (!guild) return;

    // Handle joining a JTC channel
    if (newState.channelId && global.joinToCreateChannels.has(newState.channelId)) {
      await this.handleJTCJoin(newState, guild);
    }

    // Handle being moved INTO a created private JTC channel
    if (newState.channelId && global.createdJTCChannels.has(newState.channelId)) {
      const jtcChannel = global.createdJTCChannels.get(newState.channelId);
      if (jtcChannel && jtcChannel.isPrivate && newState.member) {
        const user = newState.member.user;
        // Skip if this is the channel owner or if they were already in this channel
        if (user.id !== jtcChannel.ownerId && oldState.channelId !== newState.channelId) {
          await this.handleJTCMemberAdded(newState, user);
        }
      }
    }

    // Handle leaving a created channel (cleanup empty channels)
    if (oldState.channelId && global.createdJTCChannels.has(oldState.channelId)) {
      await this.handleJTCLeave(oldState, guild);
    }
  }

  // Handle when someone is moved INTO a private JTC channel
  private async handleJTCMemberAdded(voiceState: VoiceState, user: any): Promise<void> {
    if (!voiceState.channel) return;
    
    try {
      // Grant connect and participation permissions to invited member
      await voiceState.channel.permissionOverwrites.create(user.id, {
        ViewChannel: true,        // Can see channel
        Connect: true,           // Can join the channel
        Speak: true,             // Can speak
        UseVAD: true,            // Can use voice activity
        Stream: true,            // Can stream
        SendMessages: true,      // Can send messages
        ReadMessageHistory: true, // Can read history
        EmbedLinks: true,        // Can embed links  
        AttachFiles: true,       // Can attach files
        UseExternalEmojis: true, // Can use emojis
        AddReactions: true       // Can add reactions
      });
      
      logger.info(`✅ Granted access permissions to ${user.username} for private JTC channel ${voiceState.channel.name}`);
    } catch (error) {
      logger.error(`❌ Failed to grant permissions to ${user.username}:`, error);
    }
  }

  // Handle user joining a JTC channel
  private async handleJTCJoin(voiceState: VoiceState, guild: any): Promise<void> {
    const jtcConfig = global.joinToCreateChannels.get(voiceState.channelId!);
    if (!jtcConfig || !voiceState.member) return;

    const user = voiceState.member.user;
    const originalChannel = guild.channels.cache.get(voiceState.channelId!);
    if (!originalChannel) return;

    try {
      // Create new voice channel
      const newChannelName = `${user.displayName}'s Channel`;
      const newChannel = await guild.channels.create({
        name: newChannelName,
        type: ChannelType.GuildVoice,
        parent: originalChannel.parent,
        userLimit: originalChannel.userLimit || 0,
        bitrate: originalChannel.bitrate,
        reason: 'Join-to-create channel created',
        permissionOverwrites: jtcConfig.isPrivate ? [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]
          },
          {
            id: user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.UseVAD,
              PermissionFlagsBits.Stream,
              PermissionFlagsBits.MoveMembers,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.ManageRoles
            ]
          }
        ] : [
          {
            id: user.id,
            allow: [PermissionFlagsBits.MoveMembers, PermissionFlagsBits.ManageChannels]
          }
        ]
      });

      // Set up permissions based on channel type
      if (jtcConfig.isPrivate) {
        // Create private channel - visible but invite-only
        const everyoneRole = guild.roles.everyone;
        
        // Allow viewing but deny joining for @everyone
        await newChannel.permissionOverwrites.create(everyoneRole.id, {
          ViewChannel: true,   // Can see the channel
          Connect: false       // Can't join directly
        });
        
        // Give channel owner full permissions
        await newChannel.permissionOverwrites.create(user.id, {
          ViewChannel: true,
          Connect: true,
          Speak: true,
          UseVAD: true,
          Stream: true,
          SendMessages: true,
          ReadMessageHistory: true,
          EmbedLinks: true,
          AttachFiles: true,
          UseExternalEmojis: true,
          AddReactions: true,
          MoveMembers: true,
          ManageChannels: true,
          ManageRoles: true
        });

        // Deny Tambay role from moving members (prevents self-dragging abuse)
        const tambayRoleId = '1397749137808150629';
        const tambayRole = guild.roles.cache.get(tambayRoleId);
        if (tambayRole) {
          await newChannel.permissionOverwrites.create(tambayRole.id, {
            ViewChannel: true,   // Can see the channel
            Connect: false,      // Can't join directly
            MoveMembers: false   // Can't drag themselves or others in
          });
        }

        // Find and allow administrator/moderator roles
        try {
          const adminRoles = guild.roles.cache.filter((role: any) => {
            return role.permissions.has(PermissionFlagsBits.Administrator) ||
                   role.permissions.has(PermissionFlagsBits.ManageGuild) ||
                   role.permissions.has(PermissionFlagsBits.ManageChannels);
          });
          
          for (const [roleId, role] of adminRoles) {
            if (role.id !== everyoneRole.id) { // Skip @everyone
              await newChannel.permissionOverwrites.create(roleId, {
                ViewChannel: true,
                Connect: true,
                Speak: true,
                UseVAD: true,
                Stream: true,
                SendMessages: true,
                ReadMessageHistory: true,
                EmbedLinks: true,
                AttachFiles: true,
                UseExternalEmojis: true,
                AddReactions: true,
                MoveMembers: true,
                ManageChannels: true
              });
            }
          }
          
          logger.info(`Set permissions for ${adminRoles.size} admin/mod roles on private channel - Tambay role denied MoveMembers`);
        } catch (permError) {
          logger.warn("Error setting mod permissions:", permError);
        }
        
        logger.info(`Created PRIVATE JTC channel "${newChannelName}" - invite-only, owner-controlled access`);
      } else {
        // Public channel - everyone can see and join, owner gets management permissions
        await newChannel.permissionOverwrites.create(user.id, {
          MoveMembers: true,
          ManageChannels: true
        });
        logger.info(`Created PUBLIC JTC channel "${newChannelName}" - visible to all`);
      }

      // Move user to new channel
      await voiceState.setChannel(newChannel);

      // Track the created channel
      global.createdJTCChannels.set(newChannel.id, {
        ownerId: user.id,
        parentJTCId: voiceState.channelId!,
        isPrivate: jtcConfig.isPrivate,
        createdAt: Date.now()
      });

      // Send welcome message if private
      logger.info(`JTC channel created - isPrivate: ${jtcConfig.isPrivate}, channel: ${jtcConfig.channelName}, user: ${user.tag}`);
      
      if (jtcConfig.isPrivate) {
        logger.info(`Preparing to send private JTC welcome message for ${user.tag}`);
        try {
          const embed = new EmbedBuilder()
            .setColor(0x6E8878)
            .setTitle('🔒 Private Voice Channel Created')
            .setDescription(`Welcome to your private voice channel, ${user.displayName}!\n\n**How to invite others:**\n• Drag members from <#1400641173273575454> into this channel\n• Or ask a moderator to move members here\n\n*Note: Admins and moderators can always see and join this channel.*`)
            .setTimestamp();

          // Send message directly to the created private voice channel
          try {
            await newChannel.send({
              content: `<@${user.id}>`,
              embeds: [embed]
            });
            logger.info(`✅ Successfully sent private JTC welcome message for ${user.tag} to their private voice channel`);
          } catch (channelSendError) {
            logger.warn(`Could not send message to private voice channel, attempting DM to ${user.tag}:`, channelSendError);
            // Fallback: send DM to user if channel message fails
            try {
              await user.send({ embeds: [embed] });
              logger.info(`✅ Successfully sent private JTC welcome message to ${user.tag} via DM`);
            } catch (dmError) {
              logger.error(`❌ Could not send JTC welcome message to ${user.tag} via DM:`, dmError);
            }
          }
        } catch (error) {
          logger.error("❌ Error sending JTC welcome message:", error);
        }
      } else {
        logger.info(`Public JTC channel created for ${user.tag} - no welcome message needed`);
      }

      logger.info(`Created JTC channel "${newChannelName}" for user ${user.tag} (${user.id})`);

    } catch (error) {
      logger.error("Failed to create JTC channel:", error);
    }
  }

  // Handle user leaving a created JTC channel
  private async handleJTCLeave(voiceState: VoiceState, guild: any): Promise<void> {
    const channelConfig = global.createdJTCChannels.get(voiceState.channelId!);
    if (!channelConfig) return;

    const channel = guild.channels.cache.get(voiceState.channelId!);
    if (!channel) return;

    // Wait a moment to avoid race conditions
    setTimeout(async () => {
      try {
        // Refresh channel data
        const updatedChannel = guild.channels.cache.get(voiceState.channelId!);
        if (!updatedChannel) return;

        // If channel is empty, delete it
        if (updatedChannel.members.size === 0) {
          await updatedChannel.delete('Empty JTC channel cleanup');
          global.createdJTCChannels.delete(voiceState.channelId!);
          logger.info(`Deleted empty JTC channel: ${updatedChannel.name}`);
        }
      } catch (error) {
        logger.error("Failed to cleanup JTC channel:", error);
      }
    }, 1000); // 1 second delay
  }

  // Handle verification reaction (placeholder)
  private async handleVerificationReaction(reaction: any, user: any): Promise<void> {
    // Verification reaction handling would go here
  }

  // Handle media-only message processing (placeholder)
  private async handleMediaOnlyMessage(message: Message): Promise<void> {
    // Media-only message handling would go here
  }

  // Handle ticket selection (placeholder)
  private async handleTicketSelection(interaction: any): Promise<void> {
    // Ticket selection handling would go here
  }

  // Handle ticket close (placeholder) 
  private async handleTicketClose(interaction: any): Promise<void> {
    // Ticket close handling would go here
  }
}
