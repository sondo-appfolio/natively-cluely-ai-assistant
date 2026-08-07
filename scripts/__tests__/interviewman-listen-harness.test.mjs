// scripts/__tests__/interviewman-listen-harness.test.mjs
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const H = require('../lib/interviewman-listen/harness.js');

describe('interviewman-listen harness gate', () => {
  test('skips when RUN_INTERVIEWMAN_LISTEN unset', () => {
    const d = H.shouldRunInterviewmanListen({});
    assert.equal(d.run, false);
    assert.equal(d.mode, 'skip');
    assert.match(H.interviewmanListenSkipMessage(d), /SKIP/);
    assert.match(H.interviewmanListenSkipMessage(d), /Local opt-in/);
  });

  test('runs when RUN_INTERVIEWMAN_LISTEN=1', () => {
    const d = H.shouldRunInterviewmanListen({ RUN_INTERVIEWMAN_LISTEN: '1' });
    assert.equal(d.run, true);
    assert.equal(d.mode, 'local');
  });

  test('does not treat SD overlay flags as opt-in', () => {
    const d = H.shouldRunInterviewmanListen({
      RUN_SD_OVERLAY_INTERVIEW: '1',
      SD_OVERLAY_INTERVIEW_STUB_LLM: '1',
    });
    assert.equal(d.run, false);
  });

  test('real-audio flag is separate from suite opt-in', () => {
    assert.equal(H.wantsRealAudio({}), false);
    assert.equal(H.wantsRealAudio({ RUN_INTERVIEWMAN_LISTEN_REAL_AUDIO: '1' }), true);
  });

  test('listen testids match product chrome', () => {
    assert.equal(H.LISTEN_TESTIDS.listenToggle, 'listen-transport-toggle');
    assert.equal(H.LISTEN_TESTIDS.transcriptPanel, 'live-transcript-panel');
    assert.equal(H.LISTEN_TESTIDS.askBar, 'bottom-ask-bar');
    assert.equal(H.LISTEN_TESTIDS.askThink, 'bottom-ask-think');
    assert.equal(H.LISTEN_TESTIDS.askSubmit, 'bottom-ask-submit');
    assert.equal(H.LISTEN_TESTIDS.askInput, 'overlay-chat-input');
    assert.equal(H.LISTEN_TESTIDS.endMeeting, 'end-meeting');
    assert.equal(H.LISTEN_TESTIDS.listenUnready, 'listen-transport-unready');
    assert.equal(H.LISTEN_TESTIDS.legacyAskChip, 'ask-submit-chip');
  });
});
