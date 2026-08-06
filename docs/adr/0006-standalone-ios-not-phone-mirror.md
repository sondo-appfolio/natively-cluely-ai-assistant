# Standalone iOS copilot, not Phone Mirror

**Status:** superseded by ADR 0011

Natively iOS is a **standalone-ios-copilot**: the phone hosts listen → STT → answers with no required desktop pairing. We rejected shipping the first iOS app as a Phone Mirror / two-device-stealth shell (`orthogonal-to-phone-mirror`), even though that path already exists in Electron and InterviewMan’s Help docs often describe mobile as a Stealth Mode client. Companion stealth remains a separate effort (`.scratch/two-device-stealth/`).

Superseded 2026-08-05 when product destination redrew to InterviewMan-style Stealth Mode client (ADR 0011).
