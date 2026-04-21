import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../types";

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check that the bot is alive and measure latency');

export const cooldown = 3;

export const execute: SlashCommand['execute'] = async (client, interaction) => {
  const sent = await interaction.reply({ content: 'Pinging...', withResponse: true });
  const roundTrip = sent.resource!.message!.createdTimestamp - interaction.createdTimestamp;
  const gateway = Math.round(client.ws.ping);

  await interaction.editReply(
    `Pong!\n` +
    `Roundtrip: \`${roundTrip}ms\`\n` +
    `Gateway: \`${gateway}ms\``
  );
};