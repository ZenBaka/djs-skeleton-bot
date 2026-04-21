import { Events } from "discord.js";
import type { Event } from "../types";
import { handleAutocomplete, handleCommand } from "../handlers/SlashCommandHandler";
import { handleButton } from "../handlers/ButtonHandler";
import { handleMenu } from "../handlers/SelectMenuHandler";
import { handleModalSubmit } from "../handlers/ModalSubmitHandler";
import { handleContextMenu } from "../handlers/ContextMenuHandler";

export const name = Events.InteractionCreate;

export const execute: Event<Events.InteractionCreate>['execute'] = async(client, interaction) => {
  if (interaction.isChatInputCommand()) {
    await handleCommand(client, interaction);
  } else if (interaction.isAutocomplete()) {
    await handleAutocomplete(client, interaction);
  } else if (interaction.isContextMenuCommand()) {
    await handleContextMenu(client, interaction);
  } else if (interaction.isButton()) {
    await handleButton(client, interaction);
  } else if (interaction.isAnySelectMenu()) {
    await handleMenu(client, interaction);
  } else if (interaction.isModalSubmit()) {
    await handleModalSubmit(client, interaction);
  }
}