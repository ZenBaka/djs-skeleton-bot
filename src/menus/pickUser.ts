import { MessageFlags } from 'discord.js';
import type { SelectMenu } from '../types';

export const customId = 'pickUser';

export const execute: SelectMenu['execute'] = async (_client, interaction) => {
  // User selects give you interaction.users as a resolved Collection of
  // the selected users, alongside the raw IDs in .values.
  if (!interaction.isUserSelectMenu()) return;

  const user = interaction.users.first();
  if (!user) {
    await interaction.reply({
      content: 'No user selected.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.reply({
    content: `You picked: ${user.tag} (\`${user.id}\`)`,
    flags: MessageFlags.Ephemeral,
  });
};