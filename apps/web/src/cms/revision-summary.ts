import { publicationLabel } from "@/cms/modules";
import { publicPageName } from "@/cms/staff-labels";

const FIELD_LABELS: Record<string, string> = {
  phoneDisplay: "Phone",
  email: "Email",
  streetAddress: "Address",
  suburb: "Suburb",
  state: "State",
  postcode: "Postcode",
  hotdocUrl: "HotDoc booking link",
  openingHours: "Opening hours",
  name: "Name",
  biography: "Biography",
  role: "Role",
  qualifications: "Qualifications",
  languages: "Languages",
  areasOfCare: "Areas of interest",
  professionalInterests: "Professional interests",
  portraitPath: "Portrait",
  portraitFile: "Portrait",
  bookingUrl: "HotDoc booking link",
  title: "Title",
  summary: "Introduction",
  sections: "Page content",
  document: "Page content",
  author: "Author",
  status: "Workflow",
  contentStatus: "Workflow",
  active: "Active",
  uploadedBy: "Uploaded by",
  approvedAt: "Approval date",
  photographer: "Photographer",
  copyrightOwner: "Copyright owner",
  expiresAt: "Expiry date",
  altText: "Alt text",
  usage: "Usage locations",
  replacementStatus: "Image workflow",
  liveSha256: "Published image",
  proposalSha256: "Proposed image",
  reviewedBy: "Reviewer",
  evidenceReference: "Evidence reference",
  contentSha256: "Image fingerprint",
};

const SKIP = new Set([
  "publishedPayload",
  "governance",
  "pageId",
  "sourceTitle",
  "sourceSummary",
  "sourceName",
  "sourceAuthor",
  "sourcePortraitFile",
  "sourceBookingUrl",
  "pagePath",
  "topicPage",
  "phoneTel",
  "billingPolicy",
  "agpalStatus",
  "contentOwner",
  "category",
  "practiceName",
  "liveThumbSha256",
  "proposalThumbSha256",
]);

const ORDER = [
  "title",
  "name",
  "summary",
  "biography",
  "author",
  "phoneDisplay",
  "email",
  "streetAddress",
  "suburb",
  "state",
  "postcode",
  "hotdocUrl",
  "bookingUrl",
  "openingHours",
  "qualifications",
  "languages",
  "areasOfCare",
  "professionalInterests",
  "portraitPath",
  "portraitFile",
  "document",
  "sections",
  "status",
  "contentStatus",
  "uploadedBy",
  "approvedAt",
  "photographer",
  "copyrightOwner",
  "expiresAt",
  "altText",
  "usage",
  "replacementStatus",
  "proposalSha256",
  "liveSha256",
];

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function stable(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  return JSON.stringify(value);
}

function short(value: unknown): string {
  if (value == null || value === "") return "blank";
  if (typeof value === "string") return value.length > 80 ? `${value.slice(0, 77)}…` : value;
  if (Array.isArray(value)) return value.map((item) => String(item)).join(", ") || "blank";
  return "updated";
}

function hoursLines(before: unknown, after: unknown): string[] {
  const read = (value: unknown) => {
    const rows = new Map<string, string>();
    if (!Array.isArray(value)) return rows;
    for (const row of value) {
      if (!row || typeof row !== "object") continue;
      const item = row as Record<string, unknown>;
      const day = String(item.dayOfWeek ?? "");
      if (!day) continue;
      rows.set(day, `${item.opens ?? ""}–${item.closes ?? ""}`);
    }
    return rows;
  };
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const left = read(before);
  const right = read(after);
  const lines = days.flatMap((day) => {
    if (left.get(day) === right.get(day)) return [];
    const label = `${day.charAt(0).toUpperCase()}${day.slice(1)}`;
    return [`${label}: ${left.get(day) || "blank"} → ${right.get(day) || "blank"}`];
  });
  return lines.length ? lines : ["Opening hours were updated."];
}

function linesFor(key: string, before: unknown, after: unknown): string[] {
  const label = FIELD_LABELS[key] ?? key;
  if (key === "openingHours") return hoursLines(before, after);
  if (key === "status" || key === "contentStatus") {
    const from = before ? publicationLabel(String(before)) : "blank";
    const to = after ? publicationLabel(String(after)) : "blank";
    return [`Workflow: ${from} → ${to}`];
  }
  if (key === "document" || key === "sections") return [`${label} was updated.`];
  if (key === "replacementStatus") {
    const label = (value: unknown) => (value ? publicationLabel(String(value)) : "No proposal");
    return [`Image workflow: ${label(before)} → ${label(after)}`];
  }
  if (key === "liveSha256") return ["Published image file changed."];
  if (key === "proposalSha256") return ["Proposed image file changed."];
  if (key === "contentSha256") return ["Reviewed image fingerprint changed."];
  if (key === "usage") {
    const names = (value: unknown) => (Array.isArray(value) ? value.map((item) => publicPageName(String(item))) : []);
    const left = names(before).join(", ");
    const right = names(after).join(", ");
    if (left.length > 80 || right.length > 80) return ["Usage locations were updated."];
    return [`Usage locations: ${left || "blank"} → ${right || "blank"}`];
  }
  const left = short(before);
  const right = short(after);
  if (left.length > 80 || right.length > 80) return [`${label} was updated.`];
  return [`${label}: ${left} → ${right}`];
}

export function revisionChanges(previous: unknown, next: unknown): string[] {
  const before = asRecord(previous);
  const after = asRecord(next);
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((key) => !SKIP.has(key))
    .filter((key) => stable(before[key]) !== stable(after[key]))
    .sort((left, right) => {
      const leftOrder = ORDER.indexOf(left);
      const rightOrder = ORDER.indexOf(right);
      return (leftOrder === -1 ? ORDER.length : leftOrder) - (rightOrder === -1 ? ORDER.length : rightOrder);
    });
  const lines = keys.flatMap((key) => linesFor(key, before[key], after[key]));
  const unique = [...new Set(lines)];
  return unique.length ? unique : ["No visible website content changed."];
}
