import { notFound } from "next/navigation";
import { savePracticePage } from "@/cms/actions";
import { requireAction } from "@/cms/context";
import { practiceDocumentFrom, readPracticeDocument, type PracticeSection } from "@/cms/practice-document";
import { prisma } from "@/db/prisma";
import { Area, Field, GateNotice, SavedNotice, SaveBar, ViewPublicPage } from "./ui";
import { WorkflowControls } from "./workflow-controls";

export async function PracticeRecordEditor({
  id,
  saved,
  published,
  error,
  reason,
  returnTo,
}: {
  id: string;
  saved?: string;
  published?: string;
  error?: string;
  reason?: string;
  returnTo: string;
}) {
  const { clinic, role } = await requireAction("edit");
  const row = await prisma.practicePage.findFirst({
    where: { id, clinicId: clinic.id },
    include: { page: { select: { path: true, publishedRevision: { select: { html: true } } } } },
  });
  if (!row) notFound();
  const html = row.page?.publishedRevision?.html ?? "";
  const live = readPracticeDocument(html);
  const stored = practiceDocumentFrom(row.sections) ?? practiceDocumentFrom(row.publishedPayload);
  const document = stored && (row.publishedPayload || row.status !== "published") ? stored : live;
  const recordPath = `${returnTo}/${row.id}`;

  return (
    <main>
      <h1 className="text-2xl font-semibold">{document.title || row.title}</h1>
      <ViewPublicPage path={row.page?.path} />
      <SavedNotice saved={saved} published={published} status={row.status} />
      <GateNotice error={error} reason={reason} />
      <form action={savePracticePage} className="mt-6 grid max-w-3xl gap-4">
        <input type="hidden" name="id" value={row.id} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <Field label="Title" name="title" defaultValue={document.title} required impact={["This page", "Cards that already show this title", "Digital Reception, when it already shows this title"]} />
        <Area label="Introduction" name="summary" defaultValue={document.summary} impact={["This page", "Cards that already show this introduction", "Digital Reception, when it already shows this introduction"]} />
        {document.sections.map((section, index) => (
          <PracticeFields key={`${section.id}-${index}`} section={section} index={index} />
        ))}
        <p className="text-sm text-slate-600">
          Saving keeps this as a draft. Headings, paragraphs, lists, and FAQs keep the imported structure. Links, the footer, navigation, and the booking button stay as imported.
        </p>
        <SaveBar historyHref={`/admin/revisions/practice_page/${row.id}`} />
      </form>
      <WorkflowControls entityType="practice_page" entityId={row.id} status={row.status} returnTo={recordPath} role={role} />
    </main>
  );
}

function PracticeFields({ section, index }: { section: PracticeSection; index: number }) {
  return (
    <section className="grid gap-3 rounded border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold">{section.heading || section.id || `Section ${index + 1}`}</h2>
      {section.heading ? <Field label="Heading" name={`s${index}-heading`} defaultValue={section.heading} impact={["This page"]} /> : <input type="hidden" name={`s${index}-heading`} value="" />}
      {section.paragraphs.map((paragraph, paragraphIndex) => (
        <Area
          key={`p${paragraphIndex}`}
          label={paragraphIndex === 0 ? "Body" : `Body ${paragraphIndex + 1}`}
          name={`s${index}-p${paragraphIndex}`}
          defaultValue={paragraph}
          impact={["This page"]}
        />
      ))}
      {section.lists.map((list, listIndex) =>
        list.map((item, itemIndex) => (
          <Field key={`l${listIndex}-${itemIndex}`} label={`List item ${itemIndex + 1}`} name={`s${index}-l${listIndex}-${itemIndex}`} defaultValue={item} impact={["This page"]} />
        )),
      )}
      {section.faqs.map((faq, faqIndex) => (
        <div key={`f${faqIndex}`} className="grid gap-3">
          <Field label={`FAQ ${faqIndex + 1}`} name={`s${index}-fq${faqIndex}`} defaultValue={faq.question} impact={["This page"]} />
          <Area label="Answer" name={`s${index}-fa${faqIndex}`} defaultValue={faq.answer} impact={["This page"]} />
        </div>
      ))}
      {section.cards.map((card, cardIndex) => (
        <div key={`card${cardIndex}`} className="grid gap-3">
          <Field label="Location" name={`s${index}-cardk${cardIndex}`} defaultValue={card.kicker} impact={["This page"]} />
          <Field label="Location name" name={`s${index}-cardh${cardIndex}`} defaultValue={card.heading} impact={["This page"]} />
          <Area label="Location summary" name={`s${index}-cardt${cardIndex}`} defaultValue={card.text} impact={["This page"]} />
        </div>
      ))}
      {section.chips.map((chip, chipIndex) => (
        <Field key={`chip${chipIndex}`} label={`Highlight ${chipIndex + 1}`} name={`s${index}-chip${chipIndex}`} defaultValue={chip} impact={["This page"]} />
      ))}
    </section>
  );
}
