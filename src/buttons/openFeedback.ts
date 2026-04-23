import { LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import type { Button, ComponentInfo } from '../types';

export const info: ComponentInfo<Button> = {
  customId: 'openFeedback',
  cooldown: 3
};

export const execute: Button['execute'] = async (_client, interaction) => {
  const subjectInput = new TextInputBuilder()
    .setCustomId('subject')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(100)
    .setRequired(true);

  const bodyInput = new TextInputBuilder()
    .setCustomId('body')
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(2000)
    .setRequired(true);

  const modal = new ModalBuilder()
    .setCustomId('feedback')
    .setTitle('Send Feedback')
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Subject')
        .setTextInputComponent(subjectInput),
      new LabelBuilder()
        .setLabel('Details')
        .setTextInputComponent(bodyInput),
    );

  // showModal has to run within 3 seconds of the interaction firing, and
  // it can't come after reply/deferReply. The modal opening IS the ack.
  await interaction.showModal(modal);
};