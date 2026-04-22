# Skeleton Bot
## Index
1. [About](#about)
2. [Setup](#setup)
3. [Registering Events](#registering-events)
4. [Adding New Modules](#adding-new-modules)
5. [Documentation](#documentation)

## About

This is a project leveraging the Bun[^1] runtime. This is just a basic skeleton bot or scaffolding to use for creating Discord bots off of. It's simplistic in nature and designed to be cloned and easy to set up for any sort of developer. It uses the Discord.js[^2] library and leverages the `discord-hybrid-sharding`[^3] NPM package for bot sharding. The bot supports both prefix and slash commands right out the gate and both are easy to configure and set up.

Sharding via `discord-hybrid-sharding` is wired in by default, but is only required once your bot is in roughly 2000+ guilds. For small bots it runs as a single cluster with a single shard and adds no meaningful overhead. You can ignore it until you need it.

## Setup

You have to install [Bun](https://bun.com) in order to run and setup this project. Once you've done that you can safely fork your own copy of the repository for cloning.

**macOS/Linux/WSL:**
```bash
curl -fsSl https://bun.sh/install | bash
```

**Windows (Powershell):**
```bash
powershell -c "irm bun.sh/install.ps1 | iex"
```

**Alternative (npm):**
```bash
npm install -g bun
```

Verify the installation by running `bun --version`.

To install dependencies run:

```bash
bun install
```

> **Note:** This skeleton requests the `MessageContent` privileged intent because it supports prefix commands. You must enable it in the [Discord Developer Portal](https://discord.com/developers/applications) under your application's **Bot** tab, or remove `GatewayIntentBits.MessageContent` from `src/structures/BotClient.ts` if you only plan to use slash commands.

You will have to manually configure your own `.env` file in the root directory. You can use the `.env.example` as a template for what to fill the fields in with. Once you've done that you can start the bot with:

```bash
bun start
```
> **Note:** This starts the bot without sharding. If you would like to shard run `bun start:shard`.

Additionally, you can run the bot in development mode to get full log outputs to console:

```bash
bun start:dev
bun start:dev:shard
```

> **Note:** Log outputs are automatically streamed to a log file in `logs/`, which is the 'point-of-truth' for looking up anything in production mode.

In order to get slash commands to work you have to first register them as either guild commands or global commands. The project provides useful scripts to run:

```bash
# Global commands
bun run register
```

```bash
# Guild commands
bun run register:guild
```

> **Note:** You do not have to run this every time you start up the bot. You only have to run it when you add a new slash command or modify an existing command's `data` object (the `SlashCommandBuilder`). This also loads and registers context menu commands in the same batch as well.

## Registering Events

Registering client events is easy and uses discordjs' in-built interfaces to identify parameters. You can follow the `ready.ts` as an example:

```ts
import { Events } from 'discord.js';
import type { Event } from '../types';
import logger from '../utilities/Logger';

export const name = Events.ClientReady;
export const once = true;

// export const execute: Event<'clientReady'>['execute']...
export const execute: Event<Events.ClientReady>['execute'] = async (_client, readyClient) => {
  logger.info(`[Bot] Logged in as ${readyClient.user.tag}`);
};
```

> **Note:** Args are passed at runtime as `ClientEvents[name]` so as long as you provide the name of the event via the Events enum class or a string literal (it'll pass either way) it will supplement the parameters for you.

## Adding New Modules

Configuring and adding new modules is pretty straightforward. You can follow the example commands and components already provided, but below is a cheat sheet or guide on how to properly configure new entries. You just drop in new files in their respective directories and the individual handlers will do the rest of the heavy-lifting.

**Prefix Commands** (`src/prefixCommands/`)
| Property | Type | Required | Description |
| :--------------: | :----------: | :------: | :-----------------: |
| `info` | [`PrefixCommandInfo`](#prefixcommandinfo) | true | An object interfaced with `PrefixCommandInfo`. Only the `name`, `description` and `category` fields need populated. the others are optional. |
| `execute(client, message, ...args)` | `function` | true | A function that passes a `BotClient`, `Message` and optional `string[]` args |
| `help` | [`PrefixCommandHelp`](#prefixcommandhelp) | false | (Optional) 

*src/prefixCommands/ping.ts*

```ts
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
```

**Slash Commands** (`src/slashCommands/`)
| Property | Type | Required | Description |
| :--------------: | :----------: | :------: | :----------------------: |
| `data` | `SlashCommandBuilder` or `SlashCommandOptionsOnlyBuilder` or `SlashCommandSubcommandsOnlyBuilder` | true | The builder of the slash command. |
| `category` | [`CommandCategory`](#commandcategory) | true | A string matching the typeof `CommandCategory`. This tells the help command what category to group the command under. |
| `execute(client, interaction)` | `function` | true | A function that passes the `BotClient` and a `ChatInputCommandInteraction`. This is called when a user tries to use the command. |
| `cooldown` | `number` | false | A cooldown, in seconds, to apply to the command. |
| `autocomplete(client, interaction)` | `function` | false | A function passes the `BotClient` and an `AutocompleteInteraction`. This is called when a user attempts to use an autocomplete for an option on a slash command. |

*src/slashCommands/ping.ts*

```ts
import { SlashCommandBuilder } from "discord.js";
import type { CommandCategory, SlashCommand } from "../types";

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check that the bot is alive and measure latency');

export const category: CommandCategory = 'Information';

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
```

**Buttons:** (`src/buttons/`)

| Property | Type | Required | Description |
| :--------------: | :----------: | :------: | :-----------------: |
| `info` | [`ComponentInfo`](#componentinfo) | true | An object shaped with the `ComponentInfo` interface. Only the `customId` property needs populated. |
| `execute(client, interaction)` | `function` | true | Passes a `BotClient` and a `ButtonInteraction`. This is called when a user clicks the button. |

*src/buttons/counter.ts*

```ts
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { Button, ComponentInfo } from '../types';

export const info: ComponentInfo = {
  customId: 'counter',
  cooldown: 1,
};

export const execute: Button['execute'] = async (_client, interaction, countStr) => {
  // The handler splits the incoming customId on ':'. 'counter' matched the
  // base id for this file, and everything after arrives as rest args.
  // If the button was 'counter:5', countStr is the string '5'.
  const current = Number.parseInt(countStr ?? '0', 10) || 0;
  const next = current + 1;

  const button = new ButtonBuilder()
    .setCustomId(`counter:${next}`)
    .setLabel(`Count: ${next}`)
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  await interaction.update({ components: [row] });
};
```

**Select Menus:** (`src/menus/`)

| Property | Type | Required | Description |
| :--------------: | :----------: | :------: | :----------------------: |
| `info` | [`ComponentInfo`](#componentinfo) | true | An object shaped with the `ComponentInfo` interface. Only the `customId` property needs populated. |
| `execute(client, interaction)` | `function` | true | Passes a `BotClient` and an `AnySelectMenuInteraction`. This is called when a user selects values in a select menu. |

*src/menus/colorPicker.ts*

```ts
import { MessageFlags } from 'discord.js';
import type { ComponentInfo, SelectMenu } from '../types';

export const info: ComponentInfo = {
  customId: 'colorPicker'
};

export const execute: SelectMenu['execute'] = async (_client, interaction) => {
  // AnySelectMenuInteraction is the union of every select type. Narrow
  // here so TS knows .values holds the StringSelect values you set up.
  if (!interaction.isStringSelectMenu()) return;

  const selected = interaction.values[0];
  if (!selected) {
    await interaction.reply({
      content: 'No color selected.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.reply({
    content: `You picked: **${selected}**`,
    flags: MessageFlags.Ephemeral,
  });
};
```

**Modal Submissions:** (`src/modals/`)

| Property | Type | Required | Description |
| :--------------: | :----------: | :------: | :----------------------: |
| `info` | [`ComponentInfo`](#componentinfo) | true | An object shaped with the `ComponentInfo` interface. Only the `customId` property needs populated. |
| `execute(client, interaction)` | `function` | true | Passes a `BotClient` and a `ModalSubmitInteraction`. This is called when the user submits a modal form. |

*src/modals/feedback.ts*

```ts
import { MessageFlags } from 'discord.js';
import type { ComponentInfo, ModalSubmit } from '../types';
import logger from '../utilities/Logger';

export const info: ComponentInfo = {
  customId: 'feedback'
};

export const execute: ModalSubmit['execute'] = async (_client, interaction) => {
  const subject = interaction.fields.getTextInputValue('subject');
  const body = interaction.fields.getTextInputValue('body');

  // In a real bot this would hit a webhook, write to a DB, or open a
  // ticket. For the skeleton we log it and ack the user.
  logger.info(`[Feedback] ${interaction.user.tag} (${interaction.user.id}): ${subject} | ${body}`);

  await interaction.reply({
    content: 'Thanks! Your feedback has been recorded.',
    flags: MessageFlags.Ephemeral,
  });
};
```

## Documentation

Refer to this section to see how the various types work on the bot.

### PrefixCommandInfo
| Property | Type | Required | Description |
| :--------------: | :----------: | :------: | :----------------------: |
| `name` | `string` | true | The name of the command. Character case matters. |
| `description` | `string` | true | The description of the command. |
| `category` | [`CommandCategory`](#commandcategory) | true | A string matching the typeof `CommandCategory`. This tells the help command what category to group the command under. |
| `aliases` | `string[]` | false | (Optional) An array of `string` aliases that the bot will recognize this command as aside from it's name. |
| `cooldown` | `number` | false | (Optional) A `number`, in seconds, on which to apply a cooldown to the command. Per user, per shard. |
| `isOwnerOnly` | `boolean` | false | (Optional) A `boolean` stating whether the command is for bot owners only or not. |
| `allowedChannels` | `string[]` | false | (Optional) An array of `string` channel IDs. If this field is provided the bot will only execute the command in the provided channels. |
| `botPermissions` | [`PermissionFlagName[]`](#permissionflagname) | false | (Optional) an array of `PermissionFlagName`. The bot will check it's own permissions in the channel it's trying to send messages in and see if any are missing. |
| `userPermissions` | [`PermissionFlagName[]`](#permissionflagname) | false | (Optional) An array of `PermissionFlagName`. The bot will check the user's permissions in the channel to see if they can run the command. |

### PrefixCommandHelp
| Property | Type | Required | Description |
| :--------------: | :----------: | :------: | :----------------------: |
| `args` | `string[]` | false | (Optional) A `string` array of arguments that get passed to the command. |
| `usage` | `string` | false | (Optional) Describes how to use the command with an example. |
> **Note:** Even though both fields are optional you must supply at least one. A blank or null `PrefixCommandHelp` object will get skipped during startup.

### ComponentInfo
| Property | Type | Required | Description |
| :--------------: | :----------: | :------: | :----------------------: |
| `customId` | `string` | true | The unique identifier for the interaction component |
| `cooldown` | `number` | false | (Optional) A cooldown, in seconds, on which to apply to this component. |
| `isAuthorOnly` | `boolean` | false | (Optional) Whether or not the interaction can only be used by the person who authored it. |

### CommandCategory
| Category |
| ---------- |
| `'Administrator'` |
| `'Information'` |
| `'Moderator'` |
| `'Other'` |
| `'Owner'` |
| `'Roleplay'` |

### PermissionFlagName
> **Note:** The permission flag name is a `keyof typeof PermissionFlagsBits`. You'll want to check those out [here](https://discord.js.org/docs/packages/discord.js/14.18.0/PermissionFlagsBits:Variable) for a list of key names. Typescript automatically interprets the fields automatically.

[^1]: [bun v1.3.13](https://bun.com)
[^2]: [discord.js v14.26.3](https://github.com/discordjs/discord.js)
[^3]: [discord-hybrid-sharding v3.0.1](https://github.com/meister03/discord-hybrid-sharding)