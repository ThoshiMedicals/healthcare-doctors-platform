/**
 * Practice Experience schema governance.
 * MedicalClinic (clinic entity) + WebPage + BreadcrumbList only.
 * Never JobPosting / JobBoard / EmploymentAgency / Occupation.
 */

const FORBIDDEN_SCHEMA_TYPES = [
  "JobPosting",
  "JobBoard",
  "EmploymentAgency",
  "Occupation",
] as const;

export function assertNoJobPostingSchema(html: string): string[] {
  const violations: string[] = [];
  for (const type of FORBIDDEN_SCHEMA_TYPES) {
    const pattern = new RegExp(`"@type"\\s*:\\s*"${type}"|"@type"\\s*:\\s*\\[[^\\]]*"${type}"`, "i");
    if (pattern.test(html)) {
      violations.push(`Forbidden schema type present: ${type}`);
    }
  }
  return violations;
}

export function assertPracticeExperienceSchema(html: string): string[] {
  const violations = assertNoJobPostingSchema(html);
  if (!/"@type"\s*:\s*"MedicalClinic"|"@type"\s*:\s*\[[^\]]*MedicalClinic/.test(html)) {
    violations.push("MedicalClinic schema required on Practice Experience Hub");
  }
  if (!/"@type"\s*:\s*"WebPage"/.test(html)) {
    violations.push("WebPage schema required on Practice Experience Hub");
  }
  if (/"@type"\s*:\s*"FAQPage"/.test(html)) {
    // FAQPage is allowed only when FAQs are visible; hub v1 has none.
    violations.push("FAQPage not used on Practice Experience Hub v1 (no FAQ block)");
  }
  return violations;
}

export function hiringToneViolations(text: string): string[] {
  const banned = [
    /\bwe'?re hiring\b/i,
    /\bapply now\b/i,
    /\btalent (community|pipeline)\b/i,
    /\bemployer of choice\b/i,
    /\brockstars?\b/i,
    /\bEVP\b/,
  ];
  return banned.filter((re) => re.test(text)).map((re) => `Hiring-tone match: ${re}`);
}
