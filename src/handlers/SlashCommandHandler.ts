import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";
import { Glob } from "bun";
import { join } from "path";
import type BotClient from "../structures/BotClient";
import {  type SlashCommand } from "../types";
import logger from "../utilities/Logger";
import CooldownManager from "../managers/CooldownManager";
import BlacklistManager from "../managers/BlacklistManager";
import { isSlashCommand } from "../utilities/Validators";

const COMMANDS_DIR = join(import.meta.dir, '..', 'slashCommands');

export async function loadCommands(client: BotClient): Promise<void> {
  const glob = new Glob('**/*.{ts,js}');
  let loaded = 0;
  let skipped = 0;
  const files: string[] = [];

  for await (const file of glob.scan({ cwd: COMMANDS_DIR, absolute: true })) {
    if (file.endsWith('.d.ts')) continue;
    files.push(file);
  }
  files.sort();

  for (const file of files) {
    try {
      const mod = await import(file);

      if (!isSlashCommand(mod)) {
        logger.warn(`[SlashCommandHandler] Skipped ${file}, invalid types`);
        skipped++;
        continue;
      }

      const command: SlashCommand = {
        data: mod.data,
        category: mod.category,
        execute: mod.execute,
        cooldown: mod.cooldown,
        autocomplete: mod.autocomplete,
      };

      if (client.slashCommands.has(command.data.name)) {
        logger.warn(`[SlashCommandHandler] Duplicate command name '${command.data.name}' in ${file}`);
        skipped++;
        continue;
      }

      client.slashCommands.set(command.data.name, command);
      loaded++;
    } catch (error) {
      logger.error(error, `[SlashCommandHandler] Failed to load file ${file}:`);
      skipped++;
    }
  }

  logger.info(`[SlashCommandHandler] Loaded ${loaded} command${loaded === 1 ? '' : 's'}${skipped > 0 ? ` (${skipped} skipped)` : ''}`);
}

export async function handleCommand(client: BotClient, interaction: ChatInputCommandInteraction): Promise<void> {
  const command = client.slashCommands.get(interaction.commandName);
  if (!command) {
    await interaction.reply({
      content: 'This command is outdated or disabled.',
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

  const cooldownKey = CooldownManager.key(interaction.commandName, interaction.user.id);

  if (command.cooldown) {
    const expiresAt = CooldownManager.check(cooldownKey);
    if (expiresAt !== null) {
      await interaction.reply({
        content: `You can use this command again <t:${expiresAt}:R>.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }
  }

  const startTime = Date.now();

  try {
    await command.execute(client, interaction);
    if (command.cooldown) {
      CooldownManager.start(cooldownKey, command.cooldown);
    }

    logger.info(
      `/${interaction.commandName} | ${interaction.user.username} (${interaction.user.id}) | ${interaction.guild?.name ?? 'DM'} | ${Date.now() - startTime}ms`,
    );
  } catch (error) {
    logger.error(error, `[SlashCommandHandler] Error running /${interaction.commandName}:`);

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

export async function handleAutocomplete(client: BotClient, interaction: AutocompleteInteraction): Promise<void> {
  const command = client.slashCommands.get(interaction.commandName);
  if (!command?.autocomplete) return;

  try {
    await command.autocomplete(client, interaction);
  } catch (error) {
    logger.error(error, `[SlashCommandHandler] Autocomplete failed for /${interaction.commandName}:`);
  }
}