# iOS is a Stealth Mode client, not a standalone copilot

Supersedes ADR 0006 (standalone iOS, not Phone Mirror).

Natively’s iOS app is an **ios-stealth-mode-client**: it pairs with Natively desktop over the Phone Mirror protocol. Desktop owns mic/STT/LLM, LESSON/corpus retrieval, and overlay hide / undetectable compose. The phone shows answers and session controls (including two-device stealth enter/exit/end). We rejected shipping a phone-hosted listen→answer loop as the product thesis. This is the native Store-app phase deferred by the two-device-stealth web PRD; both must speak the same phone-token WebSocket protocol.
