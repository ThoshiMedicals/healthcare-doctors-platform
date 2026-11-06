import Link from "next/link";
import { requireAction } from "@/cms/context";

export const dynamic = "force-dynamic";

export default async function StoryCaptureArchitecturePage() {
  await requireAction("edit");
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 prose prose-slate">
      <Link href="/admin/story-capture" className="text-sm font-medium no-underline">
        ← Inventory
      </Link>
      <h1>Story Capture — admin UI structure</h1>
      <pre>{`/admin/story-capture
├── page.tsx                 Inventory + live surface counts
├── new/                     Invite / create (default-deny seed)
├── [id]/                     Workflow hub
│   └── workflow-actions     Consent · versions · reviews · place · withdraw
└── architecture/            This note

/api/admin/story-capture
├── stories
├── stories/[id]
├── stories/[id]/consent
├── stories/[id]/versions
├── stories/[id]/reviews
├── stories/[id]/placements
├── stories/[id]/withdraw
└── integration?surface=practice_experience|gp_opportunities|opportunity_pack`}</pre>
      <h2>Services</h2>
      <ul>
        <li>
          <code>story-capture/stories.ts</code> — inventory + default-deny policy seed
        </li>
        <li>
          <code>story-capture/consent.ts</code> — versioned consent, sign, supersede
        </li>
        <li>
          <code>story-capture/reuse.ts</code> — channel allow evaluation
        </li>
        <li>
          <code>story-capture/reviews.ts</code> — human status advances
        </li>
        <li>
          <code>story-capture/placements.ts</code> — PE / Opportunities / Pack surfaces
        </li>
        <li>
          <code>story-capture/withdrawal.ts</code> — take-down SLA workflow
        </li>
        <li>
          <code>story-capture/integration.ts</code> — read-model for live quotes
        </li>
      </ul>
      <p>
        Full plan: <code>docs/WMC-GP-STORY-CAPTURE-IMPLEMENTATION.md</code>
      </p>
    </div>
  );
}
