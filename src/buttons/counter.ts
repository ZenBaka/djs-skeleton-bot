import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { Button } from '../types';

export const customId = 'counter';

export const execute: Button['execute'] = async (_client, interaction, countStr) => {
  // The handler splits the incoming customId on ':'. 'counter' matched the
  // base id for this file, and everything after arrives as rest args.
  // If the button was 'counter:5', countStr is the string '5'.
  const current = Number.parseInt(countStr ?? '0', 10) || 0;
  const next = current + 1;

  const button = new ButtonBuilder()
    .setCustomId(`counter:${next}`)
    .setLabel(`Count: ${next}`)
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  await interaction.update({ components: [row] });
};