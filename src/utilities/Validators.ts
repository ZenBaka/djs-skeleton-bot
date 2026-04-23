import type { AnySelectMenuInteraction, ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import { type SlashCommand, hasShape, SlashCommandShape, isCommandCategory,
  type PrefixCommand, PrefixCommandShape, isPermissionFlagName, type Button,
  ButtonShape, MenuShape, type SelectMenu, type ModalSubmit, ModalSubmitShape,
  type ContextMenuCommand, ContextMenuCommandShape } from "../types";
import { isSnowflake } from "./Snowflake";

export function isSlashCommand(mod: unknown): mod is SlashCommand {
  if (!hasShape<SlashCommand>(mod, SlashCommandShape)) return false;
  const m = mod as Record<string, unknown>;

  if (typeof m.execute !== 'function') return false;

  if (typeof m.data !== 'object' || m.data === null) return false;
  const data = m.data as Record<string, unknown>;
  if (typeof data.name !== 'string' || data.name.length === 0) return false;
  if (typeof data.description !== 'string' || data.description.length === 0) return false;
  if (typeof data.toJSON !== 'function') return false;

  if (!isCommandCategory(m.category)) return false;

  if (m.cooldown !== undefined && typeof m.cooldown !== 'number') return false;
  if (m.autocomplete !== undefined && typeof m.autocomplete !== 'function') return false;

  return true;
}

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

  if (info.cooldown !== undefined) {
    if (typeof info.cooldown !== 'number' || info.cooldown <= 0) return false;
  }

  if (info.isOwnerOnly !== undefined && typeof info.isOwnerOnly !== 'boolean') return false;

  if (info.allowedChannels !== undefined) {
    if (!Array.isArray(info.allowedChannels)) return false;
    if (!info.allowedChannels.every(value => typeof value === 'string')) return false;
  }

  if (info.botPermissions !== undefined) {
    if (!Array.isArray(info.botPermissions)) return false;
    if (!info.botPermissions.every(isPermissionFlagName)) return false;
  }

  if (info.userPermissions !== undefined) {
    if (!Array.isArray(info.userPermissions)) return false;
    if (!info.userPermissions.every(isPermissionFlagName)) return false;
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

export function isButton(mod: unknown): mod is Button {
  if (!hasShape<Button>(mod, ButtonShape)) return false;
  const m = mod as Record<string, unknown>;

  if (typeof m.execute !== 'function') return false;

  if (typeof m.info !== 'object' || m.info === null) return false;

  const info = m.info as Record<string, unknown>;

  if (typeof info.customId !== 'string' || info.customId.length === 0) return false;

  if (info.cooldown !== undefined) {
    if (typeof info.cooldown !== 'number' || info.cooldown <= 0) return false;
  }

  if (info.isAuthorOnly !== undefined && typeof info.isAuthorOnly !== 'boolean') return false;

  if (info.resolveOwner !== undefined && typeof info.resolveOwner !== 'function') return false;

  return true;
}

export function isSelectMenu(mod: unknown): mod is SelectMenu {
  if (!hasShape<SelectMenu>(mod, MenuShape)) return false;
  const m = mod as Record<string, unknown>;

  if (typeof m.execute !== 'function') return false;

  if (typeof m.info !== 'object' || m.info === null) return false;
  const info = m.info as Record<string, unknown>;
  if (typeof info.customId !== 'string' || info.customId.length === 0) return false;
  if (info.cooldown !== undefined) {
    if (typeof info.cooldown !== 'number' || info.cooldown <= 0) return false;
  }
  if (info.isAuthorOnly !== undefined && typeof info.isAuthorOnly !== 'boolean') return false;

  return true;
}

export function isModalSubmit(mod: unknown): mod is ModalSubmit {
  if (!hasShape<ModalSubmit>(mod, ModalSubmitShape)) return false;
  const m = mod as Record<string, unknown>;

  if (typeof m.execute !== 'function') return false;

  if (typeof m.info !== 'object' || m.info === null) return false;
  const info = m.info as Record<string, unknown>;

  if (typeof info.customId !== 'string' || info.customId.length === 0) return false;
  if (info.cooldown !== undefined) {
    if (typeof info.cooldown !== 'number' || info.cooldown <= 0) return false;
  }
  if (info.isAuthorOnly !== undefined && typeof info.isAuthorOnly !== 'boolean') return false;

  return true;
}

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

/**
 * A default helper function to parse user ids directly from the interaction's custom id.
 * @param interaction Any component interaction
 * @returns A string with the resolved user id or null if not found
 */
export function resolveUserId(
  interaction: ButtonInteraction | AnySelectMenuInteraction | ModalSubmitInteraction
): string | null {
  const [, userId] = interaction.customId.split(':');

  if (userId && isSnowflake(userId)) return userId;

  return null;
}