import Link from "next/link";
import { requireAction } from "@/cms/context";
import {
  GP_DOCTOR_PROFILE_STATUS_LABEL,
  GP_DOCTOR_PROFILE_STATUS_OPTIONS,
  doctorProfileDashboardStats,
  isGpDoctorProfileStatus,
  listDoctorProfiles,
} from "@/gp-pipeline/doctor-profile";
import { prisma } from "@/db/prisma";
import { SeedAndImportActions } from "./profile-actions";

export const dynamic = "force-dynamic";

export default async function GpReadinessProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const query = await searchParams;
  const { clinic } = await requireAction("edit");
  const statusRaw = query.status?.trim() || "all";
  const status =
    statusRaw === "all" || !isGpDoctorProfileStatus(statusRaw) ? "all" : statusRaw;
  const q = query.q?.trim() || undefined;

  const [stats, profiles, practitioners] = await Promise.all([
    doctorProfileDashboardStats(clinic.id),
    listDoctorProfiles(clinic.id, { status, q }),
    prisma.practitioner.findMany({
      where: { clinicId: clinic.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return (
    <main>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recruitment</p>
          <h1 className="text-2xl font-semibold">Doctor Profile Drafts</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Review Professional Profile Builder drafts, completeness, and publish into existing doctor pages.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin/recruitment/gp-readiness" className="text-slate-600 underline">
            Recruitment packages
          </Link>
          <Link href="/admin/gp-pipeline" className="text-slate-600 underline">
            GP Pipeline
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded border border-slate-200 bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </div>
        {GP_DOCTOR_PROFILE_STATUS_OPTIONS.map(([value, label]) => (
          <div key={value} className="rounded border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
            <p className="text-2xl font-semibold">{stats[value]}</p>
          </div>
        ))}
      </div>

      <SeedAndImportActions practitioners={practitioners} />

      <form className="mt-6 grid gap-3 rounded border border-slate-200 bg-white p-4 md:grid-cols-4" method="get">
        <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
          Search
          <input
            className="rounded border border-slate-300 px-3 py-2"
            name="q"
            type="search"
            defaultValue={q ?? ""}
            placeholder="Name, bio, intro…"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Status
          <select className="rounded border border-slate-300 px-3 py-2" name="status" defaultValue={status}>
            <option value="all">All statuses</option>
            {GP_DOCTOR_PROFILE_STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
            Filter
          </button>
        </div>
      </form>

      <div className="mt-4 overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Doctor</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Completeness</th>
              <th className="px-3 py-2 font-semibold">Source</th>
              <th className="px-3 py-2 font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-slate-500" colSpan={5}>
                  No profile drafts yet. Seed migration examples or wait for a portal submission.
                </td>
              </tr>
            ) : (
              profiles.map((profile) => (
                <tr key={profile.id} className="border-t border-slate-100">
                  <td className="px-3 py-3">
                    <Link
                      className="font-medium text-slate-900 underline"
                      href={`/admin/recruitment/gp-readiness/profiles/${profile.id}`}
                    >
                      {profile.preferredPublishedName}
                    </Link>
                    {profile.readinessPackage ? (
                      <p className="text-xs text-slate-500">{profile.readinessPackage.email}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">{GP_DOCTOR_PROFILE_STATUS_LABEL[profile.status]}</td>
                  <td className="px-3 py-3">{profile.completenessScore}%</td>
                  <td className="px-3 py-3">{profile.source.replaceAll("_", " ")}</td>
                  <td className="px-3 py-3">{profile.updatedAt.toISOString().slice(0, 10)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
