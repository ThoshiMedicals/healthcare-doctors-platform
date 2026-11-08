/**
 * Clinical governance / CMS history migration policy inventory (planning only).
 * B1 must not blindly copy all staging history or discard approved sign-offs.
 */

export type GovernanceRetention =
  | "import_current_published_only"
  | "import_approved_history"
  | "exclude_staging_test"
  | "retain_in_staging_only"
  | "operator_decide";

export type GovernanceTablePolicy = {
  table: string;
  purpose: string;
  stagingRisk: string;
  productionPolicy: GovernanceRetention;
  notes: string[];
};

export const CLINICAL_GOVERNANCE_TABLE_POLICIES: GovernanceTablePolicy[] = [
  {
    table: "page_revisions",
    purpose: "Immutable HTML revisions; publishedRevisionId selects live body",
    stagingRisk: "253 revisions include historical/test edits beyond current published SHA",
    productionPolicy: "import_current_published_only",
    notes: [
      "Import one immutable revision per approved path (current published SHA).",
      "Do not bulk-copy all staging revision rows.",
      "If clinical rollback history is required for a path, operator must approve additional immutable SHAs explicitly.",
    ],
  },
  {
    table: "clinical_reviews",
    purpose: "Clinical reviewer sign-offs on content",
    stagingRisk: "May include staging-only exercises or incomplete reviews",
    productionPolicy: "operator_decide",
    notes: [
      "Export only rows tied to approved published revisions with status approved.",
      "Never invent clinical sign-offs.",
      "If no approved production sign-off exists, leave empty and require fresh review post-import where policy demands.",
    ],
  },
  {
    table: "editorial_items",
    purpose: "Editorial workflow items",
    stagingRisk: "Staging drafts and test editorial traffic",
    productionPolicy: "exclude_staging_test",
    notes: ["Start production empty unless an approved editorial backlog is explicitly listed."],
  },
  {
    table: "content_revisions",
    purpose: "Non-page content revision trail",
    stagingRisk: "Mixed approved and test revisions",
    productionPolicy: "operator_decide",
    notes: ["Only import rows linked to Class A/B/E approved entities with matching content SHA."],
  },
  {
    table: "audit_logs",
    purpose: "Security/admin audit trail",
    stagingRisk: "Staging admin actions are not production evidence",
    productionPolicy: "retain_in_staging_only",
    notes: [
      "Do not import staging audit_logs into production.",
      "Production begins a new audit trail at first admin action.",
    ],
  },
  {
    table: "navigation_items",
    purpose: "Primary nav labels/hrefs",
    stagingRisk: "Seed + golden ownership upsert are authoritative",
    productionPolicy: "import_current_published_only",
    notes: ["Seed then golden ownership upsert; do not copy staging nav rows blindly."],
  },
  {
    table: "navigation_ownership",
    purpose: "Per-page section ownership / breadcrumbs",
    stagingRisk: "Tied to page ids; rebuild from golden ownership + Class B metadata",
    productionPolicy: "import_current_published_only",
    notes: ["Recreate during import; preserve breadcrumb JSON from approved sources."],
  },
  {
    table: "media_assets",
    purpose: "Media registry / approval metadata",
    stagingRisk: "May reference staging uploads or test assets",
    productionPolicy: "operator_decide",
    notes: [
      "Public marketing binaries ship with deploy tip public/ and golden assets — not via private_objects.",
      "Import media registry rows only when asset path + approval status are production-approved.",
    ],
  },
  {
    table: "private_objects",
    purpose: "Private byte storage metadata (enquiries, applications)",
    stagingRisk: "Contains staging private payloads",
    productionPolicy: "exclude_staging_test",
    notes: ["Never copy staging private_objects into production."],
  },
  {
    table: "career_applications",
    purpose: "GP/career applications",
    stagingRisk: "Staging applicant PII",
    productionPolicy: "exclude_staging_test",
    notes: ["Recruitment HOLD — workflows off; no staging applications imported."],
  },
  {
    table: "form_requests",
    purpose: "Patient/public form submissions",
    stagingRisk: "Staging test submissions",
    productionPolicy: "exclude_staging_test",
    notes: ["Production starts empty."],
  },
  {
    table: "vacancies",
    purpose: "Recruitment vacancy records",
    stagingRisk: "Staging vacancy marketing content",
    productionPolicy: "exclude_staging_test",
    notes: ["HOLD until recruitment GO; do not import staging vacancies by default."],
  },
];

export function governancePoliciesRequiringDecision(): GovernanceTablePolicy[] {
  return CLINICAL_GOVERNANCE_TABLE_POLICIES.filter((p) => p.productionPolicy === "operator_decide");
}
