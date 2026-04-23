import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
} from 'discord.js';
import type { CommandCategory, SlashCommand } from '../types';
import { authorButton } from '../utilities/Builders';

export const data = new SlashCommandBuilder()
  .setName('demo')
  .setDescription('A demo command to showcase Discord components.');

export const cooldown = 3;

export const category: CommandCategory = 'Other';

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

export const execute: SlashCommand['execute'] = async (_client, interaction) => {
  // Delete button (author-only via the handler)
  const deleteRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    // Builder function that builds a new button with the customId: customId:userId
    authorButton(interaction.user.id, 'delete', { style: ButtonStyle.Danger, label: 'Delete' })
  );

  await interaction.reply({
    content: 'Demo components:',
    components: [deleteRow, counterRow, feedbackRow, colorRow, userRow]
  });
}