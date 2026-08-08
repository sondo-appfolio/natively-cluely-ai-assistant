/**
 * Pure policy for always-stealth SWE coach (ADR 0017–0018).
 * Keep AppState / TwoDeviceStealthSession free of duplicated disguise rules.
 */

export type StealthDisguiseMode = 'terminal' | 'settings' | 'activity' | 'none';
export type ForcedStealthDisguise = Exclude<StealthDisguiseMode, 'none'>;

/** While undetectable, disguise must never be `none` — default `terminal`. */
export function resolveDisguiseForStealth(current: StealthDisguiseMode): ForcedStealthDisguise {
  return current === 'none' ? 'terminal' : current;
}

/**
 * After two-device exit (or any live-session teardown), detectability stays on.
 * Overlay visibility is a separate axis.
 */
export function undetectableAfterTwoDeviceExit(): true {
  return true;
}
