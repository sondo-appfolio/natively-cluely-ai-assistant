# 02 — Raise SD pack WTA inject so floor fits

**What to build:** On the post-gate TI SD path, the non-droppable context-pack floor (design sheet + latest interviewer utterance + recentSdAnswers + LESSON-if-present) must survive WTA inject budgeting. Keep the hard ~12k pack ceiling and SPEC 06 eviction order; raise the inject / retrievedModeContext allowance that currently squeezes the floor (~1600 inject).

**Blocked by:** None — can start immediately (may land in parallel with 01 and 03).

**Status:** ready-for-agent

**Parent:** [PRD — Win-first TI SD context retention](../PRD.md)

- [ ] Floor-sized pack payload is not truncated away solely by the old ~1600 inject squeeze
- [ ] Hard pack ceiling ~12k remains
- [ ] Eviction order unchanged: adaptive → truncate recent → truncate LESSON → never drop sheet + latest utterance
- [ ] Tier0 proves a floor-heavy pack still includes sheet + latest utterance after inject budgeting
- [ ] Adaptive slice still drops before floor items under overflow
