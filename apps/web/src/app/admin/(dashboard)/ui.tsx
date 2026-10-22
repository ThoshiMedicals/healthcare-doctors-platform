import Link from "next/link";
import { publicHref } from "@/cms/staff-labels";
import { PendingButton } from "./pending-button";
import { SearchableRecords } from "./searchable-list";

export function SavedNotice({
  saved,
  rolled,
  published,
  status,
  kind = "content",
}: {
  saved?: string;
  rolled?: string;
  published?: string;
  status?: string;
  kind?: "content" | "governance" | "image";
}) {
  if (saved !== "1" && rolled !== "1" && published !== "1") return null;
  const message =
    published === "1"
      ? "Published. The public page now uses this version. The page structure is unchanged."
      : rolled === "1"
        ? kind === "image"
          ? "Restored. This version is now the current image. The filename and page layout are unchanged."
          : kind === "governance"
            ? "Restored. The governance record matches this revision. The public website is unchanged."
            : "Restored. A published version matches the public website. A restored draft stays off the public website until you publish."
        : kind === "governance"
          ? "Saved. Governance stays in the CMS and does not change the public website."
          : status === "clinical_review"
            ? "Submitted for review. The public website is unchanged."
            : status === "approved"
              ? "Approved. The public website is unchanged until you publish."
              : status === "published"
                ? ""
                : "Saved as a draft. The public website still shows the published version.";
  if (!message) return null;
  return <p className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p>;
}

export function ViewPublicPage({ path }: { path?: string | null }) {
  const href = publicHref(path);
  if (!href) return null;
  return (
    <a className="mt-2 inline-block text-sm text-slate-600 underline" href={href} target="_blank" rel="noreferrer">
      View public page
    </a>
  );
}

export function GateNotice({ error, reason }: { error?: string; reason?: string }) {
  if (error !== "gate" || !reason) return null;
  return <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{reason}</p>;
}

export function ErrorNotice({ error }: { error?: string }) {
  if (!error) return null;
  const message =
    error === "type"
      ? "That file was not accepted. Use JPEG, PNG, or WebP. SVG, GIF, BMP, and TIFF are blocked."
      : "That change was not saved. Check the required fields and your role.";
  return <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{message}</p>;
}

export function RecordList({
  title,
  intro,
  rows,
}: {
  title: string;
  intro: string;
  rows: { href: string; title: string; meta: string }[];
}) {
  return (
    <main>
      <SearchableRecords title={title} intro={intro} rows={rows} />
    </main>
  );
}

export function Impact({ items }: { items: readonly string[] }) {
  if (items.length === 0) {
    return <p className="text-xs font-medium text-slate-500">CMS only</p>;
  }
  return (
    <p className="text-xs leading-5 text-slate-500">
      Updates:
      {items.map((item) => (
        <span key={item} className="block">
          ✓ {item}
        </span>
      ))}
    </p>
  );
}

export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
  minLength,
  autoComplete,
  impact,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  impact: readonly string[];
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      {label}
      <Impact items={impact} />
      <input
        className="rounded border border-slate-300 bg-white px-3 py-2"
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
      />
    </label>
  );
}

export function Area({
  label,
  name,
  defaultValue,
  impact,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  impact: readonly string[];
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      {label}
      <Impact items={impact} />
      <textarea
        className="min-h-28 rounded border border-slate-300 bg-white px-3 py-2"
        name={name}
        defaultValue={defaultValue ?? ""}
      />
    </label>
  );
}

export function SaveBar({ historyHref, historyLabel = "Revision history" }: { historyHref: string; historyLabel?: string }) {
  return (
    <div className="flex items-center gap-3">
      <PendingButton
        label="Save revision"
        pendingLabel="Saving…"
        className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
      />
      <Link href={historyHref} className="text-sm text-slate-600 underline">
        {historyLabel}
      </Link>
    </div>
  );
}
