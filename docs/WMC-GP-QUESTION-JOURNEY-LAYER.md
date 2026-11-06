# GP Question Journey Layer

Question-led presentation copy for the Woolloongabba Medical Centre GP Attraction Platform.

**Constraint:** copy only. No URL, IA, navigation hierarchy, journey-group, destination, Recommended Next mapping, or CTA-target changes.

Source of truth in code: `apps/web/src/attraction-cms/journey-questions.ts`

---

## 1. GP Question Journey Map

```
Where should I begin?                          → Join Our Team
What is it actually like to work here?         → Practice Experience
Who will I be caring for?                      → Community & Catchment
How does continuity actually work here?        → Continuity in Practice
Can my clinical interests sit inside GP here?  → Clinical Interests
Would I fit here?                              → GP Opportunities
What sits around the consult?                  → Practice Support
Is there an early-career pathway?              → Registrar Pathway
What do doctors usually ask?                   → GP FAQ
Am I ready to talk with the practice?          → Doctor Readiness
What should I know about provider numbers?     → Provider Number Readiness
Do DPA or 19AB rules affect me?                → DPA Navigator
Which days might work for me?                  → Session Planner
Would I like a summary to keep?                → Opportunity Pack
Am I ready to talk to the practice?            → Express Interest / Call about joining
```

---

## 2. Page mapping (Question → Answer → Next question)

| Page | Question (hero eyebrow) | Answer the page provides | Next question |
| --- | --- | --- | --- |
| Join Our Team | Where should I begin? | A clear place to start — practice, fit, then contact | What is it actually like to work here? |
| Practice Experience | What is it actually like to work here? | Day shape, nursing, reception, continuity, sessions | Would I fit here? |
| Community & Catchment | Who will I be caring for? | Catchment and life-stage mix that shapes the book | How does continuity show up in the week? |
| Continuity in Practice | How does continuity actually work here? | Same-GP habits, recalls, handoffs | Would I fit here? |
| Clinical Interests | Can my clinical interests sit inside general practice here? | Interests inside continuity care | Would I fit here? |
| GP Opportunities | Would I fit here? | Suitability / practice shape (+ roles when advertised) | What sits around the consult? |
| Practice Support | What sits around the consult? | Rooms, nursing, reception, systems | Which days might work? |
| Registrar Pathway | Is there a pathway if I am early in my GP career? | Supervision/capacity framing | What sits around the consult? |
| GP FAQ | What do doctors usually ask before getting in touch? | Straight practice answers | Am I ready to talk with the practice? |
| Doctor Readiness | Am I ready to talk with the practice? | Optional ratings on paperwork/days/fit | Would I like a summary to keep? |
| Provider Number Readiness | What should I know about provider numbers before we talk? | Boundary: Services Australia issues numbers | Do DPA or 19AB rules affect me? |
| DPA Navigator | Do DPA or 19AB rules affect me? | Plain next step; official answers stay with government | Am I ready to talk with the practice? |
| Session Planner | Which days might work for me? | Preferred-days note only (not a booking) | Would I like a summary to keep? |
| Opportunity Pack | Would I like a summary to keep? | Bookmarkable practice pages | Am I ready to talk to the practice? |
| Express Interest | Am I ready to talk to the practice? | Human-reviewed note to the practice | We’ll take it from here (call if preferred) |

Recommended Next bands keep **the same primary/secondary hrefs and button labels**. Each bridge is three beats:

1. **Answered** — what this page just settled  
2. **Next question** — what a GP would naturally ask next  
3. **Why that page** — why the primary destination is the right place (never a bare “go here”)

Band eyebrow remains `A natural next question` / `When you are ready`.

---

## 3. Copy changes only

- Hero eyebrows → GP’s question
- Hero ledes / selected h1s → answer framing
- Join hub section eyebrows / card blurbs → question language
- Tool panel intros (provider number, DPA) → question lead-ins
- Recommended Next titles/blurbs → answered + next question
- Recommended Next eyebrow → `A natural next question` / `When you are ready`

Nav labels, paths, and CTA targets unchanged.

---

## 4. Files affected

| File | Role |
| --- | --- |
| `apps/web/src/attraction-cms/journey-questions.ts` | SSOT map + hero/next copy |
| `apps/web/src/attraction-cms/ev-shell.ts` | `heroEyebrow`; next-step titles/blurbs; band eyebrow |
| `apps/web/src/attraction-cms/render/tool-pages.ts` | Tool + hub journey copy |
| `apps/web/src/attraction-cms/render/pack-pages.ts` | Story/conversion pack hero journey copy |
| `apps/web/src/practice-experience/render-hub-html.ts` | PE hero question eyebrow |
| `apps/web/src/practice-experience/hub-content.ts` | PE lede alignment |
| `docs/WMC-GP-QUESTION-JOURNEY-LAYER.md` | This deliverable |

---

## 5. Before / after examples

| Surface | Before | After |
| --- | --- | --- |
| Community & Catchment eyebrow | `GP Attraction` | `Who will I be caring for?` |
| Doctor Readiness (already question h1) | eyebrow `GP Attraction` | eyebrow `Am I ready to talk with the practice?` |
| DPA Navigator h1 | `DPA and 19AB questions` | `Do DPA or 19AB rules affect me?` |
| Provider Number h1 | `Medicare provider numbers` | `What should I know about provider numbers?` |
| Continuity Recommended Next | `Next: GP Opportunities` / fit blurb | `Would I fit here?` / “You now understand how continuity works here…” |
| Band label | `Suggested next step` | `A natural next question` |

---

## 6. Validation checklist

- [x] No URLs changed
- [x] No IA / nav hierarchy / journey groups changed
- [x] No page destinations or Recommended Next hrefs changed
- [x] No CTA targets changed (`Express Interest`, `Call about joining`, primary/secondary labels)
- [x] No new UI modules/components
- [x] Core section bodies (stories, FAQ answers, PE modules) untouched beyond journey presentation copy
