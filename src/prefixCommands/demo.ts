import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
} from 'discord.js';
import type { PrefixCommand, PrefixCommandInfo } from '../types';
import { authorButton } from '../utilities/Builders';

export const info: PrefixCommandInfo = {
  name: 'demo',
  description: 'A demo command showcasing the various components of Discord.',
  category: 'Other',
  aliases: ['d', 'test', 'example'],
  cooldown: 3,
};

// Counter button starting at 0
const counterRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setCustomId('counter:0')
    .setLabel('Count: 0')
    .setStyle(ButtonStyle.Primary),
);

// Feedback opener
const feedbackRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setCustomId('openFeedback')
    .setLabel('Send Feedback')
    .setStyle(ButtonStyle.Secondary),
);

// Color picker string select
const colorRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
  new StringSelectMenuBuilder()
    .setCustomId('colorPicker')
    .setPlaceholder('Pick a color')
    .addOptions(
      { label: 'Red', value: 'red' },
      { label: 'Green', value: 'green' },
      { label: 'Blue', value: 'blue' },
    ),
);

// User picker
const userRow = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
  new UserSelectMenuBuilder()
    .setCustomId('pickUser')
    .setPlaceholder('Pick a user'),
);

export const execute: PrefixCommand['execute'] = async (_client, message, ..._args) => {
  // Delete button (author-only via the handler)
  const deleteRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    authorButton(message.author.id, 'delete', { label: 'Delete', style: ButtonStyle.Danger })
  );

  await message.reply({
    content: 'Demo components:',
    components: [deleteRow, counterRow, feedbackRow, colorRow, userRow]
  });
}