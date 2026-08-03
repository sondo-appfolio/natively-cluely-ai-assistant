# MAP — Win-first TI SD context retention (1-hour meeting)

**Feature slug:** `win-first-context-retention`  
**Status:** ready-for-agent (PRD + tickets)  
**PRD:** [PRD.md](PRD.md)  
**Grill:** `_workspace/grill-with-docs/01_question_log.md` (12/12) + user lock: **1-hour meeting**

## Destination

Ship TI SD WTA retention that holds commitments + durable speech across a **60-minute** interview without InterviewMan-style short raw-history caps, while staying token-efficient (compress filler; protect pack floor).

## Tickets (ready-for-agent)

| # | Title | Blocked by |
|---|--------|------------|
| [01](issues/01-align-recent-sd-answers-cap.md) | Align recentSdAnswers cap 1800→6000 | — |
| [02](issues/02-raise-sd-pack-inject-for-floor.md) | Raise SD pack WTA inject so floor fits | — |
| [03](issues/03-ti-sd-durable-hour-transcript-feed.md) | TI SD hot path: durable 3600s + maxTurns 48 | — |
| [04](issues/04-tier0-one-hour-retention-acceptance.md) | Tier0 one-hour retention acceptance | 01, 02, 03 |

**Frontier:** 01 ∥ 02 ∥ 03 → then 04.

## Seams (approved via grill + user go)

1. **Primary:** TI SD WTA transcript feed (durable 3600 + sparsify 48).
2. **Secondary:** SD pack WTA inject / retrievedModeContext budget for floor.
3. **Alignment:** recentSdAnswers metadata maxTotalChars 6000.
