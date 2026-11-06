import { notFound } from "next/navigation";
import { savePractitioner } from "@/cms/actions";
import { requireAction } from "@/cms/context";
import { editorList, editorText } from "@/cms/modules";
import { readPractitionerSlots } from "@/cms/overlay";
import { ensureImageAsset } from "@/cms/image-register";
import { compatiblePortraits, portraitBasename, readPractitionerBookingUrl, readPractitionerPortraitFile } from "@/cms/practitioner-media";
import { publishedPractitionerFields } from "@/cms/restore-sync";
import { prisma } from "@/db/prisma";
import { ImageProposalPanel } from "../../image-proposal-panel";
import { AVAILABILITY_STATUSES, AVAILABILITY_LABELS, NEW_TO_PRACTICE_DAYS } from "@/cms/practitioner-growth";
import { PortraitField } from "../../portrait-field";
import { Area, Field, GateNotice, SavedNotice, SaveBar, ViewPublicPage } from "../../ui";
import { WorkflowControls } from "../../workflow-controls";

export const dynamic = "force-dynamic";

export default async function PractitionerEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; published?: string; error?: string; reason?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { clinic, role } = await requireAction("edit");
  const row = await prisma.practitioner.findFirst({
    where: { id, clinicId: clinic.id },
    include: { page: { include: { publishedRevision: { select: { html: true } } } } },
  });
  if (!row) notFound();
  const html = row.page?.publishedRevision?.html ?? "";
  const slots = readPractitionerSlots(html);
  const sourcePortrait = readPractitionerPortraitFile(html);
  const portraits = compatiblePortraits(sourcePortrait);
  const published = publishedPractitionerFields(row.status, row.publishedPayload);
  const selectedPortrait = published?.portraitFile || portraitBasename(row.portraitPath) || sourcePortrait;
  const bookingUrl = published?.bookingUrl || row.bookingUrl || readPractitionerBookingUrl(html);
  const name = published?.name || row.name;
  const returnTo = `/admin/practitioners/${row.id}`;
  const portraitAsset = sourcePortrait ? await ensureImageAsset(clinic.id, `assets/team/${sourcePortrait}`, name) : null;
  const newToPracticeDefault = row.newToPracticeAt
    ? row.newToPracticeAt.toISOString().slice(0, 10)
    : "";
  const relatedServicesDefault = (row.relatedServices.length ? row.relatedServices : []).join(", ");

  return (
    <main>
      <h1 className="text-2xl font-semibold">{name}</h1>
      <ViewPublicPage path={row.page?.path} />
      <SavedNotice saved={query.saved} published={query.published} status={row.status} />
      <GateNotice error={query.error} reason={query.reason} />
      <form action={savePractitioner} className="mt-6 grid max-w-2xl gap-4">
        <input type="hidden" name="id" value={row.id} />
        <Field label="Name" name="name" defaultValue={name} required impact={["Profile page", "Team card", "Homepage card"]} />
        <Field
          label="Qualifications"
          name="qualifications"
          impact={["Profile page"]}
          defaultValue={published?.qualifications || editorList(row.status, row.publishedPayload, row.qualifications, slots.qualifications)}
        />
        <Area label="Biography" name="biography" impact={["Profile page"]} defaultValue={published?.biography || editorText(row.status, row.publishedPayload, row.biography, slots.biography)} />
        <Field
          label="Languages"
          name="languages"
          impact={["Profile page"]}
          defaultValue={published?.languages || editorList(row.status, row.publishedPayload, row.languages, slots.languages)}
        />
        <Field
          label="Areas of interest"
          name="areasOfCare"
          impact={["Profile page", "Discovery filters"]}
          defaultValue={published?.areasOfCare || editorList(row.status, row.publishedPayload, row.areasOfCare, slots.areasOfCare)}
        />
        <Field
          label="Professional interests"
          name="professionalInterests"
          impact={["Profile page"]}
          defaultValue={published?.professionalInterests || editorList(row.status, row.publishedPayload, row.professionalInterests, slots.professionalInterests)}
        />
        <Field
          label="Related services (paths)"
          name="relatedServices"
          impact={["Profile Services Provided", "Service matching"]}
          defaultValue={relatedServicesDefault}
        />
        <p className="text-sm text-slate-600">
          Related services example: <code>services/womens-health.html, services/family-health.html</code>.
          Leave blank to derive links from areas of interest.
        </p>
        <fieldset className="grid gap-3 rounded border border-slate-200 p-3">
          <legend className="px-1 text-sm font-medium text-slate-800">Patient acquisition</legend>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="acceptingNewPatients" defaultChecked={row.acceptingNewPatients} />
            Accepting new patients
          </label>
          <label className="grid gap-1 text-sm text-slate-700">
            Availability (admin-controlled, not live HotDoc)
            <select
              name="availabilityStatus"
              className="rounded border border-slate-300 px-2 py-2"
              defaultValue={row.availabilityStatus}
            >
              {AVAILABILITY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {AVAILABILITY_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm text-slate-700">
            New to WMC start date (badge auto-expires after {NEW_TO_PRACTICE_DAYS} days)
            <input
              type="date"
              name="newToPracticeAt"
              className="rounded border border-slate-300 px-2 py-2"
              defaultValue={newToPracticeDefault}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="clearNewBadge" />
            Clear “New to Woolloongabba Medical Centre” badge now
          </label>
        </fieldset>
        <PortraitField current={selectedPortrait} portraits={portraits} returnTo={returnTo} />
        <Field label="HotDoc URL" name="bookingUrl" defaultValue={bookingUrl} impact={["Profile page", "Team card", "Homepage card"]} />
        <p className="text-sm text-slate-600">
          Saving keeps this as a draft. The interest lists must keep the same number of items as the public page.
          Choosing another existing portrait keeps the same dimensions and the same card layout.
          A new photograph is a separate proposal. It must be a WebP at the current portrait size, and it stays off the website until a Clinic Admin approves and publishes it.
          The HotDoc link must stay on hotdoc.com.au and keep the lightbox booking workflow.
          Growth badges and availability appear on the public site after publish (or after the growth seed for newly onboarded GPs).
        </p>
        <SaveBar historyHref={`/admin/revisions/practitioner/${row.id}`} />
      </form>
      <WorkflowControls entityType="practitioner" entityId={row.id} status={row.status} returnTo={returnTo} role={role} />
      {portraitAsset ? (
        <ImageProposalPanel
          assetId={portraitAsset.id}
          storagePath={portraitAsset.storagePath}
          status={portraitAsset.replacementStatus}
          role={role}
          returnTo={returnTo}
        />
      ) : null}
    </main>
  );
}
