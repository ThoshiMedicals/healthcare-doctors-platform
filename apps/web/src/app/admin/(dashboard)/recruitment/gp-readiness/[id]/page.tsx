import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { requireAction } from "@/cms/context";
import { prisma } from "@/db/prisma";
import {
  GP_READINESS_STATUS_LABEL,
  GP_READINESS_STATUS_OPTIONS,
  GP_READINESS_TASK_PRESETS,
  GP_RECRUITMENT_SOURCE_LABEL,
  GP_RECRUITMENT_SOURCE_OPTIONS,
  getRecruitmentPackage,
  packageProfileCompleteness,
} from "@/gp-pipeline/recruitment-ops";
import { PackageActions, TaskStatusButton } from "../package-actions";

export const dynamic = "force-dynamic";

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      <div className="mt-3 space-y-2 text-sm text-slate-800">{children}</div>
    </section>
  );
}

function Kv({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap">{value || "—"}</dd>
    </div>
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function display(value: unknown): string {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join(", ") || "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export default async function GpReadinessPackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { clinic } = await requireAction("edit");
  const [row, staff] = await Promise.all([
    getRecruitmentPackage(clinic.id, id),
    prisma.clinicMembership.findMany({
      where: { clinicId: clinic.id },
      include: { user: { select: { id: true, name: true, email: true, username: true, disabledAt: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  if (!row) notFound();

  const payload = asRecord(row.payloadJson);
  const personal = asRecord(payload.personal);
  const registration = asRecord(payload.registration);
  const professional = asRecord(payload.professional);
  const website = asRecord(payload.websiteProfile);
  const availability = asRecord(payload.availability);
  const provider = asRecord(row.providerReadinessJson ?? payload.providerReadiness);
  const section19ab = asRecord(row.section19abJson ?? payload.section19ab);
  const spousal = asRecord(row.spousalAssessmentJson ?? payload.spousal);
  const docs = Array.isArray(row.documentsJson)
    ? (row.documentsJson as Array<Record<string, unknown>>)
    : [];
  const completeness = packageProfileCompleteness(row);
  const assignees = staff.map((membership) => membership.user).filter((user) => !user.disabledAt);

  return (
    <main>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Recruitment · GP Readiness Package
      </p>
      <h1 className="text-2xl font-semibold">
        {row.firstName} {row.lastName}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {GP_READINESS_STATUS_LABEL[row.status]} · profile {completeness.score}% · submitted{" "}
        {row.submittedAt.toISOString().slice(0, 10)}
        {row.recruitmentSource ? ` · ${GP_RECRUITMENT_SOURCE_LABEL[row.recruitmentSource]}` : ""}
      </p>
      <div className="mt-2 flex flex-wrap gap-3 text-sm">
        <Link className="underline text-slate-600" href="/admin/recruitment/gp-readiness">
          Back to operations
        </Link>
        {row.doctorProfileDraft ? (
          <Link
            className="underline text-slate-600"
            href={`/admin/recruitment/gp-readiness/profiles/${row.doctorProfileDraft.id}`}
          >
            Open profile draft
          </Link>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.45fr_0.9fr]">
        <div className="space-y-4">
          <Section title="Personal details">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Kv label="Name" value={`${row.firstName} ${row.lastName}`} />
              <Kv
                label="Email"
                value={
                  <a className="underline" href={`mailto:${row.email}`}>
                    {row.email}
                  </a>
                }
              />
              <Kv label="Mobile" value={row.mobile} />
              <Kv label="Preferred contact" value={row.preferredContactMethod} />
              <Kv label="Best contact time" value={display(personal.bestContactTime)} />
            </dl>
          </Section>

          <Section title="Registration & qualifications">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Kv label="AHPRA" value={display(registration.ahpraNumber)} />
              <Kv label="FRACGP" value={display(registration.fracgp)} />
              <Kv label="FACRRM" value={display(registration.facrrm)} />
              <Kv label="Other qualifications" value={display(registration.otherQualifications)} />
              <Kv label="Vocationally registered" value={display(registration.vocationallyRegistered)} />
              <Kv label="Citizen / PR / visa" value={`${display(registration.australianCitizen)} / ${display(registration.permanentResident)} / ${display(registration.temporaryVisaHolder)}`} />
              <Kv label="Current practice" value={display(professional.currentPractice)} />
              <Kv label="Years practising" value={display(professional.yearsPractising)} />
              <Kv label="Special interests" value={display(professional.specialInterests)} />
            </dl>
          </Section>

          <Section title="Provider number readiness">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Kv label="Medicare provider number" value={display(provider.medicareProviderNumber)} />
              <Kv label="Prescriber number" value={display(provider.prescriberNumber)} />
              <Kv label="PRODA" value={display(provider.prodaAccount)} />
              <Kv label="HPOS" value={display(provider.hposAccess)} />
              <Kv label="Provider path" value={row.providerNumberPath} />
            </dl>
          </Section>

          <Section title="19AB assessment">
            <dl className="grid gap-3 sm:grid-cols-2">
              {Object.entries(section19ab).map(([key, value]) => (
                <Kv key={key} label={key} value={display(value)} />
              ))}
            </dl>
          </Section>

          <Section title="Spousal assessment">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Kv label="Preliminary outcome" value={row.spousalOutcome} />
              {Object.entries(spousal).map(([key, value]) => (
                <Kv key={key} label={key} value={display(value)} />
              ))}
            </dl>
          </Section>

          <Section title="Website profile content">
            <dl className="grid gap-3">
              <Kv label="Published name" value={display(website.preferredPublishedName)} />
              <Kv label="Short introduction" value={display(website.shortIntroduction)} />
              <Kv label="Biography" value={display(website.biography)} />
              <Kv label="Qualifications" value={display(website.qualifications)} />
              <Kv label="Languages" value={display(website.languagesSpoken ?? website.languages)} />
              <Kv label="Special interests" value={display(website.specialInterests)} />
              <Kv label="Memberships" value={display(website.memberships)} />
            </dl>
          </Section>

          <Section title="Availability">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Kv label="Preference" value={display(availability.preference)} />
              <Kv label="Preferred days" value={display(availability.preferredDays)} />
              <Kv label="Preferred sessions" value={display(availability.preferredSessions)} />
              <Kv
                label="Preferred start"
                value={
                  row.preferredStartDate
                    ? row.preferredStartDate.toISOString().slice(0, 10)
                    : display(availability.preferredStartDate)
                }
              />
            </dl>
          </Section>

          <Section title="Uploaded documents">
            {docs.length === 0 ? (
              <p className="text-slate-500">No documents uploaded.</p>
            ) : (
              <ul className="space-y-2">
                {docs.map((doc) => {
                  const key = String(doc.key || "");
                  const fileName = String(doc.fileName || key);
                  return (
                    <li key={`${key}-${fileName}`}>
                      <a
                        className="underline"
                        href={`/api/admin/gp-pipeline/readiness-packages/${row.id}/documents/${encodeURIComponent(key)}`}
                      >
                        {key}: {fileName}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title="Internal notes">
            {row.notes.length === 0 ? <p className="text-slate-500">No notes yet.</p> : null}
            <ul className="space-y-3">
              {row.notes.map((note) => (
                <li key={note.id} className="border-t border-slate-100 pt-3 first:border-0 first:pt-0">
                  <p className="text-xs text-slate-500">
                    {note.createdAt.toISOString().slice(0, 10)} · {note.authorName || "Staff"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{note.body}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Tasks">
            {row.tasks.length === 0 ? <p className="text-slate-500">No tasks yet.</p> : null}
            <ul className="space-y-3">
              {row.tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-wrap items-start justify-between gap-2 border-t border-slate-100 pt-3 first:border-0 first:pt-0"
                >
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-slate-500">
                      {task.status}
                      {task.assignedTo
                        ? ` · ${task.assignedTo.name || task.assignedTo.username || task.assignedTo.email}`
                        : " · Unassigned"}
                      {task.dueAt ? ` · due ${task.dueAt.toISOString().slice(0, 10)}` : ""}
                      {task.completedAt
                        ? ` · completed ${task.completedAt.toISOString().slice(0, 10)}`
                        : ""}
                    </p>
                  </div>
                  <TaskStatusButton packageId={row.id} taskId={task.id} status={task.status} />
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Status history">
            {row.statusAudits.length === 0 ? <p className="text-slate-500">No transitions yet.</p> : null}
            <ul className="space-y-2">
              {row.statusAudits.map((audit) => (
                <li key={audit.id} className="border-t border-slate-100 pt-2 first:border-0 first:pt-0">
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
          </Section>
        </div>

        <aside className="space-y-4">
          <section className="rounded border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Doctor profile readiness</h2>
            <p className="mt-1 text-3xl font-semibold">{completeness.score}%</p>
            <ul className="mt-3 space-y-1 text-sm text-slate-700">
              {Object.entries(completeness.checks).map(([key, ok]) => (
                <li key={key}>
                  {ok ? "✓" : "○"} {key}
                </li>
              ))}
            </ul>
          </section>

          <PackageActions
            packageId={row.id}
            currentStatus={row.status}
            statusOptions={GP_READINESS_STATUS_OPTIONS}
            recruitmentSource={row.recruitmentSource}
            sourceOptions={GP_RECRUITMENT_SOURCE_OPTIONS}
            taskPresets={[...GP_READINESS_TASK_PRESETS]}
            staff={assignees}
          />
        </aside>
      </div>
    </main>
  );
}
