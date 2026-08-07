#!/usr/bin/env node
// scripts/e2e/interviewman-listen.mjs
//
// InterviewMan listen control-map e2e (family: interviewman-listen).
// Playwright `_electron` + `__e2e__:arm-listen-meeting` (no mic TCC).
// Forever separate from e2e:sd-overlay-interview NO-AUDIO SD gate suite.
//
// Glossary / ADR: docs/interviewman-listen/CONTEXT.md, docs/adr/0016-*.md
//
// Usage:
//   RUN_INTERVIEWMAN_LISTEN=1 npm run e2e:interviewman-listen
//   RUN_INTERVIEWMAN_LISTEN=1 RUN_INTERVIEWMAN_LISTEN_REAL_AUDIO=1 npm run e2e:interviewman-listen
//
// Local opt-in only — no GitHub CI job for this suite.

import { _electron as electron } from '@playwright/test';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

try {
  require('dotenv').config({ path: path.join(repoRoot, '.env') });
} catch {
  /* optional */
}

const {
  shouldRunInterviewmanListen,
  interviewmanListenSkipMessage,
  LISTEN_TESTIDS,
  wantsRealAudio,
} = require('../lib/interviewman-listen/harness.js');

const TAG = '[interviewman-listen]';
const LOCAL_TOKEN = process.env.NATIVELY_E2E_LOCAL_TEST_TOKEN || 'local-test-e2e-token';
const distMain = path.join(repoRoot, 'dist-electron', 'electron', 'main.js');
const ARTIFACT_DIR = path.join(repoRoot, 'debug-artifacts', 'interviewman-listen');

const NAV_RE = /Execution context was destroyed|because of a navigation|Target closed|has been closed/i;

function log(...a) {
  process.stdout.write(`${TAG} ${a.map(String).join(' ')}\n`);
}

function skip(msg) {
  console.log(typeof msg === 'string' ? msg : interviewmanListenSkipMessage(msg));
  process.exit(0);
}

function fail(msg) {
  console.error(TAG, 'FAIL —', msg);
  process.exit(1);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function makeR(getWin) {
  return async (ch, ...a) => {
    let lastErr;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const win = getWin();
        if (!win) throw new Error('no window');
        return await win.evaluate(
          async ({ ch, a }) => (window.electronAPI || window.api).e2eInvoke(ch, ...a),
          { ch, a },
        );
      } catch (e) {
        lastErr = e;
        if (!NAV_RE.test(String(e?.message || e))) throw e;
        await sleep(1500);
      }
    }
    throw lastErr;
  };
}

function buildLaunchEnv(udd) {
  return {
    ...process.env,
    NATIVELY_E2E: '1',
    NATIVELY_E2E_LOCAL_TEST_TOKEN: LOCAL_TOKEN,
    NATIVELY_TEST_USERDATA: udd,
    NODE_ENV: process.env.NODE_ENV === 'development' ? 'development' : 'test',
    NATIVELY_DEV_BYPASS_SCREEN_TCC: '1',
    NATIVELY_OKF_KNOWLEDGE_PACKS: process.env.NATIVELY_OKF_KNOWLEDGE_PACKS || '0',
  };
}

function windowSearch(url) {
  try {
    return new URL(url).search || '';
  } catch {
    return url || '';
  }
}

/** TopPill aux window — red square + triangle end-meeting. */
async function findPillWindow(app) {
  for (const w of app.windows()) {
    try {
      if (/window=overlay-pill/.test(windowSearch(w.url()))) return w;
    } catch {
      /* ignore */
    }
  }
  for (const w of app.windows()) {
    try {
      if (await w.evaluate(() => /window=overlay-pill/.test(location.search))) return w;
    } catch {
      /* ignore */
    }
  }
  return null;
}

/**
 * Full overlay shell (Ask bar + Transcription). Exclude overlay-pill / overlay-toggle.
 */
async function findOverlayWindow(app) {
  const wins = app.windows();
  const isAux = (s) => /window=overlay-pill|window=overlay-toggle/.test(s);

  for (const w of wins) {
    try {
      const s = windowSearch(w.url());
      if (isAux(s)) continue;
      if (/[?&]window=overlay(?:&|$)/.test(s) || /window=overlay$/.test(s)) return w;
    } catch {
      /* ignore */
    }
  }
  for (const w of wins) {
    try {
      const hit = await w.evaluate(() => {
        const s = location.search || '';
        if (/window=overlay-pill|window=overlay-toggle/.test(s)) return false;
        return /window=overlay/.test(s);
      });
      if (hit) return w;
    } catch {
      /* ignore */
    }
  }
  for (const w of wins) {
    try {
      const hasShell = await w.evaluate(() =>
        Boolean(document.querySelector('[data-testid="bottom-ask-bar"]')),
      );
      if (hasShell) return w;
    } catch {
      /* ignore */
    }
  }
  return null;
}

async function waitForTestId(win, testid, { timeout = 20_000, state = 'visible' } = {}) {
  const loc = win.locator(`[data-testid="${testid}"]`);
  await loc.first().waitFor({ state, timeout });
  return loc.first();
}

async function assertAskChrome(win) {
  await waitForTestId(win, LISTEN_TESTIDS.askBar);
  await waitForTestId(win, LISTEN_TESTIDS.askThink);
  await waitForTestId(win, LISTEN_TESTIDS.askSubmit);
  await waitForTestId(win, LISTEN_TESTIDS.askInput);
  const chipCount = await win.locator(`[data-testid="${LISTEN_TESTIDS.legacyAskChip}"]`).count();
  if (chipCount !== 0) fail(`legacy ${LISTEN_TESTIDS.legacyAskChip} still present`);
  log('PASS ask-bar present; ask-submit-chip absent');
}

async function ensureShowTranscription(win) {
  await win.evaluate(() => {
    try {
      localStorage.setItem('natively_interviewer_transcript', 'true');
    } catch {
      /* ignore */
    }
  });
  // Same-document `storage` events do not fire — reload so React re-reads preference.
  await win.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  await sleep(1200);
}

async function dumpListenDebug(win, label) {
  try {
    const info = await win.evaluate(async () => {
      const toggle = document.querySelector('[data-testid="listen-transport-toggle"]');
      const panel = document.querySelector('[data-testid="live-transcript-panel"]');
      let transport = null;
      try {
        transport = await window.electronAPI?.getListenTransport?.();
      } catch {
        /* ignore */
      }
      return {
        search: location.search,
        ls: localStorage.getItem('natively_interviewer_transcript'),
        toggle: Boolean(toggle),
        pressed: toggle?.getAttribute('aria-pressed') ?? null,
        panel: Boolean(panel),
        panelBox: panel ? panel.getBoundingClientRect() : null,
        ask: Boolean(document.querySelector('[data-testid="bottom-ask-bar"]')),
        transport,
      };
    });
    log(`DEBUG[${label}] ${JSON.stringify(info)}`);
  } catch (e) {
    log(`DEBUG[${label}] evaluate failed: ${e?.message || e}`);
  }
}

async function assertArmedChrome(shellWin, pillWin) {
  await ensureShowTranscription(shellWin);
  const toggle = await waitForTestId(pillWin, LISTEN_TESTIDS.listenToggle);
  const pressed = await toggle.getAttribute('aria-pressed');
  if (pressed !== 'true') {
    await dumpListenDebug(pillWin, 'armed-toggle-pill');
    await dumpListenDebug(shellWin, 'armed-toggle-shell');
    fail(`listen-transport-toggle aria-pressed=${pressed} (expected true)`);
  }
  try {
    await waitForTestId(shellWin, LISTEN_TESTIDS.transcriptPanel, { timeout: 12_000 });
  } catch (e) {
    await dumpListenDebug(shellWin, 'armed-panel');
    throw e;
  }
  log('PASS armed toggle (pill) + live-transcript-panel (shell)');
}

async function assertThinkKeepsArmed(shellWin, pillWin) {
  await shellWin.locator(`[data-testid="${LISTEN_TESTIDS.askThink}"]`).click();
  await sleep(300);
  const pressed = await pillWin
    .locator(`[data-testid="${LISTEN_TESTIDS.listenToggle}"]`)
    .getAttribute('aria-pressed');
  if (pressed !== 'true') fail(`Think changed listen transport (aria-pressed=${pressed})`);
  log('PASS Think leaves listen armed');
}

async function assertTypedSubmitKeepsArmed(shellWin, pillWin) {
  const input = shellWin.locator(`[data-testid="${LISTEN_TESTIDS.askInput}"]`);
  await input.fill('e2e listen typed ask — ignore');
  await shellWin.locator(`[data-testid="${LISTEN_TESTIDS.askSubmit}"]`).click();
  await sleep(400);
  const pressed = await pillWin
    .locator(`[data-testid="${LISTEN_TESTIDS.listenToggle}"]`)
    .getAttribute('aria-pressed');
  if (pressed !== 'true') fail(`typed ↑ changed listen transport (aria-pressed=${pressed})`);
  log('PASS typed ↑ leaves listen armed');
}

async function assertPauseWithoutEnd(shellWin, pillWin) {
  await pillWin.locator(`[data-testid="${LISTEN_TESTIDS.listenToggle}"]`).click();
  await sleep(400);
  const pressed = await pillWin
    .locator(`[data-testid="${LISTEN_TESTIDS.listenToggle}"]`)
    .getAttribute('aria-pressed');
  if (pressed === 'true') fail('pause did not clear aria-pressed');
  const askVisible = await shellWin.locator(`[data-testid="${LISTEN_TESTIDS.askBar}"]`).isVisible();
  if (!askVisible) fail('pause tore down Ask bar / meeting unexpectedly');
  log('PASS pause unarms without ending meeting');
}

async function assertSpeakerWiring(win, R) {
  const feed = await R('__e2e__:inject-live-transcript', {
    speaker: 'interviewer',
    text: 'Speaker wiring probe from interviewer',
    final: true,
  });
  if (!feed?.success) fail(`inject-live-transcript interviewer failed: ${JSON.stringify(feed)}`);
  const feed2 = await R('__e2e__:inject-live-transcript', {
    speaker: 'user',
    text: 'Speaker wiring probe from user',
    final: true,
  });
  if (!feed2?.success) fail(`inject-live-transcript user failed: ${JSON.stringify(feed2)}`);
  await sleep(500);
  const panel = win.locator(`[data-testid="${LISTEN_TESTIDS.transcriptPanel}"]`);
  const text = await panel.innerText();
  if (!/Speaker 1:/.test(text)) fail(`missing Speaker 1: in panel — got: ${text.slice(0, 200)}`);
  if (!/Speaker 2:/.test(text)) fail(`missing Speaker 2: in panel — got: ${text.slice(0, 200)}`);
  log('PASS Speaker 1/2 panel wiring (controlled feed)');
}

async function assertUnreadyPath(app, R) {
  const arm = await R('__e2e__:arm-listen-meeting', { mode: 'unready' });
  if (!arm?.success) fail(`arm-listen-meeting unready failed: ${JSON.stringify(arm)}`);
  if (arm.via === 'e2e-no-audio') fail('unready arm returned e2e-no-audio via — wrong seam');
  const shellWin = await findOverlayWindow(app);
  const pillWin = await findPillWindow(app);
  if (!shellWin || !pillWin) fail('unready: missing shell or pill window');
  await waitForTestId(shellWin, LISTEN_TESTIDS.listenUnready, { timeout: 15_000 });
  const fakeListening = await shellWin
    .locator(`[data-testid="${LISTEN_TESTIDS.transcriptPanel}"]`)
    .isVisible()
    .catch(() => false);
  const pressed = await pillWin
    .locator(`[data-testid="${LISTEN_TESTIDS.listenToggle}"]`)
    .getAttribute('aria-pressed')
    .catch(() => null);
  if (pressed === 'true') fail('unready path left listen toggle armed');
  log(
    `PASS unready banner; transcript panel visible=${fakeListening} (ok if false); aria-pressed=${pressed}`,
  );
}

async function assertEndMeeting(shellWin, pillWin) {
  // Prefer product IPC (pill click can be stealth/click-through flaky in e2e).
  const ended = await shellWin.evaluate(async () => {
    const api = window.electronAPI || window.api;
    if (typeof api?.endMeeting === 'function') return api.endMeeting();
    return { success: false, error: 'no_endMeeting' };
  });
  if (!ended?.success && ended?.error !== undefined) {
    // Fall back to triangle click.
    await pillWin.locator(`[data-testid="${LISTEN_TESTIDS.endMeeting}"]`).click({ force: true });
  }
  await sleep(1500);
  const askVisible = await shellWin
    .locator(`[data-testid="${LISTEN_TESTIDS.askBar}"]`)
    .isVisible()
    .catch(() => false);
  const transport = await shellWin
    .evaluate(async () => {
      try {
        return await window.electronAPI?.getListenTransport?.();
      } catch {
        return null;
      }
    })
    .catch(() => null);
  // After end, transport should leave armed (idle/ended) even if windows linger briefly.
  if (transport?.state === 'armed') {
    fail(`end-meeting left listenTransport armed: ${JSON.stringify(transport)}`);
  }
  if (askVisible && transport?.state === 'armed') {
    fail('end-meeting left Ask bar + armed transport');
  }
  log(`PASS end-meeting teardown (askVisible=${askVisible} transport=${transport?.state || 'n/a'})`);
}

async function main() {
  const decision = shouldRunInterviewmanListen(process.env);
  if (!decision.run) skip(decision);

  if (wantsRealAudio(process.env)) {
    log('NOTE RUN_INTERVIEWMAN_LISTEN_REAL_AUDIO=1 set — default path still uses arm-listen-meeting; real startMeeting not required for this slice');
  }

  if (!fs.existsSync(distMain)) {
    fail(`missing ${distMain} — run npm run build && npm run build:electron first`);
  }

  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const udd = fs.mkdtempSync(path.join(os.tmpdir(), 'natively-listen-e2e-'));
  let app;
  let win;

  try {
    log(`launching electron main=${distMain} udd=${udd}`);
    app = await electron.launch({
      args: [distMain, `--user-data-dir=${udd}`],
      env: buildLaunchEnv(udd),
      timeout: 60_000,
    });

    win = await app.firstWindow();
    await win.waitForLoadState('domcontentloaded').catch(() => {});
    await sleep(1500);

    const getWin = () => win;
    const R = makeR(getWin);

    await R('__e2e__:enable-pro').catch(() => {});

    // --- Happy armed path ---
    const arm = await R('__e2e__:arm-listen-meeting', {
      mode: 'armed',
      turns: [],
    });
    if (!arm?.success) fail(`arm-listen-meeting failed: ${JSON.stringify(arm)}`);
    if (arm.via !== 'e2e-arm-listen') {
      fail(`expected via e2e-arm-listen, got ${arm.via} (must not use e2e-no-audio)`);
    }
    if (arm.listenTransport?.state !== 'armed') {
      fail(`listenTransport.state=${arm.listenTransport?.state} (expected armed)`);
    }
    log(`armed via=${arm.via} meetingId=${arm.meetingId}`);

    const shellWin = await findOverlayWindow(app);
    const pillWin = await findPillWindow(app);
    if (!shellWin) fail('could not find full overlay shell window (window=overlay)');
    if (!pillWin) fail('could not find overlay-pill window');
    win = shellWin;
    await sleep(800);

    await assertArmedChrome(shellWin, pillWin);
    await assertAskChrome(shellWin);
    await assertThinkKeepsArmed(shellWin, pillWin);
    await assertTypedSubmitKeepsArmed(shellWin, pillWin);
    await assertSpeakerWiring(shellWin, R);
    await assertPauseWithoutEnd(shellWin, pillWin);
    await assertEndMeeting(shellWin, pillWin);

    // --- Unready path (fresh arm) ---
    await assertUnreadyPath(app, R);

    log('PASS all interviewman-listen first-slice asserts');
    try {
      await Promise.race([
        app?.close?.() ?? Promise.resolve(),
        sleep(5000).then(() => {
          throw new Error('app.close timeout');
        }),
      ]);
    } catch {
      try {
        app?.process()?.kill?.('SIGKILL');
      } catch {
        /* ignore */
      }
    }
    try {
      fs.rmSync(udd, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    process.exit(0);
  } catch (e) {
    console.error(TAG, e);
    try {
      if (win) {
        await win.screenshot({ path: path.join(ARTIFACT_DIR, 'failure.png') }).catch(() => {});
      }
    } catch {
      /* ignore */
    }
    try {
      await Promise.race([app?.close?.() ?? Promise.resolve(), sleep(3000)]);
    } catch {
      try {
        app?.process()?.kill?.('SIGKILL');
      } catch {
        /* ignore */
      }
    }
    try {
      fs.rmSync(udd, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    fail(e?.message || String(e));
  }
}

main();
