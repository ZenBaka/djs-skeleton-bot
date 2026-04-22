import { join } from "path";
import type BotClient from "../structures/BotClient";
import { Glob } from "bun";
import { hasShape, isSelectMenu, MenuShape, type SelectMenu } from "../types";
import logger from "../utilities/Logger";
import { MessageFlags, type AnySelectMenuInteraction } from "discord.js";
import CooldownManager from "../managers/CooldownManager";
import BlacklistManager from "../managers/BlacklistManager";

const MENUS_DIR = join(import.meta.dir, '..', 'menus');

export async function loadMenus(client: BotClient): Promise<void> {
  const glob = new Glob('**/*.{ts,js}');
  let loaded = 0;
  let skipped = 0;
  const files: string[] = [];

  for await (const file of glob.scan({ cwd: MENUS_DIR, absolute: true })) {
    if (file.endsWith('.d.ts')) continue;
    files.push(file);
  }
  files.sort();

  for (const file of files) {
    try {
      const mod = await import(file);

      if (!isSelectMenu(mod)) {
        logger.warn(`[SelectMenuHandler] Skipped ${file}, invalid types`);
        skipped++;
        continue;
      }

      const menu: SelectMenu = {
        customId: mod.customId,
        execute: mod.execute,
        cooldown: mod.cooldown,
        isAuthorOnly: mod.isAuthorOnly
      };

      if (client.menus.has(menu.customId)) {
        logger.warn(`[SelectMenuHandler] Duplicate menu id '${menu.customId}' in ${file}`);
        skipped++;
        continue;
      }

      client.menus.set(menu.customId, menu);
      loaded++;
    } catch (error) {
      logger.error(error, `[SelectMenuHandler] Failed to load file ${file}:`);
      skipped++;
    }
  }

  logger.info(`[SelectMenuHandler] Loaded ${loaded} menu${loaded === 1 ? '' : 's'}${skipped > 0 ? ` (${skipped} skipped)` : ''}`);
}

export async function handleMenu(client: BotClient, interaction: AnySelectMenuInteraction): Promise<void> {
  const args = interaction.customId.split(':');
  const customId = args?.shift();

  if (!customId) return;

  const menu = client.menus.get(customId);
  if (!menu) {
    await interaction.reply({
      content: 'This menu is outdated or disabled.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (menu.isAuthorOnly && interaction.user.id !== interaction.message.interactionMetadata?.user.id) {
    await interaction.reply({
      content: 'Only the interaction owner can use this menu.',
      flags: MessageFlags.Ephemeral
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

  const cooldownKey = CooldownManager.key(menu.customId, interaction.user.id);

  if (menu.cooldown) {
    const expiresAt = CooldownManager.check(cooldownKey);
    if (expiresAt !== null) {
      await interaction.reply({
        content: `You can use this menu again <t:${expiresAt}:R>.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }
  }

  const startTime = Date.now();

  try {
    await menu.execute(client, interaction, ...args);
    if (menu.cooldown) {
      CooldownManager.start(cooldownKey, menu.cooldown);
    }

    logger.info(
      `Menu '${interaction.customId}' | ${interaction.user.username} (${interaction.user.id}) | ${interaction.guild?.name ?? 'DM'} | ${Date.now() - startTime}ms`
    );
  } catch (error) {
    logger.error(error, `[SelectMenuHandler] Error running '${interaction.customId}'`);

    const reply = {
      content: 'Something went wrong running that menu.',
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