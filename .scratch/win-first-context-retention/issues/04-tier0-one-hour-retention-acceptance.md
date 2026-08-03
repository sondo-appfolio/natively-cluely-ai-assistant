# 04 — Tier0 one-hour retention acceptance

**What to build:** Acceptance suite for the win-first / 1-hour retention PRD: prove (a) a filled FR/NFR constraint spoken ≥3 minutes earlier still affects a TI SD clarifier/requirements turn, (b) a post-gate answer path can still see an early design-sheet commitment without re-elicitation, and (c) optional note/path for a ≥25-turn long-loop check that filled checklist slots are not silently cleared while still filled in the artifact. Token usage may be logged for ops but must not be the pass/fail oracle.

**Blocked by:** 01 — Align recentSdAnswers cap 1800→6000; 02 — Raise SD pack WTA inject so floor fits; 03 — TI SD hot path: durable 3600s + maxTurns 48

**Status:** ready-for-agent

**Parent:** [PRD — Win-first TI SD context retention](../PRD.md)

- [ ] Tier0: filled constraint from ≥3 minutes earlier still retained on TI SD clarifier/requirements path
- [ ] Tier0: early sheet commitment still available post-gate without re-elicitation
- [ ] Documented optional long-loop (≥25 turns) check for checklist-slot non-loss (schedule/dispatch OK; not a dual-agent CI oracle)
- [ ] Pass/fail does not use per-turn token cost as the oracle
- [ ] Suites stay green with 01–03 landed
