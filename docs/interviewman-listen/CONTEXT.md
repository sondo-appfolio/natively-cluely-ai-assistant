# InterviewMan listen parity (desktop)

Glossary for desktop listen/transcript/transport UX that mirrors InterviewMan: always-on live STT, red-square live-STT transport, triangle end-meeting, **bottom Ask bar** (Think / typed ask / blue ↑), Settings live-STT sandbox. Phone may be a **phone-stt-source** and **phone-control-surface** over Phone Mirror; desktop remains the LLM/planner host (see `docs/standalone-ios/CONTEXT.md`, ADR 0014–0015). Manual QA: [QA-CHECKLIST.md](./QA-CHECKLIST.md).

## Language

### Visibility

**always-on live transcript**:
Continuous live STT text of what is being heard — interviewer (system-audio) and user-mic — shown while red-square transport is listening, without requiring Answers/Ask to enable visibility.
_Avoid_: Answers-as-STT-start; Ask chip as listen gate; single-channel-only as the full live transcript; InterviewMan retention-timer assumptions

**live-transcript-surfaces**:
Two places that show live STT text: (1) in-meeting overlay while transport is listening; (2) Settings Audio live-STT sandbox that streams real transcript (not levels meter or credential ping). Overlay ships first if sequenced.
_Avoid_: Treating Audio level meter or `test-stt-connection` as the live transcript test; reusing no-audio SD overlay e2e harness as this sandbox

### Controls

**red-square-live-stt-transport**:
One TopPill red square toggles live STT only. Meeting start auto-arms it (filled red); while armed, live text appears in the transcription section; pause/stop stops live STT. Never submits a chat turn; never arms a separate Ask mic buffer.
_Avoid_: Dual-buffer Ask capture on the square; red-square Stop auto-submitting; Answers chip as listen start

**bottom-ask-bar**:
InterviewMan-style compose strip: yellow **Think** → What-to-Answer; typed input + blue ↑ → explicit ask submit. Replaces the Cluely overlay Ask/Submit chip in the same change. Layout/jobs match InterviewMan; colors may follow Natively tokens for readability.
_Avoid_: Keeping Ask chip alongside the bar; wiring Think to AssistLLM or to live STT; removing the chip before a typed-ask path exists

**think-vs-assist-controls**:
Bottom-bar **Think** maps to What-to-Answer (`handleWhatToSay`). Main-compose **Assist** maps to Assist mode / AssistLLM (`runAssistMode`) — separate handlers.
_Avoid_: Collapsing Think and Assist onto one handler

**interviewman-control-map**:
Overlay jobs: **red-square-live-stt-transport**; **bottom-ask-bar** (Think / type / ↑); **triangle end-meeting**; main-compose **Assist** kept as Cluely surface. Shortcut `chat:answer` focuses the bottom Ask bar (does not toggle STT or auto-submit).
_Avoid_: Red square ending the meeting; triangle pausing listen; Ask chip as listen start; red-square Stop auto-submitting a chat turn

**listen-transport-arming**:
Meeting start auto-engages red-square transport (start→hear). Red square pauses/resumes; triangle ends meeting. Ambient AI Chat skips capture. If STT is unready (`none` / missing model / permissions), show a setup/unready state — never a fake empty “listening” transcript — and point at the Settings sandbox.
_Avoid_: Silent empty transcript when provider is none; Answers arming listen; auto-listen while Ambient is on

### Shell + Cluely keep

**interviewman-visual-parity-scope**:
Layout and control jobs match InterviewMan (top pill, bottom Ask bar, settings glass structure, red-square transport). Colors/typography may use Natively tokens when that improves readability — not a pixel-perfect accent clone.
_Avoid_: Unbounded whole-app pixel clone; layout drift that breaks the control map

**interviewman-shell-cluely-keep-list**:
When adopting the InterviewMan shell, keep: What-to-Answer / Assist streams; Screenshot → answer; RAG / LESSON / context `@`; Phone Mirror / stealth.
_Avoid_: Stripping those surfaces for chrome-only parity; defaulting Ambient AI Chat into the keep-list without a separate lock

**phone-control-map-parity**:
Phone Mirror mirrors the desktop map: pause/red-square = live STT; phone Ask → Ask-bar compose/submit equivalent (not two-phase mic chip); Think/WTA and Assist separate; end-meeting unchanged.
_Avoid_: Leaving phone on the old Ask/Submit mic chip after desktop chip removal; phone-hosted LLM loop

### Scope

**interviewman-parity-scope**:
This effort ships desktop listen UX (terms above) + InterviewMan-like **phone-control-surface** work in the same effort + visual layout/chrome parity on listen / transcript / transport / Ask-bar surfaces. Desktop remains **desktop-session-host** for LLM/planner. Out unless separately locked: InterviewMan retention timers; full App Store native rewrite; whole-product pixel match.
_Avoid_: Behavior-only without layout parity on those surfaces; treating phone remote as out of scope here; importing retention timers by default; unbounded whole-app pixel clone; phone-hosted full answer loop (LLM/RAG on phone — still rejected; see ADR 0015)

**phone-stt-source**:
The phone may run STT (mic / phone-captured audio) as an alternate capture source under the same listen-transport model. Transcript text feeds the desktop session; desktop remains LLM/planner host (ADR 0015 amending 0011).
_Avoid_: Treating phone STT as phone-hosted What-to-Answer; requiring desktop mic for all user speech when phone STT is armed

## Example dialogue

**Dev:** So we delete Ask since the red square already listens like InterviewMan?  
**Expert:** Delete the Cluely **Ask chip**, yes — but ship the **bottom-ask-bar** in the same change. **red-square-live-stt-transport** owns live transcript; the bar owns Think / type / ↑.  
**Dev:** Is Think the same as Assist?  
**Expert:** No — **think-vs-assist-controls**. Think → What-to-Answer; Assist stays on the main compose panel.  
**Dev:** And the TopPill red square still ends the meeting?  
**Expert:** No. Under **interviewman-control-map**, red square is STT only; **triangle** ends the meeting.  
**Dev:** Phone still has the old Ask/Submit mic button?  
**Expert:** Remap under **phone-control-map-parity** so it matches desktop.  
**Dev:** Pixel-perfect yellow/blue from the screenshots?  
**Expert:** **interviewman-visual-parity-scope** is layout/jobs first; Natively tokens OK for readability.

## Flagged ambiguities

**Answers / Answer chip**:
Historical listen gate + voice ask→submit. Removed from product chrome; job moves to **bottom-ask-bar**.
_Resolution_: Prefer bottom Ask bar / Think / typed submit in new copy; avoid “Answers” as a listen control.

**Stop**:
Never say “Stop” alone — name the control (red-square pause vs triangle end vs Ask-bar submit).

**Session**:
Speakable-sd “sticky SD session” is answerType stickiness, not listen transport.
_Resolution_: Prefer **meeting** for listen lifecycle; sticky SD stays in speakable-sd context.
