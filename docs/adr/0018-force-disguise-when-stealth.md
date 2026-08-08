# Force a system disguise while undetectable

While desktop `isUndetectable` is true, `disguiseMode` must be one of `terminal` | `settings` | `activity` — never `none`. If stealth engages with disguise unset/`none`, default to `terminal`. Users may switch among the three disguises only. Rejected: optional disguise polish (stealth without a system-app identity); forcing a single fixed disguise with no user choice.
