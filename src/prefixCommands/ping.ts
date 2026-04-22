import type { PrefixCommand, PrefixCommandInfo } from "../types";

export const info: PrefixCommandInfo = {
  name: 'ping',
  description: 'Get latency about the bot.',
  category: 'Information',
  aliases: ['p', 'latency', 'gateway'],
  cooldown: 3,
};

export const execute: PrefixCommand['execute'] = async (client, message, ..._args) => {
  const sent = await message.reply('Pinging...');
  const roundTrip = sent.createdTimestamp - message.createdTimestamp;
  const gateway = Math.round(client.ws.ping);

  await sent.edit(
    `Pong!\n` +
    `Roundtrip: \`${roundTrip}ms\`\n` +
    `Gateway: \`${gateway}ms\``
  );
};