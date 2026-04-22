import BlacklistManager from "../managers/BlacklistManager";
import { BOT_OWNERS, type PrefixCommand, type PrefixCommandHelp, type PrefixCommandInfo } from "../types";
import { isSnowflake } from "../utilities/Snowflake";

export const info: PrefixCommandInfo = {
  name: 'blacklist',
  description: '(Owner only) Add or remove a user from the bot blacklist.',
  category: 'Owner',
  aliases: ['bl'],
  isOwnerOnly: true,
};

export const help: PrefixCommandHelp = {
  args: ['add|remove', 'userId'],
  usage: 'blacklist add 1234567890'
};

export const execute: PrefixCommand['execute'] = async (_client, message, ...args) => {
  const arg1 = args[0];
  const arg2 = args[1];

  if (!arg1 || !['add', 'remove'].includes(arg1)) {
    await message.reply('Your first argument must be either `add` or `remove`.');
    return;
  }

  if (!arg2 || !isSnowflake(arg2)) {
    await message.reply('Your second argument must be a valid user ID.');
    return;
  }

  if (arg2 === message.author.id) {
    await message.reply('You can\'t blacklist yourself silly!');
    return;
  }

  if (BOT_OWNERS.includes(arg2)) {
    await message.reply('You can\'t blacklist other bot owners!');
    return;
  }

  if (arg1 === 'add') {
    BlacklistManager.add(arg2)
    ? await message.reply(`Successfully added ${arg2} to the blacklist.`)
    : await message.reply('This user is already blacklisted.');
  } else {
    BlacklistManager.remove(arg2)
    ? await message.reply(`Successfully removed ${arg2} from the blacklist.`)
    : await message.reply('This user is not in the blacklist.');
  }
}