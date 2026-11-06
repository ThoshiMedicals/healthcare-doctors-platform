import Link from "next/link";
import { requireAction } from "@/cms/context";
import { listStories } from "@/story-capture/stories";
import {
  getGpOpportunitiesQuotes,
  getOpportunityPackQuotes,
  getPracticeExperienceQuotes,
} from "@/story-capture/integration";
import { SeedCompositeStoriesButton } from "./seed-composites-button";

export const dynamic = "force-dynamic";

export default async function StoryCaptureAdminPage() {
  const { clinic } = await requireAction("edit");
  const stories = await listStories(clinic.id);
  const [pe, opp, pack] = await Promise.all([
    getPracticeExperienceQuotes(clinic.id),
    getGpOpportunitiesQuotes(clinic.id),
    getOpportunityPackQuotes(clinic.id),
  ]);

  const byStatus = stories.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
          GP Story Capture
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">Story inventory</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Human gates only. Default-deny reuse. Versioned consent. Placement tracking for Practice
          Experience, GP Opportunities, and Opportunity Pack.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/story-capture/new"
          className="inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-3 text-sm font-medium text-white"
        >
          Invite / create story
        </Link>
        <SeedCompositeStoriesButton />
        <Link
          href="/admin/story-capture/architecture"
          className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-3 text-sm font-medium"
        >
          Implementation structure
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <h2 className="font-semibold">Public destinations (EV)</h2>
        <ul className="mt-2 space-y-1 text-slate-700">
          <li>
            Practice Experience → <code>/about-us/practice-experience.html</code> ({pe.length} live)
          </li>
          <li>
            GP Opportunities → <code>/join-our-team/gp-opportunities.html</code> ({opp.length} live)
          </li>
          <li>
            Opportunity Pack → <code>/join-our-team/opportunity-pack.html</code> ({pack.length} live)
          </li>
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          Consent, placements, reuse policies, and withdrawal live on each story detail. Composite
          seeds are placeholders — never invent named doctors.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <p className="font-semibold text-slate-900">Practice Experience live</p>
          <p className="text-2xl font-semibold">{pe.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <p className="font-semibold text-slate-900">Opportunities rail live</p>
          <p className="text-2xl font-semibold">{opp.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <p className="font-semibold text-slate-900">Opportunity Pack live</p>
          <p className="text-2xl font-semibold">{pack.length}</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <h2 className="font-semibold">By status</h2>
        <p className="mt-2 text-slate-600">
          {Object.keys(byStatus).length === 0
            ? "No stories yet."
            : Object.entries(byStatus)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ")}
        </p>
      </section>

      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {stories.map((story) => (
          <li key={story.id}>
            <Link
              href={`/admin/story-capture/${story.id}`}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50"
            >
              <div>
                <p className="font-medium text-slate-900">{story.workingTitle}</p>
                <p className="text-xs text-slate-500">
                  {story.subjectDisplayName} · {story.primaryCategory} · {story.status}
                </p>
              </div>
              <p className="text-xs text-slate-500">
                live {story.placements.length} · versions {story._count.versions}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
