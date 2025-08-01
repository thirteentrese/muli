import { 
  Client, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  ApplicationCommandType,
  PermissionFlagsBits,
  ChannelType,
  TextChannel,
  EmbedBuilder,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ActivityType
} from 'discord.js';
import logger from './logger';
import { sendWelcomeMessage, sendKAWelcomeMessage } from './welcomeRoles';

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
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('muli')
    .setDescription('Send the welcome message with role dropdowns')
    .addChannelOption(option => 
      option
        .setName('channel')
        .setDescription('The channel to send the welcome message to')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('ka')
    .setDescription('Send the KA server welcome message with role dropdowns')
    .addChannelOption(option => 
      option
        .setName('channel')
        .setDescription('The channel to send the KA welcome message to')
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
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

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
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('user-warnings')
    .setDescription('View warnings for a specific user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to check warnings for')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

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
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

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

  new SlashCommandBuilder()
    .setName('media-only')
    .setDescription('Set a channel to media-only mode (creates threads for media, deletes text-only messages)')
    .addChannelOption(option => 
      option
        .setName('channel')
        .setDescription('The channel to set as media-only')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('manage-media')
    .setDescription('View and manage media-only channels')
    .addStringOption(option =>
      option
        .setName('action')
        .setDescription('Action to perform')
        .setRequired(true)
        .addChoices(
          { name: 'List media-only channels', value: 'list' },
          { name: 'Remove media-only from channel', value: 'remove' }
        )
    )
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel to remove from media-only (required for remove action)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('join-to-create')
    .setDescription('Configure join-to-create voice channels')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Voice channel to configure as join-to-create')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Channel access type')
        .addChoices(
          { name: 'Public (Open to all members)', value: 'public' },
          { name: 'Invite Only (Private)', value: 'private' }
        )
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('manage-jtc')
    .setDescription('Manage join-to-create voice channel settings')
    .addStringOption(option =>
      option
        .setName('action')
        .setDescription('Action to perform')
        .setRequired(true)
        .addChoices(
          { name: 'List join-to-create channels', value: 'list' },
          { name: 'Remove join-to-create from channel', value: 'remove' }
        )
    )
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel to remove from join-to-create (required for remove action)')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('tagay')
    .setDescription('Randomly choose someone from a voice channel for storytelling')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Voice channel to choose from')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(null),

  new SlashCommandBuilder()
    .setName('tagay-topics')
    .setDescription('Generate random Filipino culture and community conversation topics')
    .setDefaultMemberPermissions(null),

  new SlashCommandBuilder()
    .setName('raffle')
    .setDescription('Start a new raffle')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Name/ID for this raffle')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('prize')
        .setDescription('What prize is being raffled')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('duration')
        .setDescription('How long should the raffle run?')
        .setRequired(true)
        .addChoices(
          { name: '1 hour', value: '1h' },
          { name: '2 hours', value: '2h' },
          { name: '6 hours', value: '6h' },
          { name: '12 hours', value: '12h' },
          { name: '24 hours', value: '24h' }
        )
    )
    .addIntegerOption(option =>
      option
        .setName('winners')
        .setDescription('Number of winners to pick (default: 1)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    )
    .addStringOption(option =>
      option
        .setName('rules')
        .setDescription('Rules or description for the raffle (optional)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(null),



  // Streaming commands deactivated per user request
  // new SlashCommandBuilder()
  //   .setName('stream-live')
  //   .setDescription('Show currently streaming server members')
  //   .setDefaultMemberPermissions(null),

  // new SlashCommandBuilder()
  //   .setName('debug-stream')
  //   .setDescription('Debug streaming role for a specific user')
  //   .addUserOption(option =>
  //     option
  //       .setName('user')
  //       .setDescription('User to debug streaming role for')
  //       .setRequired(true)
  //   )
  //   .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
];

// Register slash commands with Discord
export async function registerSlashCommands(rest: REST, clientId: string): Promise<void> {
  try {
    logger.info('Started refreshing application (/) commands.');
    
    // Clear existing commands first
    await rest.put(Routes.applicationCommands(clientId), { body: [] });
    logger.info('Cleared existing commands');
    
    // Wait before registering new ones
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try registering just the essential commands first
    const essentialCommands = commands.filter(cmd => {
      const name = cmd.toJSON().name;
      return ['help', 'tagay', 'tagay-topics', 'raffle'].includes(name);
    });
    
    logger.info(`Registering ${essentialCommands.length} essential commands first...`);
    
    const essentialData = essentialCommands.map(cmd => cmd.toJSON());
    await rest.put(Routes.applicationCommands(clientId), { body: essentialData });
    
    logger.info(`Successfully registered ${essentialCommands.length} essential commands.`);
    
    // Wait before registering remaining commands
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Register all commands
    logger.info(`Now registering all ${commands.length} commands...`);
    const allCommandData = commands.map(cmd => cmd.toJSON());
    await rest.put(Routes.applicationCommands(clientId), { body: allCommandData });
    
    logger.info(`Successfully registered all ${commands.length} application commands.`);
    
  } catch (error) {
    logger.error('Command registration failed:', error);
    
    // Fall back to just essential commands
    try {
      logger.info('Falling back to essential commands only...');
      const fallbackCommands = [
        new SlashCommandBuilder().setName('help').setDescription('Show bot help and commands').toJSON(),
        new SlashCommandBuilder().setName('tagay').setDescription('Get a random tagay prompt').toJSON(),
        new SlashCommandBuilder().setName('raffle').setDescription('Start a community raffle').toJSON()
      ];
      
      await rest.put(Routes.applicationCommands(clientId), { body: fallbackCommands });
      logger.info('Successfully registered fallback commands');
    } catch (fallbackError) {
      logger.error('All registration attempts failed:', fallbackError);
    }
  }
}

// Check if user has permission for certain commands
function hasPermission(interaction: ChatInputCommandInteraction): boolean {
  if (!interaction.guild || !interaction.member) return false;

  const member = interaction.member;
  const memberPermissions = typeof member.permissions === 'string' 
    ? BigInt(member.permissions) 
    : member.permissions?.bitfield;

  if (!memberPermissions) return false;

  // Check for moderator permissions
  const hasModeratorPermissions = 
    (memberPermissions & PermissionFlagsBits.ManageMessages) === PermissionFlagsBits.ManageMessages ||
    (memberPermissions & PermissionFlagsBits.KickMembers) === PermissionFlagsBits.KickMembers ||
    (memberPermissions & PermissionFlagsBits.ModerateMembers) === PermissionFlagsBits.ModerateMembers ||
    (memberPermissions & PermissionFlagsBits.Administrator) === PermissionFlagsBits.Administrator;

  // Check for special "♡." role (ID: 1356054878031708241)
  const hasSpecialRole = 'roles' in member && 
    member.roles && 
    typeof member.roles === 'object' && 
    'cache' in member.roles &&
    member.roles.cache.has('1356054878031708241');

  return hasModeratorPermissions || hasSpecialRole;
}

// Handle incoming slash command interactions
export async function handleSlashCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const { commandName } = interaction;

  // Commands that are available to all server members
  const publicCommands = ['raffle', 'tagay', 'tagay-topics', 'raffle-enter'];
  
  // Check if user has moderator/administrator permissions for restricted commands
  if (!publicCommands.includes(commandName) && !hasPermission(interaction)) {
    await interaction.reply({
      content: 'You need moderator or administrator permissions to use this command.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  try {
    switch (commandName) {
      case 'help':
        await handleHelpCommand(interaction);
        break;
      case 'muli':
        await handleWelcomeCommand(interaction);
        break;
      case 'ka':
        await handleKACommand(interaction);
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

      case 'clear-warnings':
        await handleClearWarningsCommand(interaction);
        break;
      case 'ticket':
        await handleTicketCommand(interaction);
        break;
      case 'media-only':
        await handleMediaOnlyCommand(interaction);
        break;
      case 'manage-media':
        await handleManageMediaCommand(interaction);
        break;
      case 'join-to-create':
        await handleJoinToCreateCommand(interaction);
        break;
      case 'manage-jtc':
        await handleManageJTCCommand(interaction);
        break;
      case 'tagay':
        await handleTagayCommand(interaction);
        break;
      case 'tagay-topics':
        await handleTagayTopicsCommand(interaction);
        break;
      case 'raffle':
        await handleRaffleStartCommand(interaction);
        break;
      // Streaming commands deactivated
      // case 'stream-live':
      //   await handleStreamLiveCommand(interaction);
      //   break;
      // case 'debug-stream':
      //   await handleDebugStreamCommand(interaction);
      //   break;
      default:
        await interaction.reply({
          content: 'Unknown command!',
          flags: MessageFlags.Ephemeral
        });
    }
  } catch (error) {
    logger.error(`Error handling command ${commandName}:`, error);

    const errorMessage = 'There was an error while executing this command!';

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
    }
  }
}

// Handle button interactions
export async function handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
  if (interaction.customId.startsWith('raffle_')) {
    await handleRaffleButtonInteraction(interaction);
  }
}

// Handle help command
async function handleHelpCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  // Check permissions for help command
  if (!hasPermission(interaction)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const specificCommand = interaction.options.getString('command');

  if (specificCommand) {
    // Show help for specific command
    let helpText = '';

    switch (specificCommand) {
      case 'muli':
        helpText = '**`/muli`** - Send welcome message with role selection\n\n' +
                  '**Usage:** `/muli channel:#channel`\n' +
                  '**Permission:** Administrator\n' +
                  '**Description:** Sends an interactive welcome message with dropdown menus for game roles and activity roles.';
        break;
      case 'ka':
        helpText = '**`/ka`** - Send KA server welcome message with role selection\n\n' +
                  '**Usage:** `/ka channel:#channel`\n' +
                  '**Permission:** Administrator\n' +
                  '**Description:** Sends an interactive KA server welcome message with dropdown menus for role selection.';
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
      case 'media-only':
        helpText = '**`/media-only`** - Set up media-only channel\n\n' +
                  '**Usage:** `/media-only channel:#channel`\n' +
                  '**Permission:** Administrator\n' +
                  '**Description:** Configure a channel to only allow media content. Text-only messages will be deleted immediately, and media posts will automatically get threads created for discussion.';
        break;
      case 'manage-media':
        helpText = '**`/manage-media`** - Manage media-only channel settings\n\n' +
                  '**Usage:** `/manage-media action:list|remove [channel:#channel]`\n' +
                  '**Permission:** Administrator\n' +
                  '**Description:** View all media-only channels or remove a channel from media-only mode. Use "list" to see all configured channels, or "remove" with a channel to disable media-only mode.';
        break;
      default:
        helpText = `Command \`${specificCommand}\` not found. Use \`/help\` to see all available commands.`;
    }

    await interaction.reply({
      content: helpText,
      flags: MessageFlags.Ephemeral
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
          name: '👋 `/muli`',
          value: 'Send welcome message with role selection (Admin only)',
          inline: false
        },
        {
          name: '🏛️ `/ka`',
          value: 'Send KA server welcome message with role selection (Admin only)',
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
          name: '🗑️ `/clear-warnings`',
          value: 'Clear specific warnings for a user',
          inline: false
        },
        {
          name: '🎫 `/ticket`',
          value: 'Set up ticketing system (Admin only)',
          inline: false
        },
        {
          name: '📷 `/media-only`',
          value: 'Set up media-only channel (Admin only)',
          inline: false
        },
        {
          name: '🛠️ `/manage-media`',
          value: 'Manage media-only channel settings (Admin only)',
          inline: false
        },
        {
          name: '🍻 `/tagay`',
          value: 'Randomly choose someone from a voice channel for storytelling',
          inline: false
        },
        {
          name: '💬 `/tagay-topics`',
          value: 'Generate random Filipino culture and community conversation topics',
          inline: false
        },
        {
          name: '🎉 `/raffle`',
          value: 'Start a new raffle with prize, end date, winners, and optional rules (Admin only)',
          inline: false
        },
        {
          name: '🏆 `/raffle-pick`',
          value: 'Pick winner(s) and end a raffle (Admin only)',
          inline: false
        },
        {
          name: '🎫 `/raffle-enter`',
          value: 'Enter an active raffle (shows dropdown when multiple raffles exist)',
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
      flags: MessageFlags.Ephemeral
    });
  }
}

// Handle welcome command
async function handleWelcomeCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  // Check if user has administrator permissions
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: 'You need Administrator permissions to use this command.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const channel = interaction.options.getChannel('channel');

  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: 'Please select a valid text channel.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  try {
    await sendWelcomeMessage(channel.id, interaction.guildId!);

    await interaction.reply({
      content: `Welcome message sent to ${channel}!`,
      flags: MessageFlags.Ephemeral
    });
  } catch (error) {
    logger.error('Error sending welcome message:', error);
    await interaction.reply({
      content: 'Failed to send welcome message. Please try again.',
      flags: MessageFlags.Ephemeral
    });
  }
}

// Handle KA command
async function handleKACommand(interaction: ChatInputCommandInteraction): Promise<void> {
  // Defer the reply immediately to prevent timeout
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  // Check if user has administrator permissions
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.editReply({
      content: 'You need Administrator permissions to use this command.'
    });
    return;
  }

  const channel = interaction.options.getChannel('channel');

  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.editReply({
      content: 'Please select a valid text channel.'
    });
    return;
  }

  try {
    await sendKAWelcomeMessage(channel.id, interaction.guildId!);

    await interaction.editReply({
      content: `KA welcome message sent to ${channel}!`
    });
  } catch (error) {
    logger.error('Error sending KA welcome message:', error);
    await interaction.editReply({
      content: 'Failed to send KA welcome message. Please try again.'
    });
  }
}

// Handle manage message command
async function handleManageMsgCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  // Check permissions for moderation command
  if (!hasPermission(interaction)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const messageId = interaction.options.getString('message_id', true);
  const customReason = interaction.options.getString('reason');
  const defaultReason = 'Please keep discussions relevant to the channel topic';
  const reason = customReason || defaultReason;

  try {
    // Try to fetch the message
    const message = await interaction.channel?.messages.fetch(messageId);

    if (!message) {
      await interaction.reply({
        content: '❌ Message not found. Please make sure the message ID is correct and the message is in this channel.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const messageAuthor = message.author;
    const messageContent = message.content.length > 100 
      ? message.content.substring(0, 100) + '...' 
      : message.content;

    // Delete the message
    await message.delete();

    // Send DM to the user
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0xff6b6b)
        .setTitle('Message Removed')
        .setDescription('Your message has been removed by a moderator.')
        .addFields(
          { name: 'Reason', value: reason, inline: false },
          { name: 'Channel', value: `#${(interaction.channel as TextChannel).name}`, inline: true },
          { name: 'Server', value: interaction.guild?.name || 'Unknown', inline: true },
          { name: 'Message Content', value: messageContent || 'No content', inline: false }
        )
        .setFooter({ text: 'Please follow the server rules to avoid future issues.' })
        .setTimestamp();

      await messageAuthor.send({ embeds: [dmEmbed] });
    } catch (dmError) {
      logger.warn(`Could not send DM to ${messageAuthor.tag}:`, dmError);
    }

    // Log the action if logging is enabled
    if (global.logChannels && global.logChannels.has(interaction.guildId!)) {
      const logChannelId = global.logChannels.get(interaction.guildId!);
      try {
        const logChannel = await interaction.guild?.channels.fetch(logChannelId!) as TextChannel;
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setColor(0xff6b6b)
            .setTitle('Message Deleted')
            .addFields(
              { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
              { name: 'User', value: `${messageAuthor.tag}`, inline: true },
              { name: 'Channel', value: `#${(interaction.channel as TextChannel).name}`, inline: true },
              { name: 'Reason', value: reason, inline: false },
              { name: 'Message Content', value: messageContent || 'No content', inline: false }
            )
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] });
        }
      } catch (logError) {
        logger.error('Failed to send log message:', logError);
      }
    }

    await interaction.reply({
      content: `✅ Message deleted and user notified.\n**Reason:** ${reason}`,
      flags: MessageFlags.Ephemeral
    });

  } catch (error) {
    logger.error('Error in manage-msg command:', error);
    await interaction.reply({
      content: '❌ Failed to delete message. Please make sure the message ID is correct and I have the necessary permissions.',
      flags: MessageFlags.Ephemeral
    });
  }
}

// Handle logs command
async function handleLogsCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: 'You need Administrator permissions to use this command.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const channel = interaction.options.getChannel('channel');

  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: 'Please select a valid text channel.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  // Initialize global logs map if needed
  if (!global.logChannels) {
    global.logChannels = new Map();
  }

  // Set the log channel for this guild
  global.logChannels.set(interaction.guildId!, channel.id);

  await interaction.reply({
    content: `✅ Logging channel set to ${channel}. Bot activities will be logged there.`,
    flags: MessageFlags.Ephemeral
  });
}

// Handle warn command
async function handleWarnCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!hasPermission(interaction)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const user = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason', true);

  // Initialize warnings map if needed
  if (!global.userWarnings) {
    global.userWarnings = new Map();
  }

  const userId = user.id;
  const userWarnings = global.userWarnings.get(userId) || [];

  const newWarning = {
    id: userWarnings.length + 1,
    reason: reason,
    moderator: interaction.user.tag,
    timestamp: new Date().toISOString()
  };

  userWarnings.push(newWarning);
  global.userWarnings.set(userId, userWarnings);

  // Send DM to the user
  try {
    const dmEmbed = new EmbedBuilder()
      .setColor(0xffcc00)
      .setTitle('Warning Issued')
      .setDescription('You have received a warning from a moderator.')
      .addFields(
        { name: 'Reason', value: reason, inline: false },
        { name: 'Moderator', value: interaction.user.tag, inline: true },
        { name: 'Server', value: interaction.guild?.name || 'Unknown', inline: true },
        { name: 'Warning Count', value: `${userWarnings.length}`, inline: true }
      )
      .setFooter({ text: 'Please follow the server rules to avoid future warnings.' })
      .setTimestamp();

    await user.send({ embeds: [dmEmbed] });
  } catch (dmError) {
    logger.warn(`Could not send warning DM to ${user.tag}:`, dmError);
  }

  // Log the warning if logging is enabled
  if (global.logChannels && global.logChannels.has(interaction.guildId!)) {
    const logChannelId = global.logChannels.get(interaction.guildId!);
    try {
      const logChannel = await interaction.guild?.channels.fetch(logChannelId!) as TextChannel;
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor(0xffcc00)
          .setTitle('Warning Issued')
          .addFields(
            { name: 'Moderator', value: interaction.user.tag, inline: true },
            { name: 'User', value: user.tag, inline: true },
            { name: 'Warning Count', value: `${userWarnings.length}`, inline: true },
            { name: 'Reason', value: reason, inline: false }
          )
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      }
    } catch (logError) {
      logger.error('Failed to send warning log:', logError);
    }
  }

  await interaction.reply({
    content: `✅ Warning issued to ${user.tag}.\n**Reason:** ${reason}\n**Total warnings:** ${userWarnings.length}`,
    flags: MessageFlags.Ephemeral
  });
}

// Handle user-warnings command
async function handleUserWarningsCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!hasPermission(interaction)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const user = interaction.options.getUser('user', true);
  const userId = user.id;

  if (!global.userWarnings) {
    global.userWarnings = new Map();
  }

  const userWarnings = global.userWarnings.get(userId) || [];

  if (userWarnings.length === 0) {
    await interaction.reply({
      content: `${user.tag} has no warnings.`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xffcc00)
    .setTitle(`Warnings for ${user.tag}`)
    .setDescription(`Total warnings: ${userWarnings.length}`)
    .setThumbnail(user.displayAvatarURL())
    .setTimestamp();

  userWarnings.forEach((warning, index) => {
    embed.addFields({
      name: `Warning #${warning.id}`,
      value: `**Reason:** ${warning.reason}\n**Moderator:** ${warning.moderator}\n**Date:** <t:${Math.floor(new Date(warning.timestamp).getTime() / 1000)}:F>`,
      inline: false
    });
  });

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral
  });
}

// Handle clear-warnings command
async function handleClearWarningsCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!hasPermission(interaction)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const user = interaction.options.getUser('user', true);
  const warningNumbers = interaction.options.getString('warning_numbers', true);
  const userId = user.id;

  if (!global.userWarnings) {
    global.userWarnings = new Map();
  }

  const userWarnings = global.userWarnings.get(userId) || [];

  if (userWarnings.length === 0) {
    await interaction.reply({
      content: `${user.tag} has no warnings to clear.`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (warningNumbers.toLowerCase() === 'all') {
    // Clear all warnings
    global.userWarnings.delete(userId);

    await interaction.reply({
      content: `✅ All warnings cleared for ${user.tag}.`,
      flags: MessageFlags.Ephemeral
    });
  } else {
    // Clear specific warnings
    const numbersToRemove = warningNumbers.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num));

    if (numbersToRemove.length === 0) {
      await interaction.reply({
        content: 'Please provide valid warning numbers separated by commas (e.g., "1,3,5") or "all".',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const filteredWarnings = userWarnings.filter(warning => !numbersToRemove.includes(warning.id));

    if (filteredWarnings.length === userWarnings.length) {
      await interaction.reply({
        content: 'No warnings were cleared. Please check the warning numbers.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (filteredWarnings.length === 0) {
      global.userWarnings.delete(userId);
    } else {
      global.userWarnings.set(userId, filteredWarnings);
    }

    const clearedCount = userWarnings.length - filteredWarnings.length;
    await interaction.reply({
      content: `✅ Cleared ${clearedCount} warning(s) for ${user.tag}.`,
      flags: MessageFlags.Ephemeral
    });
  }

  // Log the action if logging is enabled
  if (global.logChannels && global.logChannels.has(interaction.guildId!)) {
    const logChannelId = global.logChannels.get(interaction.guildId!);
    try {
      const logChannel = await interaction.guild?.channels.fetch(logChannelId!) as TextChannel;
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('Warnings Cleared')
          .addFields(
            { name: 'Moderator', value: interaction.user.tag, inline: true },
            { name: 'User', value: user.tag, inline: true },
            { name: 'Cleared', value: warningNumbers, inline: true }
          )
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      }
    } catch (logError) {
      logger.error('Failed to send warning clear log:', logError);
    }
  }
}

// Handle ticket command
async function handleTicketCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: 'You need Administrator permissions to use this command.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const channel = interaction.options.getChannel('channel');

  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: 'Please select a valid text channel.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  try {
    const embed = new EmbedBuilder()
      .setColor(0x6E8878)
      .setTitle('Welcome to the Help Desk!')
      .setDescription('Need assistance? Request a ticket!\n\nClick the drop-down menu below and select what you\'d like to do. A private thread will automatically be created for your request.')
      .setImage('https://cdn.discordapp.com/attachments/1208254470916673547/1400520919473979523/tickets.png?ex=688cf03f&is=688b9ebf&hm=e5e4fc5837a8cc02f4b5165273fe73babe1983a4790d2c7d8d9383f252932b25&')
      .setTimestamp();

    const selectMenu = {
      type: 1,
      components: [
        {
          type: 3,
          custom_id: 'ticket_select',
          placeholder: 'I would like to...',
          min_values: 1,
          max_values: 1,
          options: [
            {
              label: '☰ Report a concern',
              value: 'report_concern'
            },
            {
              label: '✷ Host an event',
              value: 'host_event'
            },
            {
              label: '✎ Collaborate',
              value: 'collaborate'
            },
            {
              label: '✾ Suggest an idea',
              value: 'suggestion'
            },
            {
              label: '⚑ Apply for partnership',
              value: 'partnership'
            },
            {
              label: '⋰ Other',
              value: 'other'
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
      flags: MessageFlags.Ephemeral
    });

  } catch (error) {
    logger.error('Error setting up ticket system:', error);
    await interaction.reply({
      content: 'Failed to set up ticket system. Please try again.',
      flags: MessageFlags.Ephemeral
    });
  }
}

// Handle media-only command
async function handleMediaOnlyCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: 'You need Administrator permissions to use this command.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const channel = interaction.options.getChannel('channel');

  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: 'Please select a valid text channel.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  try {
    // Initialize media-only channels map if needed
    if (!global.mediaOnlyChannels) {
      global.mediaOnlyChannels = new Map();
    }

    // Check if channel is already media-only
    if (global.mediaOnlyChannels.has(channel.id)) {
      await interaction.reply({
        content: `${channel} is already set as media-only.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Add channel to media-only map
    global.mediaOnlyChannels.set(channel.id, {
      guildId: interaction.guildId!,
      channelName: (channel as TextChannel).name
    });

    await interaction.reply({
      content: `✅ ${channel} is now set to media-only mode!\n\n**Features:**\n• Messages with media will automatically get threads created\n• Text-only messages will be deleted immediately\n• Use \`/manage-media\` to view or remove media-only settings`,
      flags: MessageFlags.Ephemeral
    });

    logger.info(`Media-only mode enabled for channel ${channel} in guild ${interaction.guildId}`);

  } catch (error) {
    logger.error('Error setting up media-only channel:', error);
    await interaction.reply({
      content: 'Failed to set up media-only mode. Please try again.',
      flags: MessageFlags.Ephemeral
    });
  }
}

// Handle manage-media command
async function handleManageMediaCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: 'You need Administrator permissions to use this command.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const action = interaction.options.getString('action', true);

  try {
    if (action === 'list') {
      // List all media-only channels for this guild
      if (!global.mediaOnlyChannels || global.mediaOnlyChannels.size === 0) {
        await interaction.reply({
          content: 'No media-only channels are currently configured.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      const guildMediaChannels = Array.from(global.mediaOnlyChannels.entries())
        .filter(([_, data]) => data.guildId === interaction.guildId);

      if (guildMediaChannels.length === 0) {
        await interaction.reply({
          content: 'No media-only channels are configured for this server.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      const channelList = guildMediaChannels
        .map(([channelId, data]) => `• <#${channelId}> (${data.channelName})`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(0x6E8878)
        .setTitle('Media-Only Channels')
        .setDescription(`**Currently configured media-only channels:**\n\n${channelList}\n\nUse \`/manage-media action:remove\` to disable media-only mode for a channel.`)
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
      });

    } else if (action === 'remove') {
      const channel = interaction.options.getChannel('channel');

      if (!channel) {
        await interaction.reply({
          content: 'Please specify a channel to remove from media-only mode.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      if (!global.mediaOnlyChannels || !global.mediaOnlyChannels.has(channel.id)) {
        await interaction.reply({
          content: `${channel} is not currently set as media-only.`,
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      // Remove channel from media-only map
      global.mediaOnlyChannels.delete(channel.id);

      await interaction.reply({
        content: `✅ ${channel} has been removed from media-only mode. It will now function as a normal channel.`,
        flags: MessageFlags.Ephemeral
      });

      logger.info(`Media-only mode disabled for channel ${channel} in guild ${interaction.guildId}`);
    }

  } catch (error) {
    logger.error('Error managing media channels:', error);
    await interaction.reply({
      content: 'Failed to manage media channels. Please try again.',
      flags: MessageFlags.Ephemeral
    });
  }
}

// Handle stream-live command
// Streaming command handlers deactivated per user request
/*
async function handleStreamLiveCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  // Allow any user to see who's currently streaming
  try {
    const currentStreamers = global.autoStreamDetection.getCurrentStreamers();
    
    if (currentStreamers.length === 0) {
      await interaction.reply({
        content: '🔴 No server members are currently streaming on Twitch.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const streamerList = currentStreamers.map(streamer => {
      const streamDuration = Math.floor((Date.now() - streamer.startTime.getTime()) / (1000 * 60));
      const hours = Math.floor(streamDuration / 60);
      const minutes = streamDuration % 60;
      const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      
      return `🔴 **${streamer.username}** ([${streamer.twitchUsername}](https://twitch.tv/${streamer.twitchUsername})) - ${duration}`;
    }).join('\n');
    
    const embed = new EmbedBuilder()
      .setColor(0x9146FF)
      .setTitle('🔴 Currently Live Server Members')
      .setDescription(`**${currentStreamers.length} member${currentStreamers.length === 1 ? '' : 's'} currently streaming:**\n\n${streamerList}`)
      .setFooter({ 
        text: 'Automatic stream detection enabled' 
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral
    });

  } catch (error) {
    logger.error('Error showing live streamers:', error);
    await interaction.reply({
      content: 'Failed to retrieve current streamers. Please try again.',
      flags: MessageFlags.Ephemeral
    });
  }
}
*/

// Handle debug-stream command
/*
async function handleDebugStreamCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: 'You need Administrator permissions to use this command.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  try {
    const targetUser = interaction.options.getUser('user', true);
    const guild = interaction.guild;
    
    if (!guild) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const member = await guild.members.fetch(targetUser.id);
    if (!member) {
      await interaction.reply({
        content: 'User not found in this server.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Check if user is currently streaming
    const isStreaming = global.autoStreamDetection.isMemberStreaming(member.id);
    const currentStreamers = global.autoStreamDetection.getCurrentStreamers();
    const streamerData = currentStreamers.find(s => s.userId === member.id);
    
    // Check streaming role
    const streamingRole = guild.roles.cache.find(role => role.name === 'streaming now');
    const hasStreamingRole = streamingRole ? member.roles.cache.has(streamingRole.id) : false;
    
    // Check Discord presence for streaming activity
    const streamingActivity = member.presence?.activities.find(activity => 
      activity.type === ActivityType.Streaming && 
      activity.url?.includes('twitch.tv')
    );

    const debugInfo = [
      `**Debug Info for ${member.displayName} (${member.id})**`,
      ``,
      `**Discord Presence:**`,
      `• Has streaming activity: ${streamingActivity ? 'Yes' : 'No'}`,
      `• Streaming URL: ${streamingActivity?.url || 'None'}`,
      `• Activity type: ${streamingActivity?.type || 'None'}`,
      ``,
      `**Bot Detection:**`,
      `• Tracked as streaming: ${isStreaming ? 'Yes' : 'No'}`,
      `• Twitch username: ${streamerData?.twitchUsername || 'None'}`,
      `• Stream start time: ${streamerData?.startTime || 'None'}`,
      ``,
      `**Role Status:**`,
      `• "streaming now" role exists: ${streamingRole ? 'Yes' : 'No'}`,
      `• Has streaming role: ${hasStreamingRole ? 'Yes' : 'No'}`,
      `• Role ID: ${streamingRole?.id || 'None'}`,
      ``,
      `**Bot Status:**`,
      `• Is bot/app: ${member.user.bot ? 'Yes' : 'No'}`
    ].join('\n');

    await interaction.reply({
      content: debugInfo,
      flags: MessageFlags.Ephemeral
    });

  } catch (error) {
    logger.error('Error in debug-stream command:', error);
    await interaction.reply({
      content: 'Failed to debug streaming info. Please try again.',
      flags: MessageFlags.Ephemeral
    });
  }
}
*/



// Handle join-to-create command
async function handleJoinToCreateCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: "You need Administrator permissions to use this command.",
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  try {
    const targetChannel = interaction.options.getChannel("channel", true);
    const channelType = interaction.options.getString("type", true);
    
    if (targetChannel.type !== ChannelType.GuildVoice) {
      await interaction.reply({
        content: "Please select a voice channel.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Initialize global join-to-create channels map if not exists
    if (typeof global.joinToCreateChannels === "undefined") {
      global.joinToCreateChannels = new Map();
    }

    // Add channel to join-to-create system
    global.joinToCreateChannels.set(targetChannel.id, {
      guildId: interaction.guild!.id,
      channelId: targetChannel.id,
      channelName: targetChannel.name || 'Unknown Channel',
      isPrivate: channelType === "private",
      createdChannels: new Set() // Track channels created from this JTC channel
    });

    const accessType = channelType === "private" ? "Invite Only (Private)" : "Public (Open to all members)";
    
    await interaction.reply({
      content: `✅ Successfully configured **${targetChannel.name}** as a join-to-create voice channel.\n**Access Type:** ${accessType}`,
      flags: MessageFlags.Ephemeral
    });

    logger.info(`Join-to-create enabled for channel ${targetChannel.name} (${targetChannel.id}) - Type: ${channelType} in guild ${interaction.guild!.id}`);

  } catch (error) {
    logger.error("Error in join-to-create command:", error);
    await interaction.reply({
      content: "Failed to configure join-to-create channel. Please try again.",
      flags: MessageFlags.Ephemeral
    });
  }
}

// Handle manage-jtc command
async function handleManageJTCCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: "You need Administrator permissions to use this command.",
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  try {
    const action = interaction.options.getString("action", true);
    
    // Initialize if not exists
    if (typeof global.joinToCreateChannels === "undefined") {
      global.joinToCreateChannels = new Map();
    }

    if (action === "list") {
      // List all join-to-create channels
      if (global.joinToCreateChannels.size === 0) {
        await interaction.reply({
          content: "No join-to-create channels are currently configured.",
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      const guildChannels = Array.from(global.joinToCreateChannels.values())
        .filter(config => config.guildId === interaction.guild!.id);

      if (guildChannels.length === 0) {
        await interaction.reply({
          content: "No join-to-create channels are configured in this server.",
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      const channelList = guildChannels.map(config => {
        const accessType = config.isPrivate ? "Invite Only" : "Public";
        return `• **${config.channelName}** (<#${config.channelId}>) - ${accessType}`;
      }).join("\n");

      await interaction.reply({
        content: `**Join-to-Create Channels:**\n${channelList}`,
        flags: MessageFlags.Ephemeral
      });

    } else if (action === "remove") {
      const targetChannel = interaction.options.getChannel("channel");
      
      if (!targetChannel) {
        await interaction.reply({
          content: "Please specify a channel to remove from join-to-create.",
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      if (!global.joinToCreateChannels.has(targetChannel.id)) {
        await interaction.reply({
          content: `**${targetChannel.name}** is not configured as a join-to-create channel.`,
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      // Remove from join-to-create system
      global.joinToCreateChannels.delete(targetChannel.id);
      
      await interaction.reply({
        content: `✅ Removed **${targetChannel.name}** from join-to-create system.`,
        flags: MessageFlags.Ephemeral
      });

      logger.info(`Join-to-create disabled for channel ${targetChannel.name} (${targetChannel.id}) in guild ${interaction.guild!.id}`);
    }

  } catch (error) {
    logger.error("Error in manage-jtc command:", error);
    await interaction.reply({
      content: "Failed to manage join-to-create settings. Please try again.",
      flags: MessageFlags.Ephemeral
    });
  }
}

// Handle tagay command - randomly select someone from voice channel
async function handleTagayCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    const voiceChannel = interaction.options.getChannel('channel', true);
    
    if (voiceChannel.type !== ChannelType.GuildVoice) {
      await interaction.reply({
        content: 'Please select a voice channel.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Get members in the voice channel (type assertion needed for Discord.js)
    const voiceChannelData = voiceChannel as any;
    const members = voiceChannelData.members ? Array.from(voiceChannelData.members.values())
      .filter((member: any) => !member.user.bot) : []; // Exclude bots

    if (members.length === 0) {
      await interaction.reply({
        content: `No one is currently in ${voiceChannel.name}.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Randomly select a member
    const randomMember: any = members[Math.floor(Math.random() * members.length)];
    
    // Create tagay message
    const tagayMessages = [
      `${randomMember}, ikaw na. Sagot mo na ang susunod na chika.`,
      `${randomMember}, your turn! Kwento mo naman.`,
      `${randomMember}, tagay! Share mo naman ang story mo.`,
      `${randomMember}, ito na turn mo. Anong kwento mo?`,
      `${randomMember}, time to spill the tea! Kwento mo na.`
    ];

    const randomMessage = tagayMessages[Math.floor(Math.random() * tagayMessages.length)];

    await interaction.reply({
      content: randomMessage
    });

    logger.info(`Tagay command used by ${interaction.user.tag} in ${voiceChannel.name}, selected ${randomMember?.displayName || 'unknown user'}`);

  } catch (error) {
    logger.error('Error in tagay command:', error);
    await interaction.reply({
      content: 'Failed to select someone for tagay. Please try again.',
      flags: MessageFlags.Ephemeral
    });
  }
}

// Handle tagay-topics command - generate Filipino culture conversation topics
async function handleTagayTopicsCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    const topics = [
      // Childhood and Growing Up
      "Share your favorite childhood memory from the Philippines.",
      "What's the most memorable family gathering you've attended?",
      "Tell us about a traditional Filipino dish your lola/lolo used to make.",
      "What's your favorite Filipino childhood game or activity?",
      "Describe the most memorable fiesta in your hometown.",
      
      // Filipino Culture and Traditions
      "What Filipino tradition do you miss the most while abroad?",
      "Share a funny or embarrassing moment during a Filipino celebration.",
      "What's the best advice your Filipino parent/grandparent gave you?",
      "Tell us about a superstition your family believes in.",
      "What's your favorite Filipino saying or expression and why?",
      
      // Food and Family
      "Describe the perfect Filipino comfort food for you.",
      "Share a story about learning to cook a Filipino dish.",
      "What's the funniest thing that happened during a family videoke session?",
      "Tell us about a time when Filipino hospitality surprised someone.",
      "What Filipino snack always reminds you of home?",
      
      // Community and Relationships
      "Share how you met your closest Filipino friend abroad.",
      "Tell us about a time the Filipino community helped you.",
      "What's the most 'Filipino' thing you've done while living abroad?",
      "Describe a moment when you felt proud to be Filipino.",
      "Share a story about introducing Filipino culture to a non-Filipino friend.",
      
      // Life Abroad and Identity
      "What was your biggest culture shock when you first moved abroad?",
      "Tell us about a time you had to explain something Filipino to foreigners.",
      "Share your funniest 'lost in translation' moment.",
      "What aspect of Filipino culture do you want to pass on to the next generation?",
      "Describe a moment when you realized how much you've changed since moving abroad.",
      
      // Dreams and Aspirations
      "If you could bring one thing from the Philippines to your current country, what would it be?",
      "Share your dream of how you want to contribute to the Filipino community.",
      "Tell us about a Filipino role model who inspires you.",
      "What's one thing you want to accomplish before you visit the Philippines again?",
      "If you could have dinner with any Filipino celebrity or historical figure, who would it be and why?"
    ];

    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    const embed = new EmbedBuilder()
      .setTitle('🍻 Tagay Topics')
      .setDescription(`**Conversation Starter:**\n\n*${randomTopic}*`)
      .setColor(0x6E8878)
      .setFooter({ text: 'Use /tagay-topics again for a new topic!' })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed]
    });

    logger.info(`Tagay-topics command used by ${interaction.user.tag}, topic: ${randomTopic}`);

  } catch (error) {
    logger.error('Error in tagay-topics command:', error);
    await interaction.reply({
      content: 'Failed to generate topic. Please try again.',
      flags: MessageFlags.Ephemeral
    });
  }
}

// Initialize global raffle storage
declare global {
  var activeRaffles: Map<string, {
    guildId: string;
    raffleName: string;
    prize: string;
    numberOfWinners: number;
    endDate: Date;
    rules?: string;
    entries: Set<string>;
    createdBy: string;
    createdAt: Date;
    channelId: string;
  }>;
}

if (typeof global.activeRaffles === 'undefined') {
  global.activeRaffles = new Map();
}

// Handle raffle command
async function handleRaffleStartCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: 'You need Administrator permissions to start a raffle.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  try {
    const raffleName = interaction.options.getString('name', true);
    const prize = interaction.options.getString('prize', true);
    const durationStr = interaction.options.getString('duration', true);
    const numberOfWinners = interaction.options.getInteger('winners') || 1;
    const rules = interaction.options.getString('rules') || '';

    // Calculate end date based on duration
    const now = new Date();
    let durationMs: number;
    
    switch (durationStr) {
      case '1h':
        durationMs = 1 * 60 * 60 * 1000; // 1 hour
        break;
      case '2h':
        durationMs = 2 * 60 * 60 * 1000; // 2 hours
        break;
      case '6h':
        durationMs = 6 * 60 * 60 * 1000; // 6 hours
        break;
      case '12h':
        durationMs = 12 * 60 * 60 * 1000; // 12 hours
        break;
      case '24h':
        durationMs = 24 * 60 * 60 * 1000; // 24 hours
        break;
      default:
        throw new Error('Invalid duration selection');
    }
    
    const endDate = new Date(now.getTime() + durationMs);
    const durationHours = durationMs / (60 * 60 * 1000);
    
    logger.info(`Raffle duration: ${durationHours} hours, ending at: ${endDate.toISOString()}`);

    // Check if raffle with this name already exists
    const raffleKey = `${interaction.guildId}_${raffleName.toLowerCase()}`;
    if (global.activeRaffles.has(raffleKey)) {
      await interaction.reply({
        content: `A raffle named "${raffleName}" is already active. Please use a different name, end the existing raffle first, or wait for it to expire.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Create new raffle
    global.activeRaffles.set(raffleKey, {
      guildId: interaction.guildId!,
      raffleName: raffleName,
      prize: prize,
      numberOfWinners: numberOfWinners,
      endDate: endDate,
      rules: rules,
      entries: new Set(),
      createdBy: interaction.user.id,
      createdAt: new Date(),
      channelId: interaction.channelId
    });

    // Create raffle announcement embed with interactive buttons
    const winnerText = numberOfWinners === 1 ? '1 winner' : `${numberOfWinners} winners`;
    const endDateFormatted = `<t:${Math.floor(endDate.getTime() / 1000)}:F>`;
    const embed = new EmbedBuilder()
      .setTitle('🎉 New Raffle Started!')
      .setDescription(`**Raffle Name:** ${raffleName}\n\n**Prize:** ${prize}\n\n${rules ? `**Rules:**\n${rules}\n\n` : ''}`)
      .setColor(0x6E8878)
      .addFields(
        { name: 'Winners', value: winnerText, inline: true },
        { name: 'Entries', value: '0', inline: true },
        { name: 'End Date', value: endDateFormatted, inline: true },
        { name: 'Organizer', value: `<@${interaction.user.id}>`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Good luck to all participants!' });

    // Create interactive buttons
    const enterButton = new ButtonBuilder()
      .setCustomId(`raffle_enter_${raffleName.toLowerCase()}`)
      .setLabel('🎲 Enter Raffle')
      .setStyle(ButtonStyle.Primary);

    const pickButton = new ButtonBuilder()
      .setCustomId(`raffle_pick_${raffleName.toLowerCase()}`)
      .setLabel('🏆 Pick Winners & End')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(enterButton, pickButton);

    await interaction.reply({
      content: `🎉 **Raffle "${raffleName}" has been started!**`,
      embeds: [embed],
      components: [row]
    });

    const duration = Math.round((endDate.getTime() - new Date().getTime()) / (1000 * 60)); // duration in minutes
    logger.info(`Raffle "${raffleName}" started by ${interaction.user.tag} in guild ${interaction.guildId} with ${numberOfWinners} winners, duration: ${duration} minutes, ending ${endDate.toISOString()}`);

  } catch (error) {
    logger.error('Error in raffle command:', error);
    await interaction.reply({
      content: 'Failed to start raffle. Please try again.',
      flags: MessageFlags.Ephemeral
    });
  }
}

// Handle raffle button interactions
async function handleRaffleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
  const customId = interaction.customId;
  
  if (customId.startsWith('raffle_enter_')) {
    await handleRaffleEnterButton(interaction);
  } else if (customId.startsWith('raffle_pick_')) {
    await handleRafflePickButton(interaction);
  }
}

// Handle raffle enter button
async function handleRaffleEnterButton(interaction: ButtonInteraction): Promise<void> {
  try {
    // Check if user is a bot
    if (interaction.user.bot) {
      await interaction.reply({
        content: 'Bots cannot enter raffles.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const raffleName = interaction.customId.replace('raffle_enter_', '');
    const raffleKey = `${interaction.guildId}_${raffleName}`;
    
    const raffle = global.activeRaffles.get(raffleKey);
    if (!raffle) {
      await interaction.reply({
        content: 'This raffle is no longer active.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Check if raffle has expired
    if (raffle.endDate < new Date()) {
      await interaction.reply({
        content: 'This raffle has expired.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Check if user already entered
    if (raffle.entries.has(interaction.user.id)) {
      await interaction.reply({
        content: 'You are already entered in this raffle!',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Add user to raffle
    raffle.entries.add(interaction.user.id);

    const endDateFormatted = `<t:${Math.floor(raffle.endDate.getTime() / 1000)}:R>`;
    await interaction.reply({
      content: `✅ You have successfully entered the raffle!\n\n**Prize:** ${raffle.prize}\n**Ends:** ${endDateFormatted}\n**Total Entries:** ${raffle.entries.size}\n\nGood luck!`,
      flags: MessageFlags.Ephemeral
    });

    // Update the embed with new entry count
    const embed = interaction.message.embeds[0];
    if (embed) {
      const updatedEmbed = EmbedBuilder.from(embed);
      // Update the entries field
      const fields = updatedEmbed.data.fields || [];
      const entryFieldIndex = fields.findIndex(field => field.name === 'Entries');
      if (entryFieldIndex !== -1) {
        fields[entryFieldIndex].value = raffle.entries.size.toString();
        updatedEmbed.setFields(fields);
      }
      
      await interaction.editReply({
        embeds: [updatedEmbed]
      });
    }

    logger.info(`User ${interaction.user.tag} entered raffle "${raffle.raffleName}" via button in guild ${interaction.guildId}`);

  } catch (error) {
    logger.error('Error in raffle enter button:', error);
    await interaction.reply({
      content: 'Failed to enter raffle. Please try again.',
      flags: MessageFlags.Ephemeral
    });
  }
}

// Handle raffle pick button
async function handleRafflePickButton(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: 'You need Administrator permissions to pick raffle winners.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  try {
    const raffleName = interaction.customId.replace('raffle_pick_', '');
    const raffleKey = `${interaction.guildId}_${raffleName}`;
    
    const raffle = global.activeRaffles.get(raffleKey);
    if (!raffle) {
      await interaction.reply({
        content: 'This raffle is no longer active.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const allEntries = Array.from(raffle.entries);
    
    // Filter out bot users from entries
    const validEntries = [];
    for (const userId of allEntries) {
      try {
        const member = await interaction.guild?.members.fetch(userId);
        if (member && !member.user.bot) {
          validEntries.push(userId);
        }
      } catch (error) {
        // If we can't fetch the user, assume they're not a bot and include them
        validEntries.push(userId);
      }
    }
    
    if (validEntries.length === 0) {
      await interaction.reply({
        content: 'This raffle has no valid entries (excluding bots). Cannot pick winners.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Determine actual number of winners (can't exceed number of valid entries)
    const actualWinners = Math.min(raffle.numberOfWinners, validEntries.length);
    
    // Pick random winners (no duplicates)
    const shuffledEntries = [...validEntries].sort(() => Math.random() - 0.5);
    const winnerUserIds = shuffledEntries.slice(0, actualWinners);
    
    // Fetch winner members
    const winners = await Promise.all(
      winnerUserIds.map(async (userId) => {
        try {
          const member = await interaction.guild?.members.fetch(userId);
          return { userId, displayName: member?.displayName || `<@${userId}>` };
        } catch (error) {
          return { userId, displayName: `<@${userId}>` };
        }
      })
    );

    const winnerNames = winners.map(w => w.displayName).join(', ');
    const winnerMentions = winners.map(w => `<@${w.userId}>`).join(', ');

    // Create winner announcement embed
    const winnerEmbed = new EmbedBuilder()
      .setTitle('🏆 Raffle Winners!')
      .setDescription(`**Raffle:** ${raffle.raffleName}\n**Prize:** ${raffle.prize}\n\n**${actualWinners === 1 ? 'Winner' : 'Winners'}:**\n${winnerMentions}`)
      .setColor(0xFFD700)
      .addFields(
        { name: 'Total Entries', value: validEntries.length.toString(), inline: true },
        { name: 'Winner(s)', value: actualWinners.toString(), inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Congratulations to the winner(s)!' });

    // Remove the raffle from active raffles
    global.activeRaffles.delete(raffleKey);

    // Update the original message to show raffle ended
    const originalEmbed = interaction.message.embeds[0];
    if (originalEmbed) {
      const endedEmbed = EmbedBuilder.from(originalEmbed)
        .setTitle('🏆 Raffle Ended!')
        .setColor(0x808080)
        .setFooter({ text: 'This raffle has ended.' });

      // Disable buttons
      const disabledRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('disabled_enter')
            .setLabel('🎲 Enter Raffle')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('disabled_pick')
            .setLabel('🏆 Raffle Ended')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );

      await interaction.update({
        embeds: [endedEmbed],
        components: [disabledRow]
      });
    }

    // Send winner announcement
    await interaction.followUp({
      content: `🎉 **Raffle "${raffle.raffleName}" has ended!**`,
      embeds: [winnerEmbed]
    });

    logger.info(`Raffle "${raffle.raffleName}" ended by ${interaction.user.tag}, ${actualWinners} winners (${validEntries.length}/${allEntries.length} valid entries): ${winnerNames}`);

  } catch (error) {
    logger.error('Error in raffle pick button:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Failed to pick winners and end raffle. Please try again.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
}
