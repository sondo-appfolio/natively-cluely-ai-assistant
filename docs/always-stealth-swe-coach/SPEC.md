## Problem Statement

Candidates using Natively in Software Engineer interviews can accidentally leave the app screen-share-visible (Detectable toggle, two-device exit restoring prior state, meeting start that never engages stealth). The product also markets Sales/Lecture and multi-mode “Intelligence OS” priors that dilute a focused SWE interview coach (Coding / Technical / Behavioral).

## Solution

Make desktop Natively an always-undetectable SWE interview coach: stealth engages when a conversation starts, users cannot flip to Detectable, disguise is required while undetectable, and the only product session is `technical-interview` with per-turn triad routing. Non-SWE modes leave product chrome (code kept for possible later return). iOS stays transparent-coach.

## User Stories

1. As a candidate, I want Natively to become undetectable when I start an interview session, so that I do not forget to enable stealth.
2. As a candidate, I want no Detectable switch in the launcher or settings, so that I cannot accidentally go visible mid-interview.
3. As a candidate, I want two-device exit to bring back the desktop overlay without making me detectable, so that phone control does not undo stealth.
4. As a candidate, I want ending a meeting to leave stealth on, so that the next session starts already protected.
5. As a candidate, I want a system-app disguise while undetectable, so that the dock/task identity does not scream “Natively.”
6. As a candidate, I want to choose among Terminal, Settings, and Activity disguises, so that I can match my environment.
7. As a candidate, I want disguise defaulting to Terminal if unset when stealth engages, so that I am never undisguised while undetectable.
8. As a candidate, I want disguise changes never to turn detectability off, so that polish cannot break stealth.
9. As a candidate on macOS, I want dock/content-protection stealth to apply, so that screen share does not capture the overlay.
10. As a candidate on Windows, I want taskbar/tray stealth parity, so that always-stealth is not macOS-only.
11. As a candidate, I want a single SWE interview session (not Sales/Lecture pickers), so that setup matches real interviews.
12. As a candidate, I want Coding questions answered with coding/DSA contracts, so that I can speak or paste working solutions.
13. As a candidate, I want Technical / system-design questions answered with speakable Technical/SD contracts, so that I can talk through design.
14. As a candidate, I want Behavioral questions answered as spoken stories, so that I can respond to experience asks.
15. As a candidate, I want interviews that mix Coding, Technical, and Behavioral without changing modes, so that routing follows the interviewer.
16. As a candidate, I do not want Sales or Lecture modes offered, so that the product stays SWE-focused.
17. As a candidate, I do not want Seminar or Recruiting modes offered, so that hard-out modes stay gone.
18. As a returning user on looking-for-work, I want to land on technical-interview, so that I stay on the SWE coach path.
19. As a candidate, I want About/Help copy to describe always-stealth SWE coaching, so that marketing matches behavior.
20. As a phone companion user, I want iOS to remain transparent-coach (no undetectable claims), so that App Store positioning stays honest.
21. As a two-device user, I want phone enter/exit/end to keep desktop undetectable sticky, so that remote control does not reintroduce Detectable.
22. As an engineer, I want internal `setUndetectable` IPC retained for tests/e2e/two-device, so that automation still works.
23. As an engineer, I want stealth policy unit-tested at a pure seam, so that sticky/disguise rules do not regress.
24. As a candidate, I want same-session follow-ups to remember earlier answers (later slice), so that clarifiers stay coherent.
25. As a candidate in a coding interview, I want verified code badges when verification is re-enabled (later slice), so that I trust suggested code.

## Implementation Decisions

- Glossary and ADRs live under `docs/always-stealth-swe-coach/` and `docs/adr/0017`–`0019`; follow **swe-coach-build-order**.
- **Slice 1 (this implement):** always-stealth package on desktop — conversation-start-stealth, no-user-detectable-switch, stealth-sticky-after-session, force-disguise-when-stealth.
- Pure policy helper (preferred seam): given current disguise + stealth intent, resolve required disguise (`none` → `terminal`) and sticky undetectable after two-device exit (always keep true).
- `TwoDeviceStealthSession.exit` must not restore prior detectability; may still restore overlay visibility.
- `startMeeting` (and equivalent live session start) must engage undetectable and ensure non-`none` disguise.
- `setUndetectable(true)` must coerce disguise via the policy helper; `setDisguise('none')` while undetectable is rejected/coerced.
- Remove Detectable/Undetectable UI from Launcher, SettingsPopup, Settings General; keep disguise picker usable while stealth is on (three options only).
- Platform: macOS + Windows desktop; do not change iOS transparent-coach copy.
- **Later slices (out of this implement run’s code):** non-swe-modes-product-retire, triad routing polish, spoken quality, code verification, same-session memory.

## Testing Decisions

Good tests assert external behavior through public surfaces (session start policy, TwoDeviceStealthSession host adapter, UI absence of Detectable controls), not private AppState fields.

**Primary seam (slice 1):** `TwoDeviceStealthSession` + a small pure stealth/disguise policy module. Prior art: `electron/services/__tests__/TwoDeviceStealthSession.test.mjs`, Windows stealth parity source tests.

**Behaviors to lock in slice 1:**
1. Two-device exit leaves undetectable true even if prior was false; overlay can restore.
2. Policy maps disguise `none` → `terminal` when stealth on; leaves terminal/settings/activity unchanged.
3. Source/UI contracts: Detectable toggles removed from Launcher / SettingsPopup / SettingsOverlay General; disguise not gated off while undetectable.

**Later seams:** ModesManager picker retirement; AnswerPlanner sales/lecture prior removal (slice 2+).

## Out of Scope

- Re-enabling Sales/Lecture/Seminar/Recruiting in v1
- Hindsight LTM, regional STT marketing claims
- iOS undetectable positioning
- Soft focus hints / three mode pickers
- Full triad routing rewrites beyond what stealth/mode chrome requires
- Hard-deleting mode template code

## Further Notes

Seams agreed for implement: (1) pure policy + TwoDeviceStealthSession + startMeeting/setUndetectable wiring + UI chrome removal. Mode collapse is the next serial `/implement` after slice 1 lands.
