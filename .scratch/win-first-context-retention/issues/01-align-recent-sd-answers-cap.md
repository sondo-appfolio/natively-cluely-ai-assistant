# 01 — Align recentSdAnswers cap 1800→6000

**What to build:** Make the Requirements-gate / design-state type metadata for `recentSdAnswers` match the runtime extractor and SD pack: `maxItems=3`, `maxTotalChars=6000`, per-item text max unchanged at 600. After this ticket, nothing in the TI SD path still advertises 1800 as the authoritative total char cap.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

**Parent:** [PRD — Win-first TI SD context retention](../PRD.md)

- [ ] Gate/design-state metadata that still says `maxTotalChars: 1800` is updated to `6000`
- [ ] Per-item max remains 600 (not raised to 2000)
- [ ] maxItems remains 3
- [ ] Tier0 or unit assertion pins the authoritative cap values (3 / 6000 / 600)
- [ ] Existing SD pack / extractor behavior remains green
