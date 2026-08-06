# Speakable SD enforcement (defense in depth)

System-design WTA turns were inheriting the coding DSA RESPONSE CONTRACT via TI `SHARED_CODING_RULES`, and DSA repair could inject Code/Dry Run/Complexity placeholders into SD transcripts. Prep and live interviews need read-aloud Delivery Framework speech, not code dumps. We enforce speakable SD with three layers: untangle prompts so SD never gets the DSA contract; never run DSA repair unless `isCodingAnswerType`; post-stream strip DSA headings and impl-language fences on `system_design_answer` while keeping SPEC 10 ASCII HLD. The same contract applies to product TI and T2 SUT; T2 interviewer is retuned to prose + mermaid only.

**Status:** accepted

## Considered options

1. **Prompt / tone-only (`promptInstruction`)** — rejected; Spec 08 already showed tone overlay cannot override TI SHARED_CODING_RULES.
2. **Post-strip only** — rejected; leaves model trained on DSA scaffolds and repair markers under misroute.
3. **Defense in depth (chosen)** — prompt untangle + repair gate + post-strip.
4. **Sim-only** — rejected; user locked speakable surface on product + T2.

## Consequences

- `compressToSpeakable` must not run on `system_design_answer`.
- FULL_RAW means no-caveman / one DF slice, not essay dump.
- `candidate_rewind` (SPECs 14–16) stays a separate track — not a speakable ship gate.
- Candidate-led showcase remains T2 sim-only (SPEC 09).
