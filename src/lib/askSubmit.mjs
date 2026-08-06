/**
 * Bottom Ask bar policy (InterviewMan control map / ADR 0014 amend).
 *
 * Think → What-to-Answer; typed ↑ → AI ask turn; chat:answer → focus bar.
 * Never arms, pauses, or resumes listen transport — red-square only.
 * Never arms a separate Ask mic buffer (Ask chip removed).
 *
 * Glossary: bottom-ask-bar, think-vs-assist-controls, red-square-live-stt-transport
 */

/** Effects that belong to listen transport — forbidden on the Ask-bar path. */
export const LISTEN_TRANSPORT_EFFECTS = Object.freeze([
  'toggleListenTransport',
  'listenTransportPause',
  'listenTransportResume',
  'listen-transport:toggle',
]);

/**
 * @param {{
 *   intent: 'think' | 'submit_typed' | 'focus_bar',
 *   hasQuestionOrAttachments?: boolean,
 * }} input
 * @returns {{
 *   action: 'think' | 'submit' | 'empty_error' | 'focus_bar',
 *   effects: readonly string[],
 * }}
 */
export function planBottomAskBarAction({ intent, hasQuestionOrAttachments = false }) {
  if (intent === 'think') {
    return {
      action: 'think',
      effects: Object.freeze(['runWhatToAnswer']),
    };
  }
  if (intent === 'focus_bar') {
    return {
      action: 'focus_bar',
      effects: Object.freeze(['focusBottomAskBar']),
    };
  }
  // submit_typed
  if (!hasQuestionOrAttachments) {
    return {
      action: 'empty_error',
      effects: Object.freeze(['showEmptyAskError']),
    };
  }
  return {
    action: 'submit',
    effects: Object.freeze(['streamChatOrRag']),
  };
}

/** @deprecated Use planBottomAskBarAction — kept briefly for call-site migration. */
export function planAskSubmitAction({ isVoiceCaptureArmed, hasQuestionOrAttachments }) {
  if (!isVoiceCaptureArmed) {
    return planBottomAskBarAction({ intent: 'focus_bar' });
  }
  return planBottomAskBarAction({
    intent: 'submit_typed',
    hasQuestionOrAttachments,
  });
}

/** True when any planned effect would arm/disarm listen transport. */
export function askSubmitTouchesListenTransport(effects) {
  const forbidden = new Set(LISTEN_TRANSPORT_EFFECTS);
  return (effects ?? []).some((effect) => forbidden.has(effect));
}
