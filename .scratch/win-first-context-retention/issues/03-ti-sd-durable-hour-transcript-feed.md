# 03 — TI SD hot path: durable 3600s + maxTurns 48

**What to build:** For Technical Interview system-design requirements and sticky-session clarifier turns, the live What-To-Answer transcript feed uses a **1-hour** durable window (`getDurableContext(3600)`) and sparsifies with `maxTurns=48`, instead of the short rolling `getContext(180)` + maxTurns=12 ring. Post-gate continuity remains design sheet + recentSdAnswers; the SD pack still does not inject full meeting transcript. Non-TI modes stay on 180s/12.

**Blocked by:** None — can start immediately (may land in parallel with 01 and 02).

**Status:** done

**Parent:** [PRD — Win-first TI SD context retention](../PRD.md)

- [x] TI SD requirements/clarifier WTA path reads durable **3600s** (not 180s) for transcript prep
- [x] Sparsify maxTurns is **48** on that path (not 12)
- [x] Non-TI / non-SD paths still use 180s + 12
- [x] Post-gate pack still omits meeting transcript; sheet/recent remain the post-gate continuity channel
- [x] Tier0 or focused unit test proves a constraint older than ~3 minutes is still present in the prepared transcript feed for a TI SD clarifier-style turn
- [x] Live path never dumps unbounded fullTranscript every turn

**Implementation notes:**
- New pure helper `electron/llm/tiSdTranscriptFeed.ts` exports the locked constants (`TI_SD_DURABLE_WINDOW_SECONDS=3600`, `TI_SD_DURABLE_MAX_TURNS=48`, plus the existing `180/12` defaults) and `isTiSdWtaHotPath(answerType, shouldArmGate)`, which mirrors the exact condition `applySdRequirementsGate` already uses to decide whether SD prepare governs a turn (`answerType === 'system_design_answer' || SdSessionAuthority.shouldArmGate`) — never broadened to other modes.
- `IntelligenceEngine.applySdRequirementsGate` now returns `isTiSdHotPath`; `runWhatShouldISay` re-sources `preparedTranscript` from `session.getDurableContext(3600)` (+ latest interim re-injection) and re-sparsifies with `maxTurns=48` only when that flag is true. All other turns keep the original `getContext(180)` + `maxTurns=12` path untouched.
- SD deep-dive context pack (`design sheet` / `recentSdAnswers`) code path was not touched — pack still omits full meeting transcript.
- Tier0: `electron/services/__tests__/TiSdDurableHourTranscriptFeedTier0.test.mjs` (4 tests) exercises the real `IntelligenceEngine.runWhatShouldISay` path end-to-end and proves: (1) a ~4-minute-old constraint survives on a TI + sticky-SD-session clarifier turn, (2) non-TI mode still drops it (180s ring unchanged), (3) TI mode alone without an open SD session also stays on 180s (no broadening), (4) a 2-hour-old turn stays outside the 3600s durable window (bounded, not unbounded fullTranscript).
