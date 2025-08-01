import { 
  StringSelectMenuInteraction,
  GuildMember
} from 'discord.js';
import logger from './logger';

/**
 * Handle role selection from dropdown menus
 */
export async function handleRoleSelection(interaction: StringSelectMenuInteraction): Promise<void> {
  if (!interaction.guild || !interaction.member) {
    await interaction.reply({
      content: 'This command can only be used in a server.',
      ephemeral: true
    });
    return;
  }

  const member = interaction.member as GuildMember;
  const selectedValues = interaction.values;
  const customId = interaction.customId;

  try {
    if (customId.startsWith('welcome_roles_')) {
      await handleWelcomeRoleSelection(interaction, member, selectedValues, customId);
    } else if (customId === 'game_roles') {
      await handleGameRoleSelection(interaction, member, selectedValues);
    } else if (customId === 'activity_roles') {
      await handleActivityRoleSelection(interaction, member, selectedValues);
    } else {
      await interaction.reply({
        content: 'Unknown role selection menu.',
        ephemeral: true
      });
    }
  } catch (error) {
    logger.error('Error handling role selection:', error);
    await interaction.reply({
      content: 'There was an error processing your role selection. Please try again.',
      ephemeral: true
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
  const category = customId.replace('welcome_roles_', '');
  
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
  if (addedRoles.length > 0) {
    response += `✅ Added ${category} roles: ${addedRoles.join(', ')}`;
  }
  if (removedRoles.length > 0) {
    if (response) response += '\n';
    response += `➖ Removed ${category} roles: ${removedRoles.join(', ')}`;
  }
  if (failedRoles.length > 0) {
    if (response) response += '\n';
    response += `❌ Failed to process some roles. Please contact a moderator.`;
  }

  await interaction.reply({
    content: response || 'No changes were made.',
    ephemeral: true
  });
}

function getCategoryRoleNames(category: string): string[] {
  switch (category) {
    case 'philippines':
      return ['Luzon', 'Visayas', 'Mindanao'];
    case 'international':
      return ['US', 'CA', 'Other'];
    case 'status':
      return ['Working', 'Student', 'Living life'];
    case 'games':
      return ['Apex', 'CSGO', 'Dota', 'League', 'Marvel Rivals', 'Minecraft', 'Mobile Legends', 'Overwatch', 'Siege X', 'Tetris', 'Valorant'];
    case 'activities':
      return ['E-numan', 'Game night', 'Movie night', 'Podcast', 'Voice call'];
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
    ephemeral: true
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
    ephemeral: true
  });
}