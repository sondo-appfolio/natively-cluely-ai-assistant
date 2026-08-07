export function speakerLabelForChannel(speaker: string): string;
export function speakerIndexForChannel(speaker: string): number | null;

export type LiveTranscriptTurn = {
  id: string;
  speaker: string;
  label: string;
  text: string;
  isFinal: boolean;
};

export function applyLiveTranscriptTurn(
  turns: readonly LiveTranscriptTurn[],
  chunk: { speaker: string; text: string; final: boolean; nowMs?: number },
): LiveTranscriptTurn[];

export function shouldShowTranscriptionPanel(input: {
  showTranscriptPreference: boolean;
  listenArmed: boolean;
  turnCount: number;
}): boolean;
