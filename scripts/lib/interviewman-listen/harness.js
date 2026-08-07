// scripts/lib/interviewman-listen/harness.js
//
// Pure helpers for the interviewman-listen Electron Playwright e2e family.
// No Electron / Playwright I/O — unit-testable.
//
// Glossary: interviewman-listen-e2e-family, interviewman-listen-e2e-ci-gate
// Distinct from sd-overlay-interview (NO-AUDIO SD gate chrome).

'use strict';

/** Overlay listen / Ask chrome (CONTEXT selectors term). */
const LISTEN_TESTIDS = Object.freeze({
  listenToggle: 'listen-transport-toggle',
  listenCluster: 'listen-transport-cluster',
  listenUnready: 'listen-transport-unready',
  transcriptPanel: 'live-transcript-panel',
  askBar: 'bottom-ask-bar',
  askThink: 'bottom-ask-think',
  askSubmit: 'bottom-ask-submit',
  askInput: 'overlay-chat-input',
  endMeeting: 'end-meeting',
  /** Must remain absent after Ask chip removal. */
  legacyAskChip: 'ask-submit-chip',
});

/**
 * Local opt-in gate. No GitHub CI — operators set RUN_INTERVIEWMAN_LISTEN=1.
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {{ run: boolean, mode: 'local' | 'skip', reason: string }}
 */
function shouldRunInterviewmanListen(env = process.env) {
  if (env.RUN_INTERVIEWMAN_LISTEN === '1') {
    return {
      run: true,
      mode: 'local',
      reason: 'RUN_INTERVIEWMAN_LISTEN=1',
    };
  }
  return {
    run: false,
    mode: 'skip',
    reason:
      'RUN_INTERVIEWMAN_LISTEN unset — set RUN_INTERVIEWMAN_LISTEN=1 to run locally (no GitHub CI)',
  };
}

function interviewmanListenSkipMessage(decision) {
  return (
    `[interviewman-listen] SKIP — ${decision?.reason || 'not configured'}. ` +
    'Local opt-in only (no GitHub CI). Separate from e2e:sd-overlay-interview NO-AUDIO family.'
  );
}

function wantsRealAudio(env = process.env) {
  return env.RUN_INTERVIEWMAN_LISTEN_REAL_AUDIO === '1';
}

module.exports = {
  LISTEN_TESTIDS,
  shouldRunInterviewmanListen,
  interviewmanListenSkipMessage,
  wantsRealAudio,
};
