/**
 * Employer Brand Integrity Pass — public/stakeholder rendering helpers.
 * Suppress prototype language and unapproved composite treatments without
 * rewriting CMS URLs, IA, or CTA destinations.
 */

const FORBIDDEN_VISIBLE =
  /\bexperience validation\b|\bplaceholder\b|\bprototype\b|\binternal\b|\banalyst note\b|\bsynthetic\b|\bstory capture\b|\breplace via\b|\bcomposite\b|\bnot final published\b|\bai_placeholder\b|\bnot identifiable\b/i;

const SECTION_SUPPRESS =
  /^(placeholder|doctor voices|community narratives|internal analyst|analyst note)/i;

/** True when text is safe to show stakeholders. */
export function isStakeholderSafeText(value: string | undefined | null): boolean {
  if (!value) return true;
  return !FORBIDDEN_VISIBLE.test(value);
}

/** Strip parenthetical/prototype markers from headings while keeping substance. */
export function cleanPublicHeading(value: string): string {
  return value
    .replace(/\s*\((?:synthetic|placeholders?|composite)[^)]*\)/gi, "")
    .replace(/\s*—\s*(?:synthetic|placeholder|composite).*$/i, "")
    .replace(/^Placeholder\s+/i, "")
    .replace(/^Composite[,:]?\s*/i, "")
    .replace(/\bcomposite\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim()
    .replace(/^[a-z]/, (ch) => ch.toUpperCase());
}

/** Whether a CMS section should be omitted from public HTML. */
export function shouldSuppressPublicSection(input: {
  id?: string;
  heading?: string;
}): boolean {
  const id = (input.id || "").toLowerCase();
  const heading = input.heading || "";
  if (
    id.includes("analyst") ||
    id.includes("doctor-voices") ||
    id.includes("doctor_voices") ||
    id.includes("composite-voices") ||
    id.includes("community-narratives") ||
    id === "voices" ||
    id.includes("placeholder")
  ) {
    return true;
  }
  if (SECTION_SUPPRESS.test(heading.trim())) return true;
  if (/\b(placeholder|synthetic|internal analyst|analyst note)\b/i.test(heading)) {
    return true;
  }
  return false;
}

/** Drop list points that expose prototype / replace-with instructions. */
export function filterPublicPoints(points: ReadonlyArray<string>): string[] {
  return points.filter((p) => isStakeholderSafeText(p));
}

/** True when an image URL is under the temporary Asset Library placeholders tree. */
export function isNonWmcPlaceholderAsset(src: string): boolean {
  return /\/assets\/attraction\/placeholders\//i.test(src) || /ai_placeholder|placeholder/i.test(src);
}
