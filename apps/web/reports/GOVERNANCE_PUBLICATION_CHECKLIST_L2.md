# L2 — Governance Publication Checklist

**Date:** 2026-10-26  
**Objective:** Prepare governance publication capability so review strips publish immediately once approvals exist.  
**Success:** Fail-closed empty public registry today; one save/command turns complete approvals into live strips.

---

## 1. Metadata audit (live DB)

| Metric | Count |
|---|---|
| ClinicalReview rows | **188** |
| `draft` | 182 |
| `under_review` | 6 |
| `approved` / `published` | **0** |
| Public-ready (`toPublicGovernanceFields`) | **0** |

### Four public fields — population

| Field | Populated | Gap |
|---|---|---|
| Reviewed By (`reviewedBy`) | 5 / 188 | Partial (draft/under_review only) |
| Content Owner (`contentOwner`) | **0 / 188** | **Blocking** |
| Last Reviewed (`lastReviewed`) | 2 / 188 | Sparse |
| Next Review Due (`nextReview`) | **0 / 188** | **Blocking** |

### Private evidence (required before public strip)

| Field | Populated |
|---|---|
| `reviewerSignedAt` | 5 |
| `approvedAt` | 2 |
| `approvalReference` | 2 |
| `evidenceReference` | **0** |
| `reviewedContentSha256` | 2 |

**Audit conclusion:** No page is strip-ready. Empty `governance-published.js` is correct fail-closed behaviour, not a missing deploy.

---

## 2. Field validation rules (publication-ready)

For status `approved` or `published`, all of the following must pass before a strip can appear:

| Public field | Rule |
|---|---|
| **Reviewed By** | Non-empty, ≥3 chars, not placeholder (`TBD` / `TODO` / `[Reviewer]`) |
| **Content Owner** | Non-empty, ≥3 chars, not placeholder |
| **Last Reviewed** | ISO `YYYY-MM-DD`; tied to reviewer sign-off / approval date |
| **Next Review Due** | ISO `YYYY-MM-DD`; **later than** Last Reviewed / approval; **≥ today (Brisbane)** |

Private gates (never emitted to `governance-published.js`):

- Approver + approval date  
- Approval reference + evidence reference  
- Content fingerprint (`reviewedContentSha256`) matching page content  
- Status ∈ {`approved`,`published`}

Implementation:

- `src/governance/public-fields.ts` → `toPublicGovernanceFields`  
- `src/governance/publish-registry.ts` → `publicStripFieldGaps` + bundle builder  
- Admin save gate in `src/cms/actions.ts` (`saveGovernance`)

---

## 3. Sample published states

Fixture sources (tests only — **not** live clinical approvals):

| Path | Status | Reviewed By | Content Owner | Last Reviewed | Next Review Due |
|---|---|---|---|---|---|
| `services/womens-health.html` | approved | Clinical Team | Women's health clinical lead | 2026-09-15 | 2027-03-16 |
| `telehealth.html` | approved | Practice operations | Patient services | 2026-10-01 | 2027-04-02 |
| `patient-information/privacy.html` | published | Practice management | Practice management | 2026-08-01 | 2027-02-02 |

Verified by `src/governance/publish-registry.test.ts`:

- 3/3 included in public bundle  
- Payload contains only `status`, `reviewedBy`, `lastReviewed`, `nextReview`, `contentOwner`  
- Private evidence fields never appear in generated JS  

---

## 4. Fail-closed verification

| Scenario | Expected | Result |
|---|---|---|
| Empty / no approvals | `WMC_APPROVED_GOVERNANCE = {}` | Pass (live file + dry-run) |
| Draft / under_review | Omitted from bundle | Pass (tests) |
| Missing Content Owner | Omitted | Pass |
| Placeholder Reviewed By (`TBD`) | Omitted | Pass |
| Overdue Next Review Due | Omitted | Pass |
| Missing evidence / fingerprint | Omitted | Pass |
| Runtime (`site.js`) | Host stays `hidden` until approved + current dates | Pass (existing) |
| Non-existent control after auth | N/A for strips | — |

Live dry-run (`npm run governance:publish:dry`):

```json
{ "candidates": 0, "included": 0, "omitted": 0, "paths": [] }
```

---

## 5. Publication wiring (ready now)

| Step | Command / trigger | Status |
|---|---|---|
| Sync eligibility drafts | `npm run governance:sync` | Available |
| Complete fields in CMS | `/admin/governance/[id]` | Available + gate tightened |
| Publish public registry | Auto on governance save; or `npm run governance:publish` | **New** |
| Dry-run | `npm run governance:publish:dry` | **New** |
| Patient site | `governance-published.js` + `site.js` strip host | Wired |

When the first real approval is saved with all four public fields + private evidence, the strip registry regenerates immediately and those pages show the governance review strip without a separate HTML rebuild.

---

## Operator checklist (go-live per page)

- [ ] Page exists in eligibility register (`governance-records.json` / ClinicalReview row)  
- [ ] Content Owner nominated and confirmed (not guessed)  
- [ ] Reviewer completes review → **Reviewed By** + **Last Reviewed**  
- [ ] Practice approver signs → private approver / references  
- [ ] **Next Review Due** set later than Last Reviewed  
- [ ] Fingerprint recorded (matches current page content)  
- [ ] Status set to `approved` or `published` in CMS  
- [ ] Confirm `npm run governance:publish:dry` lists the path  
- [ ] Load public page → governance strip visible with four fields  
- [ ] Confirm private fields (`evidenceReference`, fingerprint, approver) are **not** in page source  

---

## Residual (expected until real approvals)

- Live `included: 0` until staff complete Content Owner, Next Review Due, evidence, and approval for each page.  
- Sample fixtures must not be copied into production `governance-published.js` without authorised sign-off.  
- Python builder (`old-html/cms/tools/build_clinical_governance.py`) remains valid for offline private-approval JSON workflows; CMS path is now the primary operator path.

---

## Deliverables

| Artifact | Path |
|---|---|
| Public field gate | `src/governance/public-fields.ts` |
| Bundle builder | `src/governance/publish-registry.ts` |
| Sample states | `src/governance/sample-approvals.ts` |
| Write-through | `src/governance/write-published-registry.ts` |
| CLI | `scripts/publish-governance-registry.ts` |
| Tests | `src/governance/publish-registry.test.ts` (6/6 pass) |
| This checklist | `reports/GOVERNANCE_PUBLICATION_CHECKLIST_L2.md` |
