// electron/llm/codeVerification/__tests__/VerificationFlag.test.mjs
//
// Kill-switch for verified code execution: DEFAULT ON for new installs / when
// unset (swe-coach-build-order step 5). Opt out at runtime (no redeploy) via:
//   - env   NATIVELY_CODE_VERIFY = 'off' | 'false' | '0' | 'disabled'
//   - settings  codeVerificationEnabled === false
// When off, the hidden <verification_spec> instruction is omitted from the
// coding prompt so the model wastes no tokens on a spec nothing will run.
//
// Scope: coding/dsa answer types only — Sales/Lecture never claim verification.
//
// NOTE: env is cached per-process; use __resetCodeVerificationCache or a child
// process when exercising env branches.

import assert from 'node:assert/strict';
import { test, describe, beforeEach, afterEach } from 'node:test';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isCodeVerificationEnabled,
  __resetCodeVerificationCache,
} from '../../../../dist-electron/electron/llm/codeVerification/verificationEnabled.js';
import { planAnswer, formatAnswerPlanForPrompt } from '../../../../dist-electron/electron/llm/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../..');

const readSrc = (rel) => readFileSync(path.join(repoRoot, rel), 'utf8');

const clearEnv = () => {
  delete process.env.NATIVELY_CODE_VERIFY;
  __resetCodeVerificationCache();
};

describe('isCodeVerificationEnabled — default ON kill-switch', () => {
  beforeEach(clearEnv);
  afterEach(clearEnv);

  test('defaults ON when no env / settings override (new installs / unset)', () => {
    assert.equal(isCodeVerificationEnabled(), true);
  });

  for (const off of ['off', 'false', '0', 'disabled']) {
    test(`env NATIVELY_CODE_VERIFY=${off} opts out (child process for clean cache)`, () => {
      const out = execFileSync(process.execPath, [
        '--input-type=module', '-e',
        `import { isCodeVerificationEnabled } from './dist-electron/electron/llm/codeVerification/verificationEnabled.js'; process.stdout.write(String(isCodeVerificationEnabled()));`,
      ], { cwd: repoRoot, env: { ...process.env, NATIVELY_CODE_VERIFY: off } }).toString();
      assert.equal(out, 'false');
    });
  }

  for (const on of ['on', 'true', '1', 'enabled', '']) {
    test(`env NATIVELY_CODE_VERIFY=${on === '' ? '(empty)' : on} stays ON (only explicit off disables)`, () => {
      const out = execFileSync(process.execPath, [
        '--input-type=module', '-e',
        `import { isCodeVerificationEnabled } from './dist-electron/electron/llm/codeVerification/verificationEnabled.js'; process.stdout.write(String(isCodeVerificationEnabled()));`,
      ], {
        cwd: repoRoot,
        env: on === ''
          ? (() => { const e = { ...process.env }; delete e.NATIVELY_CODE_VERIFY; return e; })()
          : { ...process.env, NATIVELY_CODE_VERIFY: on },
      }).toString();
      assert.equal(out, 'true');
    });
  }

  test('headless / settings unavailable still defaults ON (defensive catch)', () => {
    // esbuild inlines SettingsManager; getInstance() throws without Electron app
    // → catch → default ON. Proves uncertainty never silently disables verify.
    assert.equal(isCodeVerificationEnabled(), true);
  });

  test('source: settings codeVerificationEnabled === false is the only settings opt-out', () => {
    // Runtime settings branch can't be stubbed under esbuild bundle (SettingsManager
    // is inlined). Pin the contract in source so toggle-off still disables.
    const src = readSrc('electron/llm/codeVerification/verificationEnabled.ts');
    assert.match(src, /SettingsManager\.getInstance\(\)\.get\('codeVerificationEnabled'\)/);
    assert.match(src, /if \(v === false\) return false/);
    assert.match(src, /undefined → default ON/);
    assert.match(src, /return true;\s*$/m);
  });
});

describe('formatAnswerPlanForPrompt — spec emission gated by the flag', () => {
  const codingPlan = planAnswer({ question: 'reverse a linked list', source: 'manual_input' });

  test('coding plan WITH includeVerificationSpec=true includes the spec instruction', () => {
    const s = formatAnswerPlanForPrompt(codingPlan, true);
    assert.match(s, /verification_spec/);
  });
  test('coding plan WITH includeVerificationSpec=false (or default) omits it', () => {
    assert.doesNotMatch(formatAnswerPlanForPrompt(codingPlan, false), /verification_spec/);
    assert.doesNotMatch(formatAnswerPlanForPrompt(codingPlan), /verification_spec/); // default false
  });
  test('NON-coding plan never gets the spec instruction even when enabled (Sales/Lecture out of scope)', () => {
    const general = planAnswer({ question: 'what is my name?', source: 'manual_input' });
    assert.doesNotMatch(formatAnswerPlanForPrompt(general, true), /verification_spec/);
  });
});

describe('Settings / IPC / UI contract — toggle still works with default ON', () => {
  test('get-code-verification IPC returns isCodeVerificationEnabled() (env + settings)', () => {
    const src = readSrc('electron/ipcHandlers.ts');
    const block = src.slice(
      src.indexOf("safeHandle('get-code-verification'"),
      src.indexOf("safeHandle('set-code-verification'"),
    );
    assert.match(block, /return isCodeVerificationEnabled\(\)/);
    assert.doesNotMatch(block, /Default OFF/);
  });

  test('set-code-verification persists boolean to SettingsManager', () => {
    const src = readSrc('electron/ipcHandlers.ts');
    const block = src.slice(
      src.indexOf("safeHandle('set-code-verification'"),
      src.indexOf("safeHandle('get-meeting-retention'"),
    );
    assert.match(block, /SettingsManager\.getInstance\(\)\.set\('codeVerificationEnabled', enabled\)/);
    assert.match(block, /code-verification-changed/);
  });

  test('SettingsOverlay wires get/setCodeVerification to the Verify coding answers toggle', () => {
    const ui = readSrc('src/components/SettingsOverlay.tsx');
    assert.match(ui, /getCodeVerification/);
    assert.match(ui, /setCodeVerification/);
    assert.match(ui, /Verify coding answers/);
  });

  test('preload exposes getCodeVerification / setCodeVerification IPC', () => {
    const preload = readSrc('electron/preload.ts');
    assert.match(preload, /get-code-verification/);
    assert.match(preload, /set-code-verification/);
  });
});

describe('Coding answer path — verify wired when enabled (wire check only)', () => {
  test('IntelligenceEngine gates maybeVerifyCoding on isCoding && isCodeVerificationEnabled', () => {
    const src = readSrc('electron/IntelligenceEngine.ts');
    assert.match(src, /isCodeVerificationEnabled/);
    assert.match(src, /if \(isCoding && isCodeVerificationEnabled\(\)\)/);
    assert.match(src, /maybeVerifyCoding/);
    assert.match(src, /verifyCodingAnswer/);
  });

  test('ipcHandlers coding chat gates verifyCodingAnswer on isCodeVerificationEnabled', () => {
    const src = readSrc('electron/ipcHandlers.ts');
    assert.match(src, /isCodingChat && fullResponse\.trim\(\)\.length > 0 && isCodeVerificationEnabled\(\)/);
    assert.match(src, /verifyCodingAnswer/);
  });

  test('verificationEnabled comments document default ON + settings/env opt-out', () => {
    const src = readSrc('electron/llm/codeVerification/verificationEnabled.ts');
    assert.match(src, /DEFAULT ON/i);
    assert.match(src, /NATIVELY_CODE_VERIFY/);
    assert.match(src, /codeVerificationEnabled/);
    assert.match(src, /off|opt-?out|kill-switch/i);
  });
});
