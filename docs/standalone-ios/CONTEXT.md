# Natively iOS — Stealth Mode client

Glossary for a native iPhone **Stealth Mode client** (InterviewMan-like): phone UI paired with Natively desktop. Desktop hosts intelligence; phone displays answers and controls.

## Language

### Product shape

**ios-stealth-mode-client**:
Native iOS app that pairs with Natively desktop over the Phone Mirror protocol; shows answers and session controls; does not host the interview listen→STT→LLM loop.
_Avoid_: standalone-ios-copilot, phone-hosted live assist, orthogonal-to-phone-mirror

**desktop-session-host**:
Natively desktop owns mic/STT, LLM/planner, LESSON/corpus retrieval, overlay, and undetectable/hide compose during two-device stealth.
_Avoid_: phone as intelligence host

**phone-control-surface**:
Phone UI capabilities for session control (answers, chat, actions, screenshot, stealth) — subset of broader mobile UI parity.
_Avoid_: scrcpy / pixel mirror of the laptop screen; treating this as the whole iOS product

**mobile-desktop-ui-parity**:
iOS app is a user-friendly mobile adaptation of the desktop Natively UI with all **core** session functionality; desktop remains intelligence host; not a minimal answer-only remote.
_Avoid_: thin Stealth-only remote as the product goal; requiring pixel-identical overlay chrome on iPhone

**phone-mirror-protocol**:
HTTP + WebSocket contract (`PhoneMirrorService` / phone-token events and commands) shared by web client and native iOS client.
_Avoid_: second incompatible phone protocol, giving phone tokens `/dom` access

### Pairing & stealth

**lan-qr-pairing**:
Same-subnet Wi‑Fi pairing via Allow LAN + QR/URL remains a fallback (no USB localhost reverse on iOS).
_Avoid_: iOS adb reverse, requiring USB for iPhone v1

**usb-interview-tailscale-test**:
Transports share one protocol. **Interview primary = USB** (or cable-local path). **Tailscale (and LAN Wi‑Fi) = away-from-desk testing.** iOS has no Android-style `adb reverse` — USB path must be designed explicitly.
_Avoid_: Tailscale as the only interview-day path, Safari-as-the-client

**react-native-phone-mirror-client**:
React Native iOS app that speaks phone-mirror-protocol and knowledge-gateway HTTP directly (personal sideload).
_Avoid_: Safari client, WKWebView-wrap of the HTML phone client as the product, requiring SwiftUI for this effort

**swiftui-phone-mirror-client** (deprecated):
Prior shell lock; superseded by **react-native-phone-mirror-client** (ADR 0013).

**two-device-stealth**:
Desktop hide/undetectable compose while answers stream to the phone; enter/exit/end from the phone control surface (see `.scratch/two-device-stealth/`).
_Avoid_: conflating with iOS-local overlay invisibility

**transparent-companion-positioning**:
App Store copy frames a companion/remote display for Natively desktop — not “undetectable on Zoom” on the iPhone itself.
_Avoid_: iOS stealth parity claims, invisible-on-Zoom on iPhone

### Explicit non-goals

**ios-first-no-web-phone-client**:
Ship the React Native iOS app as the only phone-client product; do not deliver or require the Safari/HTML Phone Mirror UI. Desktop PhoneMirrorService (server) remains.
_Avoid_: Safari phone client as a milestone, blocking iOS on web phone UI

**tailscale-knowledge-gateway**:
Desktop HTTP/WS API (token-gated) that runs local LESSON / knowledge / RAG vector queries and returns results to the iOS app over Tailscale for on-the-go testing — phone never opens SQLite files.
_Avoid_: remote raw DB file access, phone-hosted embeddings as the test path

**stealth-client-non-goals**:
No phone-hosted STT/LLM; no on-phone LESSON corpus; no web phone client product; **Android deferred until iOS works**; no removing the desktop Phone Mirror server.
_Avoid_: smuggling standalone scope or Android into this map

## Flagged ambiguities

**standalone-ios-copilot** (deprecated here):
Prior grill destination; superseded by **ios-stealth-mode-client** (ADR 0011).

**personal-sideload-only**:
iOS app is for personal use only (Xcode / ad hoc / private TestFlight). No public App Store listing or IAP.
_Avoid_: treating App Store review/IAP as a v1 gate

## Example dialogue

Dev: “Does the iPhone run Whisper and call Gemini itself?”  
Expert: “No — **desktop-session-host**. The phone is an **ios-stealth-mode-client**.”

Dev: “How does it get LESSON chunks?”  
Expert: “In Stealth, grounded answers arrive over **phone-mirror-protocol**. For on-the-go test, Browse uses **tailscale-knowledge-gateway** — still no SQLite on the phone.”

Dev: “Is this separate from two-device-stealth?”  
Expert: “Same protocol and product idea — web client first in that PRD; this map is the native client.”

Dev: “Can I just use Safari over Tailscale?”  
Expert: “Safari works as a stopgap, but the product is **react-native-phone-mirror-client** with **usb-interview-tailscale-test** built in.”

Dev: “Is the phone just a second screen for answers?”  
Expert: “No — **mobile-desktop-ui-parity**. Core desktop workflows on a mobile layout; overlay stealth chrome stays desktop-only.”
