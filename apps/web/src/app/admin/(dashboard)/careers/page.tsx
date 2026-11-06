import Link from "next/link";
import { careerApplicationDashboardStats } from "@/cms/careers-applications";
import { requireAction } from "@/cms/context";
import { CareersWidgets } from "./careers-widgets";

export const dynamic = "force-dynamic";

export default async function CareersHubPage() {
  const { clinic } = await requireAction("edit");
  const stats = await careerApplicationDashboardStats(clinic.id);

  return (
    <main>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Careers</p>
      <h1 className="text-2xl font-semibold">Recruitment</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Practice-facing vacancy and application management for Join Our Team. This is not a public job board or
        CRM — it keeps expressions of interest with the practice operations team.
      </p>

      <div className="mt-6">
        <CareersWidgets stats={stats} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/careers/vacancies"
          className="rounded border border-slate-200 bg-white px-4 py-4 hover:border-slate-400"
        >
          <h2 className="text-lg font-semibold">Vacancies</h2>
          <p className="mt-1 text-sm text-slate-600">Create and manage opportunities shown on Join Our Team.</p>
        </Link>
        <Link
          href="/admin/careers/applications"
          className="rounded border border-slate-200 bg-white px-4 py-4 hover:border-slate-400"
        >
          <h2 className="text-lg font-semibold">Applications</h2>
          <p className="mt-1 text-sm text-slate-600">
            Review talent community expressions of interest, resumes, and recruitment status.
          </p>
        </Link>
      </div>
    </main>
  );
}
