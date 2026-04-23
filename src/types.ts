import {
  ChannelSelectMenuBuilder,
  ComponentType,
  MentionableSelectMenuBuilder,
  PermissionFlagsBits,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
  type AnySelectMenuInteraction,
  type ApplicationCommandType,
  type AutocompleteInteraction,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type ClientEvents,
  type ContextMenuCommandBuilder,
  type Message,
  type MessageContextMenuCommandInteraction,
  type ModalSubmitInteraction,
  type SelectMenuType,
  type SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
  type SlashCommandSubcommandsOnlyBuilder,
  type UserContextMenuCommandInteraction,
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

export const PERMISSION_FLAG_NAMES = Object.keys(PermissionFlagsBits) as readonly (keyof typeof PermissionFlagsBits)[];

export type PermissionFlagName = keyof typeof PermissionFlagsBits;

export function isPermissionFlagName(value: unknown): value is PermissionFlagName {
  return typeof value === 'string'
    && (PERMISSION_FLAG_NAMES as readonly string[]).includes(value);
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

export const SlashCommandShape = ['data', 'category', 'execute'] as const satisfies readonly (keyof SlashCommand)[];

export interface PrefixCommandInfo {
  name: string;
  description: string;
  category: CommandCategory;
  aliases?: readonly string[];
  cooldown?: number;
  isOwnerOnly?: boolean;
  allowedChannels?: readonly string[];
  botPermissions?: readonly PermissionFlagName[];
  userPermissions?: readonly PermissionFlagName[];
}

export interface PrefixCommandHelp {
  args?: string[];
  usage?: string;
}

export interface PrefixCommand {
  info: PrefixCommandInfo;
  execute: (client: BotClient, message: Message, ...args: readonly string[]) => Promise<void> | void;
  help?: PrefixCommandHelp;
}

export const PrefixCommandShape = ['info', 'execute'] as const satisfies readonly (keyof PrefixCommand)[];

export type AnyComponent =
  | Button
  | SelectMenu
  | ModalSubmit;

type ComponentInteractionFor<T extends AnyComponent> =
  T extends Button ? ButtonInteraction :
  T extends SelectMenu ? AnySelectMenuInteraction :
  T extends ModalSubmit ? ModalSubmitInteraction :
  never;

export interface ComponentInfo<T extends AnyComponent> {
  customId: string;
  cooldown?: number;
  isAuthorOnly?: boolean;
  resolveOwner?: (interaction: ComponentInteractionFor<T>) => string | null | undefined | Promise<string | null | undefined>;
}

export interface Button {
  info: ComponentInfo<Button>;
  execute: (client: BotClient, interaction: ButtonInteraction, ...args: readonly string[]) => Promise<void> | void;
}

export const ButtonShape = ['info', 'execute'] as const satisfies readonly (keyof Button)[];

export const MENU_BUILDERS = {
  [ComponentType.StringSelect]: StringSelectMenuBuilder,
  [ComponentType.UserSelect]: UserSelectMenuBuilder,
  [ComponentType.RoleSelect]: RoleSelectMenuBuilder,
  [ComponentType.ChannelSelect]: ChannelSelectMenuBuilder,
  [ComponentType.MentionableSelect]: MentionableSelectMenuBuilder,
} as const;

export type SelectMenuBuilderFor<T extends SelectMenuType> =
  InstanceType<typeof MENU_BUILDERS[T]>;

export interface SelectMenu {
  info: ComponentInfo<SelectMenu>;
  execute: (client: BotClient, interaction: AnySelectMenuInteraction, ...args: readonly string[]) => Promise<void> | void;
}

export const MenuShape = ['info', 'execute'] as const satisfies readonly (keyof SelectMenu)[];

export interface ModalSubmit {
  info: ComponentInfo<ModalSubmit>;
  execute: (client: BotClient, interaction: ModalSubmitInteraction, ...args: readonly string[]) => Promise<void> | void;
}

export const ModalSubmitShape = ['info', 'execute'] as const satisfies readonly (keyof ModalSubmit)[];

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

export interface CapiFactAPI {
  factId: number;
  text: string;
}

export function hasShape<T>(mod: unknown, required: readonly (keyof T)[]): boolean {
  if (typeof mod !== 'object' || mod === null) return false;
  return required.every(key => key in mod);
}