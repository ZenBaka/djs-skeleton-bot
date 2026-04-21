import { SlashCommandBuilder } from "discord.js";
import type { CommandCategory, SlashCommand } from "../types";
import StringBuilder from "../utilities/StringBuilder";
import { EmbedBuilder } from "@discordjs/builders";
import { ApplicationCommandOptionType } from 'discord.js';

function formatOption(opt: { name: string; required?: boolean }): string {
  return opt.required ? `<${opt.name}>` : `[${opt.name}]`;
}

function buildUsage(name: string, json: ReturnType<SlashCommandBuilder['toJSON']>): string {
  const options = json.options ?? [];

  // Subcommand-only command: show "name <subcommand>" since the actual
  // args depend on which subcommand the user picks.
  const hasSubcommands = options.some(
    o => o.type === ApplicationCommandOptionType.Subcommand
      || o.type === ApplicationCommandOptionType.SubcommandGroup
  );

  if (hasSubcommands) {
    return `/${name} <subcommand>`;
  }

  const tokens = options.map(formatOption);
  return tokens.length > 0 ? `/${name} ${tokens.join(' ')}` : `/${name}`;
}

function buildArgList(json: ReturnType<SlashCommandBuilder['toJSON']>): string[] {
  const options = json.options ?? [];

  const hasSubcommands = options.some(
    o => o.type === ApplicationCommandOptionType.Subcommand
      || o.type === ApplicationCommandOptionType.SubcommandGroup
  );
  if (hasSubcommands) return [];

  return options.map(opt => `${formatOption(opt)} - ${opt.description}`);
}

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Dynamic help command for the slash commands.')
  .addStringOption(o =>
    o.setName('command')
      .setDescription('The command to lookup')
      .setRequired(false)
      .setAutocomplete(true)
  );

export const category: CommandCategory = 'Information';

export const autocomplete: SlashCommand['autocomplete'] = async (client, interaction) => {
  const focused = interaction.options.getFocused(true);

  if (focused.name !== 'command') {
    await interaction.respond([]);
    return;
  }

  const query = focused.value.toLowerCase();
  const commands = Array.from(client.slashCommands.values());

  const matches = commands
    .filter(cmd => cmd.data.name.toLowerCase().includes(query))
    .slice(0, 25)
    .map(cmd => ({
      name: `${cmd.data.name} - ${cmd.data.description}`,
      value: cmd.data.name
    }));

  await interaction.respond(matches);
};

export const cooldown = 3;

export const execute: SlashCommand['execute'] = async (client, interaction) => {
  const choice = interaction.options.getString('command', false);

  if (choice !== null) {
    const command = client.slashCommands.get(choice);

    if (!command) {
      await interaction.reply(`The command you provided \`${choice}\` does not exist.`);
      return;
    }

    const json = command.data.toJSON();
    const usage = buildUsage(command.data.name, json);
    const argList = buildArgList(json);

    const sb = new StringBuilder()
      .appendLine(`**${command.data.name}**`)
      .appendLine(command.data.description)
      .appendLine()
      .appendLine(`Usage: \`${usage}\``);

    if (argList.length > 0) {
      sb.appendLine('Args:');
      for (const line of argList) {
        sb.appendLine(`• \`${line}\``);
      }
    }

    sb.appendLineIf(command.cooldown, `Cooldown: ${command.cooldown}s`)
      .trimEnd();

    const embed = new EmbedBuilder()
      .setDescription(sb.toString())
      .setFooter({ text: 'Powered by: Skeleton Bot', iconURL: 'https://avatars.githubusercontent.com/u/85319327?v=4' });

    await interaction.reply({ embeds: [embed] });
  } else {
    const byCategory = Map.groupBy(client.slashCommands.values(), cmd => cmd.category);

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
        sb.appendLine(`\`/${cmd.data.name}\` - ${cmd.data.description}`);
      }
      sb.appendLine();
    }

    if (sb.isEmpty) {
      sb.append('No commands to show. (Which is weird because the help command should at least show!)');
    }

    const embed = new EmbedBuilder()
      .setTitle('Slash Command Overview')
      .setDescription(sb.trimEnd().toString())
      .setFooter({ text: 'Powered by: Skeleton Bot', iconURL: 'https://avatars.githubusercontent.com/u/85319327?v=4' });

    await interaction.reply({ embeds: [embed] });
  }
}