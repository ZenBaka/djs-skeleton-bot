import type { PrefixCommand } from "../types";

export const name = 'ping';
export const description = 'Pong!';
export const aliases = ['pong', 'p', 'latency'];
export const cooldown = 3;

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