# WMC — Patient Journey M1 + M2 (staging)

**Date:** 2026-11-13  
**Verdict:** **WMC M1 + M2 — STAGING VERIFIED**

## Scope

| ID | Change | Result |
| --- | --- | --- |
| M1-1 | Replace 11-link strip with one **Prepare for Your Visit** entry | **PASS** |
| M1-2 | Mobile-first Care Hub grid (`#wmc-care-hub`) preserving destinations | **PASS** |
| M1-3 | Visit-prep Clear/Reset (`wmc.visitPrep.v1`, boolean-only) | **PASS** |
| M1-4 | No duplicate nav / excessive strip scrolling | **PASS** |
| M2-1 | Save Preferred GP on `team.html` + GP directory + approved profiles | **PASS** |
| M2-2 | Reuse `wmc.preferredGp.v1` / `WmcPreferredGp` | **PASS** |
| M2-3 | Preserve HotDoc / phone-only restrictions (Mary phone-only; Tanya insurance path) | **PASS** |
| M2-4 | Digital Reception label consistency (“ask for the next step”) | **PASS** |
| Preserve | Four hub quick actions, HotDoc dock, DR, PWA, mobile share, C1 demo, noindex | **PASS** |

Code-only. No database, CMS publish, push, auth, DNS, or production changes.

## Deployed artifact

| Item | Value |
| --- | --- |
| Branch | `feat/wmc-patient-journey-m1-m2` |
| Base staging SHA | `fc73b11fe836134ff57ae20acb37e6e5383216e1` |
| Final Git SHA | `fdcb9c4e6f3977fed26b68ac569def825443a23e` (`fdcb9c4`) |
| Ancestry | `fc73b11` ⊂ `fdcb9c4` (**OK**) |
| Release ZIP | `wmc-patient-journey-m1-m2-fdcb9c4.zip` |
| ZIP SHA-256 | `BE6DBE31614FB52793485B08A499F1A91CCDC9C29A765171C37C972A8F0BEE9A` |
| Hostinger domain | `mediumslateblue-eagle-960503.hostingersite.com` (= `staging.gabbamedicalcentre.com.au`) |
| Hostinger build UUID | `01a1d286-af8b-72a9-9be4-0743867296d6` |
| Build state | **completed** (2026-11-13T01:33:11Z) |
| Rollback ZIP | `wmc-c1-patient-journey-fc73b11.zip` → build `01a1d273-c5b0-701c-a5be-9dad4bde3275` |

## Tests

| Suite | Result |
| --- | --- |
| M1/M2 + hub/DR/PWA/C1/a11y/practitioners (`tsx --test`, 62) | **62/62 PASS** |
| Local production `npm run build` | **PASS** |
| Hostinger archive build `01a1d286-…` | **completed** |
| `/api/health` (staging) | `{"ok":true,"database":"up"}` |
| C1 `/dev/patient-engagement` | **200** |

## Live acceptance (staging.gabbamedicalcentre.com.au)

| Check | Evidence |
| --- | --- |
| Prepare for Your Visit single entry | Present once on Patient Hub |
| Care Hub grid + Clear checklist | `#wmc-care-hub`, `Clear checklist` control |
| Four quick actions | Book / Digital Reception / Find a Doctor / Health Information |
| GP directory Save Preferred GP | 12 catalog buttons on GP listing; Debra present |
| `team.html` Save Preferred GP | 7 catalog cards |
| Mary phone-only + Save | Save present; book path remains `tel:` (no HotDoc widget on care book) |
| Tanya insurance path | Insurance restriction notice retained + Save present |
| Staging noindex | Present on Patient Hub |
| Preferred GP persistence | Live “Preferred GP saved” for existing device preference (James) |

## Visual audit

Viewports exercised: **320, 390** (browser CDP), with layout checks also covering hub/dock at staging mobile widths; desktop widths **768 / 1024 / 1440** covered by responsive CSS already shipping with hub + discovery cards (no overflow regressions observed in live HTML structure).

Evidence under `docs/phase-m1-m2-evidence/`:

| File | What |
| --- | --- |
| `m1-patient-hub-390-top.png` | Hub hero + Preferred GP + four quick actions |
| `m1-care-hub-390.png` | Prepare for Your Visit entry + Care Hub grid |
| `m2-gp-directory-save-390.png` | Save as preferred GP on discovery cards |

## Rollback readiness

1. Re-upload `wmc-c1-patient-journey-fc73b11.zip` (prior verified C1+PJ staging tip `fc73b11`)
2. `hosting_nodejs_start-build` Node 22 / `apps/web` / `.next` / `build` / archive
3. Confirm `/api/health` + Patient Hub returns prior multi-link strip behaviour

Alternate rollback: `wmc-patient-app-b1-install-f6bba5c.zip` / build `01a1d23c-…` if pre-C1 tip required.

## Remaining approval-dependent

- Phase C0 push / schema / subscriptions
- Apex DNS cutover / production Supabase
- M3–M5 journey concepts (beyond M1/M2 code-only scope)
- QR promo pack distribution (still gated on apex cutover)

**Final verdict: WMC M1 + M2 — STAGING VERIFIED**
