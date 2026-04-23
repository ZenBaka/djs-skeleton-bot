import { join } from "path";
import type BotClient from "../structures/BotClient";
import { Glob } from "bun";
import { type Button } from "../types";
import logger from "../utilities/Logger";
import { MessageFlags, type ButtonInteraction } from "discord.js";
import CooldownManager from "../managers/CooldownManager";
import BlacklistManager from "../managers/BlacklistManager";
import { isButton } from "../utilities/Validators";

const BUTTONS_DIR = join(import.meta.dir, '..', 'buttons');

export async function loadButtons(client: BotClient): Promise<void> {
  const glob = new Glob('**/*.{ts,js}');
  let loaded = 0;
  let skipped = 0;

  for await (const file of glob.scan({ cwd: BUTTONS_DIR, absolute: true })) {
    if (file.endsWith('.d.ts')) continue;

    try {
      const mod = await import(file);

      if (!isButton(mod)) {
        logger.warn(`[ButtonHandler] Skipped ${file}, invalid types`);
        skipped++;
        continue;
      }

      const button: Button = {
        info: mod.info,
        execute: mod.execute,
      };

      if (client.buttons.has(button.info.customId)) {
        logger.warn(`[ButtonHandler] Duplicate button id '${button.info.customId}' in ${file}`);
        skipped++;
        continue;
      }

      client.buttons.set(button.info.customId, button);
      loaded++;
    } catch (error) {
      logger.error(error, `[ButtonHandler] Failed to load file ${file}`);
      skipped++;
    }
  }

  logger.info(`[ButtonHandler] Loaded ${loaded} button${loaded === 1 ? '' : 's'}${skipped > 0 ? ` (${skipped} skipped)` : ''}`);
}

export async function handleButton(client: BotClient, interaction: ButtonInteraction): Promise<void> {
  const args = interaction.customId.split(':');
  const customId = args?.shift();

  if (!customId) return;

  const button = client.buttons.get(customId);
  if (!button) {
    await interaction.reply({
      content: 'This button is outdated or disabled.',
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

  if (button.info.isAuthorOnly) {
    const ownerId =
      (await button.info.resolveOwner?.(interaction)) ??
      interaction.message.interactionMetadata?.user.id;

    if (!ownerId || interaction.user.id !== ownerId) {
      await interaction.reply({
        content: 'This button is not for you!',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
  }

  const cooldownKey = CooldownManager.key(button.info.customId, interaction.user.id);

  if (button.info.cooldown) {
    const expiresAt = CooldownManager.check(cooldownKey);
    if (expiresAt !== null) {
      await interaction.reply({
        content: `You can use this button again <t:${expiresAt}:R>.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }
  }

  const startTime = Date.now();

  try {
    await button.execute(client, interaction, ...args);
    if (button.info.cooldown) {
      CooldownManager.start(cooldownKey, button.info.cooldown);
    }

    logger.info(
      `Button '${interaction.customId}' | ${interaction.user.username} (${interaction.user.id}) | ${interaction.guild?.name ?? 'DM'} | ${Date.now() - startTime}ms`
    );
  } catch (error) {
    logger.error(error, `[ButtonHandler] Error running '${interaction.customId}'`);

    const reply = {
      content: 'Something went wrong running that button.',
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