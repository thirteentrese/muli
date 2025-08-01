
import { 
  Client, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  ApplicationCommandType,
  PermissionFlagsBits,
  ChannelType,
  TextChannel
} from 'discord.js';
import logger from './logger';
import { sendWelcomeMessage } from './welcomeRoles';

// Define the slash commands
const commands = [
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show help for all commands')
    .addStringOption(option => 
      option
        .setName('command')
        .setDescription('Get help for a specific command')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(null),

  new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Send the welcome message with role dropdowns')
    .addChannelOption(option => 
      option
        .setName('channel')
        .setDescription('The channel to send the welcome message to')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('manage-msg')
    .setDescription('Delete inappropriate messages with notification to user')
    .addStringOption(option =>
      option
        .setName('message_id')
        .setDescription('ID of the message to delete')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Custom reason for deletion (optional)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(null),

  new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Set up logging channel for bot activities')
    .addChannelOption(option => 
      option
        .setName('channel')
        .setDescription('The channel to send logs to')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user for violating rules')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to warn')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the warning')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(null),

  new SlashCommandBuilder()
    .setName('user-warnings')
    .setDescription('View warnings for a specific user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to check warnings for')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(null),

  new SlashCommandBuilder()
    .setName('pasko')
    .setDescription('Start Christmas countdown (September-December only)')
    .addChannelOption(option => 
      option
        .setName('channel')
        .setDescription('The channel to send the countdown to')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('clear-warnings')
    .setDescription('Clear specific warnings for a user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to clear warnings for')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('warning_numbers')
        .setDescription('Warning numbers to clear (e.g., "1,3,5" or "all")')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(null),

  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Set up ticketing system')
    .addChannelOption(option => 
      option
        .setName('channel')
        .setDescription('The channel to send the ticket interface to')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
];

// Register slash commands with Discord
export async function registerSlashCommands(rest: REST, clientId: string): Promise<void> {
  try {
    logger.info('Started refreshing application (/) commands.');

    // Register commands globally
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands.map(command => command.toJSON()) }
    );

    logger.info('Successfully reloaded application (/) commands.');
  } catch (error) {
    logger.error('Error registering slash commands:', error);
    throw error;
  }
}

// Handle incoming slash command interactions
export async function handleSlashCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const { commandName } = interaction;

  try {
    switch (commandName) {
      case 'help':
        await handleHelpCommand(interaction);
        break;
      case 'welcome':
        await handleWelcomeCommand(interaction);
        break;
      case 'manage-msg':
        await handleManageMsgCommand(interaction);
        break;
      case 'logs':
        await handleLogsCommand(interaction);
        break;
      case 'warn':
        await handleWarnCommand(interaction);
        break;
      case 'user-warnings':
        await handleUserWarningsCommand(interaction);
        break;
      case 'pasko':
        await handlePaskoCommand(interaction);
        break;
      case 'clear-warnings':
        await handleClearWarningsCommand(interaction);
        break;
      case 'ticket':
        await handleTicketCommand(interaction);
        break;
      default:
        await interaction.reply({
          content: 'Unknown command!',
          ephemeral: true
        });
    }
  } catch (error) {
    logger.error(`Error handling command ${commandName}:`, error);

    const errorMessage = 'There was an error while executing this command!';

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
}

// Handle help command
async function handleHelpCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  // Check permissions for help command
  if (!hasPermission(interaction)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      ephemeral: true
    });
    return;
  }

  const specificCommand = interaction.options.getString('command');

  if (specificCommand) {
    // Show help for specific command
    let helpText = '';

    switch (specificCommand) {
      case 'welcome':
        helpText = '**`/welcome`** - Send welcome message with role selection\n\n' +
                  '**Usage:** `/welcome channel:#channel`\n' +
                  '**Permission:** Administrator\n' +
                  '**Description:** Sends an interactive welcome message with dropdown menus for game roles and activity roles.';
        break;
      case 'manage-msg':
        helpText = '**`/manage-msg`** - Delete inappropriate messages with user notification\n\n' +
                  '**Usage:** `/manage-msg message_id:<message_id> [reason]`\n' +
                  '**Permission:** Moderator or "♡." role\n' +
                  '**Description:** Delete a specific message and send a DM to the user explaining why it was removed.';
        break;
      case 'help':
        helpText = '**`/help`** - Show this help menu\n\n' +
                  '**Usage:** `/help [command]`\n' +
                  '**Permission:** Moderator or "♡." role\n' +
                  '**Description:** Display help information for all commands or a specific command.';
        break;
      case 'logs':
        helpText = '**`/logs`** - Set up logging channel for bot activities\n\n' +
                  '**Usage:** `/logs channel:#channel`\n' +
                  '**Permission:** Administrator\n' +
                  '**Description:** Configure where bot activity logs should be sent.';
        break;
      case 'warn':
        helpText = '**`/warn`** - Warn a user for violating rules\n\n' +
                  '**Usage:** `/warn user:@user reason:"violation description"`\n' +
                  '**Permission:** Moderator or "♡." role\n' +
                  '**Description:** Issue a warning to a user and keep track of their warning count.';
        break;
      case 'user-warnings':
        helpText = '**`/user-warnings`** - View warnings for a specific user\n\n' +
                  '**Usage:** `/user-warnings user:@user`\n' +
                  '**Permission:** Moderator or "♡." role\n' +
                  '**Description:** Display all warnings issued to a specific user.';
        break;
      case 'pasko':
        helpText = '**`/pasko`** - Start Christmas countdown (September-December only)\n\n' +
                  '**Usage:** `/pasko channel:#channel`\n' +
                  '**Permission:** Administrator\n' +
                  '**Description:** Start a daily Christmas countdown in the specified channel. Only works from September to December.';
        break;
      case 'clear-warnings':
        helpText = '**`/clear-warnings`** - Clear specific warnings for a user\n\n' +
                  '**Usage:** `/clear-warnings user:@user warning_numbers:"1,3,5" or "all"`\n' +
                  '**Permission:** Moderator or "♡." role\n' +
                  '**Description:** Clear specific warning numbers or all warnings for a user.';
        break;
      case 'ticket':
        helpText = '**`/ticket`** - Set up ticketing system\n\n' +
                  '**Usage:** `/ticket channel:#channel`\n' +
                  '**Permission:** Administrator\n' +
                  '**Description:** Set up an interactive ticketing system with dropdown menu for different request types.';
        break;
      default:
        helpText = `Command \`${specificCommand}\` not found. Use \`/help\` to see all available commands.`;
    }

    await interaction.reply({
      content: helpText,
      ephemeral: true
    });
  } else {
    // Show general help
    const helpEmbed = {
      color: 0x5865F2,
      title: '🤖 Bot Commands Help',
      description: 'Here are all the available commands:',
      fields: [
        {
          name: '📝 `/help [command]`',
          value: 'Show this help menu or help for a specific command',
          inline: false
        },
        {
          name: '👋 `/welcome`',
          value: 'Send welcome message with role selection (Admin only)',
          inline: false
        },
        {
          name: '🛡️ `/manage-msg`',
          value: 'Delete inappropriate messages with user notification',
          inline: false
        },
        {
          name: '📊 `/logs`',
          value: 'Set up logging channel for bot activities (Admin only)',
          inline: false
        },
        {
          name: '⚠️ `/warn`',
          value: 'Warn a user for violating rules',
          inline: false
        },
        {
          name: '📋 `/user-warnings`',
          value: 'View warnings for a specific user',
          inline: false
        },
        {
          name: '🎄 `/pasko`',
          value: 'Start Christmas countdown (September-December only, Admin only)',
          inline: false
        },
        {
          name: '🗑️ `/clear-warnings`',
          value: 'Clear specific warnings for a user',
          inline: false
        },
        {
          name: '🎫 `/ticket`',
          value: 'Set up ticketing system (Admin only)',
          inline: false
        }
      ],
      footer: {
        text: 'Use /help <command> for detailed information about a specific command'
      },
      timestamp: new Date().toISOString()
    };

    await interaction.reply({
      embeds: [helpEmbed],
      ephemeral: true
    });
  }
}

// Handle welcome command
async function handleWelcomeCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  // Check if user has administrator permissions
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: 'You need Administrator permissions to use this command.',
      ephemeral: true
    });
    return;
  }

  const channel = interaction.options.getChannel('channel');

  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: 'Please select a valid text channel.',
      ephemeral: true
    });
    return;
  }

  try {
    await sendWelcomeMessage(channel.id, interaction.guildId!);

    await interaction.reply({
      content: `Welcome message sent to ${channel}!`,
      ephemeral: true
    });
  } catch (error) {
    logger.error('Error sending welcome message:', error);
    await interaction.reply({
      content: 'Failed to send welcome message. Please try again.',
      ephemeral: true
    });
  }
}

// Handle manage-msg command - delete specific message with user notification
async function handleManageMsgCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  // Check permissions for manage-msg command
  if (!hasPermission(interaction)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      ephemeral: true
    });
    return;
  }

  const messageId = interaction.options.getString('message_id', true);
  const reason = interaction.options.getString('reason') || 'Please keep discussions relevant to the channel topic';

  try {
    // Get the message to delete
    const channel = interaction.channel as TextChannel;
    const message = await channel.messages.fetch(messageId);

    if (!message) {
      await interaction.reply({
        content: '❌ Message not found in this channel.',
        ephemeral: true
      });
      return;
    }

    const messageAuthor = message.author;

    // Delete the message
    await message.delete();

    // Send DM to user
    try {
      const embed = {
        color: 0xff6b6b,
        title: 'Message Removed',
        description: `Your message in **${interaction.guild?.name}** was deleted by a moderator.`,
        fields: [
          { name: 'Channel', value: `<#${interaction.channelId}>`, inline: true },
          { name: 'Reason', value: reason, inline: true }
        ],
        timestamp: new Date().toISOString()
      };

      await messageAuthor.send({ embeds: [embed] });
    } catch (dmError) {
      logger.error('Failed to send DM to user:', dmError);
    }

    await interaction.reply({
      content: `✅ Message deleted and user has been notified.\n**Reason:** ${reason}`,
      ephemeral: true
    });

    logger.info(`Message deleted by ${interaction.user.tag} from ${messageAuthor.tag} in #${channel.name}. Reason: ${reason}`);
  } catch (error) {
    logger.error('Error deleting message:', error);
    await interaction.reply({
      content: '❌ Failed to delete message. Make sure the message ID is correct and the message exists in this channel.',
      ephemeral: true
    });
  }
}

// Handle logs command
async function handleLogsCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  // Check if user has administrator permissions
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: 'You need Administrator permissions to use this command.',
      ephemeral: true
    });
    return;
  }

  const channel = interaction.options.getChannel('channel');

  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: 'Please select a valid text channel.',
      ephemeral: true
    });
    return;
  }

  // Store log channel in global variable
  if (!global.logChannels) {
    global.logChannels = new Map();
  }

  global.logChannels.set(interaction.guildId!, channel.id);

  await interaction.reply({
    content: `✅ Log channel set to ${channel}. All bot activities will be logged there.`,
    ephemeral: true
  });

  // Log this action
  await logActivity(interaction.guildId!, `Log channel set to ${channel} by ${interaction.user.tag}`);
}

// Handle warn command
async function handleWarnCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  // Check permissions for warn command
  if (!hasPermission(interaction)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      ephemeral: true
    });
    return;
  }

  const user = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason', true);

  // Initialize warnings storage
  if (!global.userWarnings) {
    global.userWarnings = new Map();
  }

  const userKey = `${interaction.guildId}-${user.id}`;
  const warnings = global.userWarnings.get(userKey) || [];

  const newWarning = {
    id: warnings.length + 1,
    reason,
    moderator: interaction.user.tag,
    timestamp: new Date().toISOString()
  };

  warnings.push(newWarning);
  global.userWarnings.set(userKey, warnings);

  // Send DM to warned user
  try {
    const embed = {
      color: 0xffa500,
      title: '⚠️ Warning Issued',
      description: `You have been warned in **${interaction.guild?.name}**.`,
      fields: [
        { name: 'Reason', value: reason, inline: false },
        { name: 'Warning Count', value: `${warnings.length}`, inline: true },
        { name: 'Moderator', value: interaction.user.tag, inline: true }
      ],
      timestamp: new Date().toISOString()
    };

    await user.send({ embeds: [embed] });
  } catch (dmError) {
    logger.error('Failed to send warning DM to user:', dmError);
  }

  await interaction.reply({
    content: `⚠️ ${user} has been warned.\n**Reason:** ${reason}\n**Total warnings:** ${warnings.length}`,
    ephemeral: true
  });

  // Log this action
  await logActivity(interaction.guildId!, `${user.tag} warned by ${interaction.user.tag}. Reason: ${reason} (Warning ${warnings.length})`);
}

// Handle user-warnings command
async function handleUserWarningsCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  // Check permissions for user-warnings command
  if (!hasPermission(interaction)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      ephemeral: true
    });
    return;
  }

  const user = interaction.options.getUser('user', true);

  if (!global.userWarnings) {
    global.userWarnings = new Map();
  }

  const userKey = `${interaction.guildId}-${user.id}`;
  const warnings = global.userWarnings.get(userKey) || [];

  if (warnings.length === 0) {
    await interaction.reply({
      content: `${user} has no warnings.`,
      ephemeral: true
    });
    return;
  }

  const embed = {
    color: 0xff6b6b,
    title: `⚠️ Warnings for ${user.tag}`,
    description: `Total warnings: **${warnings.length}**`,
    fields: warnings.slice(-10).map(warning => ({
      name: `Warning #${warning.id}`,
      value: `**Reason:** ${warning.reason}\n**Moderator:** ${warning.moderator}\n**Date:** <t:${Math.floor(new Date(warning.timestamp).getTime() / 1000)}:f>`,
      inline: false
    })),
    footer: warnings.length > 10 ? { text: 'Showing last 10 warnings' } : undefined,
    timestamp: new Date().toISOString()
  };

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}

// Handle pasko command
async function handlePaskoCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  // Check if user has administrator permissions
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: 'You need Administrator permissions to use this command.',
      ephemeral: true
    });
    return;
  }

  const channel = interaction.options.getChannel('channel');

  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: 'Please select a valid text channel.',
      ephemeral: true
    });
    return;
  }

  // Check if it's between September and December
  const now = new Date();
  const month = now.getMonth() + 1; // getMonth() returns 0-11

  if (month < 9 || month > 12) {
    await interaction.reply({
      content: '🎄 Christmas countdown is only available from September to December!',
      ephemeral: true
    });
    return;
  }

  // Calculate days until Christmas
  const currentYear = now.getFullYear();
  const christmas = new Date(currentYear, 11, 25); // December 25th

  // If Christmas has passed this year, calculate for next year
  if (now > christmas) {
    christmas.setFullYear(currentYear + 1);
  }

  const timeUntilChristmas = christmas.getTime() - now.getTime();
  const daysUntilChristmas = Math.ceil(timeUntilChristmas / (1000 * 60 * 60 * 24));

  // Store pasko channel in global variable
  if (!global.paskoChannels) {
    global.paskoChannels = new Map();
  }

  global.paskoChannels.set(interaction.guildId!, channel.id);

  const embed = {
    color: 0x00ff00,
    title: '🎄 Christmas Countdown Started!',
    description: `**${daysUntilChristmas} days** until Christmas! 🎅`,
    fields: [
      { name: 'Christmas Date', value: `<t:${Math.floor(christmas.getTime() / 1000)}:F>`, inline: true },
      { name: 'Channel', value: `${channel}`, inline: true }
    ],
    footer: { text: 'Maligayang Pasko!' },
    timestamp: new Date().toISOString()
  };

  await (channel as TextChannel).send({ embeds: [embed] });

  await interaction.reply({
    content: `🎄 Christmas countdown started in ${channel}! Daily updates will be posted there.`,
    ephemeral: true
  });

  // Log this action
  await logActivity(interaction.guildId!, `Christmas countdown started in ${channel} by ${interaction.user.tag}`);
}

// Handle clear-warnings command
async function handleClearWarningsCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  // Check permissions for clear-warnings command
  if (!hasPermission(interaction)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      ephemeral: true
    });
    return;
  }

  const user = interaction.options.getUser('user', true);
  const warningNumbers = interaction.options.getString('warning_numbers', true);

  if (!global.userWarnings) {
    global.userWarnings = new Map();
  }

  const userKey = `${interaction.guildId}-${user.id}`;
  const warnings = global.userWarnings.get(userKey) || [];

  if (warnings.length === 0) {
    await interaction.reply({
      content: `${user} has no warnings to clear.`,
      ephemeral: true
    });
    return;
  }

  if (warningNumbers.toLowerCase() === 'all') {
    global.userWarnings.set(userKey, []);
    await interaction.reply({
      content: `✅ All warnings cleared for ${user}.`,
      ephemeral: true
    });
    await logActivity(interaction.guildId!, `All warnings cleared for ${user.tag} by ${interaction.user.tag}`);
    return;
  }

  try {
    const numbersToRemove = warningNumbers.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    const initialCount = warnings.length;

    // Remove warnings with specified IDs (in reverse order to maintain array integrity)
    const updatedWarnings = warnings.filter(warning => !numbersToRemove.includes(warning.id));

    if (updatedWarnings.length === initialCount) {
      await interaction.reply({
        content: `❌ No valid warning numbers found. Available warnings: ${warnings.map(w => w.id).join(', ')}`,
        ephemeral: true
      });
      return;
    }

    global.userWarnings.set(userKey, updatedWarnings);

    const clearedCount = initialCount - updatedWarnings.length;
    await interaction.reply({
      content: `✅ Cleared ${clearedCount} warning(s) for ${user}. Remaining warnings: ${updatedWarnings.length}`,
      ephemeral: true
    });

    await logActivity(interaction.guildId!, `${clearedCount} warning(s) cleared for ${user.tag} by ${interaction.user.tag} (Warning numbers: ${numbersToRemove.join(', ')})`);
  } catch (error) {
    await interaction.reply({
      content: '❌ Invalid warning numbers format. Use comma-separated numbers (e.g., "1,3,5") or "all".',
      ephemeral: true
    });
  }
}

// Handle ticket command
async function handleTicketCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  // Check if user has administrator permissions
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: 'You need Administrator permissions to use this command.',
      ephemeral: true
    });
    return;
  }

  const channel = interaction.options.getChannel('channel');

  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: 'Please select a valid text channel.',
      ephemeral: true
    });
    return;
  }

  try {
    // Check if ticket interface already exists in channel to prevent duplicates
    const messages = await (channel as TextChannel).messages.fetch({ limit: 50 });
    const existingTicketMessage = messages.find(msg => 
      msg.author.id === interaction.client.user?.id && 
      msg.embeds.length > 0 && 
      msg.embeds[0].title === 'Welcome!' &&
      msg.components.length > 0
    );

    if (existingTicketMessage) {
      await interaction.reply({
        content: `⚠️ Ticket system is already set up in ${channel}. Please use the existing interface.`,
        ephemeral: true
      });
      return;
    }

    const embed = {
      color: 0x5865f2,
      title: 'Welcome!',
      description: 'Need assistance? Request a ticket!\n\nClick the drop-down menu below and select what you\'d like to do. A private thread will automatically be created for your request.',
      image: {
        url: 'https://cdn.discordapp.com/attachments/1208254470916673547/1400304551697059840/ticket.jpg?ex=688c26bd&is=688ad53d&hm=050cd914daa75011b9b5c7695fe0bb1abb37cd751ef22ad884ca4b7f773828fb&'
      },
      timestamp: new Date().toISOString()
    };

    const selectMenu = {
      type: 1,
      components: [
        {
          type: 3,
          custom_id: 'ticket_select',
          placeholder: 'I would like to...',
          options: [
            {
              label: 'Report a concern',
              value: 'report_concern',
              emoji: '🚨'
            },
            {
              label: 'Host an event in the server',
              value: 'host_event',
              emoji: '🎉'
            },
            {
              label: 'Promote an outside event or collab',
              value: 'promote_event',
              emoji: '📢'
            },
            {
              label: 'Suggest an idea or give feedback',
              value: 'suggestion',
              emoji: '💡'
            },
            {
              label: 'Apply for partnership in the SARI-SARI store',
              value: 'partnership',
              emoji: '🤝'
            },
            {
              label: 'Other',
              value: 'other',
              emoji: '❓'
            }
          ]
        }
      ]
    };

    await (channel as TextChannel).send({ 
      embeds: [embed], 
      components: [selectMenu] 
    });

    await interaction.reply({
      content: `✅ Ticket system set up in ${channel}!`,
      ephemeral: true
    });

    // Log this action
    await logActivity(interaction.guildId!, `Ticket system set up in ${channel} by ${interaction.user.tag}`);
  } catch (error) {
    logger.error('Error setting up ticket system:', error);
    await interaction.reply({
      content: 'Failed to set up ticket system. Please try again.',
      ephemeral: true
    });
  }
}

// Utility function to log activities
async function logActivity(guildId: string, message: string): Promise<void> {
  if (!global.logChannels || !global.logChannels.has(guildId)) {
    return;
  }

  try {
    const channelId = global.logChannels.get(guildId)!;
    const channel = await global.discordClient?.channels.fetch(channelId) as TextChannel;

    if (channel) {
      const embed = {
        color: 0x5865f2,
        title: '📊 Bot Activity Log',
        description: message,
        timestamp: new Date().toISOString()
      };

      await channel.send({ embeds: [embed] });
    }
  } catch (error) {
    logger.error('Failed to log activity:', error);
  }
}

// Check if user has permission to use commands
function hasPermission(interaction: ChatInputCommandInteraction): boolean {
  const member = interaction.member;
  if (!member) return false;

  // Check if user is administrator
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  // Check for moderator permissions
  if (interaction.memberPermissions?.has([
    PermissionFlagsBits.ManageMessages,
    PermissionFlagsBits.KickMembers,
    PermissionFlagsBits.ModerateMembers
  ])) {
    return true;
  }

  // Check for special "♡." role (ID: 1356054878031708241)
  if ('roles' in member && member.roles instanceof Array) {
    return member.roles.includes('1356054878031708241');
  } else if ('roles' in member && typeof member.roles === 'object' && member.roles.cache) {
    return member.roles.cache.has('1356054878031708241');
  }

  return false;
}
