import type { PrefixCommand, PrefixCommandHelp, PrefixCommandInfo } from "../types";

export const info: PrefixCommandInfo = {
  name: 'echo',
  description: 'Echo a message back as the bot.',
  category: 'Owner',
  aliases: ['msg', 'e'],
  cooldown: 3,
  isOwnerOnly: true
}

export const help: PrefixCommandHelp = {
  args: ['...string'],
  usage: 'echo This is a test message'
}

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