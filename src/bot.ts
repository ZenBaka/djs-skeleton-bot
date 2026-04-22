import { loadButtons } from "./handlers/ButtonHandler";
import { loadContextMenus } from "./handlers/ContextMenuHandler";
import { loadEvents } from "./handlers/EventHandler";
import { loadModals } from "./handlers/ModalSubmitHandler";
import { loadPrefixCommands } from "./handlers/PrefixCommandHandler";
import { loadMenus } from "./handlers/SelectMenuHandler";
import { loadCommands } from "./handlers/SlashCommandHandler";
import BlacklistManager from "./managers/BlacklistManager";
import BotClient from "./structures/BotClient";
import logger, { flushAndClose } from "./utilities/Logger";

const client = new BotClient();

(async () => {
  try {
    // Load commands
    await loadCommands(client);
    await loadPrefixCommands(client);
    await loadContextMenus(client);

    // Load message components
    await loadButtons(client);
    await loadMenus(client);
    await loadModals(client);

    // Register client events
    await loadEvents(client);

    BlacklistManager.load();

    // Login
    await client.login(Bun.env.BOT_TOKEN);
  } catch (error) {
    logger.error(error, '[Fatal] Startup failed:');
    flushAndClose();
    process.exit(1);
  }
})();

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  logger.info(`[System] Received ${signal}. Shutting down...`);
  shuttingDown = true;

  try {
    await client.destroy();
    logger.info('[System] Discord client destroyed');

    // Stop any background services, flush queues, close db connections, etc
    // Add hooks here as you add them.

    logger.info('[System] Shutdown complete.');
  } catch (error) {
    logger.error(error, '[System] Error during shutdown:');
  }

  flushAndClose();
  // Small delay to let the flush complete before exit
  setTimeout(() => process.exit(0), 250);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error(reason, '[Fatal] Unhandled rejection:')
});

process.on('uncaughtException', (error) => {
  logger.error(error, '[Fatal] Uncaught exception:');
});