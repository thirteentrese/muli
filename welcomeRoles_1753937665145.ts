import { 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder, 
  ChannelType, 
  TextChannel,
  Guild,
  EmbedBuilder
} from 'discord.js';
import { storage } from './storage';
import logger from './logger';
import bot from './discordBot';

/**
 * Send the welcome message with role selection menus
 */
export async function sendWelcomeMessage(channelId: string, serverId: string): Promise<boolean> {
  try {
    // Get Discord client
    const client = bot.getClient();
    
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
          { name: 'GAMES', value: 'ᴗ• Apex\nᴗ• CSGO\nᴗ• Dota\nᴗ• League\nᴗ• Marvel Rivals\nᴗ• Minecraft\nᴗ• Mobile Legends\nᴗ• Overwatch\nᴗ• Siege X\nᴗ• Tetris\nᴗ• Valorant', inline: true },
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
      ['Apex', 'CSGO', 'Dota', 'League', 'Marvel Rivals', 'Minecraft', 'Mobile Legends', 'Overwatch', 'Siege X', 'Tetris', 'Valorant']
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
    const regionComponents = [];
    
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
    const bondingComponents = [];
    
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
 * Handle role selection from welcome dropdowns
 */
export async function handleWelcomeRoleSelection(
  userId: string,
  serverId: string,
  roleId: string,
  selected: boolean
): Promise<boolean> {
  try {
    // Get Discord client
    const client = bot.getClient();
    
    // Get the guild
    const guild = await client.guilds.fetch(serverId);
    
    // Get the member
    const member = await guild.members.fetch(userId);
    
    if (!member) {
      throw new Error(`Member with ID ${userId} not found in server ${serverId}`);
    }
    
    // Add or remove the role
    if (selected) {
      await member.roles.add(roleId);
    } else {
      await member.roles.remove(roleId);
    }
    
    return true;
  } catch (error) {
    logger.error(`Error handling welcome role selection: ${error}`);
    throw new Error(`Failed to handle welcome role selection: ${error}`);
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