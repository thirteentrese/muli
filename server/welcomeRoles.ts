import { 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder, 
  ChannelType, 
  TextChannel,
  Guild,
  EmbedBuilder,
  Client
} from 'discord.js';
import logger from './logger';

// Get Discord client from global reference
function getDiscordClient(): Client {
  if (!global.discordClient) {
    throw new Error('Discord client not initialized');
  }
  return global.discordClient;
}

/**
 * Send the welcome message with role selection menus
 */
export async function sendWelcomeMessage(channelId: string, serverId: string): Promise<boolean> {
  try {
    // Get Discord client
    const client = getDiscordClient();

    // Get the channel to post in
    const channel = await client.channels.fetch(channelId);

    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error(`Channel with ID ${channelId} not found or is not a text channel`);
    }

    // Get the guild
    const guild = await client.guilds.fetch(serverId);

    if (!guild) {
      throw new Error(`Server with ID ${serverId} not found`);
    }

    // Get all roles for this server
    const roles = await guild.roles.fetch();

    // Filter out @everyone role and sort by position
    const validRoles = Array.from(roles.values())
      .filter(role => role.name !== '@everyone')
      .sort((a, b) => b.position - a.position);

    // Create the embeds
    const embeds = [
      new EmbedBuilder()
        .setTitle('Hallo, welcome to **mᴗ•li**!')
        .setDescription("By joining our server you agree to abide by [Discord's Terms of Service](https://discord.com/terms) and [Community Guidelines](https://discord.com/guidelines), as well as our one and only server rule: **No Kid Left Behind.**")
        .setColor(11312057),

      new EmbedBuilder()
        .setDescription("To unlock the rest of the server, please write an introduction in <#1355432987839168559> and self-assign roles below.")
        .setColor(11312057),

      new EmbedBuilder()
        .setColor(0x6E8878)
        .addFields(
          { name: 'PHILIPPINES', value: 'ᴗ• Luzon\nᴗ• Visayas\nᴗ• Mindanao', inline: true },
          { name: 'INTERNATIONAL', value: 'ᴗ• US\nᴗ• CA\nᴗ• Other', inline: true }
        )
        .setImage('https://cdn.discordapp.com/attachments/1355432988300677131/1355802507724722298/8.png?ex=67f02fbb&is=67eede3b&hm=ec23d3d1be808e80926bcd6b884d6d73251969b302bcfa09c4aa7059b934136b&'),

      new EmbedBuilder()
        .setTitle('STATUS')
        .setDescription('ᴗ• Working\nᴗ• Student\nᴗ• Living life')
        .setColor(0x6E8878)
        .setImage('https://cdn.discordapp.com/attachments/1355432988300677131/1355802508064456734/9.png?ex=67f02fbb&is=67eede3b&hm=ee2815b56261d2a9362c8b68701c958c4aebf151772a5b29fea77820693e1af2&'),

      new EmbedBuilder()
        .setTitle('BONDING')
        .setColor(0x6E8878)
        .addFields(
          { name: 'GAMES', value: 'ᴗ• Apex\nᴗ• CSGO\nᴗ• Dota\nᴗ• League\nᴗ• Marvel Rivals\nᴗ• Minecraft\nᴗ• Mobile Legends\nᴗ• Overwatch\nᴗ• Tetris\nᴗ• Valorant', inline: true },
          { name: 'ACTIVITIES', value: 'ᴗ• E-numan\nᴗ• Game night\nᴗ• Movie night\nᴗ• Podcast\nᴗ• Voice call', inline: true }
        )
        .setImage('https://cdn.discordapp.com/attachments/1355432988300677131/1355802508932550866/11.png?ex=67f02fbb&is=67eede3b&hm=ad8550a37c67e1323a990a3384d8289501193f05ecf1d526f36c57e03850bf42&')
    ];

    // Create role menus by category with appropriate limits

    // Philippines region roles - can select only 1
    const philippinesRoles = createCategoryRoleMenu(
      guild, 
      validRoles, 
      'philippines', 
      ['Luzon', 'Visayas', 'Mindanao'],
      1  // Can only select max 1 Philippines region role
    );

    // International region roles - can select only 1
    const internationalRoles = createCategoryRoleMenu(
      guild, 
      validRoles, 
      'international', 
      ['US', 'CA', 'Other'],
      1  // Can only select max 1 International region role
    );

    // Status roles - can select multiple
    const statusRoles = createCategoryRoleMenu(
      guild, 
      validRoles, 
      'status', 
      ['Working', 'Student', 'Living life']
    );

    // Games dropdown
    const gameRoles = createCategoryRoleMenu(
      guild, 
      validRoles, 
      'games', 
      ['Apex', 'CSGO', 'Dota', 'League', 'Marvel Rivals', 'Minecraft', 'Mobile Legends', 'Overwatch', 'Tetris', 'Valorant']
    );

    // Activities dropdown
    const activityRoles = createCategoryRoleMenu(
      guild, 
      validRoles, 
      'activities', 
      ['E-numan', 'Game night', 'Movie night', 'Podcast', 'Voice call']
    );

    // Send intro and unlock messages first
    await (channel as TextChannel).send({
      embeds: embeds.slice(0, 2)
    });

    // Create components array for Philippines/International section
    const regionComponents: ActionRowBuilder<StringSelectMenuBuilder>[] = [];

    // Add Philippines dropdown if roles exist
    if (philippinesRoles) {
      regionComponents.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(philippinesRoles));
    }

    // Add International dropdown if roles exist
    if (internationalRoles) {
      regionComponents.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(internationalRoles));
    }

    // Send Philippines/International section with its dropdowns
    await (channel as TextChannel).send({
      embeds: [embeds[2]],
      components: regionComponents.length > 0 ? regionComponents : []
    });

    // Send Status section with its dropdown
    await (channel as TextChannel).send({
      embeds: [embeds[3]],
      components: statusRoles ? [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(statusRoles)] : []
    });

    // Send Bonding section with game and activity dropdowns
    const bondingComponents: ActionRowBuilder<StringSelectMenuBuilder>[] = [];

    if (gameRoles) {
      bondingComponents.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(gameRoles));
    }

    if (activityRoles) {
      bondingComponents.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(activityRoles));
    }

    await (channel as TextChannel).send({
      embeds: [embeds[4]],
      components: bondingComponents
    });

    return true;
  } catch (error) {
    logger.error(`Error creating welcome message: ${error}`);
    throw new Error(`Failed to create welcome message: ${error}`);
  }
}

/**
 * Send the KA server welcome message with role selection menus
 */
export async function sendKAWelcomeMessage(channelId: string, serverId: string): Promise<boolean> {
  try {
    // Get Discord client
    const client = getDiscordClient();

    // Get the channel to post in
    const channel = await client.channels.fetch(channelId);

    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error(`Channel with ID ${channelId} not found or is not a text channel`);
    }

    // Get the guild
    const guild = await client.guilds.fetch(serverId);

    if (!guild) {
      throw new Error(`Server with ID ${serverId} not found`);
    }

    // Get all roles for this server
    const roles = await guild.roles.fetch();

    // Filter out @everyone role and sort by position
    const validRoles = Array.from(roles.values())
      .filter(role => role.name !== '@everyone')
      .sort((a, b) => b.position - a.position);

    // Create the KA embeds
    const embeds = [
      // Welcome image embed
      new EmbedBuilder()
        .setImage('https://cdn.discordapp.com/attachments/1208254470916673547/1400350785879019550/welcooome.png?ex=688c51cc&is=688b004c&hm=14d4c1e771b2f0b0b7dc87c243bc671a3dc9b2b6a5cae1c9eff9b86d1102e2fb&')
        .setColor(0x6E8878),

      // Welcome message embed
      new EmbedBuilder()
        .setTitle('Welcome to KA!')
        .setDescription("We are an online community fostering camaraderie among Filipinos and **Kabayans Abroad** through gaming, movie nights, chill voice chats, and more! By joining our server you agree to abide by [Discord's Terms of Service](https://discord.com/terms) and [Community Guidelines](https://discord.com/guidelines), as well as our server rules.\n\n*This server was created by and for Filipinos. While we warmly welcome foreigners, please understand that we are not obligated to switch languages in chat or voice calls. We encourage everyone to respect the space as it was intended.*\n\n*Also, please make sure to keep conversations in their appropriate channels to help maintain order and clarity for everyone.*\n\nWe hope you enjoy your stay, KApatid!")
        .setColor(0x6E8878),

      // Location embed
      new EmbedBuilder()
        .setTitle('LOCATION')
        .setColor(0x6E8878)
        .setImage('https://cdn.discordapp.com/attachments/1208254470916673547/1400362124961910804/location.png?ex=688c5c5c&is=688b0adc&hm=eb2bc010d0439bcca5316fd40e5bbe8654c5ddd81e9251db66788846c31d5d17&')
        .addFields(
          { name: 'PHILIPPINES', value: '❍ Luzon\n❍ Visayas\n❍ Mindanao', inline: true },
          { name: 'INTERNATIONAL', value: '❍ US\n❍ CA\n❍ Other', inline: true }
        ),

      // Age embed
      new EmbedBuilder()
        .setTitle('AGE')
        .setDescription('❍ 17-\n❍ 18+')
        .setColor(0x6E8878)
        .setImage('https://cdn.discordapp.com/attachments/1208254470916673547/1400362123372134470/age.png?ex=688c5c5b&is=688b0adb&hm=98642f36b075a13ae56532cc46bf32c945df461aefadec4300d65de2aa195601&'),

      // Pronouns embed
      new EmbedBuilder()
        .setTitle('PRONOUNS')
        .setDescription('❍ She/Her (ate)\n❍ He/Him (kuya)\n❍ They/Them (maam/sir)')
        .setColor(0x6E8878)
        .setImage('https://cdn.discordapp.com/attachments/1208254470916673547/1400362125712556093/pronouns.png?ex=688c5c5c&is=688b0adc&hm=8027f855d4ceb6639de6c4dec9df039f92160c9917c75c732812b9a02dba6ee2&'),

      // Bonding embed
      new EmbedBuilder()
        .setTitle('BONDING')
        .setColor(0x6E8878)
        .setImage('https://cdn.discordapp.com/attachments/1208254470916673547/1400362124160667678/bonding.png?ex=688c5c5b&is=688b0adb&hm=2045ef9194989f723f4fbf09fd9f6588eac3000f0595df435f24885caa939b15&')
        .addFields(
          { name: 'GAMES', value: '❍ Apex\n❍ CSGO\n❍ Dota\n❍ League\n❍ Marvel Rivals\n❍ Minecraft\n❍ Mobile Legends\n❍ Overwatch\n❍ Tetris\n❍ Valorant', inline: true },
          { name: 'ACTIVITIES', value: '❍ E-numan\n❍ Game night\n❍ Movie night\n❍ Voice call', inline: true }
        ),

      // Color embed
      new EmbedBuilder()
        .setTitle('COLOR')
        .setDescription('❍ Manananggal - black.\n❍ White Lady - white.\n❍ Tikbalang - silver.\n❍ Diwata - pink.\n❍ Duwende - green.\n❍ Tiyanak - red.\n❍ Sirena - aqua.\n❍ Ibong Adarna - gold.\n❍ Sigbin - violet.\n❍ Bungisngis - blue.')
        .setColor(0x6E8878)
        .setImage('https://cdn.discordapp.com/attachments/1208254470916673547/1400363208488910858/location..png?ex=688c5d5e&is=688b0bde&hm=d3ab6fe115ac92910a205e481f6be336b1c3ea0cb3639dc5378e3a6e274ec491&')
    ];

    // Create role menus by category with appropriate limits

    // Combined location roles (Philippines + International) - can select multiple but with limits
    const locationRoles = createKACategoryRoleMenu(
      guild, 
      validRoles, 
      'ka_location', 
      ['Luzon', 'Visayas', 'Mindanao', 'US', 'CA', 'Other'],
      2,  // Can select max 2 location roles (1 PH + 1 International)
      'Self-assign location roles...'
    );

    // Age roles - can select only 1
    const ageRoles = createKACategoryRoleMenu(
      guild, 
      validRoles, 
      'ka_age', 
      ['17-', '18+'],
      1,  // Can only select 1 age range
      'Self-assign age roles...'
    );

    // Pronouns - can select only 1 - map to existing roles
    const pronounRoles = createKACategoryRoleMenu(
      guild, 
      validRoles, 
      'ka_pronouns', 
      ['ate', 'kuya', 'maam/sir'],  // Using existing role names in order
      1,  // Can only select 1 pronoun
      'Self-assign pronoun roles...'
    );

    // Games dropdown - keep separate
    const gameRoles = createKACategoryRoleMenu(
      guild, 
      validRoles, 
      'ka_games', 
      ['Apex', 'CSGO', 'Dota', 'League', 'Marvel Rivals', 'Minecraft', 'Mobile Legends', 'Overwatch', 'Tetris', 'Valorant'],
      undefined,  // Multiple selections allowed
      'Self-assign game roles...'
    );

    // Activities dropdown - keep separate, omit podcast
    const activityRoles = createKACategoryRoleMenu(
      guild, 
      validRoles, 
      'ka_activities', 
      ['E-numan', 'Game night', 'Movie night', 'Voice call'],
      undefined,  // Multiple selections allowed
      'Self-assign activity roles...'
    );

    // Color roles - can select only 1
    const colorRoles = createKACategoryRoleMenu(
      guild, 
      validRoles, 
      'ka_colors', 
      ['Manananggal', 'White Lady', 'Tikbalang', 'Diwata', 'Duwende', 'Tiyanak', 'Sirena', 'Ibong Adarna', 'Sigbin', 'Bungisngis'],
      1,  // Can only select 1 color
      'Self-assign color roles...'
    );

    // 1. Send welcome image first
    await (channel as TextChannel).send({
      embeds: [embeds[0]]
    });

    // 2. Send welcome message
    await (channel as TextChannel).send({
      embeds: [embeds[1]]
    });

    // 3. Send Location section with dropdown
    if (locationRoles) {
      await (channel as TextChannel).send({
        embeds: [embeds[2]],
        components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(locationRoles)]
      });
    }

    // 4. Send Age section with dropdown
    if (ageRoles) {
      await (channel as TextChannel).send({
        embeds: [embeds[3]],
        components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(ageRoles)]
      });
    }

    // 5. Send Pronouns section with dropdown
    if (pronounRoles) {
      await (channel as TextChannel).send({
        embeds: [embeds[4]],
        components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(pronounRoles)]
      });
    }

    // 6. Send Bonding section with game and activity dropdowns
    const bondingComponents: ActionRowBuilder<StringSelectMenuBuilder>[] = [];

    if (gameRoles) {
      bondingComponents.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(gameRoles));
    }

    if (activityRoles) {
      bondingComponents.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(activityRoles));
    }

    await (channel as TextChannel).send({
      embeds: [embeds[5]],
      components: bondingComponents
    });

    // 7. Send Color section with dropdown (last section)
    if (colorRoles) {
      await (channel as TextChannel).send({
        embeds: [embeds[6]],
        components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(colorRoles)]
      });
    }

    // 8. Send verification message
    const aprobEmoji = guild.emojis.cache.find(emoji => emoji.name === 'aprob');
    const emojiDisplay = aprobEmoji ? `<:aprob:${aprobEmoji.id}>` : ':aprob:';
    
    const verificationEmbed = new EmbedBuilder()
      .setTitle('Tuloy po kayo!')
      .setDescription(`React with ${emojiDisplay} to verify and gain access to all public channels.`)
      .setColor(0x6E8878);

    const verificationMessage = await (channel as TextChannel).send({
      embeds: [verificationEmbed]
    });

    // Add the :aprob: reaction to the verification message
    try {
      // Try to find the custom aprob emoji
      const aprobEmoji = guild.emojis.cache.find(emoji => emoji.name === 'aprob');
      if (aprobEmoji) {
        await verificationMessage.react(aprobEmoji);
      } else {
        // Fallback to a generic emoji if aprob not found
        await verificationMessage.react('✅');
        logger.warn('Custom aprob emoji not found, using fallback emoji');
      }
    } catch (error) {
      logger.warn('Could not add reaction to verification message:', error);
    }

    return true;
  } catch (error) {
    logger.error(`Error creating KA welcome message: ${error}`);
    throw new Error(`Failed to create KA welcome message: ${error}`);
  }
}

/**
 * Helper function to create a role menu for a specific category
 * @param maxSelectable Optional parameter to limit the number of selectable roles
 */
function createCategoryRoleMenu(
  guild: Guild, 
  allRoles: any[], 
  category: string,
  roleNames: string[],
  maxSelectable?: number
): StringSelectMenuBuilder | null {
  // Filter roles that match the category
  const categoryRoles = allRoles.filter(role => {
    // Check if the role name contains any of the specified role names
    // Remove the "ᴗ• " prefix if it exists
    const normalizedRoleName = role.name.replace(/^ᴗ•\s*/, '');
    return roleNames.some(name => 
      normalizedRoleName.toLowerCase() === name.toLowerCase() ||
      role.name.toLowerCase() === name.toLowerCase()
    );
  });

  if (categoryRoles.length === 0) {
    return null;
  }

  // Create the select menu
  const select = new StringSelectMenuBuilder()
    .setCustomId(`welcome_roles_${category}`)
    .setPlaceholder(`Select ${category} roles...`)
    .setMinValues(0)
    .setMaxValues(maxSelectable !== undefined ? maxSelectable : categoryRoles.length);

  // Sort roles alphabetically by clean name and add options
  const sortedRoles = categoryRoles.sort((a, b) => {
    const cleanA = a.name.replace(/^ᴗ•\s*/, '');
    const cleanB = b.name.replace(/^ᴗ•\s*/, '');
    return cleanA.localeCompare(cleanB);
  });

  sortedRoles.forEach(role => {
    // Remove "ᴗ• " prefix from the label for cleaner dropdown display
    const cleanLabel = role.name.replace(/^ᴗ•\s*/, '');
    select.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(cleanLabel)
        .setValue(role.id)
        .setDescription(`Select to add/remove the ${cleanLabel} role`)
    );
  });

  return select;
}

/**
 * Helper function to create a role menu for KA server categories
 */
function createKACategoryRoleMenu(
  guild: Guild, 
  allRoles: any[], 
  category: string,
  roleNames: string[],
  maxSelectable?: number,
  placeholder?: string
): StringSelectMenuBuilder | null {
  // Filter roles that match the category
  let filteredRoleNames = roleNames;
    
  if (category === 'ka_games') {
      filteredRoleNames = roleNames.filter(game => game !== 'Siege X');
  }
  
  const categoryRoles = allRoles.filter(role => {
    return filteredRoleNames.some(name => 
      role.name.toLowerCase() === name.toLowerCase()
    );
  });

  if (categoryRoles.length === 0) {
    return null;
  }

  // Create the select menu
  const select = new StringSelectMenuBuilder()
    .setCustomId(`ka_roles_${category}`)
    .setPlaceholder(placeholder || `Select ${category.replace('ka_', '')} roles...`)
    .setMinValues(0)
    .setMaxValues(maxSelectable !== undefined ? maxSelectable : categoryRoles.length);

  // Sort roles to match the order in roleNames array
  const sortedRoles: any[] = [];
  for (const roleName of filteredRoleNames) {
    const matchingRole = categoryRoles.find(role => 
      role.name.toLowerCase() === roleName.toLowerCase()
    );
    if (matchingRole) {
      sortedRoles.push(matchingRole);
    }
  }

  sortedRoles.forEach((role: any) => {
    select.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(role.name)
        .setValue(role.id)
        .setDescription(`Select to add/remove the ${role.name} role`)
    );
  });

  return select;
}