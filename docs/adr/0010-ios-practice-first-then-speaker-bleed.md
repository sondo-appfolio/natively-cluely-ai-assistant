# Ship practice-first, then speaker-bleed live

**Status:** superseded by ADR 0011 (Stealth Mode client — desktop owns listen path)

v1 uses **practice-first-wedge** (in-app mock/practice). Live assist later uses **speaker-bleed-live** (phone mic hears laptop speaker). We rejected same-phone Zoom+assist and ReplayKit broadcast as v1 requirements because Apple provides no clean silent call-tap API and broadcast UX is high-friction. System-audio loopback and desktop-required hosting remain non-goals on iOS.
