import { ApplicationCommandType, ContextMenuCommandBuilder, MessageFlags } from 'discord.js';
import type { ContextMenuCommand } from '../types';

export const data = new ContextMenuCommandBuilder()
  .setName('View Raw')
  .setType(ApplicationCommandType.Message);

export const cooldown = 3;

export const execute: ContextMenuCommand<ApplicationCommandType.Message>['execute']
  = async (_client, interaction) => {
    const content = interaction.targetMessage.content;
    if (!content) {
      await interaction.reply({
        content: 'That message has no text content (maybe it is just an embed or attachment).',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Escape backticks so they can't break out of the code block.
    const safe = content.replace(/`/g, '\u200b`');
    const body = '```\n' + safe + '\n```';

    // Messages can be up to 4000 chars; content adds overhead for the code
    // fence. Truncate defensively for long messages.
    const truncated = body.length > 1900 ? body.slice(0, 1900) + '\n...(truncated)```' : body;

    await interaction.reply({
      content: truncated,
      flags: MessageFlags.Ephemeral,
    });
  };