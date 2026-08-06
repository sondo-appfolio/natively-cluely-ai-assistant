/**
 * Overlay live-transcript projection rules (always-on-live-transcript).
 *
 * While listen transport is armed, interviewer + user-mic STT project to the
 * rolling bar without requiring Answers/Ask (`isManualRecording`). Ask still
 * owns voice-input capture separately via `captureForAsk`.
 *
 * Glossary: always-on-live-transcript, listen-transport-arming
 */

/**
 * @param {{ listenArmed: boolean, isManualRecording: boolean }} input
 * @returns {boolean}
 */
export function shouldKeepUserMicChunk({ listenArmed, isManualRecording }) {
  return listenArmed === true || isManualRecording === true;
}

/**
 * Whether the overlay should mount the live-transcript surface.
 *
 * Always-on-live-transcript: while listen transport is armed and the interviewer
 * transcript preference is on, show the surface even before the first STT token
 * (RollingTranscript renders "Listening…" for empty text).
 *
 * @param {{
 *   showTranscriptPreference: boolean,
 *   listenArmed: boolean,
 *   hasRollingText: boolean,
 * }} input
 * @returns {boolean}
 */
export function shouldShowLiveTranscriptSurface({
  showTranscriptPreference,
  listenArmed,
  hasRollingText,
}) {
  if (!showTranscriptPreference) return false;
  if (listenArmed === true) return true;
  return hasRollingText === true;
}

/**
 * @param {{
 *   speaker: string,
 *   listenArmed: boolean,
 *   isManualRecording: boolean,
 * }} input
 * @returns {{ projectToRolling: boolean, captureForAsk: boolean }}
 */
export function projectLiveTranscriptChunk({
  speaker,
  listenArmed,
  isManualRecording,
}) {
  if (speaker === 'interviewer') {
    return { projectToRolling: true, captureForAsk: false };
  }

  if (speaker === 'user') {
    return {
      projectToRolling: listenArmed === true,
      captureForAsk: isManualRecording === true,
    };
  }

  return { projectToRolling: false, captureForAsk: false };
}
