import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  speakerLabelForChannel,
  applyLiveTranscriptTurn,
  shouldShowTranscriptionPanel,
} from '../liveTranscriptTurns.mjs';

describe('liveTranscriptTurns (bottom Transcription panel)', () => {
  test('maps dual STT channels to Speaker 1 / Speaker 2', () => {
    assert.equal(speakerLabelForChannel('interviewer'), 'Speaker 1');
    assert.equal(speakerLabelForChannel('user'), 'Speaker 2');
  });

  test('partial then final updates the same open turn', () => {
    let turns = [];
    turns = applyLiveTranscriptTurn(turns, {
      speaker: 'interviewer',
      text: 'Hello',
      final: false,
      nowMs: 1,
    });
    turns = applyLiveTranscriptTurn(turns, {
      speaker: 'interviewer',
      text: 'Hello world',
      final: true,
      nowMs: 2,
    });
    assert.equal(turns.length, 1);
    assert.equal(turns[0].label, 'Speaker 1');
    assert.equal(turns[0].text, 'Hello world');
    assert.equal(turns[0].isFinal, true);
  });

  test('speaker change opens a new labeled turn while streaming', () => {
    let turns = applyLiveTranscriptTurn([], {
      speaker: 'interviewer',
      text: 'How are you?',
      final: true,
      nowMs: 1,
    });
    turns = applyLiveTranscriptTurn(turns, {
      speaker: 'user',
      text: 'I am fine',
      final: false,
      nowMs: 2,
    });
    assert.equal(turns.length, 2);
    assert.equal(turns[0].label, 'Speaker 1');
    assert.equal(turns[1].label, 'Speaker 2');
    assert.equal(turns[1].isFinal, false);
  });

  test('Show Transcription preference hides the panel entirely', () => {
    assert.equal(
      shouldShowTranscriptionPanel({
        showTranscriptPreference: false,
        listenArmed: true,
        turnCount: 3,
      }),
      false,
    );
    assert.equal(
      shouldShowTranscriptionPanel({
        showTranscriptPreference: true,
        listenArmed: true,
        turnCount: 0,
      }),
      true,
    );
    assert.equal(
      shouldShowTranscriptionPanel({
        showTranscriptPreference: true,
        listenArmed: false,
        turnCount: 2,
      }),
      true,
    );
  });
});
