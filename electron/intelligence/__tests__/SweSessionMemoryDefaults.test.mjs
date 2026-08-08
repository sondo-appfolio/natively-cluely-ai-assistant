// SWE-MEMORY (always-stealth SWE coach, swe-coach-build-order step 6):
// Same-session follow-ups under technical-interview use durable live transcript
// memory + conversationMemoryV2 — NOT Hindsight LTM (deferred).
//
// Pins:
//   1. durableMemoryWindow + conversationMemoryV2 default ON for packaged TI.
//   2. All hindsight* flags stay default OFF.
//   3. LiveTranscriptBrain.getMemoryWindow retains long-range entities by default.
//   4. resolveLiveFollowup under technical-interview recalls session entities
//      without any Hindsight flag/env.
//   5. Live session memory rollout remains default ON (existing seam).

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  isIntelligenceFlagEnabled,
  isDurableMemoryWindowEnabled,
  intelligenceFlagMeta,
  __resetIntelligenceFlagsCache,
} from '../../../dist-electron/electron/intelligence/intelligenceFlags.js';
import { LiveTranscriptBrain } from '../../../dist-electron/electron/intelligence/LiveTranscriptBrain.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const llm = await import(
  pathToFileURL(path.resolve(__dirname, '../../../dist-electron/electron/llm/index.js')).href
);
const {
  resolveLiveFollowup,
  isLiveSessionMemoryEnabled,
  resolveLiveSessionMemoryConfig,
  __resetLiveSessionMemoryCache,
} = llm;

const MIN = 60;

const FLAG_ENV_KEYS = [
  'NATIVELY_DURABLE_MEMORY_WINDOW',
  'NATIVELY_CONVERSATION_MEMORY_V2',
  'NATIVELY_HINDSIGHT_MEMORY',
  'NATIVELY_HINDSIGHT_LIVE_RECALL',
  'NATIVELY_HINDSIGHT_POST_MEETING_RETAIN',
  'NATIVELY_ENABLE_LIVE_SESSION_MEMORY',
  'NATIVELY_LIVE_SESSION_MEMORY_KILL_SWITCH',
  'NATIVELY_LIVE_SESSION_MEMORY_ROLLOUT_PERCENT',
  'NATIVELY_INTERNAL',
  'NATIVELY_DEV',
];

let saved = {};
beforeEach(() => {
  saved = {};
  for (const k of FLAG_ENV_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  __resetIntelligenceFlagsCache();
  __resetLiveSessionMemoryCache();
});
afterEach(() => {
  for (const k of FLAG_ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  __resetIntelligenceFlagsCache();
  __resetLiveSessionMemoryCache();
});

/** Minimal SessionTracker-like: contextItems evict at 120s; fullTranscript is durable. */
class FakeSession {
  constructor(nowSec = 0) {
    this.now = nowSec * 1000;
    this.contextItems = [];
    this.fullTranscript = [];
  }
  setNow(sec) { this.now = sec * 1000; }
  add(role, text, atSec) {
    const timestamp = atSec * 1000;
    const item = { role, text, timestamp };
    this.contextItems.push(item);
    this.fullTranscript.push({ speaker: role === 'interviewer' ? 'system' : role, text, timestamp, final: true });
    const cutoff = this.now - 120_000;
    this.contextItems = this.contextItems.filter((i) => i.timestamp >= cutoff);
  }
  getContext(lastSeconds = 180) {
    const c = this.now - lastSeconds * 1000;
    return this.contextItems.filter((i) => i.timestamp >= c);
  }
  getContextWithInterim(s) { return this.getContext(s); }
  getDurableContext(lastSeconds = 7200) {
    const c = this.now - lastSeconds * 1000;
    return this.fullTranscript
      .filter((i) => i.timestamp >= c)
      .map((i) => ({
        role: i.speaker === 'system' ? 'interviewer' : i.speaker,
        text: i.text,
        timestamp: i.timestamp,
      }));
  }
  getLastInterviewerTurn() {
    const hit = [...this.contextItems].reverse().find((i) => i.role === 'interviewer');
    return hit?.text ?? null;
  }
}

describe('SWE-MEMORY — packaged TI same-session defaults (no Hindsight)', () => {
  test('durableMemoryWindow + conversationMemoryV2 default ON; hindsight* stay OFF', () => {
    assert.equal(isDurableMemoryWindowEnabled(), true, 'durableMemoryWindow must default ON for TI same-session recall');
    assert.equal(isIntelligenceFlagEnabled('conversationMemoryV2'), true, 'conversationMemoryV2 must default ON for Ask-bar follow-ups');
    assert.equal(intelligenceFlagMeta('durableMemoryWindow').default, true);
    assert.equal(intelligenceFlagMeta('conversationMemoryV2').default, true);

    assert.equal(isIntelligenceFlagEnabled('hindsightMemory'), false);
    assert.equal(isIntelligenceFlagEnabled('hindsightLiveRecall'), false);
    assert.equal(isIntelligenceFlagEnabled('hindsightPostMeetingRetain'), false);
  });

  test('live session memory rollout defaults ON (existing seam; kill switch still wins)', () => {
    const c = resolveLiveSessionMemoryConfig('ti-session-1');
    assert.equal(c.enabled, true);
    assert.equal(isLiveSessionMemoryEnabled('ti-session-1'), true);

    process.env.NATIVELY_LIVE_SESSION_MEMORY_KILL_SWITCH = '1';
    __resetLiveSessionMemoryCache();
    assert.equal(isLiveSessionMemoryEnabled('ti-session-1'), false);
  });

  test('LiveTranscriptBrain memory window retains a minute-1 entity by default (no env)', () => {
    const s = new FakeSession(0);
    s.add('interviewer', 'Tell me about Project Polaris.', 60);
    s.add('user', 'It is our data platform rewrite.', 90);
    s.setNow(62 * 60); // ~hour later — contextItems eviction drops Polaris
    s.add('interviewer', 'What was the hardest part of that project?', 62 * 60);

    const brain = new LiveTranscriptBrain(s);
    const mem = brain.getMemoryWindow(7200).map((t) => t.text).join(' ');
    assert.match(mem, /Polaris/, 'default-ON durableMemoryWindow must keep long-range entity in getMemoryWindow');
    assert.doesNotMatch(
      s.getContext(7200).map((t) => t.text).join(' '),
      /Polaris/,
      'sanity: short contextItems window must have lost Polaris',
    );
  });

  test('TI follow-up resolves via session memory without any Hindsight flag', () => {
    // Prove the live follow-up path used by IntelligenceEngine under technical-interview:
    // long-range project recall → resolved question names the entity. No Hindsight env set.
    for (const k of ['NATIVELY_HINDSIGHT_MEMORY', 'NATIVELY_HINDSIGHT_LIVE_RECALL', 'NATIVELY_HINDSIGHT_POST_MEETING_RETAIN']) {
      assert.equal(process.env[k], undefined, `${k} must stay unset`);
    }

    const r = resolveLiveFollowup({
      turns: [
        { role: 'interviewer', text: 'Tell me about Natively.', t: 1 * MIN },
        { role: 'user', text: 'An AI interview copilot.', t: 2 * MIN },
        { role: 'interviewer', text: 'filler about culture', t: 30 * MIN },
        { role: 'interviewer', text: 'What was the hardest part of that project?', t: 62 * MIN },
      ],
      latestQuestion: 'What was the hardest part of that project?',
      mode: 'technical-interview',
      surface: 'what_to_answer',
    });

    assert.equal(r.recalledEntity, 'Natively');
    assert.match(r.resolvedQuestion, /Natively/);
    assert.ok(!r.isClarification, 'must not fall through to clarification when session memory hits');
    assert.equal(r.resolvedVia, 'session_memory');
    assert.ok(r.confidence >= 0.7);
  });

  test('env OFF still disables conversationMemoryV2 / durableMemoryWindow (overrides win)', () => {
    process.env.NATIVELY_CONVERSATION_MEMORY_V2 = 'off';
    process.env.NATIVELY_DURABLE_MEMORY_WINDOW = '0';
    __resetIntelligenceFlagsCache();
    assert.equal(isIntelligenceFlagEnabled('conversationMemoryV2'), false);
    assert.equal(isDurableMemoryWindowEnabled(), false);
  });
});
