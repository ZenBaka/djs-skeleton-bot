import { join } from "path";
import type BotClient from "../structures/BotClient";
import { Glob } from "bun";
import { type ModalSubmit } from "../types";
import logger from "../utilities/Logger";
import { MessageFlags, type ModalSubmitInteraction } from "discord.js";
import CooldownManager from "../managers/CooldownManager";
import BlacklistManager from "../managers/BlacklistManager";
import { isModalSubmit } from "../utilities/Validators";

const MODALS_DIR = join(import.meta.dir, '..', 'modals');

export async function loadModals(client: BotClient): Promise<void> {
  const glob = new Glob('**/*.{ts,js}');
  let loaded = 0;
  let skipped = 0;

  for await (const file of glob.scan({ cwd: MODALS_DIR, absolute: true })) {
    if (file.endsWith('.d.ts')) continue;

    try {
      const mod = await import(file);

      if (!isModalSubmit(mod)) {
        logger.warn(`[ModalSubmitHandler] Skipped ${file}, invalid types`);
        skipped++;
        continue;
      }

      const modal: ModalSubmit = {
        info: mod.info,
        execute: mod.execute,
      };

      if (client.modals.has(modal.info.customId)) {
        logger.warn(`[ModalSubmitHandler] Duplicated modal id '${modal.info.customId}' in ${file}`);
        skipped++;
        continue;
      }

      client.modals.set(modal.info.customId, modal);
      loaded++;
    } catch (error) {
      logger.error(error, `[ModalSubmitHandler] Failed to load file ${file}`);
      skipped++;
    }
  }

  logger.info(`[ModalSubmitHandler] Loaded ${loaded} modal${loaded === 1 ? '' : 's'}${skipped > 0 ? ` (${skipped} skipped)` : ''}`);
}

export async function handleModalSubmit(client: BotClient, interaction: ModalSubmitInteraction): Promise<void> {
  const args = interaction.customId.split(':');
  const customId = args?.shift();

  if (!customId) return;

  const modal = client.modals.get(customId);
  if (!modal) {
    await interaction.reply({
      content: 'This modal is outdated or disabled.',
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

  const cooldownKey = CooldownManager.key(modal.info.customId, interaction.user.id);

  if (modal.info.cooldown) {
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
    await modal.execute(client, interaction, ...args);
    if (modal.info.cooldown) {
      CooldownManager.start(cooldownKey, modal.info.cooldown);
    }

    logger.info(
      `Modal '${interaction.customId}' | ${interaction.user.username} (${interaction.user.id}) | ${interaction.guild?.name ?? 'DM'} | ${Date.now() - startTime}ms`
    );
  } catch (error) {
    logger.error(error, `[ModalSubmitHandler] Error running '${interaction.customId}'`);

    const reply = {
      content: 'Something went wrong running that modal submission.',
      flags: MessageFlags.Ephemeral
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