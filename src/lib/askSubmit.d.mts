export const LISTEN_TRANSPORT_EFFECTS: readonly string[];

export function planBottomAskBarAction(input: {
  intent: 'think' | 'submit_typed' | 'focus_bar';
  hasQuestionOrAttachments?: boolean;
}): {
  action: 'think' | 'submit' | 'empty_error' | 'focus_bar';
  effects: readonly string[];
};

/** @deprecated Use planBottomAskBarAction */
export function planAskSubmitAction(input: {
  isVoiceCaptureArmed: boolean;
  hasQuestionOrAttachments: boolean;
}): {
  action: 'think' | 'submit' | 'empty_error' | 'focus_bar';
  effects: readonly string[];
};

export function askSubmitTouchesListenTransport(
  effects: readonly string[] | null | undefined,
): boolean;
