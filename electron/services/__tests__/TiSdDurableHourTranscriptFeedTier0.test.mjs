// electron/services/__tests__/TiSdDurableHourTranscriptFeedTier0.test.mjs
//
// Ticket 03 (win-first-context-retention) — TI SD hot path: durable 3600s +
// maxTurns 48.
//
// Proves, against the real IntelligenceEngine.runWhatShouldISay path (compiled
// dist-electron, same code Electron main runs):
//   1. A Requirements constraint spoken ~4 minutes earlier (older than the
//      180s ring) is STILL present in the prepared transcript fed to
//      WhatToAnswerLLM on a Technical Interview sticky-session clarifier turn.
//   2. The exact same setup on a non-TI mode (general) still uses the 180s
//      ring — the old constraint is dropped, proving non-TI behavior is
//      unchanged.
//   3. The live path never dumps the unbounded fullTranscript: an interviewer
//      turn from 2 hours ago (outside the 3600s durable window) is absent.
//
// Run: npm run build:electron && node --test electron/services/__tests__/TiSdDurableHourTranscriptFeedTier0.test.mjs

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distElectron = path.resolve(__dirname, '../../../dist-electron/electron');

async function loadIntelligenceEngine() {
  return import(pathToFileURL(path.join(distElectron, 'IntelligenceEngine.js')).href);
}
async function loadSessionTracker() {
  return import(pathToFileURL(path.join(distElectron, 'SessionTracker.js')).href);
}
async function loadGate() {
  return import(pathToFileURL(path.join(distElectron, 'llm/sdRequirementsGate.js')).href);
}

class StubLLMHelper {
  getActiveModel() { return { provider: 'gemini', model: 'gemini-3-flash' }; }
  isStreamingSupported() { return true; }
  setNegotiationCoachingHandler(_fn) { /* no-op */ }
  getGeminiClient() { return null; }
  getOpenAIClient() { return null; }
  getClaudeClient() { return null; }
  getGroqClient() { return null; }
  getOllamaClient() { return null; }
  getModesManager() { return { getActiveMode: () => null, getActiveModeSystemPromptSuffix: () => '' }; }
  getSettingsManager() { return { get: () => null, set: () => {} }; }
}

async function makeEngine({ modeId }) {
  const { IntelligenceEngine } = await loadIntelligenceEngine();
  const { SessionTracker } = await loadSessionTracker();
  const session = new SessionTracker();
  const engine = new IntelligenceEngine(new StubLLMHelper(), session);

  // getActiveModeId/getActiveModeInfo read a live ModesManager singleton in
  // production; override the instance methods directly (TS `private` is
  // compile-time only) so the test controls the mode deterministically.
  engine.getActiveModeId = () => modeId;
  engine.getActiveModeInfo = () => (
    modeId === 'technical-interview'
      ? { id: 'ti', templateType: 'technical-interview', name: 'Technical Interview', isCustom: false }
      : { id: 'general', templateType: 'general', name: 'General', isCustom: false }
  );

  const calls = [];
  engine.whatToAnswerLLM = {
    async *generateStream(cleanedTranscript) {
      calls.push({ cleanedTranscript });
      yield 'A reasonable clarifier answer grounded in the stated constraints.';
    },
  };

  return { engine, session, calls };
}

const PROBLEM = 'Design a URL shortener like Bitly.';
const OLD_CONSTRAINT = 'We need to support 100000 QPS with 99.99 percent availability.';
const CLARIFIER_QUESTION = 'For analytics, do you want total clicks only or a geo and device breakdown?';

function seedTranscript(session, now) {
  // Spoken ~4 minutes ago: outside the default 180s ring, inside the 3600s
  // durable window.
  session.addTranscript({
    speaker: 'interviewer',
    text: OLD_CONSTRAINT,
    timestamp: now - 4 * 60 * 1000,
    final: true,
  });
  // A couple of recent turns so the window isn't trivially empty.
  session.addTranscript({
    speaker: 'interviewer',
    text: 'Great, thanks for confirming scale.',
    timestamp: now - 30 * 1000,
    final: true,
  });
  session.addTranscript({
    speaker: 'interviewer',
    text: CLARIFIER_QUESTION,
    timestamp: now - 2 * 1000,
    final: true,
  });
}

describe('TI SD hot path: durable 3600s transcript feed (ticket 03)', () => {
  test('TI + sticky SD session clarifier turn retains a ~4-minute-old constraint', async () => {
    const now = Date.now();
    const { engine, session, calls } = await makeEngine({ modeId: 'technical-interview' });
    const gate = await loadGate();

    // Sticky SD session already open (a prior turn established the problem).
    session.setSdRequirementsArtifact(gate.createEmptyRequirementsArtifact(PROBLEM));
    seedTranscript(session, now);

    const answer = await engine.runWhatShouldISay(undefined, 0.8, undefined, { skipCooldown: true });

    assert.ok(answer, 'expected a spoken answer');
    assert.equal(calls.length, 1);
    assert.match(
      calls[0].cleanedTranscript,
      /100000 QPS|99\.99 percent availability/i,
      'a Requirements constraint spoken ~4 minutes earlier must survive on the TI SD hot path',
    );
  });

  test('non-TI mode with the same transcript still uses the 180s ring (constraint dropped)', async () => {
    const now = Date.now();
    const { engine, session, calls } = await makeEngine({ modeId: 'general' });
    seedTranscript(session, now);

    const answer = await engine.runWhatShouldISay(undefined, 0.8, undefined, { skipCooldown: true });

    assert.ok(answer);
    assert.equal(calls.length, 1);
    assert.doesNotMatch(
      calls[0].cleanedTranscript,
      /100000 QPS|99\.99 percent availability/i,
      'non-TI turns must keep the short 180s ring, not the durable window',
    );
  });

  test('TI + no sticky SD session (no problemKey) also stays on the 180s ring', async () => {
    const now = Date.now();
    const { engine, session, calls } = await makeEngine({ modeId: 'technical-interview' });
    seedTranscript(session, now);

    const answer = await engine.runWhatShouldISay(undefined, 0.8, undefined, { skipCooldown: true });

    assert.ok(answer);
    assert.equal(calls.length, 1);
    assert.doesNotMatch(
      calls[0].cleanedTranscript,
      /100000 QPS|99\.99 percent availability/i,
      'TI mode alone (no sticky problemKey / gate armed) must not broaden to the durable window',
    );
  });

  test('never dumps the unbounded fullTranscript: a 2h-old turn stays outside the 3600s durable window', async () => {
    const now = Date.now();
    const { engine, session, calls } = await makeEngine({ modeId: 'technical-interview' });
    const gate = await loadGate();
    session.setSdRequirementsArtifact(gate.createEmptyRequirementsArtifact(PROBLEM));

    session.addTranscript({
      speaker: 'interviewer',
      text: 'Ancient onboarding chit-chat from two hours ago about the weather.',
      timestamp: now - 2 * 60 * 60 * 1000,
      final: true,
    });
    seedTranscript(session, now);

    const answer = await engine.runWhatShouldISay(undefined, 0.8, undefined, { skipCooldown: true });

    assert.ok(answer);
    assert.equal(calls.length, 1);
    assert.doesNotMatch(
      calls[0].cleanedTranscript,
      /weather/i,
      'the durable feed must stay bounded to 3600s, never the full unbounded transcript',
    );
    assert.match(calls[0].cleanedTranscript, /100000 QPS|99\.99 percent availability/i);
  });
});
