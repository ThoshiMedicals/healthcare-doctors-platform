import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAction } from "@/cms/context";
import {
  GP_DOCTOR_PROFILE_STATUS_LABEL,
  getDoctorProfile,
  scoreDoctorProfileCompleteness,
} from "@/gp-pipeline/doctor-profile";
import { prisma } from "@/db/prisma";
import { ProfileActions } from "../profile-actions";

export const dynamic = "force-dynamic";

function ListBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-800">{items.length ? items.join(", ") : "—"}</dd>
    </div>
  );
}

export default async function GpReadinessProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { clinic } = await requireAction("edit");
  const [profile, practitioners] = await Promise.all([
    getDoctorProfile(clinic.id, id),
    prisma.practitioner.findMany({
      where: { clinicId: clinic.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);
  if (!profile) notFound();

  const completeness = scoreDoctorProfileCompleteness(profile);

  return (
    <main>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Recruitment · Doctor Profile Drafts
      </p>
      <h1 className="text-2xl font-semibold">{profile.preferredPublishedName}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {GP_DOCTOR_PROFILE_STATUS_LABEL[profile.status]} · {profile.completenessScore}% complete ·{" "}
        {profile.source.replaceAll("_", " ")}
      </p>
      <Link
        className="mt-2 inline-block text-sm text-slate-600 underline"
        href="/admin/recruitment/gp-readiness/profiles"
      >
        Back to profile drafts
      </Link>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <dl className="grid gap-4 rounded border border-slate-200 bg-white p-4 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title</dt>
            <dd>{profile.title}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Preferred published name
            </dt>
            <dd>{profile.preferredPublishedName}</dd>
          </div>
          <ListBlock label="Credentials" items={profile.credentials} />
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Short introduction
            </dt>
            <dd className="whitespace-pre-wrap">{profile.shortIntroduction || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Biography</dt>
            <dd className="whitespace-pre-wrap">{profile.biography || "—"}</dd>
          </div>
          <ListBlock label="Qualifications" items={profile.qualifications} />
          <ListBlock label="Special interests" items={profile.specialInterests} />
          <ListBlock label="Languages" items={profile.languages} />
          <ListBlock label="Memberships" items={profile.memberships} />
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Clinical experience
            </dt>
            <dd>{profile.yearsPractising || "—"}</dd>
          </div>
          {profile.readinessPackage ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Readiness package
              </dt>
              <dd>
                <Link
                  className="underline"
                  href={`/admin/recruitment/gp-readiness/${profile.readinessPackage.id}`}
                >
                  {profile.readinessPackage.firstName} {profile.readinessPackage.lastName}
                </Link>{" "}
                ·{" "}
                <a className="underline" href={`mailto:${profile.readinessPackage.email}`}>
                  {profile.readinessPackage.email}
                </a>
              </dd>
            </div>
          ) : null}
          {profile.practitioner ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Linked practitioner
              </dt>
              <dd>
                <Link className="underline" href={`/admin/practitioners/${profile.practitioner.id}`}>
                  {profile.practitioner.name}
                </Link>
              </dd>
            </div>
          ) : null}
          {profile.reviewNotes ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Review notes
              </dt>
              <dd className="whitespace-pre-wrap">{profile.reviewNotes}</dd>
            </div>
          ) : null}
        </dl>

        <aside className="space-y-4">
          <div className="rounded border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Profile completeness</h2>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{completeness.score}%</p>
            <ul className="mt-3 space-y-1 text-sm text-slate-700">
              {Object.entries(completeness.checks).map(([key, ok]) => (
                <li key={key}>
                  {ok ? "✓" : "○"} {key}
                </li>
              ))}
            </ul>
          </div>

          {profile.headshotPath ? (
            <div className="rounded border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Headshot</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="mt-3 h-40 w-40 rounded-xl object-cover"
                src={`/api/admin/gp-pipeline/doctor-profiles/${profile.id}/headshot`}
                alt=""
              />
            </div>
          ) : null}

          <ProfileActions
            profileId={profile.id}
            currentStatus={profile.status}
            practitionerId={profile.practitionerId}
            practitioners={practitioners}
          />

          <div className="rounded border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Status history
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {profile.statusAudits.length === 0 ? <li>No transitions yet.</li> : null}
              {profile.statusAudits.map((audit) => (
                <li key={audit.id} className="border-t border-slate-100 pt-2">
                  <span className="font-medium">
                    {audit.fromStatus || "—"} → {audit.toStatus}
                  </span>
                  <span className="text-slate-500">
                    {" "}
                    · {audit.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                  </span>
                  {audit.actorName ? <div className="text-xs text-slate-500">{audit.actorName}</div> : null}
                  {audit.note ? <div className="text-xs text-slate-600">{audit.note}</div> : null}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
