import { Glob } from "bun";
import { join } from "path";
import type BotClient from "../structures/BotClient";
import { type Event, EventShape, hasShape } from "../types";
import logger from "../utilities/Logger";

const EVENTS_DIR = join(import.meta.dir, '..', 'events');

export async function loadEvents(client: BotClient): Promise<void> {
  const glob = new Glob('**/*.{ts,js}');
  let loaded = 0;
  let skipped = 0;

  for await (const file of glob.scan({ cwd: EVENTS_DIR, absolute: true })) {
    if (file.endsWith('d.ts')) continue;

    try {
      const mod = await import(file);

      if (!hasShape<Event>(mod, EventShape)) {
        logger.warn(`[EventHandler] Skipped ${file}, not a valid event`);
        skipped++;
        continue;
      }

      const wrapped = async (...args: unknown[]) => {
        try {
          // @ts-expect-error - args is ClientEvents[name] at runtime but
          // the generic removal makes TS throw an error here
          await mod.execute(client, ...args);
        } catch (error) {
          logger.error(error, `[EventHandler] Error in ${mod.name} listener:`);
        }
      };

      if (mod.once) {
        client.once(mod.name, wrapped);
      } else {
        client.on(mod.name, wrapped);
      }

      loaded++;
    } catch (error) {
      logger.error(error, `[EventHandler] Failed to load ${file}:`);
      skipped++;
    }
  }

  logger.info(`[EventHandler] Loaded ${loaded} event${loaded === 1 ? '' : 's'}${skipped > 0 ? ` (${skipped} skipped)` : ''}`);
}