import { REST, Routes } from 'discord.js';
import { Glob } from 'bun';
import { join } from 'node:path';
import { ContextMenuCommandShape, hasShape, SlashCommandShape, type ContextMenuCommand, type SlashCommand } from '../src/types';

const COMMANDS_DIR = join(import.meta.dir, '..', 'src', 'slashCommands');
const CONTEXT_MENUS_DIR = join(import.meta.dir, '..', 'src', 'contextMenus');

const args = Bun.argv.slice(2);
const toGuild = args.includes('--guild');
const clear = args.includes('--clear');

const token = Bun.env.BOT_TOKEN;
const clientId = Bun.env.CLIENT_ID;
const guildId = Bun.env.GUILD_ID;

if (!token) {
  console.error('BOT_TOKEN is not set in .env');
  process.exit(1);
}
if (!clientId) {
  console.error('CLIENT_ID is not set in .env');
  process.exit(1);
}
if (toGuild && !guildId) {
  console.error('--guild was passed but GUILD_ID is not set in .env');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);
const route = toGuild
  ? Routes.applicationGuildCommands(clientId, guildId!)
  : Routes.applicationCommands(clientId);

if (clear) {
  console.log(`Clearing all ${toGuild ? 'guild' : 'global'} commands...`);
  await rest.put(route, { body: [] });
  console.log('Done. All commands removed.');
  process.exit(0);
}

// Walk the commands folder and collect the .data payloads
const payload: unknown[] = [];
const glob = new Glob('**/*.{ts,js}');

async function collectFrom<T extends { data: { toJSON(): unknown } }>(
  dir: string,
  shape: readonly (keyof T)[],
  kind: string,
): Promise<void> {
  const files: string[] = [];
  for await (const file of glob.scan({ cwd: dir, absolute: true })) {
    if (file.endsWith('.d.ts')) continue;
    files.push(file);
  }
  files.sort();

  for (const file of files) {
    try {
      const mod = await import(file);
      if (!hasShape<T>(mod, shape)) {
        console.warn(`Skipped ${file}, not a valid ${kind}`);
        continue;
      }
      payload.push(mod.data.toJSON());
    } catch (error) {
      console.error(`Failed to load ${file}:`, error);
    }
  }
}

await collectFrom<SlashCommand>(COMMANDS_DIR, SlashCommandShape, 'slash command');
await collectFrom<ContextMenuCommand>(CONTEXT_MENUS_DIR, ContextMenuCommandShape, 'context menu command');

if (payload.length === 0) {
  console.error('No commands found to register. Nothing to do.');
  process.exit(0);
}

console.log(`Registering ${payload.length} command${payload.length === 1 ? '' : 's'} ${toGuild ? `to guild ${guildId}` : 'globally'}...`);

try {
  const result = (await rest.put(route, { body: payload })) as unknown[];
  console.log(`Done. ${result.length} command${result.length === 1 ? '' : 's'} registered.`);
  if (!toGuild) {
    console.log('Note: global commands can take up to an hour to appear in every server.');
  }
} catch (error) {
  console.error('Registration failed:', error);
  process.exit(1);
}