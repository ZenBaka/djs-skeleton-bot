import type {
  AnySelectMenuInteraction,
  ApplicationCommandType,
  AutocompleteInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  ClientEvents,
  ContextMenuCommandBuilder,
  Message,
  MessageContextMenuCommandInteraction,
  ModalSubmitInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  UserContextMenuCommandInteraction,
} from 'discord.js';
import type BotClient from './structures/BotClient';

export const BOT_OWNERS: readonly string[] = (Bun.env.BOT_OWNERS ?? '')
  .split(',')
  .map(id => id.trim())
  .filter(id => id.length > 0);

export const COMMAND_CATEGORIES = [
  'Administrator',
  'Information',
  'Moderator',
  'Other',
  'Owner',
  'Roleplay',
] as const satisfies readonly string[];

export type CommandCategory = typeof COMMAND_CATEGORIES[number];

export function isCommandCategory(value: unknown): value is CommandCategory {
  return typeof value === 'string'
    && (COMMAND_CATEGORIES as readonly string[]).includes(value);
}

export type SlashCommandData =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder;

export interface SlashCommand {
  data: SlashCommandData;
  category: CommandCategory;
  execute: (client: BotClient, interaction: ChatInputCommandInteraction) => Promise<void> | void;
  cooldown?: number;
  autocomplete?: (client: BotClient, interaction: AutocompleteInteraction) => Promise<void> | void;
}

export const SlashCommandShape = ['data', 'execute'] as const satisfies readonly (keyof SlashCommand)[];

export function isSlashCommand(mod: unknown): mod is SlashCommand {
  if (!hasShape<SlashCommand>(mod, SlashCommandShape)) return false;
  const m = mod as Record<string, unknown>;

  if (typeof m.execute !== 'function') return false;

  if (typeof m.data !== 'object' || m.data === null) return false;
  const data = m.data as Record<string, unknown>;
  if (typeof data.name !== 'string' || data.name.length === 0) return false;
  if (typeof data.toJSON !== 'function') return false;

  if (!isCommandCategory(m.category)) return false;

  if (m.cooldown !== undefined && typeof m.cooldown !== 'number') return false;
  if (m.autocomplete !== undefined && typeof m.autocomplete !== 'function') return false;

  return true;
}

export interface PrefixCommandInfo {
  name: string;
  description: string;
  category: CommandCategory;
  aliases?: readonly string[];
}

export interface PrefixCommandHelp {
  args?: string[];
  usage?: string;
}

export interface PrefixCommand {
  info: PrefixCommandInfo;
  execute: (client: BotClient, message: Message, ...args: readonly string[]) => Promise<void> | void;
  cooldown?: number;
  isOwnerOnly?: boolean;
  help?: PrefixCommandHelp;
}

export const PrefixCommandShape = ['info', 'execute'] as const satisfies readonly (keyof PrefixCommand)[];

export function isPrefixCommand(mod: unknown): mod is PrefixCommand {
  if (!hasShape<PrefixCommand>(mod, PrefixCommandShape)) return false;
  const m = mod as Record<string, unknown>;

  if (typeof m.execute !== 'function') return false;

  if (typeof m.info !== 'object' || m.info === null) return false;
  const info = m.info as Record<string, unknown>;
  if (typeof info.name !== 'string' || info.name.length === 0) return false;
  if (typeof info.description !== 'string' || info.description.length === 0) return false;
  if (!isCommandCategory(info.category)) return false;

  if (info.aliases !== undefined) {
    if (!Array.isArray(info.aliases)) return false;
    if (!info.aliases.every(value => typeof value === 'string')) return false;
  }

  if (m.help !== undefined) {
    if (typeof m.help !== 'object' || m.help === null) return false;
    const help = m.help as Record<string, unknown>;

    if (help.args !== undefined) {
      if (!Array.isArray(help.args)) return false;
      if (!help.args.every(value => typeof value === 'string')) return false;
    }

    if (help.usage !== undefined && typeof help.usage !== 'string') return false;
  }

  return true;
}

export interface Button {
  customId: string;
  execute: (client: BotClient, interaction: ButtonInteraction, ...args: readonly string[]) => Promise<void> | void;
  cooldown?: number;
  isAuthorOnly?: boolean;
}

export const ButtonShape = ['customId', 'execute'] as const satisfies readonly (keyof Button)[];

export function isButton(mod: unknown): mod is Button {
  if (!hasShape<Button>(mod, ButtonShape)) return false;
  const m = mod as Record<string, unknown>;

  if (typeof m.execute !== 'function') return false;

  if (typeof m.customId !== 'string' || m.customId.length === 0) return false;

  if (m.cooldown !== undefined && typeof m.cooldown !== 'number') return false;
  if (m.isAuthorOnly !== undefined && typeof m.isAuthorOnly !== 'boolean') return false;

  return true;
}

export interface SelectMenu {
  customId: string;
  execute: (client: BotClient, interaction: AnySelectMenuInteraction, ...args: readonly string[]) => Promise<void> | void;
  cooldown?: number;
  isAuthorOnly?: boolean;
}

export const MenuShape = ['customId', 'execute'] as const satisfies readonly (keyof SelectMenu)[];

export function isSelectMenu(mod: unknown): mod is SelectMenu {
  if (!hasShape<SelectMenu>(mod, MenuShape)) return false;
  const m = mod as Record<string, unknown>;

  if (typeof m.execute !== 'function') return false;

  if (typeof m.customId !== 'string' || m.customId.length === 0) return false;

  if (m.cooldown !== undefined && typeof m.cooldown !== 'number') return false;
  if (m.isAuthorOnly !== undefined && typeof m.isAuthorOnly !== 'boolean') return false;

  return true;
}

export interface ModalSubmit {
  customId: string;
  execute: (client: BotClient, interaction: ModalSubmitInteraction, ...args: readonly string[]) => Promise<void> | void;
  cooldown?: number;
}

export const ModalSubmitShape = ['customId', 'execute'] as const satisfies readonly (keyof ModalSubmit)[];

export function isModalSubmit(mod: unknown): mod is ModalSubmit {
  if (!hasShape<ModalSubmit>(mod, ModalSubmitShape)) return false;
  const m = mod as Record<string, unknown>;

  if (typeof m.execute !== 'function') return false;

  if (typeof m.customId !== 'string' || m.customId.length === 0) return false;

  if (m.cooldown !== undefined && typeof m.cooldown !== 'number') return false;

  return true;
}

export interface Event<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  execute: (client: BotClient, ...args: ClientEvents[K]) => Promise<void> | void;
  once?: boolean;
}

export const EventShape = ['name', 'execute'] as const satisfies readonly (keyof Event)[];

export type ContextMenuType =
  | ApplicationCommandType.User
  | ApplicationCommandType.Message;

type ContextMenuInteractionFor<T extends ContextMenuType> =
  T extends ApplicationCommandType.User
  ? UserContextMenuCommandInteraction
  : MessageContextMenuCommandInteraction;

export interface ContextMenuCommand<T extends ContextMenuType = ContextMenuType> {
  data: ContextMenuCommandBuilder;
  execute: (client: BotClient, interaction: ContextMenuInteractionFor<T>) => Promise<void> | void;
  cooldown?: number;
  isOwnerOnly?: boolean;
}

export const ContextMenuCommandShape = ['data', 'execute'] as const satisfies readonly (keyof ContextMenuCommand)[];

export function isContextMenuCommand(mod: unknown): mod is ContextMenuCommand {
  if (!hasShape<ContextMenuCommand>(mod, ContextMenuCommandShape)) return false;
  const m = mod as Record<string, unknown>;

  if (typeof m.execute !== 'function') return false;

  if (typeof m.data !== 'object' || m.data === null) return false;
  const data = m.data as Record<string, unknown>;
  if (typeof data.name !== 'string' || data.name.length === 0) return false;
  if (typeof data.toJSON !== 'function') return false;

  if (m.cooldown !== undefined && typeof m.cooldown !== 'number') return false;
  if (m.isOwnerOnly !== undefined && typeof m.isOwnerOnly !== 'boolean') return false;

  return true;
}

export interface CapiFactAPI {
  factId: number;
  text: string;
}

export function hasShape<T>(mod: unknown, required: readonly (keyof T)[]): boolean {
  if (typeof mod !== 'object' || mod === null) return false;
  return required.every(key => key in mod);
}