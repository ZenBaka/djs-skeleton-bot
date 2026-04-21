import type { PrefixCommand } from "../types";

export const name = 'echo';
export const description = 'Echo a message back as the bot.';
export const aliases = ['msg', 'e'];
export const cooldown = 3;
export const isOwnerOnly = true; // prevent mass-mention abuse by default

export const execute: PrefixCommand['execute'] = async (_client, message, ...args) => {
  if (args.length === 0) {
    await message.reply('No message to echo!');
    return;
  }

  if (!message.channel.isSendable()) {
    await message.reply("I can't send messages in this channel.");
    return;
  }

  const content = args.join(' ');
  await message.channel.send({
    content,
    // Strip mentions by default so an owner typo can't ping everyone.
    // Remove this line if you want mentions to pass through.
    allowedMentions: { parse: [] },
  });
};