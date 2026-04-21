import { Events } from "discord.js";
import type { Event } from "../types";
import { handlePrefixCommand } from "../handlers/PrefixCommandHandler";

export const name = Events.MessageCreate;

export const execute: Event<Events.MessageCreate>['execute'] = async (client, message) => {
  await handlePrefixCommand(client, message);
}