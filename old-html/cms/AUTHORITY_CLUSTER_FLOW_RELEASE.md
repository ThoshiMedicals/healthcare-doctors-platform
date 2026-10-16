# Healthcare Knowledge Centre Authority Clusters & Patient Navigation

## Implementation

The existing **81 published-format article files** remain unchanged in clinical wording. **No new articles** have been created, and this release must not be described as clinical approval or live publication.

- **19 connected topical authority clusters**. Every article links to all other members of its defined cluster and its existing topic hub. The previously single-guide Healthy Ageing category is connected to Preventive Healthcare rather than treated as a standalone authority topic.
- **10 priority symptom/question pages retained**: headache (3), pain (3), cough (2) and sore throat (2). The articles keep their original URLs, education, FAQs, anchors and booking links.
- **29 healthcare service pages** now link patients back to relevant guides; each linked guide returns to its matched service.
- **13 practitioner profiles** now offer scope-relevant health guides without adding clinical credentials or implying availability, diagnosis or treatment promises. Chiropractic and physiotherapy profiles are kept distinct from GP services.
- The existing **On This Page** navigation, accessible section anchors, headings and FAQ components are preserved. Content was not shortened to improve navigation.
- The existing Digital Reception search index has been regenerated without changing its user interface.

## Genuine review and publication controls

The existing `cms/governance-workflow.json`, `cms/governance-approval-template.json` and `cms/tools/build_clinical_governance.py` handle owner submission, signed clinical review and practice approval. The public review component already supports `reviewedBy`, `lastReviewed`, `nextReview` and `contentOwner`. These fields remain **hidden** unless verifiable approvals are securely supplied and the content fingerprint matches. The review queue hashes for all changed articles were refreshed; nobody has been marked approved and no date has been invented.

**Two pre-existing incorrect governance host keys** (on cardiovascular risk and neck pain) were corrected to their actual page paths so the existing validator can match the correct record.

## Quality gates for future updates

1. Keep all authority content in meaningful clusters, not isolated individual pages.
2. For any new article, extend `cms/authority-cluster-flow-map.json` and link every existing cluster member to it, and it to every member and the hub.
3. Ensure the Article ↔ Service relationship is reciprocal, and practitioner patient guides reflect verified public profiles.
4. Do not invent sign-off or review dates. Publication requires real review evidence and matching content fingerprints.
5. Before a deployment, run `python cms/tools/check_authority_cluster_flow.py`, `python cms/tools/build_digital_reception_index.py --check`, `python cms/tools/build_clinical_governance.py --check`, and `python cms/tools/check_knowledge_publishing.py`.
6. The pre-existing `check_search_metadata.py` threshold warnings are **not fixed** by this navigation-only release; they need a separate editorial metadata pass.

No homepage architecture, identity assets, patient-content paragraph wording or CSS styles were changed.
