import { MessageFlags } from 'discord.js';
import type { ComponentInfo, ModalSubmit } from '../types';
import logger from '../utilities/Logger';

export const info: ComponentInfo = {
  customId: 'feedback'
};

export const execute: ModalSubmit['execute'] = async (_client, interaction) => {
  const subject = interaction.fields.getTextInputValue('subject');
  const body = interaction.fields.getTextInputValue('body');

  // In a real bot this would hit a webhook, write to a DB, or open a
  // ticket. For the skeleton we log it and ack the user.
  logger.info(`[Feedback] ${interaction.user.tag} (${interaction.user.id}): ${subject} | ${body}`);

  await interaction.reply({
    content: 'Thanks! Your feedback has been recorded.',
    flags: MessageFlags.Ephemeral,
  });
};