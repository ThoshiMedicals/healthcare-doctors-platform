import { CARE_AREA_SERVICE_MAP, servicesForCareAreas } from "@/seo/care-area-service-map";

export const NEW_TO_PRACTICE_DAYS = 60;

export const AVAILABILITY_STATUSES = [
  "available_this_week",
  "limited",
  "waitlist",
  "not_accepting",
] as const;

export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export type PractitionerGrowthFields = {
  acceptingNewPatients: boolean;
  newToPracticeAt: string | null;
  availabilityStatus: AvailabilityStatus;
  relatedServices: string[];
};

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  available_this_week: "Available This Week",
  limited: "Limited Availability",
  waitlist: "Join Waitlist",
  not_accepting: "Not Accepting New Patients",
};

export const NEW_TO_WMC_LABEL = "New to Woolloongabba Medical Centre";
export const ACCEPTING_NEW_PATIENTS_LABEL = "Accepting New Patients";

export function isAvailabilityStatus(value: unknown): value is AvailabilityStatus {
  return typeof value === "string" && (AVAILABILITY_STATUSES as readonly string[]).includes(value);
}

export function parseGrowthFields(input: {
  acceptingNewPatients?: unknown;
  newToPracticeAt?: unknown;
  availabilityStatus?: unknown;
  relatedServices?: unknown;
}): PractitionerGrowthFields {
  const availabilityStatus = isAvailabilityStatus(input.availabilityStatus)
    ? input.availabilityStatus
    : "available_this_week";
  const acceptingNewPatients =
    availabilityStatus === "not_accepting"
      ? false
      : input.acceptingNewPatients === false || input.acceptingNewPatients === "false"
        ? false
        : true;
  let newToPracticeAt: string | null = null;
  if (input.newToPracticeAt instanceof Date && !Number.isNaN(input.newToPracticeAt.getTime())) {
    newToPracticeAt = input.newToPracticeAt.toISOString();
  } else if (typeof input.newToPracticeAt === "string" && input.newToPracticeAt.trim()) {
    const d = new Date(input.newToPracticeAt);
    newToPracticeAt = Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const relatedServices = Array.isArray(input.relatedServices)
    ? input.relatedServices.map((item) => String(item).replace(/^\//, "")).filter(Boolean)
    : [];
  return { acceptingNewPatients, newToPracticeAt, availabilityStatus, relatedServices };
}

export function growthFromPayload(payload: unknown): PractitionerGrowthFields {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return parseGrowthFields({});
  }
  const data = payload as Record<string, unknown>;
  return parseGrowthFields(data);
}

export function isNewToPracticeActive(newToPracticeAt: string | null, now = new Date()): boolean {
  if (!newToPracticeAt) return false;
  const start = new Date(newToPracticeAt);
  if (Number.isNaN(start.getTime())) return false;
  const expires = new Date(start.getTime() + NEW_TO_PRACTICE_DAYS * 24 * 60 * 60 * 1000);
  return now >= start && now < expires;
}

export function newBadgeExpiresAt(newToPracticeAt: string | null): string | null {
  if (!newToPracticeAt) return null;
  const start = new Date(newToPracticeAt);
  if (Number.isNaN(start.getTime())) return null;
  return new Date(start.getTime() + NEW_TO_PRACTICE_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

function labelForServicePath(path: string): string {
  const normalized = path.replace(/^\//, "");
  const mapped = CARE_AREA_SERVICE_MAP.find((rule) => rule.servicePath === normalized);
  if (mapped) return mapped.serviceLabel;
  return normalized
    .replace(/^services\//, "")
    .replace(/\.html$/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Prefer explicit relatedServices; otherwise derive from care areas. */
export function resolvePractitionerServices(
  relatedServices: readonly string[],
  areasOfCare: readonly string[],
): Array<{ path: string; label: string }> {
  if (relatedServices.length) {
    return relatedServices.map((path) => {
      const normalized = path.replace(/^\//, "");
      const full = normalized.startsWith("services/") ? normalized : `services/${normalized}`;
      return { path: full, label: labelForServicePath(full) };
    });
  }
  return servicesForCareAreas(areasOfCare);
}

export function careFilterTokens(areasOfCare: readonly string[]): string[] {
  const tokens = new Set<string>();
  for (const area of areasOfCare) {
    const lower = area.toLowerCase();
    if (/women/.test(lower)) tokens.add("womens-health");
    // Avoid matching the "men's" substring inside "women's".
    if (/(^|[^a-z])men'?s\b/.test(lower)) tokens.add("mens-health");
    if (/family|general practice/.test(lower)) tokens.add("family-medicine");
    if (/skin|dermatology/.test(lower)) tokens.add("skin-checks");
    if (/mental/.test(lower)) tokens.add("mental-health");
    if (/chronic|diabetes|heart|copd|osteo/.test(lower)) tokens.add("chronic-disease");
    if (/child/.test(lower)) tokens.add("childrens-health");
    if (/prevent/.test(lower)) tokens.add("preventive-care");
    if (/vaccin|immunis|travel/.test(lower)) tokens.add("vaccinations");
  }
  return [...tokens];
}

export const CARE_FILTER_OPTIONS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "womens-health", label: "Women's Health" },
  { id: "mens-health", label: "Men's Health" },
  { id: "family-medicine", label: "Family Medicine" },
  { id: "skin-checks", label: "Skin Checks" },
  { id: "mental-health", label: "Mental Health" },
  { id: "chronic-disease", label: "Chronic Disease" },
  { id: "childrens-health", label: "Children's Health" },
];

export function growthSearchKeywords(growth: PractitionerGrowthFields): string[] {
  const keys: string[] = [];
  if (isNewToPracticeActive(growth.newToPracticeAt)) keys.push("new gp", "new doctor", "new to woolloongabba");
  if (growth.acceptingNewPatients) keys.push("accepting new patients", "new patients");
  keys.push(AVAILABILITY_LABELS[growth.availabilityStatus].toLowerCase());
  return keys;
}
