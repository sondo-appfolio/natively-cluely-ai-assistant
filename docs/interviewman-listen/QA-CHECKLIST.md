# QA checklist — InterviewMan listen parity

Manual acceptance path for `interviewman-listen` (ADR 0014 control map, ADR 0015 phone STT source). Glossary: [CONTEXT.md](./CONTEXT.md).

## Out of scope (do not fail the build on these)

- InterviewMan retention timers / win-first memory product behavior
- Phone-hosted LLM, RAG, LESSON retrieval, or What-to-Answer brain on the phone
- Whole-app pixel-perfect InterviewMan clone (only listen / transcript / transport / Ask-bar surfaces)
- SD overlay interview e2e no-audio harness as a live-STT suite

---

## Desktop — happy path

- [ ] Start a meeting with STT configured → listening arms without clicking Ask
- [ ] Live transcript shows interviewer (system audio) and user-mic text while armed
- [ ] Red square **pauses** listening → no new STT capture; meeting stays open
- [ ] Red square **resumes** listening → live text continues
- [ ] **Ask/Submit chip is gone** from quick actions
- [ ] Bottom Ask bar present: **Think** | typed input | blue ↑
- [ ] Think runs What-to-Answer; listen transport state unchanged
- [ ] Type + blue ↑ (or Enter) sends an AI ask; listen transport state unchanged
- [ ] ⌘5 / Focus Ask bar focuses the bottom Ask input (does not arm mic, does not toggle STT)
- [ ] Assist on main compose (if shown) stays separate from Think
- [ ] Quick actions (What to answer?, Clarify, Recap/Brainstorm, Follow Up) still work
- [ ] Triangle **ends** the meeting (returns to launcher); red square alone does not end it

## Desktop — Ambient & unready

- [ ] Ambient AI Chat ON at meeting start → capture skipped (no fake empty “listening” transcript)
- [ ] STT provider `none` / missing model / missing permissions → clear unready / setup state (not empty listening)
- [ ] Unready banner points at Settings Audio; after fixing provider, red square can resume

## Settings — live-STT sandbox

- [ ] Settings → Audio → Listen streams **real transcript text** (partial and/or final)
- [ ] Level meter alone is not treated as the live-STT proof
- [ ] Credential / connection ping alone is not treated as the live-STT proof
- [ ] Stop / pause sandbox mirrors listen-transport mental model (Listen stops streaming text)

## Phone Mirror — control + STT source

- [ ] Phone can pause / resume listen transport (desktop remains session host)
- [ ] Phone triangle-equivalent ends the meeting on desktop
- [ ] Phone Ask with typed message produces an AI turn from the **desktop** LLM
- [ ] Phone Ask with empty message focuses desktop Ask bar (not two-phase mic)
- [ ] Phone mic STT text appears in the shared desktop / overlay live transcript when phone is active user-STT source
- [ ] UI indicates active user-STT source (Desktop vs Phone); last-armed wins
- [ ] While phone is user-STT source, desktop user-mic is not treated as the active dictation source

## Copy & shortcuts

- [ ] Help / Settings copy: red square = live STT; triangle = end meeting; Focus Ask bar = bottom bar
- [ ] Shortcut label for `chat:answer` is Focus Ask bar (not “start listening”)
- [ ] No overlay copy implies Ask chip is required to hear the room

## Regression smoke

- [ ] After pause → typed ask → resume, transcript and answers both still work
- [ ] Ending via triangle tears down session cleanly (no orphan “still listening” state)
