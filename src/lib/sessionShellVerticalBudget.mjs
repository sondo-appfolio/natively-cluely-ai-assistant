/**
 * InterviewMan-tall session shell: grow the overlay downward to the work-area
 * bottom, then split leftover flex between Transcription and chat scroll.
 */

/** Near-full work-area height (replaces legacy 0.9 clamp for meeting shell). */
export const SESSION_SHELL_HEIGHT_FRACTION = 0.98;

const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);

/**
 * Target OS-window height so the shell column reaches the desktop bottom.
 *
 * @param {{
 *   workAreaY: number,
 *   workAreaHeight: number,
 *   windowTopY: number,
 *   bottomMargin?: number,
 *   heightFraction?: number,
 * }} params
 * @returns {{ maxHeight: number, targetHeight: number, workAreaBottom: number }}
 */
export function sessionShellVerticalBudget({
  workAreaY,
  workAreaHeight,
  windowTopY,
  bottomMargin = 8,
  heightFraction = SESSION_SHELL_HEIGHT_FRACTION,
}) {
  const maxHeight = Math.max(1, Math.floor(workAreaHeight * heightFraction));
  const workAreaBottom = workAreaY + workAreaHeight - bottomMargin;
  const fromTop = Math.max(1, workAreaBottom - windowTopY);
  const targetHeight = Math.min(maxHeight, fromTop);
  return { maxHeight, targetHeight, workAreaBottom };
}

/**
 * Split leftover vertical space between Transcription panel and chat scroll.
 * `chromeHeight` is every non-flex pixel (quick actions, ask bar, footer, etc.).
 *
 * @param {{
 *   targetHeight: number,
 *   chromeHeight: number,
 *   transcriptMin?: number,
 *   transcriptMaxShare?: number,
 *   chatMin?: number,
 * }} params
 * @returns {{ flexBudget: number, transcriptMax: number, chatMax: number }}
 */
export function sessionShellFlexBudgets({
  targetHeight,
  chromeHeight,
  transcriptMin = 120,
  transcriptMaxShare = 0.38,
  chatMin = 160,
}) {
  const flexBudget = Math.max(0, targetHeight - chromeHeight);
  if (flexBudget <= 0) {
    return { flexBudget: 0, transcriptMax: transcriptMin, chatMax: chatMin };
  }
  const transcriptCap = Math.max(
    transcriptMin,
    Math.floor(flexBudget * clamp(transcriptMaxShare, 0, 1)),
  );
  const transcriptMax = Math.min(transcriptCap, Math.max(transcriptMin, flexBudget - chatMin));
  const chatMax = Math.max(chatMin, flexBudget - transcriptMin);
  return { flexBudget, transcriptMax, chatMax };
}
