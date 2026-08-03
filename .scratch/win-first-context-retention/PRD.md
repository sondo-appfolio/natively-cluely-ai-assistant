# PRD — Win-first TI SD context retention (1-hour meeting)

**Status:** `ready-for-agent`  
**Feature slug:** `win-first-context-retention`  
**Grill:** `_workspace/grill-with-docs/01_question_log.md` (12/12 verified, Mode C)  
**User amendment:** Context must hold for a **1-hour meeting** (`getDurableContext(3600)` minimum; do not ship a shorter durable window in v1).  
**Audience:** `/to-tickets` then `/implement`  
**Sibling maps (do not re-litigate):** SD Requirements Grilling Gate · SD Deep-Dive Context · SdSessionAuthority  

---

## Problem Statement

In Technical Interview system-design meetings that last up to an hour, Natively’s live What-To-Answer path still feeds a short rolling transcript window (`getContext(180)` + sparsify ~12 turns). Candidates and interviewers lose Requirements constraints, numbers, and design decisions spoken earlier in the hour — even though durable transcript storage and a design sheet already exist. Competitors expose short “conversation length” context knobs (e.g. InterviewMan ~10 minutes of prompt history); burning tokens to **win** the interview matters more than matching that short raw-history cap. Without raising the TI SD hot path to hour-scale durable speech **and** protecting the SD context-pack floor from a too-tight inject budget, hour-long interviews silently forget filled checklist slots and early commitments.

## Solution

For **Technical Interview system-design only** (Requirements gate + sticky clarifiers under SdSessionAuthority + post-gate deep dive):

1. **Retention unit = commitments**, not maximal raw dump every turn: Requirements checklist, interviewer constraints/numbers, design decisions, coverage progress, plus a short recent spoken window.
2. **1-hour durable transcript feed** on the TI SD WTA hot path: `getDurableContext(3600)` then `prepareTranscriptForWhatToAnswer` with `maxTurns=48` (requirements/clarifier turns). Post-gate continuity stays `designSheet` + `recentSdAnswers`; the SD context pack still **omits** full meeting transcript.
3. **Protect the pack floor**: keep hard ~12k pack ceiling; raise WTA inject / retrievedModeContext slot so sheet + latest utterance + recentSdAnswers + LESSON-if-present are not crushed by the current ~1600 inject squeeze.
4. **Align `recentSdAnswers`**: authoritative `maxItems=3`, `maxTotalChars=6000`, per-item max 600; fix stale gate-type 1800 metadata.
5. **Keep** SPEC 06 eviction order, screenshot queue at 5, thin design sheet, TemporalContext prior-assistant stubs as anti-repetition only.
6. **Non-TI modes unchanged** (`getContext(180)` + sparsify 12).

## User Stories

1. As a candidate in a 60-minute TI SD interview, I want Requirements numbers I confirmed in minute 5 still available at minute 50, so that I do not contradict myself or re-ask filled slots.
2. As a candidate on a clarifier turn under a sticky SD session, I want the durable hour window (not the 180s ring) to feed WTA, so that gate fill and soft-refuse stay accurate late in the meeting.
3. As a candidate post-gate, I want early design commitments on the design sheet to still ground answers, so that deep dives stay consistent with what I already said.
4. As a candidate, I want recent spoken SD answers (up to 3 / 6000 chars total) in the pack floor, so that continuity does not depend on 3×200 priorResponses stubs.
5. As a candidate, I do not want the entire raw transcript dumped into every prompt, so that answers stay focused and tokens buy win-critical state instead of filler.
6. As a candidate, I want the pack’s non-droppable floor to survive WTA inject budgeting, so that sheet + latest probe are never silently dropped for inject squeeze.
7. As a candidate, I want LESSON chunks to remain score-gated and omit-on-miss, so that weak retrieval does not crowd out sheet/recent under the 12k hard cap.
8. As a candidate in coding/DSA/behavioral modes, I want existing short windows unchanged in v1, so that this work does not rewrite all meeting memory.
9. As an implementer, I want one primary seam on the TI SD WTA transcript feed, so that hour retention is testable without scattering magic numbers.
10. As an implementer, I want a secondary seam on SD pack inject budgets, so that floor protection is independently verifiable.
11. As an implementer, I want gate-type `recentSdAnswers` metadata aligned to 6000, so that docs/types match runtime extractor/pack.
12. As a QA engineer, I want Tier0 proof that a filled FR/NFR spoken ≥3 minutes earlier survives a clarifier turn on the TI SD path.
13. As a QA engineer, I want Tier0 proof that a post-gate answer can cite an early sheet commitment without re-elicitation.
14. As a QA engineer, I want optional long-loop (≥25 turns) evidence that filled checklist slots are not silently cleared while still filled in the artifact.
15. As an operator, I want per-turn token usage logged for ops, not used as a pass/fail oracle.
16. As a product owner, I want InterviewMan-style ~10-minute raw context caps explicitly rejected as the memory model.
17. As a product owner, I want screenshot PNG queue left at 5, so vision cost does not become the retention strategy.
18. As a product owner, I want COMMITTED_MAX raised only after measured eviction of active commitments, so the sheet stays thin by default.
19. As a session, I want leaving TI / meeting-end / new-problem reset to keep existing SessionTracker and authority lifecycle rules.
20. As a T2 operator, I want sim pin / showcase dynamics unchanged except where they share the same TI SD WTA feed, so corpus runs benefit from hour retention without new sim-only memory forks.

## Implementation Decisions

### Primary seam (preferred)
- **TI SD WTA transcript preparation** in the IntelligenceEngine live What-To-Answer path: when Technical Interview + SD session should arm (sticky `problemKey` / SdSessionAuthority / `system_design_answer` prepare path as already defined by session authority), load transcript via **durable 3600s** window and sparsify with **maxTurns=48** instead of `getContext(180)` + maxTurns=12.
- Post-gate `system_design_answer` continues to assemble SD context pack from design-state; pack still ignores meeting transcript input.
- Non-TI and non-SD paths keep today’s 180s / 12 behavior.

### Secondary seam
- **SD context pack WTA inject budget**: raise inject / retrievedModeContext allowance so the non-droppable floor fits; keep hard pack cap ~12k; eviction order unchanged (adaptive → truncate recent → truncate LESSON → never drop sheet + latest utterance).

### Alignment seam
- **`recentSdAnswers` cap metadata**: gate type/default `maxTotalChars` 1800 → **6000**; keep maxItems=3 and per-item text max 600.

### Explicit non-changes
- Do not grow TemporalContext prior-assistant into a 6000-char parallel feed under PromptAssembler’s prior-assistant block.
- Do not raise `MAX_SCREENSHOTS` or add OCR→designSheet pipeline in v1.
- Do not disable global token budgets or inject whole-file LESSON every turn.
- Do not rewrite coding/DSA/behavioral memory in v1.

### 1-hour meeting lock
- Wall-clock target for durable feed: **3600 seconds** minimum.
- Sparsify turn budget must be high enough that a dense hour of SD dialogue is not collapsed to 12 turns (lock **48** unless Tier0 proves otherwise; if 48 is insufficient for hour-long dense turns, raise turns before shortening the 3600s window).

## Testing Decisions

- Good tests assert **external behavior**: clarifier/requirements turns still “know” older filled constraints; pack floor survives inject; gate metadata matches runtime caps — not private helper call graphs.
- Modules under test: TI SD WTA transcript feed behavior; SD context pack inject under floor-sized payloads; `recentSdAnswers` cap alignment; Tier0 acceptance from grill Q12.
- Prior art: SdSessionAuthority Tier0, SdDeepDiveContextPack Tier0, SdRequirementsGate Tier0, overlay/sim harnesses for optional long-loop (schedule-only; never PR oracle for dual-agent).

## Out of Scope

- Maximal grounding (full raw transcript every WTA turn).
- InterviewMan-style ~10-minute conversation length as the product memory model.
- Disabling all token budgets / hard pack ceiling.
- Whole-file LESSON inject every turn.
- Raising screenshot PNG queue or OCR→sheet retention pipeline.
- Non-TI mode memory rewrite.
- Upstream PRs / premium submodule work (fork-only, skip-premium).

## Further Notes

- Grill rejected reordering eviction to truncate LESSON before recent; protect floor via inject budget instead.
- `LIVE_MEMORY_WINDOW_SECONDS` already 7200 on some memory paths; this PRD specifically changes the **WTA hot path** that still uses 180s today.
- Next: `/to-tickets` under `.scratch/win-first-context-retention/issues/`, then `/implement` per ticket with clear context between tickets.
