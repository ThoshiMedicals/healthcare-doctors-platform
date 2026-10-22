import { notFound } from "next/navigation";
import { saveGovernance } from "@/cms/actions";
import { requireAction } from "@/cms/context";
import { prisma } from "@/db/prisma";
import { GOVERNANCE_STATUSES } from "@/governance/status";
import { publicPageName } from "@/cms/staff-labels";
import { Field, GateNotice, Impact, SavedNotice, SaveBar, ViewPublicPage } from "../../ui";

export const dynamic = "force-dynamic";

function day(value: Date | null): string {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function GovernanceEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string; reason?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { clinic } = await requireAction("clinical_signoff");
  const row = await prisma.clinicalReview.findFirst({
    where: { id, clinicId: clinic.id },
    include: { page: { select: { path: true } } },
  });
  if (!row) notFound();

  return (
    <main>
      <h1 className="text-2xl font-semibold">{publicPageName(row.page.path)}</h1>
      <ViewPublicPage path={row.page.path} />
      <SavedNotice saved={query.saved} kind="governance" />
      <GateNotice error={query.error} reason={query.reason} />
      <form action={saveGovernance} className="mt-6 grid max-w-2xl gap-4">
        <input type="hidden" name="id" value={row.id} />
        <Field label="Reviewer" name="reviewedBy" defaultValue={row.reviewedBy} impact={[]} />
        <Field label="Reviewer sign-off" name="reviewerSignedBy" defaultValue={row.reviewerSignedBy} impact={[]} />
        <Field label="Approver" name="approvedBy" defaultValue={row.approvedBy} impact={[]} />
        <Field label="Content owner" name="contentOwner" defaultValue={row.contentOwner} impact={[]} />
        <Field label="Approval reference" name="approvalReference" defaultValue={row.approvalReference} impact={[]} />
        <Field label="Evidence reference" name="evidenceReference" defaultValue={row.evidenceReference} impact={[]} />
        <Field label="Approval date" name="lastReviewed" type="date" defaultValue={day(row.approvedAt ?? row.lastReviewed)} impact={[]} />
        <Field label="Next review date" name="nextReview" type="date" defaultValue={day(row.nextReview)} impact={[]} />
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Review status
          <Impact items={[]} />
          <select className="rounded border border-slate-300 bg-white px-3 py-2" name="status" defaultValue={row.status}>
            {GOVERNANCE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-slate-600">
          Approved and published require a reviewer, approver, approval date, approval reference, evidence reference,
          content owner, a later next review date, and a fingerprint of this page. Publication is refused until that
          fingerprint matches the page being published. Fingerprint: {row.reviewedContentSha256 ?? "not recorded"}.
        </p>
        <SaveBar historyHref={`/admin/revisions/clinical_review/${row.id}`} />
      </form>
    </main>
  );
}
