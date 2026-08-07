# InterviewMan listen parity (desktop)

Glossary for desktop listen/transcript/transport UX that mirrors InterviewMan: always-on live STT, red-square live-STT transport, triangle end-meeting, **bottom Ask bar** (Think / typed ask / blue ↑), Settings live-STT sandbox. Phone may be a **phone-stt-source** and **phone-control-surface** over Phone Mirror; desktop remains the LLM/planner host (see `docs/standalone-ios/CONTEXT.md`, ADR 0014–0015). Manual QA: [QA-CHECKLIST.md](./QA-CHECKLIST.md).

## Language

### Visibility

**always-on live transcript**:
Continuous live STT text of what is being heard — interviewer (system-audio) and user-mic — shown while red-square transport is listening, without requiring Answers/Ask to enable visibility.
_Avoid_: Answers-as-STT-start; Ask chip as listen gate; single-channel-only as the full live transcript; InterviewMan retention-timer assumptions

**live-transcript-surfaces**:
Two places that show live STT text: (1) in-meeting overlay **Transcription** panel (bottom, speaker-labeled turns) while Show Transcription is on and transport is listening; (2) Settings Audio live-STT sandbox that streams real transcript (not levels meter or credential ping).
_Avoid_: Treating Audio level meter or `test-stt-connection` as the live transcript test; reusing no-audio SD overlay e2e harness as this sandbox; single-line marquee as the only transcript surface

**transcription-panel-speakers**:
Bottom Transcription panel labels dual-channel STT as **Speaker 1** (interviewer / system audio) and **Speaker 2** (user mic) as text streams. Show Transcription preference shows/hides the whole panel.
_Avoid_: Unlabeled mixed rolling text as the primary transcript UX; gating the panel on Ask chip

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

**interviewman-dark-tall-shell**:
Default meeting overlay is near-opaque charcoal (Ask-bar baseline, factory opacity ~0.95) so bright IDEs cannot wash the panel light; session column grows top-anchored to near the work-area bottom (~0.98) with Transcription/chat flex room.
_Avoid_: Frosted low-alpha glass as the meeting default; short content-fit cards that stop mid-desktop; transparent transcriptStyle overriding the Transcription fill

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

### Automated e2e (local)

**interviewman-listen-e2e-family**:
New Electron Playwright family: npm script `e2e:interviewman-listen` → `scripts/e2e/interviewman-listen.mjs` with helpers under `scripts/lib/interviewman-listen/`. Forever separate from `e2e:sd-overlay-interview`. Never use `startOverlaySessionWithoutAudioForE2e` or `__e2e__:arm-sd-overlay-gate` as live-STT / listen proof.
_Avoid_: Extending the SD overlay suite into listen parity; relying only on Vite `tests/e2e` `page.goto` for overlay listen chrome

**interviewman-listen-e2e-launch**:
Launch via Playwright `_electron` in that standalone script, copying sd-overlay’s launch/env/temp-userData/window-find pattern (`NATIVELY_E2E=1`). Do not put this suite under `playwright.config.ts` Vite Chrome `tests/e2e`.
_Avoid_: Assuming `npm run test:e2e` already boots the Electron overlay

**interviewman-listen-e2e-stt-fidelity**:
Default local run arms via `__e2e__:arm-listen-meeting`: opens a meeting and arms **listen-transport** without SD gate chrome and without requiring mic/system-audio devices. Chrome asserts on that path. Post-arm controlled feed may prove Speaker 1/2 **panel wiring** only — never Settings sandbox live-STT fidelity and never real capture proof. Optional real capture: `RUN_INTERVIEWMAN_LISTEN_REAL_AUDIO=1`.
_Avoid_: SD no-audio arm as listen proof; TCC required for the default green path; treating inject as Settings sandbox or live mic proof

**interviewman-listen-e2e-desktop-scope**:
First slice covers in-meeting overlay only (TopPill transport, Transcription panel, bottom Ask bar, end-meeting, unready banner). Settings Audio `live-stt-sandbox*` stays later / manual QA.
_Avoid_: Blocking v1 on Settings sandbox e2e

**interviewman-listen-e2e-control-map-slice**:
Mandatory after armed overlay: `listen-transport-toggle` armed; `live-transcript-panel` when Show Transcription on; bottom Ask bar controls present; `ask-submit-chip` absent; Think and typed ↑ leave transport armed; pause unarms without ending meeting; `end-meeting` tears down. Optional: Speaker 1/2 text after controlled feed.
_Avoid_: SD gate testids as listen proof; requiring Assist LLM success for green

**interviewman-listen-e2e-shell-asserts**:
First-slice e2e does not assert pixel opacity or “IDE not readable through panel.” **interviewman-dark-tall-shell** stays unit-tested (height fraction ≥ 0.98, dark factory opacity ~0.95); charcoal/tall readability remains manual QA.
_Avoid_: Screenshot baselines or opacity gates in v1 listen e2e

**interviewman-listen-e2e-edge-paths**:
Slice 1 must cover STT-unready → `listen-transport-unready`, no fake empty listening. Ambient-ON skip-capture is slice 2 unless a preference fixture makes it free. Never treat SD no-audio arm as Ambient.
_Avoid_: Happy-path-only forever; using SD no-audio as Ambient stand-in

**interviewman-listen-e2e-phone-scope**:
This suite is desktop-overlay only. Phone Mirror control/STT-source parity stays on unit tests + manual QA.
_Avoid_: Blocking desktop listen e2e on mobile/WebView automation

**interviewman-listen-e2e-ci-gate**:
No GitHub Actions or remote CI job. Operators run locally: `RUN_INTERVIEWMAN_LISTEN=1 npm run e2e:interviewman-listen` (skip exit 0 when unset). Launch sets `NATIVELY_E2E=1`. Do not reuse `SD_OVERLAY_*` flags. Optional local real audio: `RUN_INTERVIEWMAN_LISTEN_REAL_AUDIO=1`.
_Avoid_: Adding a GitHub workflow/PR/schedule job; overloading SD overlay env flags

**interviewman-listen-e2e-selectors**:
Use existing testids (`listen-transport-*`, `live-transcript-panel`, `bottom-ask-*`, `overlay-chat-input`, `end-meeting`). Speaker lines via text `Speaker 1:` / `Speaker 2:`. Do not target `live-transcript-surface` (RollingTranscript) or SD gate testids as primary listen proof. Assert `ask-submit-chip` absent.
_Avoid_: Blocking v1 on new per-turn speaker testids

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
**Dev:** Can we extend `e2e:sd-overlay-interview` for the Transcription panel?  
**Expert:** No — **interviewman-listen-e2e-family**. SD no-audio arm is not listen proof; use `__e2e__:arm-listen-meeting` under **interviewman-listen-e2e-stt-fidelity**, local-only (**interviewman-listen-e2e-ci-gate**).

## Flagged ambiguities

**Answers / Answer chip**:
Historical listen gate + voice ask→submit. Removed from product chrome; job moves to **bottom-ask-bar**.
_Resolution_: Prefer bottom Ask bar / Think / typed submit in new copy; avoid “Answers” as a listen control.

**Stop**:
Never say “Stop” alone — name the control (red-square pause vs triangle end vs Ask-bar submit).

**Session**:
Speakable-sd “sticky SD session” is answerType stickiness, not listen transport.
_Resolution_: Prefer **meeting** for listen lifecycle; sticky SD stays in speakable-sd context.
