import type { Button, ComponentInfo } from '../types';
import { resolveUserId } from '../utilities/Validators';

export const info: ComponentInfo<Button> = {
  customId: 'delete',
  isAuthorOnly: true,
  resolveOwner: resolveUserId
};

export const execute: Button['execute'] = async (_client, interaction) => {
  // isAuthorOnly above makes the handler reject anyone who wasn't the
  // original interaction owner before we ever get here.
  await interaction.message.delete();
};