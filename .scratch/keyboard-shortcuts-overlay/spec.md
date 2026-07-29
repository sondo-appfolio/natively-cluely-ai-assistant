# Spec — Keyboard Shortcuts Overlay (Cluely-parity cheat-sheet)

**Status:** ready-for-agent  
**Feature slug:** `keyboard-shortcuts-overlay`  
**Grill source:** `_workspace/grill-with-docs/01_question_log.md` (2026-07-28, 8/8 verified)  
**Refs:** `_workspace/grill-with-docs/refs/1921.jpg`, `1922.jpg`  
**Audience:** `/to-tickets` then `/implement` (do not re-litigate locked grill decisions without a new grill)

---

## Problem Statement

During an interview or meeting, candidates using Natively need a fast way to see which global shortcuts do what — hide/show the window, move it without a mouse, scroll chat, take a screenshot, generate a solution, start/stop recording, mouse pass-through, and so on. Today those chords live in Settings > Hotkeys (rebind) and scattered Help copy. There is no mid-session Cluely-style cheat-sheet, no dedicated toggle hotkey for such a sheet, and no single glanceable surface that always shows the **live** accelerators the user actually has bound. Photo references show the UX target; Natively already has most of the underlying actions (including move-window via ⌘⇧+arrows) but not the panel.

## Solution

Ship a mid-session **Keyboard Shortcuts** frosted modal (Cluely-parity) over the overlay: curated rows with friendly display titles, live chords from KeybindManager, **Got it** / Esc / toggle to dismiss. Add a new global keybind `general:toggle-shortcuts` defaulting to ⌘/ (`CommandOrControl+/`), plus a UI entry to open the same sheet. Opening the sheet temporarily makes the overlay interactive if mouse passthrough was on, and restores prior passthrough on dismiss. Settings > Hotkeys remains the full list and rebind surface — the sheet does not mass-remap defaults toward photo chords.

## User Stories

1. As a candidate mid-session, I want a Keyboard Shortcuts cheat-sheet I can open without leaving the overlay flow, so that I can glance at chords without digging through Settings.
2. As a candidate, I want a dedicated global hotkey to open and close that sheet, so that I can toggle it even when another app is focused (stealth).
3. As a candidate, I want the default toggle hotkey to be ⌘/, so that it matches common “help/shortcuts” muscle memory and does not collide with existing Natively defaults.
4. As a candidate, I want to rebind the toggle hotkey in Settings > Hotkeys, so that I can resolve conflicts with other apps.
5. As a candidate, I want a UI control (menu / toolbar / help entry) that opens the same sheet, so that I can discover it without already knowing ⌘/.
6. As a candidate, I want Esc to dismiss the sheet, so that I can close it without hunting for a button.
7. As a candidate, I want a **Got it** button that dismisses the sheet, so that the UX matches the Cluely reference.
8. As a candidate, I want pressing the toggle hotkey again to close the sheet if it is open, so that one chord both opens and closes.
9. As a candidate with mouse passthrough on, I want opening the sheet to temporarily make the overlay clickable, so that I can press Got it.
10. As a candidate, I want dismissing the sheet to restore my previous passthrough state, so that stealth click-through is not permanently broken by looking at shortcuts.
11. As a candidate, I want the sheet to be a centered frosted modal (not a Settings page or Help article), so that it feels like a mid-session glance surface.
12. As a candidate, I want the sheet **not** to auto-open on first run, so that it never surprises me mid-interview.
13. As a candidate, I want each row to show the **live** accelerator from KeybindManager, so that after I rebind in Settings the sheet stays truthful.
14. As a candidate, I want curated rows roughly matching the photo set (Generate, Screenshot, Recording, Reset, Hide/Show, Pass-Through, Scroll Chat, Scroll Content, Move Window), so that the list stays glanceable.
15. As a candidate, I want Generate Solution to map to process-screenshots and show its live chord (default ⌘↵), so that the primary solve action is findable by Cluely-familiar naming.
16. As a candidate, I want Take Screenshot to map to take-screenshot and show its live chord (default ⌘H), so that capture stays discoverable.
17. As a candidate, I want Start/Stop Recording to map to answer/record (`chat:answer`) and show its live chord (default ⌘5), so that I am not lied to with a non-existent ⌘L default.
18. As a candidate, I want Reset Context to map to reset-cancel and show its live chord (default ⌘R), so that reset is discoverable without inventing ⌘G.
19. As a candidate, I want Hide/Show Window to map to toggle-visibility and show its live chord (default ⌘B), so that stealth hide remains obvious.
20. As a candidate, I want Mouse Pass-Through to map to toggle-mouse-passthrough and show its live chord (default ⌘⇧B), so that click-through is discoverable under Natively’s chord.
21. As a candidate, I want Scroll Chat to map to scroll up/down and show live chords (default ⌘↑/↓), so that I can scroll without a mouse.
22. As a candidate, I want Scroll Content to map to scroll left/right and show live chords (default ⌘⌥←/→), so that wide code blocks are reachable from the sheet.
23. As a candidate, I want Move Window to map to window:move-* and show live chords (default ⌘⇧+arrows), so that I know how to reposition without adopting photo ⌘+arrows that conflict with scroll.
24. As a candidate, I want friendly Cluely-style **display titles** on the sheet, so that the panel reads like the reference photos.
25. As a candidate, I want short descriptions under each title, so that I understand what the action does without leaving the sheet.
26. As a candidate in Settings > Hotkeys, I want existing KeybindManager labels unchanged, so that rebind UI stays consistent with prior docs and ids.
27. As a candidate, I want a hint or link from the sheet toward Settings > Hotkeys, so that I know where to customize or see the full list.
28. As a candidate, I want unbound curated actions to render safely (empty / “Unbound”), so that a cleared keybind does not crash the sheet.
29. As a candidate, I want directional rows (scroll/move) to present related chords together where the photo groups them, so that one row can cover an axis family.
30. As a power user, I want all other KeybindManager actions (⌘1–7 extras, selective screenshot, DOM capture, stealth typing, etc.) to remain registered and working, even if omitted from the curated sheet.
31. As a power user, I want Settings > Hotkeys to remain the place to rebind any action, so that the sheet never becomes a second rebind editor.
32. As a stealth user, I want existing global shortcuts to keep working while the sheet is closed, so that this feature does not unregister or break stealth chords.
33. As a stealth user, I want the toggle-shortcuts chord itself to be global, so that I can open the sheet without focusing Natively first.
34. As a candidate who rebound scroll or move, I want the sheet to reflect my custom chords immediately after reopen or live update, so that display-live is real.
35. As a candidate on Windows/Linux, I want accelerators rendered with the platform-appropriate modifier glyphs/labels, so that “Ctrl” appears where macOS would show ⌘.
36. As an implementer, I want a single curated catalog (id → display title, description, keybind id(s)), so that UI and tests share one content model.
37. As an implementer, I want a pure resolver from catalog + current keybind map → rows with display accelerators, so that tests do not need Electron UI.
38. As an implementer, I want `general:toggle-shortcuts` added to DEFAULT_KEYBINDS with default `CommandOrControl+/`, so that registration follows the existing keybind pipeline.
39. As an implementer, I want conflict handling for the new keybind to reuse KeybindManager’s existing swap / registration-failed behavior, so that we do not invent a second conflict policy.
40. As an implementer, I want main-process dispatch of `general:toggle-shortcuts` to toggle sheet visibility in the overlay renderer, so that the hotkey path matches other global actions.
41. As an implementer, I want sheet open/close to coordinate with overlay mouse-passthrough policy, so that interactive dismiss works without permanently flipping the user’s stealth preference.
42. As a QA engineer, I want Tier-0 coverage that DEFAULT_KEYBINDS includes toggle-shortcuts at CommandOrControl+/, so that the default cannot silently vanish.
43. As a QA engineer, I want Tier-0 coverage that the content resolver maps each curated row to the correct keybind id(s) and live accelerator strings, so that display-live naming stays locked.
44. As a QA engineer, I want Tier-0 coverage that rebound accelerators appear in resolver output, so that Settings changes surface on the sheet model.
45. As a QA engineer, I want Tier-0 or seam coverage that opening the sheet requests interactive mouse mode and dismiss restores prior passthrough, so that the passthrough contract cannot regress quietly.
46. As a product owner, I want Help copy (if touched) to point at the new sheet and/or ⌘/, without replacing Settings > Hotkeys guidance, so that docs stay aligned.
47. As a candidate comparing to Cluely photos, I want visual parity in structure (header icon, title, row icon + title + description + keycaps, Got it), so that the sheet is recognizable — without requiring pixel-perfect cloning of unused Cluely chords.
48. As a candidate, I want closing Settings or other overlays not to be required before opening the shortcuts sheet (or clear z-order rules if both can exist), so that mid-session access stays simple.
49. As an accessibility-minded user, I want focus trapped reasonably in the modal while open and restored on dismiss, so that keyboard-only dismiss (Esc / Got it / toggle) works.
50. As a future maintainer, I want this spec’s out-of-scope list respected (no mass Cluely remaps, no Hotkeys redesign, no Spotlight hang work), so that scope does not creep mid-implement.

## Implementation Decisions

- **Feature shape:** Mid-session Keyboard Shortcuts cheat-sheet modal in the overlay UI + dedicated global toggle keybind. Distinct from Settings > Hotkeys (rebind) and from Help documentation.
- **Keybind:** Add `general:toggle-shortcuts` to the default keybind set; `isGlobal: true`; default accelerator `CommandOrControl+/`; rebindable via existing Settings > Hotkeys / KeybindManager set/reset; conflicts use existing swap-on-set and registration-failed notifications.
- **Chord strategy (display-live):** Sheet always reads current KeybindManager accelerators. Do not mass-remap defaults to Cluely photo chords in this work. Move window stays ⌘⇧+arrows; scroll keeps ⌘+arrows (and horizontal ⌘⌥+arrows).
- **Curated catalog:** Fixed ordered list ≈ photo rows, each with: display title, short description, icon key, one or more KeybindManager action ids. Resolver joins catalog to live accelerators for rendering.
- **Display naming (sheet only):** Friendly titles may match Cluely wording; Settings / KeybindManager `label` fields stay as today.
  - Generate Solution → `general:process-screenshots`
  - Take Screenshot → `general:take-screenshot`
  - Start/Stop Recording → `chat:answer`
  - Reset Context → `general:reset-cancel`
  - Hide/Show Window → `general:toggle-visibility`
  - Mouse Pass-Through → `general:toggle-mouse-passthrough`
  - Scroll Chat → `chat:scrollUp` + `chat:scrollDown`
  - Scroll Content → `chat:scrollLeft` + `chat:scrollRight`
  - Move Window → `window:move-up/down/left/right`
- **No new default chords** for Recording (⌘L) or Reset (⌘G).
- **Overlay UX:** Centered frosted modal; header keyboard affordance + “Keyboard Shortcuts”; rows with keycap rendering; footer **Got it**. Dismiss via Got it, Esc, or toggle hotkey. No auto first-run.
- **Passthrough policy:** On open, force overlay interactive (clear ignore-mouse / passthrough for interaction) while remembering prior user passthrough preference; on dismiss, restore that preference. Do not permanently flip the stored passthrough setting unless the user toggles passthrough themselves.
- **UI entry:** At least one non-hotkey entry point (e.g. overlay control or Help affordance) that opens the same sheet state.
- **Settings relationship:** Optional “Customize in Settings > Hotkeys” hint/link from the sheet; do not embed a rebind editor in the sheet; do not redesign the Hotkeys settings tab.
- **Modules (conceptual):** KeybindManager (new default + dispatch), overlay shortcuts sheet UI + open state, curated catalog + pure resolver, passthrough coordination with existing overlay mouse-passthrough APIs. Prefer extending existing seams over new subsystems.
- **Platform rendering:** Accelerator display should follow existing shortcut formatting helpers used elsewhere in the app when available.
- **Z-order / coexistence:** Prefer simple rules: shortcuts sheet is an overlay-local modal; if Settings is open, either allow sheet on top or require Settings closed — pick the path that reuses existing overlay modal patterns with least new focus bugs.

## Testing Decisions

- **Good tests** assert external behavior at the agreed seams: defaults present, resolver output for catalog + keybind map, passthrough open/dismiss contract — not private React trees or Electron screenshot diffs.
- **Primary seam — KeybindManager registration:** Assert `general:toggle-shortcuts` exists in defaults with `CommandOrControl+/`, is global, and participates in set/reset / conflict swap like other keybinds. Prefer extending or mirroring existing keybind/service test style in the electron services test area.
- **Secondary seam — content resolver (pure):** Given a curated catalog and a keybind map (including rebound and empty accelerators), assert row order, mapped action ids, and emitted accelerator strings / unbound handling. Highest-leverage lock for display-live + naming.
- **Tertiary seam — sheet open/close + passthrough policy:** At the WindowHelper / overlay IPC (or equivalent policy helper) boundary, assert open → interactive; dismiss → prior passthrough restored. Avoid brittle full UI e2e unless the repo already has a cheap pattern for modal open state.
- **Prior art:** Keybind-related service tests; Settings Hotkeys / `useShortcuts` mapping patterns; existing overlay mouse-passthrough IPC (`set` / `toggle` / `get` / changed events). Prefer pure unit tests over launching Electron for catalog/resolver.
- **Non-goals for tests:** Pixel-perfect Cluely visual regression; remapping suites for photo chords; Spotlight hang scenarios.

## Out of Scope

- Mass remapping of Natively default chords to match Cluely photo accelerators
- Redesigning or replacing Settings > Hotkeys
- Breaking, unregistering, or narrowing existing global stealth shortcuts
- Auto-showing the sheet on first run / first session
- Adding ⌘L or ⌘G (or other photo-only chords) as new defaults
- Showing every KeybindManager action in the mid-session sheet (full list stays in Settings)
- Spotlight / Electron.app hang fixes (tracked separately)
- Building a second rebind UI inside the cheat-sheet
- Changing Help into the primary shortcuts surface (Help may only link/mention)

## Further Notes

- Grill locked decisions live in `_workspace/grill-with-docs/00_memory.md` and `01_question_log.md`; treat them as authoritative for `/to-tickets` / `/implement`.
- Visual refs: `_workspace/grill-with-docs/refs/1921.jpg`, `1922.jpg` — structure and density targets, not chord truth.
- Move-window already ships; this feature’s job is discoverability via the sheet + toggle, not inventing move.
- After tickets: implement blockers-first with fresh context per ticket (`/to-tickets` → `/implement`).
