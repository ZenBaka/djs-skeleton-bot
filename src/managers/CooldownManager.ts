import { Collection } from "discord.js";

/**
 * Per-user cooldown tracker for commands, buttons, menus, modals, and
 * context menus. Cooldowns are per-cluster-process, so under sharding a
 * user gets independent cooldowns in each cluster.
 *
 * Keys are opaque strings that the caller builds. For the standard
 * "scope + user" format every handler uses, call `CooldownManager.key()`.
 */
export default class CooldownManager {
  private static cache: Collection<string, number> = new Collection();
  private static pruner: ReturnType<typeof setInterval>;

  static {
    this.pruner = setInterval(() => this.prune(), 60_000);
    // Don't block process exit on the pruner timer.
    this.pruner.unref?.();
  }

  /**
   * Build a cooldown key in the standard "scope:userId" format used by
   * every handler in this skeleton.
   */
  public static key(...parts: string[]): string {
    return parts.join(':');
  }

  /**
   * Returns the expiration timestamp in unix seconds if the key is on
   * cooldown, or null otherwise. Drop the return value straight into
   * Discord's `<t:N:R>` relative-time format.
   */
  public static check(key: string): number | null {
    const expiresAt = this.cache.get(key);
    if (!expiresAt) return null;
    if (expiresAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return Math.floor(expiresAt / 1000);
  }

  /**
   * Start a cooldown for the key. No-op if duration is non-positive or
   * if the key already has an active cooldown (the existing one keeps
   * its remaining time rather than being reset).
   */
  public static start(key: string, durationInSeconds: number): void {
    if (durationInSeconds <= 0) return;
    if (this.check(key) !== null) return;
    this.cache.set(key, Date.now() + durationInSeconds * 1000);
  }

  /**
   * Remove a cooldown early. Useful for admin overrides or tests.
   */
  public static clear(key: string): void {
    this.cache.delete(key);
  }

  private static prune(): void {
    const now = Date.now();
    this.cache.sweep((expiresAt) => expiresAt <= now);
  }
}