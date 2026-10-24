// Server-side TOTP-verification cooldown (R12): after `max` failed attempts
// within `windowMs`, verification is blocked until the window rolls past the
// triggering attempt. Pure and timestamp-only so it is unit-testable.

export interface CooldownConfig {
  max: number;
  windowMs: number;
}

export const DEFAULT_COOLDOWN: CooldownConfig = { max: 5, windowMs: 15_000 };

/**
 * Returns the milliseconds until the cooldown lifts, or `null` when there is no
 * active cooldown. `attempts` are the failure timestamps (epoch ms).
 */
export function cooldownRemainingMs(
  attempts: number[],
  now = Date.now(),
  config: CooldownConfig = DEFAULT_COOLDOWN,
): number | null {
  const { max, windowMs } = config;
  const recent = attempts.filter((at) => at > now - windowMs).sort((a, b) => a - b);
  if (recent.length < max) return null;
  const ends = recent[max - 1] + windowMs;
  return ends > now ? ends - now : null;
}
