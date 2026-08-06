import { ChevronUp, ChevronDown } from "lucide-react";
import icon from "../icon.png";
import type { OverlayAppearance } from "../../lib/overlayAppearance";

interface TopPillProps {
    expanded: boolean;
    onToggle: () => void;
    /** Red-square listen transport toggle (pause/resume). Does not end the meeting. */
    onToggleListen: () => void;
    /** Triangle end-meeting. */
    onEndMeeting: () => void;
    /** When true, red square shows as “listening” (armed). */
    listenArmed?: boolean;
    appearance: OverlayAppearance;
    onLogoClick?: () => void;
}

export default function TopPill({
    expanded,
    onToggle,
    onToggleListen,
    onEndMeeting,
    listenArmed = false,
    appearance,
    onLogoClick,
}: TopPillProps) {
    return (
        <div className="flex justify-center select-none z-50">
            <div
                className="
          draggable-area
          flex items-center gap-2
          rounded-full
          border
          overlay-pill-surface
          backdrop-blur-md
          px-1.5 py-1.5
          transition-all duration-300 ease-sculpted
        "
                style={appearance.pillStyle}
            >
                <div className="draggable-area">
                    {/* LOGO BUTTON */}
                    <button
                        onClick={onLogoClick}
                        className={`
              w-7 h-7
              rounded-full
              overlay-icon-surface
              overlay-icon-surface-hover
              flex items-center justify-center
              relative overflow-hidden
              interaction-base interaction-press
            `}
                        style={appearance.iconStyle}
                    >
                        <img
                            src={icon}
                            alt="Natively"
                            className="w-[24px] h-[24px] object-contain opacity-95 scale-105 force-black-icon"
                            draggable="false"
                            onDragStart={(e) => e.preventDefault()}
                        />
                    </button>
                </div>

                {/* CENTER SEGMENT */}
                <button
                    onClick={onToggle}
                    className={`
            flex items-center gap-2
            group
            px-3 py-1
            rounded-full
            backdrop-blur-md
            overlay-chip-surface
            overlay-text-interactive
            text-[12px]
            font-medium
            border
            interaction-base interaction-hover interaction-press
          `}
                    style={appearance.chipStyle}
                >
                    <span className="opacity-70 group-hover:opacity-100 transition-opacity duration-200">
                        {expanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                        )}
                    </span>
                    <span className="tracking-wide opacity-80 group-hover:opacity-100">{expanded ? "Hide" : "Show"}</span>
                </button>

                {/* RED SQUARE — listen transport pause/resume (ADR 0014) */}
                <button
                    type="button"
                    onClick={onToggleListen}
                    title={listenArmed ? "Pause listening" : "Resume listening"}
                    aria-label={listenArmed ? "Pause listening" : "Resume listening"}
                    className={`
            w-7 h-7
            rounded-full
            overlay-icon-surface
            flex items-center justify-center
            interaction-base interaction-press
            ${listenArmed
              ? 'text-red-400 hover:bg-red-500/15'
              : 'overlay-text-primary hover:bg-red-500/10 hover:text-red-400 opacity-70'}
          `}
                    style={appearance.iconStyle}
                >
                    <div className="w-3.5 h-3.5 rounded-[3px] bg-current opacity-80" />
                </button>

                {/* TRIANGLE — end meeting */}
                <button
                    type="button"
                    onClick={onEndMeeting}
                    title="End meeting"
                    aria-label="End meeting"
                    className={`
            w-7 h-7
            rounded-full
            overlay-icon-surface
            overlay-text-primary
            flex items-center justify-center
            interaction-base interaction-press
            hover:bg-white/10
          `}
                    style={appearance.iconStyle}
                >
                    <div
                        className="opacity-80"
                        style={{
                            width: 0,
                            height: 0,
                            borderLeft: '5px solid transparent',
                            borderRight: '5px solid transparent',
                            borderTop: '8px solid currentColor',
                        }}
                    />
                </button>
            </div>
        </div>
    );
}
