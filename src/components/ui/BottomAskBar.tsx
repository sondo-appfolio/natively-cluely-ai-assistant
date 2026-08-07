import React from 'react';
import { ArrowUp } from 'lucide-react';

export const BOTTOM_ASK_BAR_TESTID = 'bottom-ask-bar';
export const BOTTOM_ASK_THINK_TESTID = 'bottom-ask-think';
export const BOTTOM_ASK_SUBMIT_TESTID = 'bottom-ask-submit';

export interface BottomAskBarProps {
  value: string;
  onChange: (value: string) => void;
  onThink: () => void;
  onSubmit: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  placeholder?: string;
  thinkLabel?: string;
  inputClassName?: string;
  inputStyle?: React.CSSProperties;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onMouseDown?: React.MouseEventHandler<HTMLInputElement>;
  readOnly?: boolean;
  /** Extra classes on the outer bar (stealth engage, etc.). */
  className?: string;
  children?: React.ReactNode;
}

/**
 * InterviewMan-style bottom Ask bar: Think | typed input | blue ↑.
 * Does not control live STT (red-square only).
 */
export default function BottomAskBar({
  value,
  onChange,
  onThink,
  onSubmit,
  inputRef,
  placeholder = 'Ask about your interview…',
  thinkLabel = 'Think',
  inputClassName = '',
  inputStyle,
  onKeyDown,
  onMouseDown,
  readOnly,
  className = '',
  children,
}: BottomAskBarProps) {
  const canSubmit = value.trim().length > 0;

  return (
    <div
      data-testid={BOTTOM_ASK_BAR_TESTID}
      className={`flex items-center gap-2 rounded-2xl border border-white/15 bg-[rgba(18,18,22,0.88)] px-2 py-1.5 ${className}`}
    >
      <button
        type="button"
        data-testid={BOTTOM_ASK_THINK_TESTID}
        onClick={onThink}
        className="shrink-0 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-amber-300 hover:bg-white/5 active:scale-95 transition-all"
        title={thinkLabel}
      >
        {thinkLabel}
      </button>
      <div className="relative flex-1 min-w-0">
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          data-testid="overlay-chat-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onMouseDown={onMouseDown}
          readOnly={readOnly}
          placeholder={placeholder}
          className={`w-full bg-transparent border-0 outline-none text-[13px] leading-relaxed overlay-text-primary placeholder:overlay-text-muted ${inputClassName}`}
          style={inputStyle}
        />
        {children}
      </div>
      <button
        type="button"
        data-testid={BOTTOM_ASK_SUBMIT_TESTID}
        onClick={onSubmit}
        disabled={!canSubmit}
        aria-label="Submit ask"
        className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-all active:scale-95 ${
          canSubmit
            ? 'bg-[#007AFF] text-white shadow-lg shadow-blue-500/20 hover:bg-[#0071E3]'
            : 'overlay-icon-surface overlay-text-muted cursor-not-allowed'
        }`}
      >
        <ArrowUp className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
