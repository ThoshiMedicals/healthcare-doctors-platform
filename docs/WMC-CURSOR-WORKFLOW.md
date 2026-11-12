# WMC ChatGPT -> Cursor Workflow (Corrected for the Actual Project)

**Status:** In-repo process guide (Project Pack v1.2, merged 13 November 2026). Does not authorise deploy, DB writes or Phase B implementation by itself.

1. **Anchor:** At the beginning of each Cursor session, reference `@PROJECT_SPEC.md` and the canonical trust/roadmap files. Check `git status`, worktrees, concurrent agent work, actual staging SHA and current deployments. Do not reuse the past baseline if a newer release is live.
2. **Small tasks:** One bounded component/workstream per Cursor prompt. Keep a task's implementation, tests and verification together; use separate prompts for unrelated features. For multi-file work use Cursor Agent/Composer; for small edits use inline editing if desired. Windows uses Ctrl shortcuts where shown in Cursor.
3. **Rules:** Use `.cursor/rules/*.mdc` Project Rules (not a new `.cursorrules` legacy file) with metadata. Inspect and merge with any existing rules and `AGENTS.md` first. Rules guide AI but cannot enforce database access controls or release approvals.
4. **Canonical facts:** Fetch from current WMC CMS and Trust Facts Register. Do not create `data/clinic-config.json` or `doctors.json` for a second copy of clinic facts. No hard-coded unverified address, phone, opening times, specialties, languages, profiles, HotDoc URLs.
5. **PWA:** Existing manifest and service worker are in place; test and extend only if necessary. Do not overwrite caching strategies, auth-sensitive routes or notices with stale offline data. Offline hours/emergency information is subject to freshness/clinical review.
6. **HotDoc:** Official widget is a candidate to validate. Existing lightbox/doctor-specific links/phone-only exception are canonical; retain a safe fallback and allow HotDoc to own bookings and clinical appointment messaging.
7. **Visual design:** Keep global WMC responsive website intact. Patient Hub may use task-focused app presentation; do not constrain every desktop route to 480px or replace the three-action dock with a five-tab bar without design approval.
8. **Gates:** Plan -> implement scoped code only -> focused tests/build -> Playwright and responsive screenshots -> review real deployed pages -> rollback evidence. Hostinger staging deploy only when the prompt authorises it. Database or production work always needs explicit separate approval.
9. **No fake completion:** Report what is shipped, merely proposed, blocked and independently verified. A file added locally or report marked PASS is not evidence that a staging site was updated.

## Source guide corrections

| Generic example | Correct WMC approach |
|---|---|
| `.cursorrules` at root | `.cursor/rules/wmc-core.mdc` (current Project Rules), after checking existing rules |
| Static Hostinger hosting | Next.js Node.js Web App + CMS + PostgreSQL |
| `#163244`, `#EBF5F3` palette | Existing WMC navy `#123B5D`, teal `#1E8C8C`, aqua `#DDF4F3` tokens |
| 10 doctors and made-up `doctors.json` | 15 published profiles; current CMS/practitioner authoritative sources |
| Address, phone, email, hours from example | Verify Trust Facts and current CMS, including temporary holiday hours |
| Placeholder HotDoc URLs | Existing approved doctor-specific links and booking behavior |
| Family localStorage profiles now | Future concept only; privacy/identity review first, preserve `wmc.preferredGp.v1` |
| 5-tab bottom bar now | Keep approved three-action mobile dock; review UX before any navigation redesign |
| Build new manifest and `sw.js` | Preserve existing PWA; audit and extend incrementally |
| Cache hours/emergency as forever accurate | Freshness controls, disclaimer and clinical approval required |
| All HotDoc links `target=_blank` | Preserve current approved lightbox and reliable external fallback |

## Reference documentation

- Cursor Rules: https://cursor.com/docs/rules
- HotDoc Online Bookings and widgets: https://support.hotdoc.com.au/hc/en-gb/articles/360039522791-Getting-Started-with-Online-Bookings
