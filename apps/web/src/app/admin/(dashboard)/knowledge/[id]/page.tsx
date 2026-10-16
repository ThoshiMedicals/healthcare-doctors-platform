import { notFound } from "next/navigation";
import { saveKnowledgeArticle } from "@/cms/actions";
import { articleDocumentFrom, readArticleDocument } from "@/cms/article-document";
import { requireAction } from "@/cms/context";
import { prisma } from "@/db/prisma";
import { publicPageName } from "@/cms/staff-labels";
import { Area, Field, GateNotice, Impact, SavedNotice, SaveBar, ViewPublicPage } from "../../ui";
import { WorkflowControls } from "../../workflow-controls";

export const dynamic = "force-dynamic";

export default async function ArticleEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; published?: string; error?: string; reason?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { clinic, role } = await requireAction("edit");
  const row = await prisma.knowledgeArticle.findFirst({
    where: { id, clinicId: clinic.id },
    include: { page: { select: { path: true, publishedRevision: { select: { html: true } } } } },
  });
  if (!row) notFound();
  const pagePath = row.page?.path ?? row.articlePath ?? "";
  const live = readArticleDocument(row.page?.publishedRevision?.html ?? "", pagePath);
  const stored = articleDocumentFrom(row.educationalContent);
  const document = stored && (row.publishedPayload || row.status !== "published") ? stored : live;
  const pages = await prisma.page.findMany({
    where: { clinicId: clinic.id, status: "published" },
    select: { path: true },
    orderBy: { path: "asc" },
  });
  const services = pages.filter((page) => page.path.startsWith("services/")).map((page) => page.path);
  const practitioners = pages.filter((page) => page.path.startsWith("doctors/")).map((page) => page.path);
  const guides = pages.filter((page) => page.path.startsWith("knowledge/")).map((page) => page.path);
  const returnTo = `/admin/knowledge/${row.id}`;

  return (
    <main>
      <h1 className="text-2xl font-semibold">{document.title || row.title}</h1>
      <ViewPublicPage path={pagePath} />
      <SavedNotice saved={query.saved} published={query.published} status={row.status} />
      <GateNotice error={query.error} reason={query.reason} />
      <form action={saveKnowledgeArticle} className="mt-6 grid max-w-3xl gap-4">
        <input type="hidden" name="id" value={row.id} />
        <Field label="Heading" name="title" defaultValue={document.title} required impact={["Article page", "Knowledge card that already shows this heading", "Digital Reception, when it already shows this heading"]} />
        <Area label="Summary" name="summary" defaultValue={document.summary} impact={["Article page", "Knowledge card that already shows this summary", "Digital Reception, when it already shows this summary"]} />
        <Field label="Review date" name="updated" type="date" defaultValue={document.updated} impact={["Article page"]} />
        {document.sections.map((section, index) => (
          <section key={section.id} className="grid gap-3 rounded border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold">{section.heading || section.id}</h2>
            <Field label="Subheading" name={`s${index}-heading`} defaultValue={section.heading} impact={["Article page"]} />
            {section.paragraphs.map((paragraph, paragraphIndex) => (
              <Area key={`p${paragraphIndex}`} label={paragraphIndex === 0 ? "Article body" : `Article body ${paragraphIndex + 1}`} name={`s${index}-p${paragraphIndex}`} defaultValue={paragraph} impact={["Article page"]} />
            ))}
            {section.takeaways.map((takeaway, takeawayIndex) => (
              <Field key={`t${takeawayIndex}`} label={takeawayIndex === 0 ? "Key takeaway" : `Key takeaway ${takeawayIndex + 1}`} name={`s${index}-t${takeawayIndex}`} defaultValue={takeaway} impact={["Article page"]} />
            ))}
            {section.faqs.map((faq, faqIndex) => (
              <div key={`f${faqIndex}`} className="grid gap-3">
                <Field label={`FAQ ${faqIndex + 1}`} name={`s${index}-fq${faqIndex}`} defaultValue={faq.question} impact={["Article page"]} />
                <Area label="Answer" name={`s${index}-fa${faqIndex}`} defaultValue={faq.answer} impact={["Article page"]} />
              </div>
            ))}
            {section.sources.map((source, sourceIndex) => (
              <div key={`src${sourceIndex}`} className="grid gap-3">
                <Field label={`Source ${sourceIndex + 1}`} name={`s${index}-srcl${sourceIndex}`} defaultValue={source.label} impact={["Article page"]} />
                <Field label="Source address" name={`s${index}-src${sourceIndex}`} defaultValue={source.href} impact={["Article page"]} />
              </div>
            ))}
            {section.services.map((service, serviceIndex) => (
              <div key={`svc${serviceIndex}`} className="grid gap-3">
                <Field label={`Related service ${serviceIndex + 1}`} name={`s${index}-svcl${serviceIndex}`} defaultValue={service.label} impact={["Article page"]} />
                <Choice label="Service page" name={`s${index}-svc${serviceIndex}`} value={service.href} options={services} />
              </div>
            ))}
            {section.practitioners.map((practitioner, practitionerIndex) => (
              <div key={`prac${practitionerIndex}`} className="grid gap-3">
                <Field label={`Related practitioner ${practitionerIndex + 1}`} name={`s${index}-pracl${practitionerIndex}`} defaultValue={practitioner.label} impact={["Article page"]} />
                <Area label="Practitioner summary" name={`s${index}-pracs${practitionerIndex}`} defaultValue={practitioner.summary} impact={["Article page"]} />
                <Choice label="Practitioner profile" name={`s${index}-prac${practitionerIndex}`} value={practitioner.href} options={practitioners} />
              </div>
            ))}
            {section.guides.map((guide, guideIndex) => (
              <div key={`guide${guideIndex}`} className="grid gap-3">
                <Field label="Guide category" name={`s${index}-guidek${guideIndex}`} defaultValue={guide.kicker} impact={["Article page"]} />
                <Field label={`Related article ${guideIndex + 1}`} name={`s${index}-guidet${guideIndex}`} defaultValue={guide.title} impact={["Article page"]} />
                <Area label="Article summary" name={`s${index}-guides${guideIndex}`} defaultValue={guide.summary} impact={["Article page"]} />
                <Choice label="Article page" name={`s${index}-guide${guideIndex}`} value={guide.href} options={guides} />
              </div>
            ))}
          </section>
        ))}
        <p className="text-sm text-slate-600">
          Saving keeps this as a draft. Headings, paragraphs, takeaways, FAQs, and links keep the imported structure.
          Related services, practitioners, and articles must stay on published pages. The review date stays in the existing byline.
        </p>
        <SaveBar historyHref={`/admin/revisions/knowledge_article/${row.id}`} />
      </form>
      <WorkflowControls entityType="knowledge_article" entityId={row.id} status={row.status} returnTo={returnTo} role={role} />
    </main>
  );
}

function Choice({ label, name, value, options }: { label: string; name: string; value: string; options: string[] }) {
  const choices = options.includes(value) || !value ? options : [value, ...options];
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      {label}
      <Impact items={["Article page"]} />
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
