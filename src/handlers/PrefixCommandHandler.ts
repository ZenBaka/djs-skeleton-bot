import { join } from "path";
import type BotClient from "../structures/BotClient";
import { Glob } from "bun";
import { BOT_OWNERS, isPrefixCommand, type PrefixCommand } from "../types";
import logger from "../utilities/Logger";
import { Message } from "discord.js";
import CooldownManager from "../managers/CooldownManager";
import BlacklistManager from "../managers/BlacklistManager";

const COMMANDS_DIR = join(import.meta.dir, '..', 'prefixCommands');
const PREFIX = Bun.env.BOT_PREFIX || 'sb?'

export async function loadPrefixCommands(client: BotClient): Promise<void> {
  const glob = new Glob('**/*.{ts,js}');
  let loaded = 0;
  let aliasesLoaded = 0;
  let skipped = 0;
  let aliasesSkipped = 0;
  const files: string[] = [];

  for await (const file of glob.scan({ cwd: COMMANDS_DIR, absolute: true })) {
    if (file.endsWith('.d.ts')) continue;
    files.push(file);
  }
  files.sort();

  for (const file of files) {
    try {
      const mod = await import(file);

      if (!isPrefixCommand(mod)) {
        logger.warn(`[PrefixCommandHandler] Skipped ${file}, invalid types`);
        skipped++;
        continue;
      }

      const command: PrefixCommand = {
        info: mod.info,
        execute: mod.execute,
        help: mod.help,
      };

      if (client.prefixCommands.has(command.info.name)) {
        logger.warn(`[PrefixCommandHandler] Duplicate command name '${command.info.name}' in ${file}`);
        skipped++;
        continue;
      }

      if (command.info.aliases) {
        for (const alias of command.info.aliases) {
          if (client.prefixCommands.has(alias)) {
            logger.warn(`[PrefixCommandHandler] Duplicate command alias '${alias}' in ${file}`);
            aliasesSkipped++;
            continue;
          }

          client.prefixCommands.set(alias, command);
          aliasesLoaded++;
        }
      }

      client.prefixCommands.set(command.info.name, command);
      loaded++;
    } catch (error) {
      logger.error(error, `[PrefixCommandHandler] Failed to load file ${file}:`);
      skipped++;
    }
  }

  logger.info(`[PrefixCommandHandler] Loaded ${loaded} prefix command${loaded === 1 ? '' : 's'}${skipped > 0 ? ` (${skipped + aliasesSkipped} skipped)` : ''}${aliasesLoaded > 0 ? ` (${aliasesLoaded} aliases)` : ''}`);
}

export async function handlePrefixCommand(client: BotClient, message: Message): Promise<void> {
  if (message.author.bot) return;
  if (!client.user) return;

  const mentionPrefix = `<@${client.user.id}>`;
  const mentionPrefixNick = `<@!${client.user.id}>`;

  let usedPrefix: string | null = null;

  if (message.content.startsWith(PREFIX)) usedPrefix = PREFIX;
  else if (message.content.startsWith(mentionPrefix)) usedPrefix = mentionPrefix;
  else if (message.content.startsWith(mentionPrefixNick)) usedPrefix = mentionPrefixNick;

  if (!usedPrefix) return;

  if (message.content === mentionPrefix || message.content === mentionPrefixNick) {
    await message.reply({
      content: `My prefix is: \`${PREFIX}\`. You can also just mention me with commands too!`
    });
    return;
  }

  const args = message.content.slice(usedPrefix.length).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();

  if (!commandName) return;

  const command = client.prefixCommands.get(commandName);
  if (!command) {
    await message.reply('This command is outdated or disabled.');
    return;
  }

  if (BlacklistManager.has(message.author.id)) return;

  if (command.info.isOwnerOnly && !BOT_OWNERS.includes(message.author.id)) {
    await message.reply('this is an owner-only command!');
    return;
  }

  if (command.info.allowedChannels
    && message.inGuild()
    && !command.info.allowedChannels.includes(message.channelId)
  ) {
    await message.reply('This command is disabled in this channel.');
    return;
  }

  if (command.info.botPermissions && message.inGuild()) {
    const self = await message.guild.members.fetchMe();

    const channelPerms = self.permissionsIn(message.channelId);
    const missing = channelPerms.missing(command.info.botPermissions);

    if (missing.length > 0) {
      await message.reply(
        `I'm missing permissions to run this command: ${missing.join(', ')}`
      );
      return;
    }
  }

  if (command.info.userPermissions && message.member && message.inGuild()) {
    const missing = message.channel.permissionsFor(message.member)?.missing(command.info.userPermissions) ?? [];

    if (missing.length > 0) {
      await message.reply(`You need: ${missing.join(', ')}`);
      return;
    }
  }

  const cooldownKey = CooldownManager.key(command.info.name, message.author.id);

  if (command.info.cooldown) {
    const expiresAt = CooldownManager.check(cooldownKey);
    if (expiresAt !== null) {
      await message.reply({
        content: `You can use this command again <t:${expiresAt}:R>.`
      });
      return;
    }
  }

  const startTime = Date.now();

  try {
    await command.execute(client, message, ...args);
    if (command.info.cooldown) {
      CooldownManager.start(cooldownKey, command.info.cooldown);
    }
    logger.info(
      `${PREFIX}${commandName} | ${message.author.username} (${message.author.id}) | ${message.guild?.name ?? 'DM'} | ${Date.now() - startTime}ms`,
    );
  } catch (error) {
    logger.error(error, `[PrefixCommandHandler] Error running ${PREFIX}${commandName}:`);
    try {
      await message.reply('Something went wrong running that command.');
    } catch {
      // Message may have been deleted or channel gone, nothing to do
    }
  }
}