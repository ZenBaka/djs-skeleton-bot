import { ButtonBuilder, ModalBuilder, type APIButtonComponent, type APIModalComponent, type APIModalInteractionResponseCallbackData, type APISelectMenuComponent, type ButtonComponentData, type ModalComponentData, type ModalData, type SelectMenuType } from "discord.js";
import { MENU_BUILDERS, type SelectMenuBuilderFor } from "../types";

export function authorButton(
  userId: string,
  customId: string,
  data?: Partial<ButtonComponentData | APIButtonComponent>
): ButtonBuilder {
  return new ButtonBuilder(data).setCustomId(`${customId}:${userId}`);
}

export function authorMenu<T extends SelectMenuType>(
  type: T,
  userId: string,
  customId: string,
  data?: Partial<APISelectMenuComponent>,
): SelectMenuBuilderFor<T> {
  const BuilderClass = MENU_BUILDERS[type];
  return new (BuilderClass as any)(data).setCustomId(`${customId}:${userId}`);
}

export function authorModal(
  userId: string,
  customId: string,
  data?: Partial<ModalComponentData> | Partial<APIModalInteractionResponseCallbackData>
): ModalBuilder {
  return new ModalBuilder(data).setCustomId(`${customId}:${userId}`);
}