import { publicationLabel } from "@/cms/modules";

export type ImageRevisionPlace = "current" | "previous" | "same" | "older";

function canonical(value: unknown): string {
  return JSON.stringify(normalize(value));
}

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.keys(record)
      .sort()
      .reduce<Record<string, unknown>>((sorted, key) => {
        sorted[key] = normalize(record[key]);
        return sorted;
      }, {});
  }
  return value ?? null;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

/**
 * Newest revision whose result matches the image in use is current.
 * The previous place is the newest older result that matches the state
 * immediately before that current result. Restore still applies `next`.
 */
export function imageRevisionPlaces(
  current: unknown,
  revisions: readonly { previous: unknown; next: unknown }[],
): ImageRevisionPlace[] {
  const currentKey = canonical(current);
  const currentIndex = revisions.findIndex((revision) => canonical(revision.next) === currentKey);
  const previousKey = currentIndex >= 0 ? canonical(revisions[currentIndex].previous) : "";
  let previousMarked = false;
  return revisions.map((revision, index) => {
    const nextKey = canonical(revision.next);
    if (index === currentIndex) return "current";
    if (currentIndex >= 0 && nextKey === currentKey) return "same";
    if (
      currentIndex >= 0 &&
      !previousMarked &&
      index > currentIndex &&
      nextKey === previousKey &&
      nextKey !== currentKey
    ) {
      previousMarked = true;
      return "previous";
    }
    return "older";
  });
}

export function imageRestoreLabel(place: ImageRevisionPlace): string | null {
  if (place === "current" || place === "same") return null;
  if (place === "previous") return "Return to the previous version";
  return "Use this older version";
}

export function imageVersionResult(snapshot: unknown, current: unknown): string[] {
  const next = asRecord(snapshot);
  const now = asRecord(current);
  const status = next.replacementStatus;
  const lines = [`Workflow: ${status ? publicationLabel(String(status)) : "No proposal"}`];
  if (typeof next.liveSha256 === "string" && typeof now.liveSha256 === "string") {
    lines.push(
      next.liveSha256 === now.liveSha256
        ? "Published file: same as the website now"
        : "Published file: different from the website now",
    );
  } else if ("liveSha256" in next) {
    lines.push(typeof next.liveSha256 === "string" ? "Published file: recorded in this version" : "Published file: not recorded");
  }
  if ("proposalSha256" in next) {
    lines.push(typeof next.proposalSha256 === "string" ? "Proposed file: kept with this version" : "Proposed file: none");
  }
  return lines;
}
