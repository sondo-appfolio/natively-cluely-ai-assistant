export function shouldKeepUserMicChunk(input: {
  listenArmed: boolean;
  isManualRecording: boolean;
}): boolean;

export function shouldShowLiveTranscriptSurface(input: {
  showTranscriptPreference: boolean;
  listenArmed: boolean;
  hasRollingText: boolean;
}): boolean;

export function projectLiveTranscriptChunk(input: {
  speaker: string;
  listenArmed: boolean;
  isManualRecording: boolean;
}): { projectToRolling: boolean; captureForAsk: boolean };
