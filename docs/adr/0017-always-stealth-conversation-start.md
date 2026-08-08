# Always-stealth at conversation start; sticky; no user Detectable switch

Natively’s desktop interview coach must not be accidentally screen-share-visible mid-call. We engage `isUndetectable` on live session start (`startMeeting` / equivalent), remove Detectable/Undetectable from product chrome, and never restore detectability via two-device exit or session end (overlay visibility may return). Rejected: app-launch-forever stealth (over-constrains pre-meeting UX); restore-prior on TwoDevice exit (reopens a detectable path); Advanced bury hatch in v1.
