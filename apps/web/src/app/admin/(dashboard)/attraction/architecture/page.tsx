import Link from "next/link";
import { requireAction } from "@/cms/context";

export const dynamic = "force-dynamic";

export default async function AttractionAdminArchitecturePage() {
  await requireAction("edit");

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 prose prose-slate">
      <p>
        <Link href="/admin/attraction" className="text-sm font-medium no-underline">
          ← Attraction CMS
        </Link>
      </p>
      <h1>Admin UI architecture — Phase 1</h1>
      <p>
        GP Attraction CMS admin is a Content-group module. It manages typed documents with
        immutable revisions and human approval events. It does not replace the public{" "}
        <code>Page</code>/<code>PageRevision</code> publish path in Phase 1.
      </p>

      <h2>Route tree</h2>
      <pre>{`/admin/attraction
├── page.tsx                 Document list + seed + asset summary
├── architecture/page.tsx    This architecture note
└── [id]/page.tsx            Document detail
    └── approval-actions     Client human-gate controls

/api/admin/attraction
├── documents                GET list · POST create|seed
├── documents/[id]           GET · PATCH draft
├── documents/[id]/revisions POST immutable revision
├── documents/[id]/approvals POST human decision (publish_production → 403)
└── assets                   GET · POST upsert registry`}</pre>

      <h2>Component map</h2>
      <ul>
        <li>
          <strong>AttractionCmsAdminPage</strong> — inventory by kind; Phase 1 boundary banner
        </li>
        <li>
          <strong>SeedAttractionDefaultsButton</strong> — idempotent seed for five domains
        </li>
        <li>
          <strong>AttractionDocumentDetailPage</strong> — revision JSON, approvals, schema results
        </li>
        <li>
          <strong>AttractionApprovalActions</strong> — submit / approve / pause / publish-intent
        </li>
      </ul>

      <h2>Service layer</h2>
      <ul>
        <li>
          <code>attraction-cms/documents.ts</code> — create, draft, revision, fingerprint
        </li>
        <li>
          <code>attraction-cms/approvals.ts</code> — human-only transitions; production publish throw
        </li>
        <li>
          <code>attraction-cms/validate-schema.ts</code> — schema hooks per kind
        </li>
        <li>
          <code>attraction-cms/assets.ts</code> — Asset Library registry
        </li>
        <li>
          <code>attraction-cms/seed-defaults.ts</code> — Opportunities, FAQ, PE, Pathway, Stories
        </li>
      </ul>

      <h2>Later phases (not Phase 1)</h2>
      <ul>
        <li>Set <code>publishedRevisionId</code> and emit public HTML</li>
        <li>Wire Story Capture <code>GpStory</code> tables when migrated</li>
        <li>Binary media upload into Asset Library storage</li>
        <li>Composition pins for Opportunity Pack</li>
      </ul>
    </div>
  );
}
