/**
 * Intended published practitioner profile route inventory.
 * Used by regression tests so profile journeys fail closed when a redirect
 * or directory card points patients away from a live profile.
 *
 * Keep aligned with CMS published practitioners that own an individual profile
 * page. Gemunu is intentionally excluded (on_hold / unpublished → directory).
 */

export type PublishedPractitionerRoute = {
  slug: string;
  displayName: string;
  /** Canonical Next-native path without leading slash (CMS page.path form). */
  profilePath: string;
  /** Directory surface(s) that should link to this profile. */
  directorySurfaces: ReadonlyArray<
    "team-general-practitioners" | "team" | "team-allied-health" | "homepage"
  >;
  /** Expected H1 / primary name signal on the profile page. */
  expectedHeading: string;
};

/** Full published inventory with individual public profiles (staging CMS 2026-11-11). */
export const PUBLISHED_PRACTITIONER_ROUTES: readonly PublishedPractitionerRoute[] = [
  {
    slug: "dr-anand-singh",
    displayName: "Dr Anand Singh",
    profilePath: "doctors/dr-anand-singh.html",
    directorySurfaces: ["team-general-practitioners", "team"],
    expectedHeading: "Dr Anand Singh",
  },
  {
    slug: "dr-debra-larkins",
    displayName: "Dr Debra Larkins",
    profilePath: "doctors/dr-debra-larkins.html",
    directorySurfaces: ["team-general-practitioners"],
    expectedHeading: "Dr Debra Larkins",
  },
  {
    slug: "dr-golnar-mortezaei",
    displayName: "Dr Golnar Mortezaei",
    profilePath: "doctors/dr-golnar-mortezaei.html",
    directorySurfaces: ["team-general-practitioners"],
    expectedHeading: "Dr Golnar Mortezaei",
  },
  {
    slug: "dr-james",
    displayName: "Dr James Chanaka",
    profilePath: "doctors/dr-james.html",
    directorySurfaces: ["team-general-practitioners"],
    expectedHeading: "Dr James Chanaka",
  },
  {
    slug: "dr-kooshyar-karimi",
    displayName: "Dr Kooshyar Karimi",
    profilePath: "doctors/dr-kooshyar-karimi.html",
    directorySurfaces: ["team-general-practitioners"],
    expectedHeading: "Dr Kooshyar Karimi",
  },
  {
    slug: "dr-mary-abadir",
    displayName: "Dr Mary Abadir",
    profilePath: "doctors/dr-mary-abadir.html",
    directorySurfaces: ["team", "homepage"],
    expectedHeading: "Dr Mary Abadir",
  },
  {
    slug: "dr-nirupa-sivathasan",
    displayName: "Dr Nirupa Sivathasan",
    profilePath: "doctors/dr-nirupa-sivathasan.html",
    directorySurfaces: ["team-general-practitioners"],
    expectedHeading: "Dr Nirupa Sivathasan",
  },
  {
    slug: "dr-sambo-luon",
    displayName: "Dr Sambo Luon",
    profilePath: "doctors/dr-sambo-luon.html",
    directorySurfaces: ["team-general-practitioners"],
    expectedHeading: "Dr Sambo Luon",
  },
  {
    slug: "dr-steven-chang",
    displayName: "Dr Steven Chang",
    profilePath: "doctors/dr-steven-chang.html",
    directorySurfaces: ["team-allied-health", "team", "homepage"],
    expectedHeading: "Dr Steven Chang",
  },
  {
    slug: "dr-sumita-singh",
    displayName: "Dr Sumita Singh",
    profilePath: "doctors/dr-sumita-singh.html",
    directorySurfaces: ["team-general-practitioners", "team"],
    expectedHeading: "Dr Sumita Singh",
  },
  {
    slug: "dr-tanya-goodwill",
    displayName: "Dr Tanya Goodwill",
    profilePath: "doctors/dr-tanya-goodwill.html",
    directorySurfaces: ["team-general-practitioners", "team"],
    expectedHeading: "Dr Tanya Goodwill",
  },
  {
    slug: "dr-usman-gul",
    displayName: "Dr Usman Gul",
    profilePath: "doctors/dr-usman-gul.html",
    directorySurfaces: ["team-general-practitioners"],
    expectedHeading: "Dr Usman Gul",
  },
  {
    slug: "dr-wasantha-hettiarchchi",
    displayName: "Dr Wasantha Hettiarchchi",
    profilePath: "doctors/dr-wasantha-hettiarchchi.html",
    directorySurfaces: ["team-general-practitioners", "team"],
    expectedHeading: "Dr Wasantha Hettiarchchi",
  },
  {
    slug: "dr-yamesha-ranatunga",
    displayName: "Dr Yamesha Ranatunga",
    profilePath: "doctors/dr-yamesha-ranatunga.html",
    directorySurfaces: ["team-general-practitioners"],
    expectedHeading: "Dr Yamesha Ranatunga",
  },
  {
    slug: "mr-samuel-stafford",
    displayName: "Mr Samuel Stafford",
    profilePath: "doctors/mr-samuel-stafford.html",
    directorySurfaces: ["team-allied-health", "team"],
    expectedHeading: "Mr Samuel Stafford",
  },
] as const;

/** Intentionally unpublished — may 301 to GP directory; never treat as a live profile. */
export const UNPUBLISHED_PRACTITIONER_DIRECTORY_REDIRECTS = [
  "/doctors/dr-gemunu-suresh-ranawake.html",
  "/doctor/dr-gemunu-suresh-ranawake",
] as const;

export const GP_DIRECTORY_PATH = "/team-general-practitioners.html";

export function publishedProfilePathnames(): string[] {
  return PUBLISHED_PRACTITIONER_ROUTES.map((r) => `/${r.profilePath}`);
}

export function findPublishedRouteByPath(pathname: string): PublishedPractitionerRoute | undefined {
  const normalized = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  return PUBLISHED_PRACTITIONER_ROUTES.find((r) => r.profilePath === normalized);
}
