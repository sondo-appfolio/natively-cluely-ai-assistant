import React, { useEffect, useRef } from 'react';

export const LIVE_TRANSCRIPT_PANEL_TESTID = 'live-transcript-panel';

export type LiveTranscriptPanelTurn = {
  id: string;
  label: string;
  text: string;
  isFinal: boolean;
};

export interface LiveTranscriptPanelProps {
  turns: LiveTranscriptPanelTurn[];
  surfaceStyle?: React.CSSProperties;
  placeholder?: string;
  title?: string;
  autoScroll?: boolean;
}

/**
 * InterviewMan-style bottom Transcription panel with per-speaker labels.
 * Visibility is owned by the parent (Show Transcription preference).
 */
export default function LiveTranscriptPanel({
  turns,
  surfaceStyle,
  placeholder = 'Transcription will appear here…',
  title = 'Transcription',
  autoScroll = true,
}: LiveTranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoScroll || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [turns, autoScroll]);

  return (
    <div
      data-testid={LIVE_TRANSCRIPT_PANEL_TESTID}
      className="mx-3 mb-2 rounded-2xl border border-white/12 bg-[rgba(12,12,16,0.55)] overflow-hidden"
      style={surfaceStyle}
    >
      <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1">
        <span className="text-[11px] font-semibold tracking-wide overlay-text-primary">
          {title}
        </span>
      </div>
      <div
        ref={scrollRef}
        className="max-h-[140px] min-h-[72px] overflow-y-auto px-3 pb-2.5 space-y-2 no-drag"
        style={{ scrollbarWidth: 'thin' }}
      >
        {turns.length === 0 ? (
          <p className="text-[12px] leading-relaxed overlay-text-muted italic">
            {placeholder}
          </p>
        ) : (
          turns.map((turn) => (
            <div key={turn.id} className="text-[12px] leading-relaxed">
              <span className="font-semibold text-sky-300/90 mr-1.5">
                {turn.label}:
              </span>
              <span
                className={`overlay-text-primary ${turn.isFinal ? '' : 'opacity-80'}`}
              >
                {turn.text || '…'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
