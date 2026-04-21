import { Events } from "discord.js";
import type { Event } from "../types";
import logger from "../utilities/Logger";

export const name = Events.ClientReady;
export const once = true;

export const execute: Event<Events.ClientReady>['execute'] = async(_client, readyClient) => {
  logger.info(`[Bot] Logged in as ${readyClient.user.tag}`);
};