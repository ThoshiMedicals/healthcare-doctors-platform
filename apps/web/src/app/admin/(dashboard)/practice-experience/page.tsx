import Link from "next/link";
import { requireAction } from "@/cms/context";
import { prisma } from "@/db/prisma";
import { PRACTICE_EXPERIENCE_HUB_CONTENT } from "@/practice-experience/hub-content";
import { PRACTICE_EXPERIENCE_PATH } from "@/practice-experience/types";
import { PracticeExperienceModuleEditor } from "./module-editor";

export const dynamic = "force-dynamic";

export default async function PracticeExperienceAdminPage() {
  const { clinic } = await requireAction("edit");
  const page = await prisma.page.findUnique({
    where: { clinicId_path: { clinicId: clinic.id, path: PRACTICE_EXPERIENCE_PATH } },
    include: { publishedRevision: { select: { id: true, createdAt: true, contentSha256: true } } },
  });
  const practicePage = await prisma.practicePage.findUnique({
    where: { clinicId_slug: { clinicId: clinic.id, slug: "practice-experience" } },
  });

  const content = PRACTICE_EXPERIENCE_HUB_CONTENT;
  const published = Boolean(page?.publishedRevisionId);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">Content</p>
        <h1 className="text-3xl font-semibold text-slate-900">Practice Experience Hub</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
          CMS surface for the seven approved practice-experience modules. Public HTML is rendered from
          typed content and published as an immutable page revision — MedicalClinic schema only, no
          JobPosting.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Publishing status</h2>
        <dl className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-500">Public path</dt>
            <dd>
              <code>{PRACTICE_EXPERIENCE_PATH}</code>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Revision</dt>
            <dd>{published ? "Published" : "Not published yet — run publish script"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Content version</dt>
            <dd>{content.version}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">PracticePage slug</dt>
            <dd>{practicePage?.slug ?? "—"}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link
            className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-3 font-medium text-slate-800 hover:bg-slate-50"
            href={`/${PRACTICE_EXPERIENCE_PATH}`}
            target="_blank"
          >
            View public page
          </Link>
          <code className="rounded bg-slate-100 px-2 py-2 text-xs text-slate-700">
            npx tsx scripts/publish-practice-experience.ts
          </code>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Modules</h2>
        <p className="text-sm text-slate-600">
          Placeholder copy and AI visuals are replaceable. Swap media to consented stills and quotes
          via the testimonial / story-capture workflow before treating this as final.
        </p>
        <div className="space-y-4">
          {content.modules
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((module) => (
              <PracticeExperienceModuleEditor key={module.id} module={module} />
            ))}
        </div>
      </section>
    </div>
  );
}
