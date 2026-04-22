const DISCORD_EPOCH = 1420070400000n; // 2015-01-01T00:00:00Z in ms

/**
 * Returns true if the string is a valid Discord snowflake; correct
 * length, all digits, and decodes to a timestamp between Discord's
 * epoch (2015) and one day in the future (to allow for clock changes).
 */
export function isSnowflake(value: string): boolean {
  if (!/^\d{17,20}$/.test(value)) return false;

  let timestamp: bigint;
  try {
    // The top 42 bits are milliseconds since Discord's epoch.
    // BigInt because snowflakes overflow Number after ~2^53.
    timestamp = (BigInt(value) >> 22n) + DISCORD_EPOCH;
  } catch {
    return false;
  }

  const now = BigInt(Date.now());
  const oneDay = 86_400_000n;
  return timestamp >= DISCORD_EPOCH && timestamp <= now + oneDay;
}

/**
 * Decode the create timestamp from a snowflake. Returns null if the
 * input isn't a valid snowflake. Useful for "this account was created
 * on..." features.
 */
export function snowflakeToDate(value: string): Date | null {
  if (!isSnowflake(value)) return null;
  const ms = (BigInt(value) >> 22n) + DISCORD_EPOCH;
  return new Date(Number(ms));
}