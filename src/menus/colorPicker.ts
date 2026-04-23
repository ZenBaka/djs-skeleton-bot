import { MessageFlags } from 'discord.js';
import type { ComponentInfo, SelectMenu } from '../types';

export const info: ComponentInfo<SelectMenu> = {
  customId: 'colorPicker'
};

export const execute: SelectMenu['execute'] = async (_client, interaction) => {
  // AnySelectMenuInteraction is the union of every select type. Narrow
  // here so TS knows .values holds the StringSelect values you set up.
  if (!interaction.isStringSelectMenu()) return;

  const selected = interaction.values[0];
  if (!selected) {
    await interaction.reply({
      content: 'No color selected.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.reply({
    content: `You picked: **${selected}**`,
    flags: MessageFlags.Ephemeral,
  });
};