// electron/llm/tiSdTranscriptFeed.ts
//
// Ticket 03 (win-first-context-retention): the live What-To-Answer transcript
// feed for Technical Interview system-design requirements + sticky-session
// clarifier turns must read a 1-hour durable window instead of the short
// rolling 180s ring, so a constraint/number spoken early in an hour-long
// interview is still present on a later clarifier turn. Every other turn
// (non-TI, non-SD) keeps today's 180s/12 behavior unchanged.

/**
 * User lock: `getDurableContext(3600)` minimum for the TI SD hot path. Do not
 * ship a shorter durable window.
 */
export const TI_SD_DURABLE_WINDOW_SECONDS = 3600;

/**
 * Sparsify budget for the durable window. Locked at 48 unless a Tier0 test
 * proves it insufficient for dense hour-long SD dialogue — if so, raise this
 * value before ever shortening TI_SD_DURABLE_WINDOW_SECONDS.
 */
export const TI_SD_DURABLE_MAX_TURNS = 48;

/** Short rolling window every non-TI-SD WTA turn continues to use. */
export const DEFAULT_WTA_WINDOW_SECONDS = 180;
export const DEFAULT_WTA_MAX_TURNS = 12;

/**
 * True when this WTA turn is on the TI SD requirements/clarifier hot path.
 *
 * Mirrors the exact condition `applySdRequirementsGate` already uses to
 * decide whether SD prepare governs the turn at all (`isSdAnswer ||
 * authority.shouldArmGate`) — i.e. either the answer plan IS the
 * `system_design_answer` type, or SdSessionAuthority has armed the
 * Requirements gate for this turn (Technical Interview mode + a sticky
 * `problemKey` session already open — this is what covers a clarifier turn
 * that classifies as `general_meeting_answer`).
 *
 * Deliberately narrow: never broadens to other modes or answer types.
 */
export function isTiSdWtaHotPath(
  answerType: string | null | undefined,
  shouldArmGate: boolean,
): boolean {
  return answerType === 'system_design_answer' || shouldArmGate;
}
