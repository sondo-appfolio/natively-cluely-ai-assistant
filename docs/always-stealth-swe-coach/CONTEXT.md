# Always-stealth SWE interview coach

Desktop product posture: Natively is an always-undetectable Software Engineer interview coach. One **swe-interview-session** routes Coding / Technical / Behavioral per turn; Sales/Lecture and other non-SWE modes are product-retired. iOS stays transparent-coach.

## Language

### Stealth (desktop)

**conversation-start-stealth**:
Calling `startMeeting` (or equivalent live interview session start) must `setUndetectable(true)`. Stealth remains engaged for the life of that session. Pre-meeting app boot may be detectable; the invariant is session-start, not process-launch.
_Avoid_: App-launch-as-trigger; assuming `startMeeting` already forces stealth; conflating with two-device restore-prior without **stealth-sticky-after-session**

**no-user-detectable-switch**:
Detectable/Undetectable controls are removed from product chrome (Launcher, SettingsPopup, Settings General). Users cannot flip to detectable during a live session. Keep `setUndetectable` IPC for internal callers (two-device, tests, e2e). No Advanced escape hatch in v1.
_Avoid_: In-meeting eye toggle; removing IPC; Advanced bury hatch in v1

**stealth-sticky-after-session**:
After **conversation-start-stealth**, never restore `isUndetectable` to false via two-device exit or session end. Two-device exit may restore overlay visibility; detectability stays on (persist).
_Avoid_: Restoring prior detectability on TwoDevice exit; equating overlay-visible with detectable

**force-disguise-when-stealth**:
While `isUndetectable` is true, `disguiseMode` must be one of `terminal` | `settings` | `activity` (never `none`). User may switch among those three. If stealth engages and disguise is `none`, default `terminal`. Disguise is not a path back to detectable.
_Avoid_: `disguiseMode none` while stealth on; optional-off polish; gating disguise UI behind a Detectable toggle

**always-stealth-desktop-scope**:
The stealth terms above bind to the desktop Electron session host (macOS + Windows). iOS / App Store companion keeps **transparent-coach-positioning**. Two-device: phone is control/answer surface; desktop still obeys always-stealth when hidden.
_Avoid_: iOS undetectable claims; macOS-only stealth; phone exit making desktop detectable

### SWE session / modes

**swe-interview-session**:
Single product `ModeTemplateType` `technical-interview`. No pre-call Coding / Technical / Behavioral mode picker. Per turn, AnswerPlanner routes among the triad answer types.
_Avoid_: Three ModeTemplateTypes for the triad; treating triad as Modes Manager modes

**swe-triad-answer-types**:
Under **swe-interview-session** — Coding: `coding_question_answer`, `dsa_question_answer`, coding-contract debug types. Technical: `technical_concept_answer`, `system_design_answer` (speakable SD). Behavioral: `behavioral_interview_answer`. Out of triad: `sales_answer` / `lecture_answer`; `general_meeting_answer` fallthrough; `project_about_answer` special-case (not Behavioral).
_Avoid_: SD under Coding; sales/lecture as triad legs; project_about as Behavioral

**non-swe-modes-product-retire**:
v1 product-retires non-SWE modes from chrome/routing without big-bang deleting code. Hard out: `sales`, `lecture`, `seminar`, `recruiting`. Migrate `looking-for-work` → `technical-interview`. Hide `team-meet` / `general` from create-mode chrome; leftovers get neutral/TI-equivalent priors. Default active mode `technical-interview`.
_Avoid_: Hard-deleting templates in the same change; Sales/Lecture in About/Help; sales/lecture priors on migrated sessions

**swe-coach-build-order**:
Implement: (1) always-stealth package desktop, (2) **swe-interview-session** + **non-swe-modes-product-retire** + About/Help copy, (3) triad routing quality, (4) spoken answer quality, (5) coding path + sandboxed verification, (6) same-session memory, (7) defer Hindsight LTM, regional STT marketing, bringing back retired modes.
_Avoid_: Copy before stealth invariants; re-enabling Sales/Lecture chrome; Hindsight before triad routing

## Flagged ambiguities

**Detectable vs overlay-visible**: Overlay can return after two-device exit while `isUndetectable` stays true — these are different axes.

**Mode vs answerType**: Product “Coding / Technical / Behavioral” are answer-type legs, not Modes Manager templates.

## Example dialogue

Dev: “User starts Natively — when do we go undetectable?”  
Expert: “**conversation-start-stealth** — on `startMeeting`, not app launch.”  

Dev: “Can they flip back to Detectable in Settings?”  
Expert: “No — **no-user-detectable-switch**. And if they exit two-device, overlay may show but **stealth-sticky-after-session** keeps undetectable on.”  

Dev: “Do we need a Coding mode in the picker?”  
Expert: “No — **swe-interview-session** is `technical-interview`; **swe-triad-answer-types** routes the turn.”  

Dev: “What about Sales and Lecture?”  
Expert: “**non-swe-modes-product-retire** — hard out of chrome; code can stay for a later return.”  
