/**
 * Multi-turn live transcript for the InterviewMan-style bottom Transcription panel.
 *
 * Dual-channel STT maps to fixed speaker labels:
 *   interviewer (system audio) → Speaker 1
 *   user (mic) → Speaker 2
 *
 * Glossary: always-on-live-transcript, live-transcript-surfaces
 */

/**
 * @param {string} speaker
 * @returns {string}
 */
export function speakerLabelForChannel(speaker) {
  if (speaker === 'interviewer') return 'Speaker 1';
  if (speaker === 'user') return 'Speaker 2';
  return 'Speaker';
}

/**
 * @param {string} speaker
 * @returns {number | null}
 */
export function speakerIndexForChannel(speaker) {
  if (speaker === 'interviewer') return 1;
  if (speaker === 'user') return 2;
  return null;
}

/**
 * @typedef {{ id: string, speaker: string, label: string, text: string, isFinal: boolean }} LiveTranscriptTurn
 */

/**
 * Apply one STT chunk to the turn list (partial updates last open turn; speaker
 * change or finalization opens a new turn).
 *
 * @param {readonly LiveTranscriptTurn[]} turns
 * @param {{ speaker: string, text: string, final: boolean, nowMs?: number }} chunk
 * @returns {LiveTranscriptTurn[]}
 */
export function applyLiveTranscriptTurn(turns, { speaker, text, final, nowMs = Date.now() }) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed && !final) return [...turns];

  const label = speakerLabelForChannel(speaker);
  const next = turns.map((t) => ({ ...t }));
  const last = next[next.length - 1];

  if (last && last.speaker === speaker && !last.isFinal) {
    last.text = trimmed || last.text;
    if (final) last.isFinal = true;
    return next;
  }

  if (!trimmed && final) {
    if (last && last.speaker === speaker) {
      last.isFinal = true;
    }
    return next;
  }

  next.push({
    id: `turn-${speaker}-${nowMs}-${next.length}`,
    speaker,
    label,
    text: trimmed,
    isFinal: final === true,
  });
  return next;
}

/**
 * @param {{
 *   showTranscriptPreference: boolean,
 *   listenArmed: boolean,
 *   turnCount: number,
 * }} input
 * @returns {boolean}
 */
export function shouldShowTranscriptionPanel({
  showTranscriptPreference,
  listenArmed,
  turnCount,
}) {
  if (!showTranscriptPreference) return false;
  if (listenArmed === true) return true;
  return turnCount > 0;
}
