# Prompt 4A — Task discovery (before / after)

**Objective:** Improve desktop and mobile task discovery without changing site architecture.

## Audit (before)

| Surface | Finding |
| --- | --- |
| Header (desktop) | Find Information strip hidden at ≥768px; only section nav visible |
| Mobile menu | Tasks present but styled like plain links; weak separation from nav |
| Digital Reception | Dock control matched Call Clinic (outline); mobile compact label was “Search” |
| Patient Information hub | Common tasks grid present; no Find Information cue |
| Homepage shortcuts | Task links mixed with browse links; no visual elevation |

## Changes (after)

1. **Desktop Find Information strip** — Existing `.patient-tasks` row shown above section nav as teal chip actions (New Patient, Repeat Script, Test Results, Referral, Skin Check, HotDoc Messages).
2. **Mobile menu** — Find Information block framed as a teal panel; chips vs plain nav links below.
3. **Digital Reception** — Teal filled dock control; compact label **Ask us** (not Search); aria-label clarifies assistance.
4. **Label integrity** — Removed `site.js` rename of “Find Information” → “Task shortcuts”.
5. **Patient hub** — “Find Information” eyebrow above Common patient tasks; soft mint wash.
6. **Homepage** — Priority information-list links (new patients, scripts, results, referrals) tinted as task shortcuts.

Architecture unchanged: same `#primary-nav`, same care dock, same hub sections.

## Distinction model

| Layer | Role | Cue |
| --- | --- | --- |
| Task shortcuts | Direct patient tasks | Teal chips · Find Information |
| Navigation | Site sections | Plain text links |
| Search / assistance | Digital Reception | Teal filled dock · Ask us |

## Screenshots

| File | View |
| --- | --- |
| `qa/4a-before-desktop-header.png` | Desktop before — no Find Information strip; DR = outline |
| `qa/4a-after-desktop-header.png` | Desktop after — Find Information chips + teal Digital Reception |
| `qa/4a-after-mobile-menu.png` | Mobile menu after — Find Information panel above nav |
| `qa/4a-after-mobile-dock-ask.png` | Mobile dock after — Ask us / teal assist |

## Success criteria

- Patients can see where to **perform common tasks** (Find Information chips / menu panel).
- Patients can see where to **ask / search** (Digital Reception — Ask us).
- Section **navigation** remains visually separate plain text.
