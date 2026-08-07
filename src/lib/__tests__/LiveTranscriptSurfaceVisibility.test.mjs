/**
 * Feedback loop: dedicated bottom Transcription panel must mount while
 * listening when Show Transcription is on — even before the first STT token.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shouldShowLiveTranscriptSurface } from '../liveTranscriptProjection.mjs';
import { shouldShowTranscriptionPanel } from '../liveTranscriptTurns.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const niSrc = readFileSync(
  path.resolve(__dirname, '../../components/NativelyInterface.tsx'),
  'utf-8',
);

describe('shouldShowTranscriptionPanel — bottom panel', () => {
  test('armed + preference on + empty turns → show panel', () => {
    assert.equal(
      shouldShowTranscriptionPanel({
        showTranscriptPreference: true,
        listenArmed: true,
        turnCount: 0,
      }),
      true,
    );
  });

  test('preference off → hide even when armed with turns', () => {
    assert.equal(
      shouldShowTranscriptionPanel({
        showTranscriptPreference: false,
        listenArmed: true,
        turnCount: 3,
      }),
      false,
    );
  });
});

describe('shouldShowLiveTranscriptSurface — legacy helper still coherent', () => {
  test('preference off hides', () => {
    assert.equal(
      shouldShowLiveTranscriptSurface({
        showTranscriptPreference: false,
        listenArmed: true,
        hasRollingText: true,
      }),
      false,
    );
  });
});

describe('NativelyInterface mounts LiveTranscriptPanel via preference', () => {
  test('uses shouldShowTranscriptionPanel and LiveTranscriptPanel', () => {
    assert.match(niSrc, /shouldShowTranscriptionPanel\s*\(/);
    assert.match(niSrc, /LiveTranscriptPanel/);
    assert.match(niSrc, /live-transcript-panel|LIVE_TRANSCRIPT_PANEL|Transcription will appear/);
  });

  test('does not mount RollingTranscript or keep top rolling STT state', () => {
    assert.doesNotMatch(niSrc, /<RollingTranscript[\s>]/);
    assert.doesNotMatch(niSrc, /mergeRollingTranscript/);
    assert.doesNotMatch(niSrc, /setRollingTranscript|rollingTranscript/);
    assert.doesNotMatch(niSrc, /applyRollingPartialPreview/);
  });
});
