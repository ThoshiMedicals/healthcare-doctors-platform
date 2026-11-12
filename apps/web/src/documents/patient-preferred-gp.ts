/**
 * My Preferred GP — device-local persistence helpers (no server/account storage).
 * Catalog paths align with approved `old-html/doctors/*.html` + owner-listed GPs (Mary, Golnar).
 */

export const PREFERRED_GP_STORAGE_KEY = "wmc.preferredGp.v1";

/** Trust fact TF-PHONE-02 — clinic reception tel (Mary phone-only bookings). */
export const CLINIC_RECEPTION_TEL_HREF = "tel:+61732173344";

/** Owner-authorised HotDoc for Dr Golnar Mortezaei (integration/wmc-post-pwa-booking). */
export const GOLNAR_APPROVED_HOTDOC_URL =
  "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors/dr-golnar-mortezaei-5?wp=w_lightbox";

export type PreferredGpBookingMode = "PHONE_ONLY" | "ONLINE" | "PROFILE";

export type PreferredGpStored = {
  slug: string;
  name: string;
  profilePath: string;
  updatedAt: string;
};

export type PreferredGpCatalogEntry = {
  slug: string;
  name: string;
  profilePath: string;
  bookingMode: PreferredGpBookingMode;
  /** When ONLINE or PHONE_ONLY — explicit CTA; PROFILE uses profilePath only. */
  bookingCtaHref: string | null;
};

/** GPs from team-general-practitioners + Mary + Golnar (approved paths). */
export const APPROVED_GP_CATALOG: readonly PreferredGpCatalogEntry[] = [
  {
    slug: "dr-anand-singh",
    name: "Dr Anand Singh",
    profilePath: "doctors/dr-anand-singh.html",
    bookingMode: "PROFILE",
    bookingCtaHref: null,
  },
  {
    slug: "dr-debra-larkins",
    name: "Dr Debra Larkins",
    profilePath: "doctors/dr-debra-larkins.html",
    bookingMode: "PROFILE",
    bookingCtaHref: null,
  },
  {
    slug: "dr-golnar-mortezaei",
    name: "Dr Golnar Mortezaei",
    profilePath: "doctors/dr-golnar-mortezaei.html",
    bookingMode: "ONLINE",
    bookingCtaHref: GOLNAR_APPROVED_HOTDOC_URL,
  },
  {
    slug: "dr-james",
    name: "Dr James Chanaka",
    profilePath: "doctors/dr-james.html",
    bookingMode: "PROFILE",
    bookingCtaHref: null,
  },
  {
    slug: "dr-kooshyar-karimi",
    name: "Dr Kooshyar Karimi",
    profilePath: "doctors/dr-kooshyar-karimi.html",
    bookingMode: "PROFILE",
    bookingCtaHref: null,
  },
  {
    slug: "dr-mary-abadir",
    name: "Dr Mary Abadir",
    profilePath: "doctors/dr-mary-abadir.html",
    bookingMode: "PHONE_ONLY",
    bookingCtaHref: CLINIC_RECEPTION_TEL_HREF,
  },
  {
    slug: "dr-nirupa-sivathasan",
    name: "Dr Nirupa Sivathasan",
    profilePath: "doctors/dr-nirupa-sivathasan.html",
    bookingMode: "PROFILE",
    bookingCtaHref: null,
  },
  {
    slug: "dr-sambo-luon",
    name: "Dr Sambo Luon",
    profilePath: "doctors/dr-sambo-luon.html",
    bookingMode: "PROFILE",
    bookingCtaHref: null,
  },
  {
    slug: "dr-steven-chang",
    name: "Dr Steven Chang",
    profilePath: "doctors/dr-steven-chang.html",
    bookingMode: "PROFILE",
    bookingCtaHref: null,
  },
  {
    slug: "dr-sumita-singh",
    name: "Dr Sumita Singh",
    profilePath: "doctors/dr-sumita-singh.html",
    bookingMode: "PROFILE",
    bookingCtaHref: null,
  },
  {
    slug: "dr-tanya-goodwill",
    name: "Dr Tanya Goodwill",
    profilePath: "doctors/dr-tanya-goodwill.html",
    bookingMode: "PROFILE",
    bookingCtaHref: null,
  },
  {
    slug: "dr-usman-gul",
    name: "Dr Usman Gul",
    profilePath: "doctors/dr-usman-gul.html",
    bookingMode: "PROFILE",
    bookingCtaHref: null,
  },
  {
    slug: "dr-wasantha-hettiarchchi",
    name: "Dr Wasantha Hettiarchchi",
    profilePath: "doctors/dr-wasantha-hettiarchchi.html",
    bookingMode: "PROFILE",
    bookingCtaHref: null,
  },
  {
    slug: "dr-yamesha-ranatunga",
    name: "Dr Yamesha Ranatunga",
    profilePath: "doctors/dr-yamesha-ranatunga.html",
    bookingMode: "PROFILE",
    bookingCtaHref: null,
  },
  {
    slug: "mr-samuel-stafford",
    name: "Mr Samuel Stafford",
    profilePath: "doctors/mr-samuel-stafford.html",
    bookingMode: "PROFILE",
    bookingCtaHref: null,
  },
] as const;

const SLUG_BY_PATH = new Map(
  APPROVED_GP_CATALOG.map((entry) => [entry.profilePath.toLowerCase(), entry.slug]),
);

export function slugFromProfilePath(profilePath: string): string | null {
  const normalized = profilePath.trim().replace(/^\/+/, "").toLowerCase();
  return SLUG_BY_PATH.get(normalized) ?? null;
}

export function getCatalogEntryBySlug(slug: string): PreferredGpCatalogEntry | null {
  const key = slug.trim().toLowerCase();
  return APPROVED_GP_CATALOG.find((entry) => entry.slug === key) ?? null;
}

export function getBookingModeForSlug(slug: string): PreferredGpBookingMode | null {
  return getCatalogEntryBySlug(slug)?.bookingMode ?? null;
}

export function resolvePreferredGpBookingCta(
  entry: PreferredGpCatalogEntry,
): { href: string; label: string; external: boolean } {
  if (entry.bookingMode === "PHONE_ONLY" && entry.bookingCtaHref) {
    return { href: entry.bookingCtaHref, label: "Call reception to book", external: false };
  }
  if (entry.bookingMode === "ONLINE" && entry.bookingCtaHref) {
    return { href: entry.bookingCtaHref, label: "Book on HotDoc", external: true };
  }
  return { href: entry.profilePath, label: "View profile to book", external: false };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidPreferredGpRecord(value: unknown): value is PreferredGpStored {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (!isNonEmptyString(record.slug) || !isNonEmptyString(record.name)) return false;
  if (!isNonEmptyString(record.profilePath) || !isNonEmptyString(record.updatedAt)) return false;
  if (!getCatalogEntryBySlug(record.slug)) return false;
  const catalog = getCatalogEntryBySlug(record.slug)!;
  return (
    record.profilePath.toLowerCase() === catalog.profilePath.toLowerCase() &&
    record.name.trim() === catalog.name
  );
}

export function parsePreferredGp(raw: string | null | undefined): PreferredGpStored | null {
  if (raw == null || raw === "") return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isValidPreferredGpRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function serializePreferredGp(record: PreferredGpStored): string {
  return JSON.stringify({
    slug: record.slug,
    name: record.name,
    profilePath: record.profilePath,
    updatedAt: record.updatedAt,
  });
}

export function buildPreferredGpRecord(slug: string, updatedAt: string = new Date().toISOString()): PreferredGpStored | null {
  const entry = getCatalogEntryBySlug(slug);
  if (!entry) return null;
  return {
    slug: entry.slug,
    name: entry.name,
    profilePath: entry.profilePath,
    updatedAt,
  };
}
