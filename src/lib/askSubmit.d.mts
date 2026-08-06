export const LISTEN_TRANSPORT_EFFECTS: readonly string[];

export function planAskSubmitAction(input: {
  isVoiceCaptureArmed: boolean;
  hasQuestionOrAttachments: boolean;
}): {
  action: 'arm_voice_capture' | 'submit' | 'empty_speech_error';
  effects: readonly string[];
};

export function askSubmitTouchesListenTransport(
  effects: readonly string[] | null | undefined,
): boolean;
