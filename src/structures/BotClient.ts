import { Client, Collection, GatewayIntentBits, Options, type ClientOptions } from "discord.js";
import type { Button, ContextMenuCommand, ModalSubmit, PrefixCommand, SelectMenu, SlashCommand } from "../types";

export default class BotClient extends Client {
  public readonly slashCommands: Collection<string, SlashCommand> = new Collection();
  public readonly contextMenus: Collection<string, ContextMenuCommand> = new Collection();
  public readonly prefixCommands: Collection<string, PrefixCommand> = new Collection();
  public readonly buttons: Collection<string, Button> = new Collection();
  public readonly menus: Collection<string, SelectMenu> = new Collection();
  public readonly modals: Collection<string, ModalSubmit> = new Collection();

  /**
   * @param options - Optional ClientOptions overrides. Any field passed here
   * fully replaces the matching default (no merging). Pass the full
   * object that you want for `intents`, `makeCache`, etc.
   */
  constructor(options?: Partial<ClientOptions>) {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages
      ],

      // makeCache controls how much memory discord.js uses per manager.
      // The defaults cache almost everything with no bounds or upper limits.
      // Which can add up fast on a bot in many servers. These limits are
      // just basic starting points. I recommend increasing them if you
      // build features that read from the affected cache.
      makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,

        // Keep the last 100 messages per channel. Enough to start off with
        // and implement small features. If you do message-history lookups
        // increase the size to be higher.
        MessageManager: 100,

        // Presences are the single biggest chunk of cached memory on big
        // bots. Disable unless you actively read them (which requires the
        // GuildPresences privileged intent).
        PresenceManager: 0,

        // Features this bot doesn't use. Remove `: 0` (or set a number)
        // on any line when you add a feature that needs a cache.
        GuildBanManager: 0,
        GuildInviteManager: 0,
        GuildScheduledEventManager: 0,
        StageInstanceManager: 0,
        ThreadMemberManager: 0,
        ReactionManager: 0,

        // The member cache is a bit silly. Several discord.js paths assume
        // the bot's own GuildMember is cached. Cap the size, but pin the
        // bot's own member so it's never evicted.
        GuildMemberManager: {
          maxSize: 200,
          keepOverLimit: (member) => member.id === member.client.user.id,
        },

        // Cap user and thread caches so a long-running bot doesn't grow
        // without any bounds or upper limits when it encounters new users
        // and threads.
        UserManager: 1000,
        ThreadManager: 50,
      }),

      // Sweepers periodically remove old entries from the caches above.
      // `makeCache` limits the hard capped size; sweepers determine how long
      // entries are supposed to live.
      sweepers: {
        ...Options.DefaultSweeperSettings,
        messages: {
          interval: 3600, // Run every hour
          lifetime: 1800 // Drop messages older than 30 minutes
        },
        users: {
          interval: 3600,
          // Keep the bot itself; sweep everyone else who isn't cached for
          // another reason.
          filter: () => (user) => user.id !== user.client.user?.id,
        },
      },
      ...options,
    });
  }
}