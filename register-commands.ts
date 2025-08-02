import { REST, Routes } from 'discord.js';
import 'dotenv/config';
import { slashCommands } from './discordCommands_1753937665144';

const token = process.env.BOT_TOKEN!;
const clientId = process.env.CLIENT_ID!;
const guildId = process.env.GUILD_ID!;

const rest = new REST({ version: '10' }).setToken(token);

async function registerCommands() {
  try {
    console.log('Started registering guild commands...');

    // Convert each SlashCommandBuilder to JSON
    const commandsJson = slashCommands.map(cmd => cmd.toJSON());

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commandsJson },
    );

    console.log('Successfully registered guild commands!');
  } catch (error) {
    console.error('Error registering guild commands:', error);
  }
}

registerCommands();
