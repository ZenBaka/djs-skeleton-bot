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

  export type SlashCommandData =
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder;

export interface SlashCommand {
  data: SlashCommandData;
  execute: (client: BotClient, interaction: ChatInputCommandInteraction) => Promise<void> | void;
  cooldown?: number;
  autocomplete?: (client: BotClient, interaction: AutocompleteInteraction) => Promise<void> | void;
}

export const SlashCommandShape = ['data', 'execute'] as const satisfies readonly (keyof SlashCommand)[];

export interface PrefixCommand {
  name: string;
  description: string;
  aliases?: readonly string[];
  execute: (client: BotClient, message: Message, ...args: readonly string[]) => Promise<void> | void;
  cooldown?: number;
  isOwnerOnly?: boolean;
}

export const PrefixCommandShape = ['name', 'description', 'execute'] as const satisfies readonly (keyof PrefixCommand)[];

export interface Button {
  customId: string;
  execute: (client: BotClient, interaction: ButtonInteraction, ...args: readonly string[]) => Promise<void> | void;
  cooldown?: number;
  isAuthorOnly?: boolean;
}

export const ButtonShape = ['customId', 'execute'] as const satisfies readonly (keyof Button)[];

export interface SelectMenu {
  customId: string;
  execute: (client: BotClient, interaction: AnySelectMenuInteraction, ...args: readonly string[]) => Promise<void> | void;
  cooldown?: number;
  isAuthorOnly?: boolean;
}

export const MenuShape = ['customId', 'execute'] as const satisfies readonly (keyof SelectMenu)[];

export interface ModalSubmit {
  customId: string;
  execute: (client: BotClient, interaction: ModalSubmitInteraction, ...args: readonly string[]) => Promise<void> | void;
  cooldown?: number;
}

export const ModalSubmitShape = ['customId', 'execute'] as const satisfies readonly (keyof ModalSubmit)[];

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

export function hasShape<T>(mod: unknown, required: readonly (keyof T)[]): mod is T {
  if (typeof mod !== 'object' || mod === null) return false;
  return required.every(key => key in mod);
}