import { ApplicationCommandType, ContextMenuCommandBuilder, MessageFlags } from 'discord.js';
import type { ContextMenuCommand } from '../types';

export const data = new ContextMenuCommandBuilder()
  .setName('View Avatar')
  .setType(ApplicationCommandType.User);

export const cooldown = 3;

export const execute: ContextMenuCommand<ApplicationCommandType.User>['execute']
  = async (_client, interaction) => {
    const url = interaction.targetUser.displayAvatarURL({ size: 1024 });
    await interaction.reply({
      content: `${interaction.targetUser.username}'s avatar: ${url}`,
      flags: MessageFlags.Ephemeral,
    });
  };