import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import logger from "../utilities/Logger";

const DATA_DIR = join(process.cwd(), 'data');
const BLACKLIST_FILE = join(DATA_DIR, 'blacklist.json');

export default class BlacklistManager {
  private static cache: Set<string> = new Set();
  private static loaded = false;

  public static load(): void {
    if (this.loaded) return;

    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

      if (!existsSync(BLACKLIST_FILE)) {
        writeFileSync(BLACKLIST_FILE, '[]', 'utf8');
        this.loaded = true;
        logger.info('[BlacklistManager] Created empty blacklist.json');
        return;
      }

      const raw = readFileSync(BLACKLIST_FILE, 'utf8');
      const parsed: unknown = JSON.parse(raw);

      if (!Array.isArray(parsed) || !parsed.every(v => typeof v === 'string')) {
        logger.warn('[BlacklistManager] blacklist.json is malformed, starting empty');
        this.cache.clear();
      } else {
        this.cache = new Set(parsed);
      }

      this.loaded = true;
      logger.info(`[BlacklistManager] Loaded ${this.cache.size} blacklisted user${this.cache.size === 1 ? '' : 's'}`);
    } catch (error) {
      logger.error(error, '[BlacklistManager] Failed to load blacklist:');
      this.loaded = true; // mark loaded anyway so we don't retry on every check
    }
  }

  public static has(userId: string): boolean {
    return this.cache.has(userId);
  }

  public static add(userId: string): boolean {
    if (this.cache.has(userId)) return false;
    this.cache.add(userId);
    this.persist();
    return true;
  }

  public static remove(userId: string): boolean {
    if (!this.cache.delete(userId)) return false;
    this.persist();
    return true;
  }

  public static list(): readonly string[] {
    return Array.from(this.cache);
  }

  public static get size(): number {
    return this.cache.size;
  }

  private static persist(): void {
    try {
      writeFileSync(BLACKLIST_FILE, JSON.stringify(Array.from(this.cache), null, 2), 'utf8');
    } catch (error) {
      logger.error(error, '[BlacklistManager] Failed to persist blacklist:');
    }
  }
}