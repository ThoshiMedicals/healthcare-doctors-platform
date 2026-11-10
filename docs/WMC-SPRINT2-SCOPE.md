# WMC — Sprint 2 proposed scope (kickoff)

**Baseline tip:** `ec71759` (Sprint 1 staging accepted)  
**Worktree:** `C:\Users\RoshanSamarawickrema\Desktop\WMC-sprint2-kickoff` · branch `sprint2/kickoff-scope`  
**Status:** Package A **implemented locally** (S1-R1/R2/R3, A11Y-001, S1-R4, UX-005) — commit candidate pending operator authorisation; Package B locally committed on `sprint2/package-b-practitioner-directory` as `c8fd429`

Sources used (no new broad audit):

- Enterprise pre-launch audit `WMC-ENTERPRISE-PRELAUNCH-2026-11-09` (`issues.json`)
- Sprint 1 staging acceptance residuals
- `docs/WMC-PHASE1-PHASE2-CONSOLIDATED-BACKLOG.md`
- `docs/WMC-PHASE3-PRELAUNCH-REMEDIATION.md`
- Sprint 1 prompt exclusion: do not begin SEO-001 / SEO-002 / CONT-001 / VIS-001 in Sprint 1

---

## A. Approved-ready candidates (implementation after explicit Sprint 2 GO)

These have engineering evidence, do not require clinical B1F to start, and do not redesign frozen hero layout. They still need a **written Sprint 2 Package A GO** before code changes.

| Ticket | Outcome | Acceptance criteria |
|--------|---------|---------------------|
| **S1-R1** Golnar welcome meta | Meta description no longer advertises online booking while phone-only | Staging welcome HTML meta matches reception-only; no `book … online` |
| **S1-R2** Golnar welcome grammar | Summary/body prose grammatically clean reception wording | No mid-sentence “and To arrange…” artifact |
| **S1-R3** Welcome booking chrome | Welcome article does not imply Golnar is HotDoc-bookable | Clinic HotDoc chrome either removed/relabelled as general practice **or** replaced with Call Reception when page is Golnar welcome; Digital Reception retained |
| **A11Y-001** Empty homepage link names | Image/link controls expose accessible names | Homepage accessibility tree: no empty-name links; keyboard focus visible |
| **S1-R4** A11y smoke harness | Repeatable keyboard/focus checks for booking CTAs + HOLD 404 | Scripted or documented PASS on staging sample set |
| **UX-005** Nav destination verification | Confirm primary nav hrefs resolve; document alias gaps | Evidence table of nav href → status; any alias fix only if operator approves |

**Out of Package A unless separately approved:** any homepage hero / practitioner-strip membership change (freeze).

---

## B. Defects requiring further verification

| Ticket | Why blocked / needs verify | Next evidence |
|--------|----------------------------|---------------|
| **VIS-001** Mobile hero grey plane | Probable only; hero v6 frozen; may be emulator artefact | Real-device + Network panel on `next.` and Hostinger; asset-only fix if confirmed |
| **UX-004** Homepage strip omits James/Yamesha | Requires **operator freeze exception** + roster decision | Written strip membership list |
| **PERF-001** Lab metrics missing | PSI incomplete in audit | Operator PSI/CrUX on staging hostname |
| **OPS-001** media_assets gaps | Metadata vs live portraits | CMS media inventory reconcile |
| **S1-R6** Staging robots CDN Allow | Known Phase 3 P3-C2 / BL-P1-01 platform issue | hPanel/CDN route `/robots.txt` to Node |
| **BL-P1-02** UAT robots fidelity | Marked DONE in Phase 3; re-check after any UAT rebuild | `:3100` + `next.` robots/sitemap 200 |

---

## C. Future enhancements outside Sprint 2

| Ticket | Reason |
|--------|--------|
| **SEO-001** Production robots/sitemap cutover pack | Cutover-phase only; staging locks must stay |
| **SEO-002** WP → Next redirect matrix | Needs WP sitemap / GSC export + SEO owner priorities |
| **UX-004** strip membership (if not freeze-excepted) | Marketing/operator product decision |
| Broad “premium redesign” / IA overhaul | Not authorised; conflicts with golden + hero freeze |
| Recruitment authenticity / Index Gate (BL-P1-04/05) | Recruitment HOLD remains; Attraction soft-launch track |
| BL-P2 geo / warm hosts polish | Schedulable P2 after patient UX residuals |

---

## D. Production-cutover blockers (not Sprint 2 website UX)

From Phase 3 / Phase 4 readiness (ops + governance):

- Dedicated production Supabase project + env attestation  
- Off-box backup + restore drill  
- Production Auth.js / secrets on production host  
- Cloudflare Full (strict) + DNS rollback values  
- Hostinger Git auto-deploy reconnect (**S1-R5** — ops, optional)  
- WordPress remains live until signed cutover  
- Clinical B1F approvals (**CONT-001**, EEAT-001, Usman BL-P1-03)  
- Recruitment HOLD remains active  

**Production DNS:** NO-GO.

---

## Recommended Sprint 2 sequence (after GO)

1. **Package A GO** on S1-R1/R2/R3 (+ optional A11Y-001).  
2. Implement in this worktree; tests + production build; **no auto-deploy**.  
3. Staging deploy only after separate release authorisation.  
4. Parallel ops ticket for S1-R5/R6 (no app redesign).  
5. VIS-001 verification spike before any hero asset change.  
6. Keep SEO/CONT packages in cutover/clinical tracks.

---

## Explicit non-actions (this kickoff)

- No application code changes until Package A (or subset) is authorised.  
- No merge to `release/wmc-hostinger-rc1` beyond accepted `ec71759`.  
- No Hostinger redeploy; preserve build `01a1bfd6-…`.  
- No `next.` tunnel restart.  
- No production / DNS / WordPress changes.  
- Main dirty worktree left untouched.
