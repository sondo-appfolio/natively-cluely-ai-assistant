// electron/llm/codeVerification/verificationEnabled.ts
//
// Single kill-switch for verified code execution (swe-coach-build-order step 5).
// DEFAULT ON for new installs / when unset so Coding answers under
// technical-interview get sandboxed verify → judge → one-shot correction.
// Scope is coding/dsa answer types only — Sales/Lecture never claim verification
// (AnswerPlanner omits <verification_spec> for non-coding plans; callers also
// gate on isCoding / isCodingChat).
//
// Opt out at runtime (without changing code / redeploy) by either:
//   - env   NATIVELY_CODE_VERIFY = 'off' | 'false' | '0' | 'disabled'  → disabled
//   - settings  codeVerificationEnabled === false                     → disabled
// Reads defensively (never throws). Any uncertainty resolves to the default ON,
// EXCEPT an explicit env/settings "off" which always wins.
//
// Mirrors the kill-switch model in profileGroundingV2.ts.

let cachedEnvOff: boolean | null = null;

const envDisabled = (): boolean => {
  if (cachedEnvOff !== null) return cachedEnvOff;
  let off = false;
  try {
    const v = (process.env.NATIVELY_CODE_VERIFY || '').trim().toLowerCase();
    off = v === 'off' || v === 'false' || v === '0' || v === 'disabled';
  } catch { off = false; }
  cachedEnvOff = off;
  return off;
};

/**
 * True when verified code execution should run. DEFAULT ON; an explicit env or
 * settings "off" disables it at runtime (no redeploy). Pure-ish + safe to call
 * on the hot path (settings read is a cheap cached SettingsManager get).
 */
export const isCodeVerificationEnabled = (): boolean => {
  if (envDisabled()) return false;
  try {
    const { SettingsManager } = require('../../services/SettingsManager');
    const v = SettingsManager.getInstance().get('codeVerificationEnabled');
    if (v === false) return false; // explicit opt-out only; undefined → default ON
  } catch { /* settings unavailable → fall through to default ON */ }
  return true;
};

/** Test-only: reset the cached env read (env can't change mid-process otherwise). */
export const __resetCodeVerificationCache = (): void => { cachedEnvOff = null; };
