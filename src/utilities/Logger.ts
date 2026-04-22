import pino from "pino";
import pretty from "pino-pretty";
import { statSync, renameSync, unlinkSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const LOG_DIR = Bun.env.LOG_DIR ?? join(process.cwd(), 'logs');
const LOG_FILE = join(LOG_DIR, 'bot.log');
const MAX_BYTES = 25 * 1024 * 1024; // 25MB
const MAX_FILES = 3;
const ROTATION_CHECK_INTERVAL = 60_000;

const isDev = Bun.env.NODE_ENV !== 'production';

if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

let fileDestination = pino.destination({ dest: LOG_FILE, sync: false, minLength: 0 });

/**
 * Rotate the logs when bot.log exceeds MAX_BYTES.
 *
 * Note: a small number of log lines may land in bot.1.log instead of a
 * fresh bot.log if writes race the rename. Accepted for a skeleton.
 */
function rotate(): void {
  try {
    if (!existsSync(LOG_FILE)) return;

    const { size } = statSync(LOG_FILE);
    if (size < MAX_BYTES) return;

    fileDestination.flushSync();

    for (let i = MAX_FILES; i >= 1; i--) {
      const older = join(LOG_DIR, `bot.${i}.log`);
      if (i === MAX_FILES) {
        if (existsSync(older)) unlinkSync(older);
      } else {
        const newer = join(LOG_DIR, `bot.${i + 1}.log`);
        if (existsSync(older)) renameSync(older, newer);
      }
    }

    renameSync(LOG_FILE, join(LOG_DIR, 'bot.1.log'));
    fileDestination.reopen();

    logger.info(`[Logger] Log rotated. Previous file exceeded ${MAX_BYTES / 1024 / 1024}MB`);
  } catch (error) {
    console.error('[Logger] Rotation failed:', error);
  }
}

// File stream is always present. In production it stays at info to keep
// disk volume sane; in dev it captures debug to match the console.
const fileLevel = isDev ? 'debug' : 'info';
const streams: pino.StreamEntry[] = [
  { level: fileLevel, stream: fileDestination },
];

// Pretty-print to console only in development. The CPU cost of pino-pretty
// dominated the profile when this ran on every log line in production, so
// production emits raw JSON and lets a downstream consumer pretty-print on
// demand (e.g. piping bot.log through `pino-pretty` from the terminal).
if (isDev) {
  const prettyStream = pretty({
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
    levelFirst: true,
  });
  streams.unshift({ level: 'debug', stream: prettyStream });
}

const logger = pino(
  { level: isDev ? 'debug' : 'info' },
  pino.multistream(streams),
);

const rotationInterval = setInterval(rotate, ROTATION_CHECK_INTERVAL);
rotationInterval.unref?.();

/**
 * Flush and close the file stream.
 * Call this before process.exit()
 */
export function flushAndClose(): void {
  try {
    clearInterval(rotationInterval);
    fileDestination.flushSync();
    fileDestination.end();
  } catch {
    // Swallow it. If sonic-boom isn't ready there isn't anything we can do.
  }
}

// Safely handle exit by wrapping it in a try-catch to silence sonic-boom errors
process.on('beforeExit', () => { try { fileDestination.flushSync(); } catch {} });
process.on('exit', () => { try { fileDestination.flushSync(); } catch {} });

export default logger;