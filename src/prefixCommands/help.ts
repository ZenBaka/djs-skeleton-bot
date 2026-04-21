import { EmbedBuilder } from "discord.js";
import type { CommandCategory, PrefixCommand, PrefixCommandHelp, PrefixCommandInfo } from "../types";
import StringBuilder from "../utilities/StringBuilder";

export const info: PrefixCommandInfo = {
  name: 'help',
  description: 'A useful help command to get various information about other commands',
  category: 'Information',
  aliases: ['h', 'cmds', 'commands']
};

export const help: PrefixCommandHelp = {
  args: ['commandName'],
  usage: 'help ping'
};

export const execute: PrefixCommand['execute'] = async (client, message, ...args) => {
  if (args.length > 0) {
    const commandName = args[0]!;

    const command = client.prefixCommands.get(commandName);

    if (!command) {
      await message.reply(`The command you provided \`${commandName}\` does not exist.`);
      return;
    }

    const prefix = Bun.env.BOT_PREFIX || 'sb?';
    let usage = `${prefix}${command.info.name}`;
    let a = '';
    let aliases = '';
    const info = command.info;
    const help = command.help;

    if (info.aliases) aliases = info.aliases.join(', ');

    if (help) {
      if (help.args) a = help.args.join(', ');
      if (help.usage) usage = `${prefix}${help.usage}`
    }

    const sb = new StringBuilder()
      .appendLine(`**${info.name}**`)
      .appendLine(info.description)
      .appendLine()
      .appendLine(`Usage: \`${usage}\``)
      .appendLineIf(a.length > 0, `Args: \`${a}\``)
      .appendLineIf(aliases.length > 0, `Aliases: \`${aliases}\``)
      .appendLineIf(command.cooldown, `Cooldown: ${command.cooldown}s`)
      .trimEnd();

    const embed = new EmbedBuilder()
      .setDescription(sb.toString())
      .setFooter({ text: 'Powered by: Skeleton Bot', iconURL: 'https://avatars.githubusercontent.com/u/85319327?v=4' });

    await message.reply({ embeds: [embed] });
  } else {
    const prefix = Bun.env.BOT_PREFIX || 'sb?';

    // The collection stores each command under its name AND under every
    // alias, so .values() yields the same object multiple times. A Set
    // deduplicates by identity since all aliases point to the same object.
    const unique = new Set(client.prefixCommands.values());

    // Group by category. Empty categories simply don't appear in the map.
    const byCategory = Map.groupBy(unique, cmd => cmd.info.category);

    // Fixed display order. User-facing categories first, admin/owner last.
    const displayOrder: CommandCategory[] = [
      'Information',
      'Roleplay',
      'Other',
      'Moderator',
      'Administrator',
      'Owner',
    ];

    const sb = new StringBuilder();

    for (const category of displayOrder) {
      const cmds = byCategory.get(category);
      if (!cmds || cmds.length === 0) continue;

      sb.appendLine(`**${category} Commands**`);
      for (const cmd of cmds) {
        sb.appendLine(`\`${prefix}${cmd.info.name}\` - ${cmd.info.description}`);
      }
      sb.appendLine();
    }

    if (sb.isEmpty) {
      sb.append('No commands to show. (Which is weird because the help command should at least show!)');
    }

    const embed = new EmbedBuilder()
      .setTitle('Prefix Command Overview')
      .setDescription(sb.trimEnd().toString())
      .setFooter({ text: 'Powered by: Skeleton Bot', iconURL: 'https://avatars.githubusercontent.com/u/85319327?v=4' });

    await message.reply({ embeds: [embed] });
  }
}