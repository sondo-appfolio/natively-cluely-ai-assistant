import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LISTEN_TRANSPORT_EFFECTS,
  planBottomAskBarAction,
  askSubmitTouchesListenTransport,
} from '../askSubmit.mjs';

describe('bottom Ask bar policy (InterviewMan shell — ADR 0014 amend)', () => {
  test('think plans What-to-Answer only — no listen transport, no voice capture', () => {
    const plan = planBottomAskBarAction({ intent: 'think' });
    assert.equal(plan.action, 'think');
    assert.deepEqual([...plan.effects], ['runWhatToAnswer']);
    assert.equal(askSubmitTouchesListenTransport(plan.effects), false);
    for (const effect of LISTEN_TRANSPORT_EFFECTS) {
      assert.equal(plan.effects.includes(effect), false);
    }
    assert.equal(plan.effects.includes('startManualVoiceCapture'), false);
  });

  test('submit_typed with content streams chat without mic arm or listen transport', () => {
    const plan = planBottomAskBarAction({
      intent: 'submit_typed',
      hasQuestionOrAttachments: true,
    });
    assert.equal(plan.action, 'submit');
    assert.deepEqual([...plan.effects], ['streamChatOrRag']);
    assert.equal(askSubmitTouchesListenTransport(plan.effects), false);
    assert.equal(plan.effects.includes('finalizeMicSTT'), false);
    assert.equal(plan.effects.includes('startManualVoiceCapture'), false);
  });

  test('submit_typed empty shows error without listen transport', () => {
    const plan = planBottomAskBarAction({
      intent: 'submit_typed',
      hasQuestionOrAttachments: false,
    });
    assert.equal(plan.action, 'empty_error');
    assert.deepEqual([...plan.effects], ['showEmptyAskError']);
    assert.equal(askSubmitTouchesListenTransport(plan.effects), false);
  });

  test('focus_bar plans focus only — chat:answer remap', () => {
    const plan = planBottomAskBarAction({ intent: 'focus_bar' });
    assert.equal(plan.action, 'focus_bar');
    assert.deepEqual([...plan.effects], ['focusBottomAskBar']);
    assert.equal(askSubmitTouchesListenTransport(plan.effects), false);
  });

  test('askSubmitTouchesListenTransport detects forbidden effects', () => {
    assert.equal(askSubmitTouchesListenTransport(['toggleListenTransport']), true);
    assert.equal(askSubmitTouchesListenTransport(['listen-transport:toggle']), true);
    assert.equal(askSubmitTouchesListenTransport(['streamChatOrRag']), false);
    assert.equal(askSubmitTouchesListenTransport(['runWhatToAnswer']), false);
  });
});
