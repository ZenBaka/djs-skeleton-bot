# Skeleton Bot
## Index
1. [About](#about)
2. [Setup](#setup)
3. [Registering Events](#registering-events)
4. [Adding New Modules](#adding-new-modules)

### About

This is a project leveraging the Bun[^1] runtime. This is just a basic skeleton bot or scaffolding to use for creating Discord bots off of. It's simplistic in nature and designed to be cloned and easy to set up for any sort of developer. It uses the Discord.js[^2] library and leverages the `discord-hybrid-sharding`[^3] NPM package for bot sharding. The bot supports both prefix and slash commands right out the gate and both are easy to configure and set up.

Sharding via `discord-hybrid-sharding` is wired in by default, but is only required once your bot is in roughly 2000+ guilds. For small bots it runs as a single cluster with a single shard and adds no meaningful overhead. You can ignore it until you need it.

### Setup

You have to install [Bun](https://bun.com) in order to run and setup this project. Once you've done that you can safely fork your own copy of the repository for cloning.

To install dependencies run:

```bash
bun install
```

> **Note:** This skeleton requests the `MessageContent` privileged intent because it supports prefix commands. You must enable it in the [Discord Developer Portal](https://discord.com/developers/applications) under your application's **Bot** tab, or remove `GatewayIntentBits.MessageContent` from `src/structures/BotClient.ts` if you only plan to use slash commands.

You will have to manually configure your own `.env` file in the root directory. You can use the `.env.example` as a template for what to fill the fields in with. Once you've done that you can start the bot with:

```bash
bun start
```

In order to get slash commands to work you have to first register them as either guild commands or global commands. The project provides useful scripts to run:

```bash
# Global commands
bun run register
```

```bash
# Guild commands
bun run register:guild
```

> **Note:** You do not have to run this every time you start up the bot. You only have to run it when you add a new slash command or modify an existing command's `data` object (the `SlashCommandBuilder`)

### Registering Events

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

### Adding New Modules

Configuring and adding new modules is pretty straightforward. You can follow the example commands and components already provided, but below is a cheat sheet or guide on how to properly configure new entries. You just drop in new files in their respective directories and the individual handlers will do the rest of the heavy-lifting.

**Prefix Commands** (`src/prefixCommands/`)
| Property | Type | Required | Description |
| :--------------: | :----------: | :------: | :-----------------: |
| `name` | `string` | true | The name of the prefix command. |
| `description` | `string` | true | The description of the command (for help command). |
| `execute(client, message, ...args)` | `function` | true | The executable method of the command. This is what runs when someone types the command.
| `aliases` | `string[]` | false | (Optional) Additional aliases that the command can be used as. |
| `cooldown` | `number` | false | (Optional) A cooldown to attach to the command (in seconds) |
| `isOwnerOnly` | `boolean` | false | (Optional) A boolean to represent whether the command is owner only or not. |

*src/prefixCommands/ping.ts*

```ts
import type { PrefixCommand } from '../types';

export const name = 'ping';
export const description = 'Pong!';
export const aliases = ['pong', 'p', 'latency'];
export const cooldown = 3;

export const execute: PrefixCommand['execute'] = async (_client, message, ..._args) => {
  await message.reply('Pong!');
};
```

**Slash Commands** (`src/slashCommands/`)
| Property | Type | Required | Description |
| :--------------: | :----------: | :------: | :----------------------: |
| `data` | `SlashCommandBuilder` or `SlashCommandOptionsOnlyBuilder` or `SlashCommandSubcommandsOnlyBuilder` | true | The builder of the slash command. |
| `execute(client, interaction)` | `function` | true | A function that passes the `BotClient` and a `ChatInputCommandInteraction`. This is called when a user tries to use the command. |
| `cooldown` | `number` | false | A cooldown, in seconds, to apply to the command. |
| `autocomplete(client, interaction)` | `function` | false | A function passes the `BotClient` and an `AutocompleteInteraction`. This is called when a user attempts to use an autocomplete for an option on a slash command. |

*src/slashCommands/ping.ts*

```ts
import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../types';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Pong!');

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

[^1]: [bun v1.3.13](https://bun.com)
[^2]: [discord.js v14.26.3](https://github.com/discordjs/discord.js)
[^3]: [discord-hybrid-sharding v3.0.1](https://github.com/meister03/discord-hybrid-sharding)