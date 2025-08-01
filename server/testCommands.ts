import { 
  SlashCommandBuilder, 
  REST, 
  Routes, 
  ChatInputCommandInteraction,
  PermissionFlagsBits
} from 'discord.js';
import logger from './logger';

// Simple test commands
const testCommands = [
  new SlashCommandBuilder()
    .setName('test')
    .setDescription('Test command to verify bot is working')
    .setDefaultMemberPermissions(null),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show help for all commands')
    .setDefaultMemberPermissions(null)
];

// Register test commands
export async function registerTestCommands(rest: REST, clientId: string): Promise<void> {
  try {
    logger.info('Registering test commands...');

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: testCommands.map(command => command.toJSON()) }
    );

    logger.info(`Successfully registered ${testCommands.length} test commands.`);
  } catch (error) {
    logger.error('Error registering test commands:', error);
  }
}

// Handle test commands
export async function handleTestCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (interaction.commandName === 'test') {
    await interaction.reply('Bot is working! 🎉');
  } else if (interaction.commandName === 'help') {
    await interaction.reply({
      content: 'Test bot is active. Commands: /test, /help',
      ephemeral: true
    });
  }
}