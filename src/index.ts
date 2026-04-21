import { ClusterManager } from "discord-hybrid-sharding";
import logger from "./utilities/Logger";
import path from "path";

const botFile = path.join(import.meta.dir, 'bot.ts');

const manager = new ClusterManager(botFile, {
  token: Bun.env.BOT_TOKEN,
  totalShards: 'auto', // Let Discord decide shard count
  shardsPerClusters: 2, // 2 internal shards per cluster process
  totalClusters: 'auto', // Auto-calculate cluster count
  mode: 'process', // Each cluster is a separate process
  respawn: true,
  restarts: {
    max: 10,
    interval: 60_000 * 60 // Reset restart counter every hour
  },
  queue: {
    auto: true, // Automatically manage spawn queue
    timeout: 60_000 // 60s timeout per cluster spawn
  }
});

manager.on('clusterCreate', (cluster) => {
  logger.info(`[System] Launched Cluster #${cluster.id} (Shards: ${cluster.shardList.join(', ')})`);

  cluster.on('error', (error) => {
    logger.error(error, `[Cluster ${cluster.id}] Error:`)
  });

  cluster.on('death', () => {
    logger.error(`[Cluster #${cluster.id}] Died. Respawning...`);
  });

  cluster.on('message', (message: any) => {
    if (message && typeof message === 'object' && 'type' in message && message.type === 'log') {
      logger.info(`[Cluster #${cluster.id}] ${message.content}`);
    }
  });
});

manager.spawn().catch(error => {
  logger.error(error, '[System] Failed to spawn clusters:');
});