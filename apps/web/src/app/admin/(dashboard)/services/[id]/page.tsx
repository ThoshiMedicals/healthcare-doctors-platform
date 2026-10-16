import { notFound } from "next/navigation";
import { saveService } from "@/cms/actions";
import { requireAction } from "@/cms/context";
import { readServiceDocument, serviceDocumentFrom, type ServiceSection } from "@/cms/service-document";
import { prisma } from "@/db/prisma";
import { publicPageName } from "@/cms/staff-labels";
import { Area, Field, GateNotice, Impact, SavedNotice, SaveBar, ViewPublicPage } from "../../ui";
import { WorkflowControls } from "../../workflow-controls";

export const dynamic = "force-dynamic";

export default async function ServiceEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; published?: string; error?: string; reason?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { clinic, role } = await requireAction("edit");
  const row = await prisma.service.findFirst({
    where: { id, clinicId: clinic.id },
    include: { page: { select: { path: true, publishedRevision: { select: { html: true } } } } },
  });
  if (!row) notFound();
  const pagePath = row.page?.path ?? "";
  const live = readServiceDocument(row.page?.publishedRevision?.html ?? "", pagePath);
  const stored = serviceDocumentFrom(row.patientEducation) ?? serviceDocumentFrom(row.publishedPayload);
  const document = stored && (row.publishedPayload || row.status !== "published") ? stored : live;
  const doctors = await prisma.page.findMany({
    where: { clinicId: clinic.id, status: "published", path: { startsWith: "doctors/" } },
    select: { path: true },
    orderBy: { path: "asc" },
  });
  const returnTo = `/admin/services/${row.id}`;

  return (
    <main>
      <h1 className="text-2xl font-semibold">{document.title || row.title}</h1>
      <ViewPublicPage path={pagePath} />
      <SavedNotice saved={query.saved} published={query.published} status={row.status} />
      <GateNotice error={query.error} reason={query.reason} />
      <form action={saveService} className="mt-6 grid max-w-3xl gap-4">
        <input type="hidden" name="id" value={row.id} />
        <Field label="Title" name="title" defaultValue={document.title} required impact={["Service page", "Cards that already show this title", "Digital Reception, when it already shows this title"]} />
        <Area label="Service summary" name="summary" defaultValue={document.summary} impact={["Service page", "Cards that already show this summary", "Digital Reception, when it already shows this summary"]} />
        {document.sections.map((section, index) => (
          <ServiceFields key={section.id} section={section} index={index} doctors={doctors.map((doctor) => doctor.path)} />
        ))}
        <p className="text-sm text-slate-600">
          Saving keeps this as a draft. Paragraphs, lists, visit steps, FAQs, references, and related practitioners keep the imported structure.
          Related practitioner links must stay on published doctor profiles. The booking button stays as imported.
        </p>
        <SaveBar historyHref={`/admin/revisions/service/${row.id}`} />
      </form>
      <WorkflowControls entityType="service" entityId={row.id} status={row.status} returnTo={returnTo} role={role} />
    </main>
  );
}

function ServiceFields({ section, index, doctors }: { section: ServiceSection; index: number; doctors: string[] }) {
  const introduction = section.id === "introduction";
  return (
    <section className="grid gap-3 rounded border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold">{sectionLabel(section)}</h2>
      <Field label={introduction ? "Introduction heading" : "Heading"} name={`s${index}-heading`} defaultValue={section.heading} impact={["Service page"]} />
      {section.paragraphs.map((paragraph, paragraphIndex) => (
        <Area
          key={`p${paragraphIndex}`}
          label={paragraphLabel(section, paragraphIndex)}
          name={`s${index}-p${paragraphIndex}`}
          defaultValue={paragraph}
          impact={["Service page"]}
        />
      ))}
      {section.lists.map((list, listIndex) =>
        list.map((item, itemIndex) => (
          <Field
            key={`l${listIndex}-${itemIndex}`}
            label={`List ${listIndex + 1} item ${itemIndex + 1}`}
            name={`s${index}-l${listIndex}-${itemIndex}`}
            defaultValue={item}
            impact={["Service page"]}
          />
        )),
      )}
      {section.steps.map((step, stepIndex) => (
        <div key={`step${stepIndex}`} className="grid gap-3">
          <Field label={`Visit step ${stepIndex + 1}`} name={`s${index}-sh${stepIndex}`} defaultValue={step.heading} impact={["Service page"]} />
          <Area label="Step detail" name={`s${index}-st${stepIndex}`} defaultValue={step.text} impact={["Service page"]} />
        </div>
      ))}
      {section.faqs.map((faq, faqIndex) => (
        <div key={`f${faqIndex}`} className="grid gap-3">
          <Field label={`FAQ ${faqIndex + 1}`} name={`s${index}-fq${faqIndex}`} defaultValue={faq.question} impact={["Service page"]} />
          <Area label="Answer" name={`s${index}-fa${faqIndex}`} defaultValue={faq.answer} impact={["Service page"]} />
        </div>
      ))}
      {section.references.map((reference, referenceIndex) => (
        <div key={`ref${referenceIndex}`} className="grid gap-3">
          <Field label={`Reference ${referenceIndex + 1}`} name={`s${index}-refl${referenceIndex}`} defaultValue={reference.label} impact={["Service page"]} />
          <Field label="Reference address" name={`s${index}-ref${referenceIndex}`} defaultValue={reference.href} impact={["Service page"]} />
        </div>
      ))}
      {section.practitioners.map((practitioner, practitionerIndex) => (
        <div key={`prac${practitionerIndex}`} className="grid gap-3">
          <Field label={`Related practitioner ${practitionerIndex + 1}`} name={`s${index}-pracl${practitionerIndex}`} defaultValue={practitioner.label} impact={["Service page"]} />
          <Field label="Practitioner note" name={`s${index}-pracn${practitionerIndex}`} defaultValue={practitioner.note} impact={["Service page"]} />
          <Choice label="Practitioner profile" name={`s${index}-prac${practitionerIndex}`} value={practitioner.href} options={doctors} />
        </div>
      ))}
    </section>
  );
}

function sectionLabel(section: ServiceSection): string {
  if (section.id === "introduction") return "Service introduction";
  if (section.id === "faqs") return "FAQs";
  if (section.id === "related-practitioners") return "Related practitioners";
  if (section.references.length > 0) return "References";
  return section.heading || section.id;
}

function paragraphLabel(section: ServiceSection, paragraphIndex: number): string {
  if (section.id === "introduction") return paragraphIndex === 0 ? "Service introduction" : `Service introduction ${paragraphIndex + 1}`;
  return paragraphIndex === 0 ? "Service body" : `Service body ${paragraphIndex + 1}`;
}

function Choice({ label, name, value, options }: { label: string; name: string; value: string; options: string[] }) {
  const choices = options.includes(value) || !value ? options : [value, ...options];
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      {label}
      <Impact items={["Service page"]} />
      <select className="rounded border border-slate-300 bg-white px-3 py-2" name={name} defaultValue={value}>
        {choices.map((option) => (
          <option key={option} value={option}>
            {publicPageName(option)}
          </option>
        ))}
      </select>
    </label>
  );
}
