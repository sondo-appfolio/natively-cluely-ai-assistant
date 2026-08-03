// electron/services/__tests__/Tier0WinFirstContextRetentionAcceptanceTicket04.test.mjs
//
// Ticket 04 (win-first-context-retention) — Tier0 acceptance suite proving:
//
//   (a) a filled FR/NFR Requirements constraint spoken >=3 minutes earlier
//       still affects a TI SD clarifier/requirements turn — both the raw
//       durable transcript (ticket 03) AND the persisted "filled" checklist
//       slot state (this ticket) survive, and actively steer grill pacing so
//       the already-answered slots are never re-asked.
//   (b) a post-gate answer path can still see an early design-sheet
//       commitment from a prior turn (SPECs 05/06) without the CURRENT
//       turn's transcript re-eliciting / restating it.
//   (c) a documented, schedule/dispatch-only note (not a dual-agent CI
//       oracle) for an optional >=25-turn long-loop checklist-slot
//       non-loss check, pointing at the existing T2 sim harness.
//   Token usage may be logged for ops visibility but is never the pass/fail
//   oracle anywhere in this suite (dedicated test below proves it).
//
// Prior art reused as-is (not re-implemented here): TiSdDurableHourTranscriptFeedTier0
// (ticket 03, full IntelligenceEngine hot-path proof), SdDeepDiveLiveWiringTier0 /
// SdDeepDiveContextPackTier0 (SPECs 05/06 pack + live merge), SdSessionAuthority*Tier0
// (GM-vs-SD arming contract — deliberately not re-litigated).
//
// Run: npm run build:electron && node --test electron/services/__tests__/Tier0WinFirstContextRetentionAcceptanceTicket04.test.mjs

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const distElectron = path.resolve(__dirname, '../../../dist-electron/electron');
const distLlm = path.join(distElectron, 'llm');

async function loadIntelligenceEngine() {
  return import(pathToFileURL(path.join(distElectron, 'IntelligenceEngine.js')).href);
}
async function loadSessionTracker() {
  return import(pathToFileURL(path.join(distElectron, 'SessionTracker.js')).href);
}
async function loadGate() {
  return import(pathToFileURL(path.join(distLlm, 'sdRequirementsGate.js')).href);
}
async function loadDeepDiveLive() {
  return import(pathToFileURL(path.join(distLlm, 'sdDeepDiveLive.js')).href);
}
async function loadWhatToAnswerLLM() {
  return import(pathToFileURL(path.join(distLlm, 'WhatToAnswerLLM.js')).href);
}
async function loadAnswerPlanner() {
  return import(pathToFileURL(path.join(distLlm, 'AnswerPlanner.js')).href);
}
async function loadContextPack() {
  return import(pathToFileURL(path.join(distLlm, 'sdDeepDiveContextPack.js')).href);
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
    async *generateStream(...args) {
      calls.push({ cleanedTranscript: args[0], answerPlan: args[9], requestSnapshot: args[args.length - 1] });
      yield 'A reasonable answer grounded in the stated constraints.';
    },
  };

  return { engine, session, calls };
}

const PROBLEM = 'Design a URL shortener like Bitly.';
const OLD_CONSTRAINT = 'We need to support 100000 QPS with 99.99 percent availability.';
const CLARIFIER_QUESTION = 'For analytics, do you want total clicks only or a geo and device breakdown?';

function seedTranscript(session, now) {
  session.addTranscript({
    speaker: 'interviewer',
    text: OLD_CONSTRAINT,
    timestamp: now - 4 * 60 * 1000, // ~4 minutes ago — >=3 minute acceptance bar, still inside 3600s durable window
    final: true,
  });
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

describe('Ticket 04(a): filled FR/NFR constraint >=3min old still affects a TI SD clarifier/requirements turn', () => {
  test('already-filled scale_qps + consistency_availability survive a later clarifier turn (no reset, no re-ask); raw wording also survives the durable window', async () => {
    const now = Date.now();
    const gate = await loadGate();
    const { engine, session, calls } = await makeEngine({ modeId: 'technical-interview' });

    // At minute ~1 of the interview, the live Requirements gate already
    // captured this constraint into two checklist slots (this is what
    // fillArtifactFromInterviewerText does on the turn the interviewer said
    // it). Two mandatory slots remain open, so the artifact stays in the
    // 'requirements' phase for the clarifier turn under test below.
    let artifact = gate.createEmptyRequirementsArtifact(PROBLEM);
    artifact = gate.fillSlotFromInterviewer(artifact, 'scale_qps', '100000 QPS');
    artifact = gate.fillSlotFromInterviewer(artifact, 'consistency_availability', '99.99 percent availability');
    const problemKeyBefore = artifact.problemKey;
    session.setSdRequirementsArtifact(artifact);

    seedTranscript(session, now);

    const answer = await engine.runWhatShouldISay(undefined, 0.8, undefined, { skipCooldown: true });

    assert.ok(answer, 'expected a spoken answer');
    assert.equal(calls.length, 1);

    // (1) Raw retention (ticket 03 seam, reconfirmed here): the durable
    // window still carries the exact spoken words ~4 minutes later.
    assert.match(
      calls[0].cleanedTranscript,
      /100000 QPS|99\.99 percent availability/i,
      'a Requirements constraint spoken ~4 minutes earlier must survive on the TI SD hot path',
    );

    // (2) Filled-slot retention: the persisted artifact still shows the two
    // slots filled from minute ~1 — the later clarifier turn must not clear,
    // re-key, or silently forget them.
    const persisted = session.getSdRequirementsArtifact();
    assert.ok(persisted, 'artifact must still be attached to the session after the clarifier turn');
    assert.equal(persisted.problemKey, problemKeyBefore, 'sticky problemKey must be unchanged (no reset)');
    assert.equal(persisted.slots.scale_qps.filled, true);
    assert.equal(persisted.slots.scale_qps.fillSource, 'interviewer');
    assert.equal(persisted.slots.consistency_availability.filled, true);
    assert.equal(persisted.slots.consistency_availability.fillSource, 'interviewer');
    assert.equal(
      gate.deriveSdPhase(persisted),
      'requirements',
      'checklist still incomplete (2 of 4 mandatory slots open) — this is the requirements/clarifier path the acceptance targets',
    );

    // (3) The filled constraint actively "affects" this turn, not just sits
    // inert: grill pacing must skip the already-filled slots and only ask
    // about what's still missing.
    const nextSlots = gate.nextEligibleSlots(persisted, { limit: 4 });
    assert.ok(!nextSlots.includes('scale_qps'), 'already-filled scale_qps must never be re-asked');
    assert.ok(!nextSlots.includes('consistency_availability'), 'already-filled consistency_availability must never be re-asked');
    assert.deepEqual(nextSlots, ['functional_requirements', 'latency']);
  });

  test('sanity control: identical setup on non-TI mode drops the old constraint (180s ring unchanged)', async () => {
    const now = Date.now();
    const { engine, session, calls } = await makeEngine({ modeId: 'general' });
    seedTranscript(session, now);

    const answer = await engine.runWhatShouldISay(undefined, 0.8, undefined, { skipCooldown: true });

    assert.ok(answer);
    assert.equal(calls.length, 1);
    assert.doesNotMatch(
      calls[0].cleanedTranscript,
      /100000 QPS|99\.99 percent availability/i,
      'non-TI turns must keep the short 180s ring, not the durable window (proves (a) is TI-SD-specific, not a global change)',
    );
  });
});

describe("Ticket 04(b): early design-sheet commitment stays visible post-gate without re-elicitation", () => {
  test('a commitment from an earlier post-gate answer still grounds a later post-gate answer that never restates it', async () => {
    const gate = await loadGate();
    const deepDiveLive = await loadDeepDiveLive();
    const { WhatToAnswerLLM } = await loadWhatToAnswerLLM();
    const { planAnswer } = await loadAnswerPlanner();

    const now = Date.now();
    const meetingId = 'ticket04-meeting';

    // Requirements gate already closed (checklist complete + advance accepted).
    let artifact = gate.createEmptyRequirementsArtifact(PROBLEM);
    for (const id of ['functional_requirements', 'scale_qps', 'latency', 'consistency_availability']) {
      artifact = gate.fillSlotFromInterviewer(artifact, id, 'ok');
    }
    artifact = gate.acceptAdvance(artifact);
    assert.equal(gate.deriveSdPhase(artifact), 'post_requirements');
    artifact = gate.ensureSdDeepDiveExtension(artifact);

    // Turn N-1 (several minutes earlier): a completed post-gate answer
    // commits an Entities design decision to the sheet. IntelligenceEngine
    // calls this exact production function after every completed post-gate
    // system_design_answer stream (SPEC 05 post-answer merge).
    const committedTurn = deepDiveLive.applyCompletedSdAnswerToArtifact({
      artifact,
      spokenText:
        'COMMIT id=entities:url section=entities text=URL maps to a short code via Base62 with a 7-char code and 30-day TTL.\n' +
        'We key the mapping store by the short code.',
      meetingId,
      currentMeetingId: meetingId,
      answerType: 'system_design_answer',
      sdPhase: 'post_requirements',
      now: now - 6 * 60 * 1000,
    });
    assert.equal(committedTurn.applied, true);
    assert.ok(
      committedTurn.artifact.designSheet.committed.some((c) => c.id === 'entities:url' && c.status === 'committed'),
      'the earlier commitment must be on the durable design sheet',
    );

    // Turn N (now): a fresh deep-dive question that never mentions Base62 /
    // the 7-char code / TTL. IntelligenceEngine builds this exact snapshot
    // (buildSdDeepDivePackSnapshot) from the persisted artifact for every
    // post-gate system_design_answer turn — no re-elicitation is requested.
    const latestInterviewer = 'How would you handle a sudden spike of hot keys during a viral link?';
    const currentTurnTranscript = `[INTERVIEWER]: ${latestInterviewer}`;
    assert.doesNotMatch(currentTurnTranscript, /Base62/i, 'sanity: the current turn itself never restates the earlier commitment');

    const snapshot = {
      sdDeepDive: deepDiveLive.buildSdDeepDivePackSnapshot(committedTurn.artifact, latestInterviewer),
    };
    assert.match(
      JSON.stringify(snapshot.sdDeepDive.designSheet),
      /Base62/,
      'the request snapshot IntelligenceEngine builds must carry the early commitment forward',
    );

    const answerPlan = {
      ...planAnswer({ question: latestInterviewer, source: 'interviewer' }),
      answerType: 'system_design_answer',
      sdPhase: 'post_requirements',
    };

    const stubModes = {
      getActiveModeSystemPromptSuffix: () => '',
      buildActiveModeContextBlock: () => '',
      buildRetrievedActiveModeContextBlock: () => '',
    };
    const stubHelper = {
      getPromptTier: () => 'tiny',
      getCapabilities: () => ({ outputBudgetTokens: 1000 }),
      fitContextForCurrentModel: (t) => t,
      canUseLocalFallback: async () => false,
      async *streamChat(userMessage) { yield userMessage; },
      getKnowledgeOrchestrator: () => ({ queryRelevantChunks: async () => [] }),
    };

    const wta = new WhatToAnswerLLM(stubHelper, stubModes);
    let out = '';
    for await (const t of wta.generateStream(
      currentTurnTranscript,
      undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
      answerPlan,
      undefined,
      snapshot,
    )) {
      out += t;
    }

    // The answer path is grounded in the persisted sheet — no re-elicitation
    // of the earlier commitment was required from the current turn.
    assert.match(out, /<design_sheet>/);
    assert.match(out, /Base62/);
    assert.match(out, /<latest_interviewer>/);
    assert.match(out, /hot keys/i);
  });
});

describe('Ticket 04(c): optional long-loop (>=25 turns) checklist-slot non-loss — documented, schedule/dispatch only, not a CI oracle', () => {
  // This ticket deliberately does NOT add a dual-agent, always-on CI test for
  // an hour-long (>=25 turn) SD interview loop — that would be slow, live-LLM
  // dependent, and non-deterministic as a merge-blocking oracle. Instead:
  //
  //   Dispatch (manual / scheduled, not part of `npm test`):
  //     SD_INTERVIEW_SIM_T2_MAX_TURNS=25 npm run sd-interview-sim:t2
  //   (raise the turn count further for a full hour-scale run; see
  //   scripts/sd-interview-sim-t2.js for additional env knobs.)
  //
  //   What to eyeball for checklist-slot non-loss:
  //     - The written corpus JSON under traces/sd-interview-sim/ contains the
  //       full turn-by-turn transcript; `npm run sd-interview-sim:digest --
  //       <file>.json` renders a human-readable digest.
  //     - A slot that was filled early (Requirements checklist, or a
  //       designSheet.committed entry post-gate) must still read as filled /
  //       committed at turn >=25 — it must never silently flip back to
  //       missing/uncovered while the interview stays on the same SD problem.
  //     - Any per-turn token/usage figures the harness logs are OPS
  //       TELEMETRY ONLY; a long, token-heavy run is not itself a failure,
  //       and pass/fail must never be decided by comparing token counts
  //       (see the dedicated test below).
  //
  // This test only proves the dispatch entry point exists and is wired,
  // so the note above cannot silently drift from the actual script.
  test('T2 sim harness entry point exists for a manually-dispatched long-loop run', () => {
    const harnessPath = path.join(repoRoot, 'scripts', 'sd-interview-sim-t2.js');
    assert.ok(fs.existsSync(harnessPath), 'expected scripts/sd-interview-sim-t2.js to exist for the optional long-loop dispatch');

    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
    assert.equal(
      pkg.scripts?.['sd-interview-sim:t2'],
      'NATIVELY_E2E=1 ./node_modules/.bin/electron scripts/sd-interview-sim-t2.js',
      'the npm dispatch script referenced by the long-loop note must still exist as documented',
    );

    const harnessSrc = fs.readFileSync(harnessPath, 'utf8');
    assert.match(
      harnessSrc,
      /SD_INTERVIEW_SIM_T2_MAX_TURNS/,
      'the max-turns env knob referenced by the long-loop dispatch note must still exist in the harness',
    );
  });
});

describe('Ticket 04: token usage may be logged for ops but is never the pass/fail oracle', () => {
  test('behavioral acceptance (floor survives) holds identically for a token-light and a token-heavy pack', async () => {
    const packMod = await loadContextPack();
    const gate = await loadGate();

    const lightSheet = {
      ...gate.createEmptySdDesignSheet('p'),
      committed: [
        { id: 'c1', section: 'entities', text: 'Short entity note.', fillSource: 'speech', status: 'committed', updatedAt: 1 },
      ],
    };
    const heavySheet = {
      ...gate.createEmptySdDesignSheet('p'),
      committed: Array.from({ length: 18 }, (_, i) => ({
        id: `c${i}`,
        section: 'entities',
        text: `Requirement ${i}: URLs shorten via Base62 with a 7-char code and TTL of 30 days.`,
        fillSource: 'speech',
        status: 'committed',
        updatedAt: i,
      })),
    };

    const light = packMod.buildSdDeepDiveContextPack({ sheet: lightSheet, latestInterviewer: 'Continue.' });
    const heavy = packMod.buildSdDeepDiveContextPack({ sheet: heavySheet, latestInterviewer: 'Continue.' });

    // Ops-only telemetry point: logged for visibility, never asserted as a
    // pass/fail gate anywhere in this suite.
    console.log(
      '[ticket04][ops-telemetry-only] tokenEstimate light=%d heavy=%d (NOT a pass/fail oracle)',
      light.meta.tokenEstimate,
      heavy.meta.tokenEstimate,
    );
    // Informational sanity only — not the thing under test.
    assert.ok(heavy.meta.tokenEstimate > light.meta.tokenEstimate);

    // The actual oracle is behavioral: the floor (sheet + latest utterance)
    // survives identically regardless of how far apart the token estimates
    // land, and regardless of the hard-cap/inject-budget numbers themselves.
    for (const result of [light, heavy]) {
      assert.ok(result.blocks.designSheet, 'sheet floor must survive regardless of token cost');
      assert.ok(result.blocks.latestInterviewer, 'utterance floor must survive regardless of token cost');
    }
  });
});
