import type { Button } from '../types';

export const customId = 'delete';
export const isAuthorOnly = true;

export const execute: Button['execute'] = async (_client, interaction) => {
  // isAuthorOnly above makes the handler reject anyone who wasn't the
  // original interaction owner before we ever get here.
  await interaction.message.delete();
};