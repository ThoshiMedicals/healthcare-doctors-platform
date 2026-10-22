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
          impact={["Profile page"]}
          defaultValue={published?.areasOfCare || editorList(row.status, row.publishedPayload, row.areasOfCare, slots.areasOfCare)}
        />
        <Field
          label="Professional interests"
          name="professionalInterests"
          impact={["Profile page"]}
          defaultValue={published?.professionalInterests || editorList(row.status, row.publishedPayload, row.professionalInterests, slots.professionalInterests)}
        />
        <PortraitField current={selectedPortrait} portraits={portraits} />
        <Field label="HotDoc URL" name="bookingUrl" defaultValue={bookingUrl} impact={["Profile page", "Team card", "Homepage card"]} />
        <p className="text-sm text-slate-600">
          Saving keeps this as a draft. The interest lists must keep the same number of items as the public page.
          Choosing another existing portrait keeps the same dimensions and the same card layout.
          A new photograph is a separate proposal. It must be a WebP at the current portrait size, and it stays off the website until a Clinic Admin approves and publishes it.
          The HotDoc link must stay on hotdoc.com.au and keep the lightbox booking workflow.
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
