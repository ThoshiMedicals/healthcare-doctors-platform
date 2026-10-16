import type { MembershipRole } from "@prisma/client";
import { roleAllows } from "@/auth/permissions";
import { approveContent, publishContent, submitContent } from "@/cms/actions";
import { publicationLabel } from "@/cms/modules";
import { PendingButton } from "./pending-button";

export function WorkflowControls({
  entityType,
  entityId,
  status,
  returnTo,
  role,
}: {
  entityType: string;
  entityId: string;
  status: string;
  returnTo: string;
  role: MembershipRole;
}) {
  return (
    <section className="mt-8 grid max-w-2xl gap-3 rounded border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-700">
        Workflow: <span className="font-medium">{publicationLabel(status)}</span>.
        {status === "published"
          ? " This version is on the public website."
          : " Draft, under review, and approved versions stay off the public website."}
      </p>
      {status === "drafting" ? (
        <form action={submitContent}>
          <input type="hidden" name="entityType" value={entityType} />
          <input type="hidden" name="entityId" value={entityId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <PendingButton label="Submit for review" pendingLabel="Submitting…" className="rounded border border-slate-300 px-3 py-2 text-sm" />
        </form>
      ) : null}
      {status === "clinical_review" && roleAllows(role, "clinical_signoff") ? (
        <form action={approveContent}>
          <input type="hidden" name="entityType" value={entityType} />
          <input type="hidden" name="entityId" value={entityId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <PendingButton label="Approve" pendingLabel="Approving…" className="rounded border border-slate-300 px-3 py-2 text-sm" />
        </form>
      ) : null}
      {status === "approved" && roleAllows(role, "publish") ? (
        <form action={publishContent}>
          <input type="hidden" name="entityType" value={entityType} />
          <input type="hidden" name="entityId" value={entityId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <PendingButton label="Publish" pendingLabel="Publishing…" className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white" />
        </form>
      ) : null}
    </section>
  );
}
