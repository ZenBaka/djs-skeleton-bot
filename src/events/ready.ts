import { Events } from "discord.js";
import type { Event } from "../types";
import logger from "../utilities/Logger";

export const name = Events.ClientReady;
export const once = true;

export const execute: Event<Events.ClientReady>['execute'] = async(client, readyClient) => {
  logger.info(`[Bot ${client && client.shard ? client.shard.ids[0] : 0}] Logged in as ${readyClient.user.tag}`);
  if (client.user) {
    client.user.setPresence({ status: 'online', activities: [] });
  }
};