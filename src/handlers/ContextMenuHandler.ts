import { join } from "path";
import { Glob } from "bun";
import { MessageFlags } from "discord.js";
import type { ContextMenuCommandInteraction } from "discord.js";
import type BotClient from "../structures/BotClient";
import { BOT_OWNERS, type ContextMenuCommand } from "../types";
import logger from "../utilities/Logger";
import CooldownManager from "../managers/CooldownManager";
import BlacklistManager from "../managers/BlacklistManager";
import { isContextMenuCommand } from "../utilities/Validators";

const CONTEXT_MENUS_DIR = join(import.meta.dir, '..', 'contextMenus');

/**
 * Collection keys combine the command type and name because Discord allows a
 * user-type and message-type command to share a display name. Keying by name
 * alone would cause silent overwrites at load time.
 */
function collectionKey(type: number, name: string): string {
  return `${type}:${name}`;
}

export async function loadContextMenus(client: BotClient): Promise<void> {
  const glob = new Glob('**/*.{ts,js}');
  const files: string[] = [];
  let loaded = 0;
  let skipped = 0;

  for await (const file of glob.scan({ cwd: CONTEXT_MENUS_DIR, absolute: true })) {
    if (file.endsWith('.d.ts')) continue;
    files.push(file);
  }
  files.sort();

  for (const file of files) {
    try {
      const mod = await import(file);

      if (!isContextMenuCommand(mod)) {
        logger.warn(`[ContextMenuHandler] Skipped ${file}, invalid types`);
        skipped++;
        continue;
      }

      const command: ContextMenuCommand = {
        data: mod.data,
        execute: mod.execute,
        cooldown: mod.cooldown,
        isOwnerOnly: mod.isOwnerOnly,
      };

      const json = command.data.toJSON();

      // A ContextMenuCommandBuilder that wasn't given a .setType(...) will
      // serialize without a type field, which Discord rejects at register time.
      // Catch it at load time instead so the user gets a clear message.
      if (typeof json.type !== 'number') {
        logger.warn(`[ContextMenuHandler] Skipped ${file}, missing .setType(ApplicationCommandType.User | .Message)`);
        skipped++;
        continue;
      }

      const key = collectionKey(json.type, json.name);

      if (client.contextMenus.has(key)) {
        logger.warn(`[ContextMenuHandler] Duplicate ${json.type === 2 ? 'user' : 'message'} command '${json.name}' in ${file}`);
        skipped++;
        continue;
      }

      client.contextMenus.set(key, command);
      loaded++;
    } catch (error) {
      logger.error(error, `[ContextMenuHandler] Failed to load file ${file}:`);
      skipped++;
    }
  }

  logger.info(`[ContextMenuHandler] Loaded ${loaded} context menu${loaded === 1 ? '' : 's'}${skipped > 0 ? ` (${skipped} skipped)` : ''}`);
}

export async function handleContextMenu(client: BotClient, interaction: ContextMenuCommandInteraction): Promise<void> {
  const key = collectionKey(interaction.commandType, interaction.commandName);
  const command = client.contextMenus.get(key);

  if (!command) {
    await interaction.reply({
      content: 'This command is outdated or disabled.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (BlacklistManager.has(interaction.user.id)) {
    await interaction.reply({
      content: 'You are blacklisted from using any of this bot\'s features.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (command.isOwnerOnly && !BOT_OWNERS.includes(interaction.user.id)) {
    await interaction.reply({
      content: 'This is an owner-only command.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const cooldownKey = CooldownManager.key(key, interaction.user.id);

  if (command.cooldown) {
    const expiresAt = CooldownManager.check(cooldownKey);
    if (expiresAt !== null) {
      await interaction.reply({
        content: `You can use this command again <t:${expiresAt}:R>.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
  }

  const startTime = Date.now();

  try {
    // Cast is needed because the stored type is the base union but the
    // runtime interaction narrows to one side. The user's execute function
    // declared its type via the generic and handles the narrow internally.
    await command.execute(client, interaction as never);
    if (command.cooldown) {
      CooldownManager.start(cooldownKey, command.cooldown);
    }

    logger.info(
      `ctx '${interaction.commandName}' (${interaction.commandType === 2 ? 'user' : 'message'}) | ${interaction.user.username} (${interaction.user.id}) | ${interaction.guild?.name ?? 'DM'} | ${Date.now() - startTime}ms`
    );
  } catch (error) {
    logger.error(error, `[ContextMenuHandler] Error running '${interaction.commandName}':`);

    const reply = {
      content: 'Something went wrong running that command.',
      flags: MessageFlags.Ephemeral,
    } as const;

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    } catch {
      // Interaction is gone, nothing to do
    }
  }
}