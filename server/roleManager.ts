import { 
  StringSelectMenuInteraction,
  GuildMember,
  MessageFlags
} from 'discord.js';
import logger from './logger';

/**
 * Handle role selection from dropdown menus
 */
export async function handleRoleSelection(interaction: StringSelectMenuInteraction): Promise<void> {
  if (!interaction.guild || !interaction.member) {
    await interaction.reply({
      content: 'This command can only be used in a server.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const member = interaction.member as GuildMember;
  const selectedValues = interaction.values;
  const customId = interaction.customId;

  try {
    if (customId.startsWith('welcome_roles_') || customId.startsWith('ka_roles_')) {
      await handleWelcomeRoleSelection(interaction, member, selectedValues, customId);
    } else if (customId === 'game_roles') {
      await handleGameRoleSelection(interaction, member, selectedValues);
    } else if (customId === 'activity_roles') {
      await handleActivityRoleSelection(interaction, member, selectedValues);
    } else {
      await interaction.reply({
        content: 'Unknown role selection menu.',
        flags: MessageFlags.Ephemeral
      });
    }
  } catch (error) {
    logger.error('Error handling role selection:', error);
    await interaction.reply({
      content: 'There was an error processing your role selection. Please try again.',
      flags: MessageFlags.Ephemeral
    });
  }
}

/**
 * Handle welcome role selection from dropdowns
 */
async function handleWelcomeRoleSelection(
  interaction: StringSelectMenuInteraction,
  member: GuildMember,
  selectedValues: string[],
  customId: string
): Promise<void> {
  const guild = interaction.guild!;
  const category = customId.replace('welcome_roles_', '').replace('ka_roles_', '');
  
  // Special handling for location roles (Philippines + International constraint)
  if (category === 'ka_location') {
    const selectedRoles = selectedValues.map(roleId => guild.roles.cache.get(roleId)).filter(Boolean) as any[];
    const philippinesRoles = selectedRoles.filter(role => ['Luzon', 'Visayas', 'Mindanao'].includes(role.name));
    const internationalRoles = selectedRoles.filter(role => ['US', 'CA', 'Other'].includes(role.name));
    
    // Check constraints
    if (philippinesRoles.length > 1) {
      await interaction.reply({
        content: 'You can only select one Philippines location role.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    
    if (internationalRoles.length > 1) {
      await interaction.reply({
        content: 'You can only select one international location role.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }
  }
  
  // For Philippines and International regions, remove existing region roles first
  if (category === 'philippines' || category === 'international') {
    const allRegionRoles = ['Luzon', 'Visayas', 'Mindanao', 'US', 'CA', 'Other'];
    for (const roleName of allRegionRoles) {
      const existingRole = guild.roles.cache.find(role => 
        role.name.replace(/^ᴗ•\s*/, '').toLowerCase() === roleName.toLowerCase()
      );
      if (existingRole && member.roles.cache.has(existingRole.id)) {
        await member.roles.remove(existingRole.id);
      }
    }
  }

  const addedRoles: string[] = [];
  const removedRoles: string[] = [];
  const failedRoles: string[] = [];

  // Get all current roles in this category
  const categoryRoleNames = getCategoryRoleNames(category);
  const currentCategoryRoles = guild.roles.cache.filter(role => {
    const cleanName = role.name.replace(/^ᴗ•\s*/, '');
    return categoryRoleNames.some(name => cleanName.toLowerCase() === name.toLowerCase());
  });

  // Remove roles that are not selected
  for (const role of currentCategoryRoles.values()) {
    if (!selectedValues.includes(role.id) && member.roles.cache.has(role.id)) {
      try {
        await member.roles.remove(role.id);
        removedRoles.push(role.name.replace(/^ᴗ•\s*/, ''));
      } catch (error) {
        logger.error(`Failed to remove role ${role.id}:`, error);
      }
    }
  }

  // Add selected roles
  for (const roleId of selectedValues) {
    try {
      const role = guild.roles.cache.get(roleId);
      if (role) {
        if (!member.roles.cache.has(roleId)) {
          await member.roles.add(role);
          addedRoles.push(role.name.replace(/^ᴗ•\s*/, ''));
        }
      } else {
        failedRoles.push(roleId);
      }
    } catch (error) {
      logger.error(`Failed to add role ${roleId}:`, error);
      failedRoles.push(roleId);
    }
  }

  let response = '';
  const displayCategory = category.replace('ka_', '');
  if (addedRoles.length > 0) {
    response += `✅ Added ${displayCategory} roles: ${addedRoles.join(', ')}`;
  }
  if (removedRoles.length > 0) {
    if (response) response += '\n';
    response += `➖ Removed ${displayCategory} roles: ${removedRoles.join(', ')}`;
  }
  if (failedRoles.length > 0) {
    if (response) response += '\n';
    response += `❌ Failed to process some roles. Please contact a moderator.`;
  }

  await interaction.reply({
    content: response || 'No changes were made.',
    flags: MessageFlags.Ephemeral
  });
}

function getCategoryRoleNames(category: string): string[] {
  switch (category) {
    case 'philippines':
    case 'ka_philippines':
      return ['Luzon', 'Visayas', 'Mindanao'];
    case 'international':
    case 'ka_international':
      return ['US', 'CA', 'Other'];
    case 'status':
      return ['Working', 'Student', 'Living life'];
    case 'games':
    case 'ka_games':
      return ['Apex', 'CSGO', 'Dota', 'League', 'Marvel Rivals', 'Minecraft', 'Mobile Legends', 'Overwatch', 'Tetris', 'Valorant'];
    case 'activities':
      return ['E-numan', 'Game night', 'Movie night', 'Podcast', 'Voice call'];
    case 'ka_activities':
      return ['E-numan', 'Game night', 'Movie night', 'Voice call'];
    // KA server specific roles
    case 'ka_location':
      return ['Luzon', 'Visayas', 'Mindanao', 'US', 'CA', 'Other'];
    case 'ka_pronouns':
      return ['ate', 'kuya', 'maam/sir'];
    case 'ka_age':
      return ['17-', '18+'];  
    case 'ka_year':
      return ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Alumni'];
    case 'ka_interests':
      return ['Gaming', 'Music', 'Art', 'Sports', 'Tech', 'Movies', 'Books', 'Cooking'];
    case 'ka_colors':
      return ['Manananggal', 'White Lady', 'Tikbalang', 'Diwata', 'Duwende', 'Tiyanak', 'Sirena', 'Ibong Adarna', 'Sigbin', 'Bungisngis'];
    default:
      return [];
  }
}

/**
 * Handle game role selection
 */
async function handleGameRoleSelection(
  interaction: StringSelectMenuInteraction, 
  member: GuildMember, 
  selectedValues: string[]
): Promise<void> {
  const guild = interaction.guild!;
  const addedRoles: string[] = [];
  const failedRoles: string[] = [];

  for (const roleId of selectedValues) {
    try {
      const role = guild.roles.cache.get(roleId);
      if (role) {
        if (!member.roles.cache.has(roleId)) {
          await member.roles.add(role);
          addedRoles.push(role.name);
        }
      } else {
        failedRoles.push(roleId);
      }
    } catch (error) {
      logger.error(`Failed to add role ${roleId} to ${member.user.tag}:`, error);
      failedRoles.push(roleId);
    }
  }

  let response = '';
  if (addedRoles.length > 0) {
    response += `✅ Added game roles: ${addedRoles.join(', ')}`;
  }
  if (failedRoles.length > 0) {
    if (response) response += '\n';
    response += `❌ Failed to add some roles. Please contact a moderator.`;
  }

  await interaction.reply({
    content: response || 'No changes were made.',
    flags: MessageFlags.Ephemeral
  });
}

/**
 * Handle activity role selection
 */
async function handleActivityRoleSelection(
  interaction: StringSelectMenuInteraction, 
  member: GuildMember, 
  selectedValues: string[]
): Promise<void> {
  const guild = interaction.guild!;
  const addedRoles: string[] = [];
  const failedRoles: string[] = [];

  for (const roleId of selectedValues) {
    try {
      const role = guild.roles.cache.get(roleId);
      if (role) {
        if (!member.roles.cache.has(roleId)) {
          await member.roles.add(role);
          addedRoles.push(role.name);
        }
      } else {
        failedRoles.push(roleId);
      }
    } catch (error) {
      logger.error(`Failed to add role ${roleId} to ${member.user.tag}:`, error);
      failedRoles.push(roleId);
    }
  }

  let response = '';
  if (addedRoles.length > 0) {
    response += `✅ Added activity roles: ${addedRoles.join(', ')}`;
  }
  if (failedRoles.length > 0) {
    if (response) response += '\n';
    response += `❌ Failed to add some roles. Please contact a moderator.`;
  }

  await interaction.reply({
    content: response || 'No changes were made.',
    flags: MessageFlags.Ephemeral
  });
}
