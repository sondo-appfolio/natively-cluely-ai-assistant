/**
 * Feedback loop for: "I do not see the live transcription text area"
 * while a meeting is listening (InterviewMan always-on-live-transcript).
 *
 * Symptom: overlay must mount a live-transcript surface while listen is armed
 * even before the first STT token arrives — empty text is still a visible area
 * ("Listening…"), not a missing region.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shouldShowLiveTranscriptSurface } from '../liveTranscriptProjection.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const niSrc = readFileSync(
  path.resolve(__dirname, '../../components/NativelyInterface.tsx'),
  'utf-8',
);

describe('shouldShowLiveTranscriptSurface — always-on surface', () => {
  test('armed + preference on + empty text → show surface (user symptom seam)', () => {
    assert.equal(
      shouldShowLiveTranscriptSurface({
        showTranscriptPreference: true,
        listenArmed: true,
        hasRollingText: false,
      }),
      true,
      'live transcript area must be visible while listening even with no STT text yet',
    );
  });

  test('preference off → hide even when armed', () => {
    assert.equal(
      shouldShowLiveTranscriptSurface({
        showTranscriptPreference: false,
        listenArmed: true,
        hasRollingText: true,
      }),
      false,
    );
  });

  test('paused with leftover text → keep surface', () => {
    assert.equal(
      shouldShowLiveTranscriptSurface({
        showTranscriptPreference: true,
        listenArmed: false,
        hasRollingText: true,
      }),
      true,
    );
  });

  test('paused with empty text → hide', () => {
    assert.equal(
      shouldShowLiveTranscriptSurface({
        showTranscriptPreference: true,
        listenArmed: false,
        hasRollingText: false,
      }),
      false,
    );
  });
});

describe('NativelyInterface mounts surface via visibility helper (not text-gated)', () => {
  test('does not require rollingTranscript truthy to mount RollingTranscript', () => {
    // The bug: `{showTranscript && rollingTranscript ? <RollingTranscript/> : null}`
    // hides the entire live-transcript area until first STT token.
    assert.doesNotMatch(
      niSrc,
      /showTranscript\s*&&\s*rollingTranscript\s*\?\s*\(/,
      'overlay must not gate the live-transcript surface on non-empty rollingTranscript',
    );
  });

  test('uses shouldShowLiveTranscriptSurface for mount decision', () => {
    assert.match(
      niSrc,
      /shouldShowLiveTranscriptSurface\s*\(/,
      'overlay must call shouldShowLiveTranscriptSurface for always-on surface visibility',
    );
  });
});
