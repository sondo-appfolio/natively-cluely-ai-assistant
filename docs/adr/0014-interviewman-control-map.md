# Red square is live STT; bottom Ask bar submits; triangle ends the meeting

Status: accepted (amended 2026-08-06)

Today’s Cluely overlay **Ask/Submit chip** two-phase mic capture (`handleAnswerNow` / `isManualRecording`) duplicates InterviewMan’s red-square listen job and fights always-on live transcript. We amend the control map: **red square** = live STT transport only (auto-arm on meeting start; pause stops STT; never submits); **bottom Ask bar** replaces the Ask chip in the same change (Think → What-to-Answer; typed input + blue ↑ → AI turn); main-compose **Assist** stays a separate AssistLLM control; **triangle** ends the meeting; `chat:answer` focuses the Ask bar. Phone Mirror mirrors this map. Visual parity is layout/jobs (not unbounded pixel clone); keep WTA/Assist, screenshot→answer, RAG/LESSON/@, Phone Mirror/stealth. We rejected merging submit onto the red square and rejected removing the Ask chip before a typed-ask path exists. See `docs/interviewman-listen/CONTEXT.md`.
