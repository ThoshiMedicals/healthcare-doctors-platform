import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  PRACTITIONER_BOOKING_MATRIX,
  GOLNAR_APPROVED_HOTDOC_URL,
  resolvePractitionerBookingHref,
} from "@/documents/practitioner-booking";
import {
  resolveWordpressLegacyRedirect,
  WORDPRESS_LEGACY_REDIRECTS,
} from "./wordpress-legacy-redirects";
import {
  GP_DIRECTORY_PATH,
  PUBLISHED_PRACTITIONER_ROUTES,
  UNPUBLISHED_PRACTITIONER_DIRECTORY_REDIRECTS,
  findPublishedRouteByPath,
  publishedProfilePathnames,
} from "./published-practitioner-routes";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../../../");

/** CMS-only GP profiles injected into the live GP directory (not golden HTML). */
const CMS_INJECTED_GP_PROFILE_PATHS = [
  "doctors/dr-golnar-mortezaei.html",
  "doctors/dr-james.html",
  "doctors/dr-yamesha-ranatunga.html",
] as const;

function readPublicHtml(rel: string): string {
  const candidates = [
    path.join(repoRoot, "old-html", rel),
    path.join(repoRoot, "apps", "web", "public", rel),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return fs.readFileSync(candidate, "utf8");
  }
  throw new Error(`Missing HTML fixture for ${rel}`);
}

function extractDoctorProfileHrefs(html: string): string[] {
  const matches = html.matchAll(/href="(doctors\/[^"]+\.html)"/gi);
  return [...new Set([...matches].map((m) => m[1]))];
}

test("published practitioner inventory covers every intended individual profile", () => {
  assert.equal(PUBLISHED_PRACTITIONER_ROUTES.length, 15);
  const slugs = new Set(PUBLISHED_PRACTITIONER_ROUTES.map((r) => r.slug));
  assert.equal(slugs.size, 15);
  for (const route of PUBLISHED_PRACTITIONER_ROUTES) {
    assert.match(route.profilePath, /^doctors\/.+\.html$/);
    assert.ok(route.displayName.length > 3);
    assert.ok(route.directorySurfaces.length >= 1);
  }
});

test("no published Next-native profile may redirect to the GP directory", () => {
  for (const pathname of publishedProfilePathnames()) {
    const target = resolveWordpressLegacyRedirect(pathname);
    assert.equal(
      target,
      null,
      `${pathname} must not be in WORDPRESS_LEGACY_REDIRECTS (got ${target})`,
    );
  }

  for (const [from, to] of Object.entries(WORDPRESS_LEGACY_REDIRECTS)) {
    if (!/^\/doctors\//i.test(from)) continue;
    if (
      UNPUBLISHED_PRACTITIONER_DIRECTORY_REDIRECTS.includes(
        from as (typeof UNPUBLISHED_PRACTITIONER_DIRECTORY_REDIRECTS)[number],
      )
    ) {
      continue;
    }
    assert.notEqual(
      to,
      GP_DIRECTORY_PATH,
      `path ${from} incorrectly redirects published-looking profile to directory`,
    );
  }
});

test("canonical published paths never 404 via accidental directory swallow", () => {
  // Regression for a8309db: Golnar / James / Yamesha were 301'd to directory.
  const critical = [
    "/doctors/dr-golnar-mortezaei.html",
    "/doctors/dr-james.html",
    "/doctors/dr-yamesha-ranatunga.html",
    "/doctors/dr-mary-abadir.html",
    "/doctors/dr-tanya-goodwill.html",
  ];
  for (const pathname of critical) {
    assert.equal(resolveWordpressLegacyRedirect(pathname), null, pathname);
    assert.ok(findPublishedRouteByPath(pathname), pathname);
  }
});

test("WordPress legacy doctor equity maps into published profiles, not the directory", () => {
  const legacyToProfile: Record<string, string> = {
    "/doctor/dr-golnar-mortezaei-gp-fracgp": "/doctors/dr-golnar-mortezaei.html",
    "/doctor/dr-james-general-practitioner": "/doctors/dr-james.html",
    "/doctor/dr-tanya-goodwill": "/doctors/dr-tanya-goodwill.html",
    "/doctor/dr-mary-abadir": "/doctors/dr-mary-abadir.html",
  };
  for (const [from, to] of Object.entries(legacyToProfile)) {
    assert.equal(resolveWordpressLegacyRedirect(from), to);
    assert.ok(findPublishedRouteByPath(to));
  }
});

test("unpublished Gemunu is the only /doctors|/doctor path allowed to redirect to directory", () => {
  for (const pathname of UNPUBLISHED_PRACTITIONER_DIRECTORY_REDIRECTS) {
    assert.equal(resolveWordpressLegacyRedirect(pathname), GP_DIRECTORY_PATH);
  }

  const doctorDirectoryRedirects = Object.entries(WORDPRESS_LEGACY_REDIRECTS).filter(
    ([from, to]) => to === GP_DIRECTORY_PATH && /\/doctors?\//i.test(from),
  );
  assert.deepEqual(
    doctorDirectoryRedirects.map(([from]) => from).sort(),
    [...UNPUBLISHED_PRACTITIONER_DIRECTORY_REDIRECTS].sort(),
  );
});

test("golden GP directory cards point at inventory profiles (never the directory)", () => {
  const html = readPublicHtml("team-general-practitioners.html");
  const hrefs = extractDoctorProfileHrefs(html);
  assert.ok(hrefs.length >= 9, `expected golden GP cards, got ${hrefs.length}`);

  for (const href of hrefs) {
    const route = findPublishedRouteByPath(href);
    assert.ok(route, `golden GP directory links to unknown profile ${href}`);
    assert.notEqual(href, "team-general-practitioners.html");
  }

  // CMS-injected trio are not in golden HTML; inventory still requires them as GPs.
  for (const profilePath of CMS_INJECTED_GP_PROFILE_PATHS) {
    assert.ok(findPublishedRouteByPath(profilePath));
    assert.equal(
      findPublishedRouteByPath(profilePath)?.directorySurfaces.includes(
        "team-general-practitioners",
      ),
      true,
    );
    assert.equal(resolveWordpressLegacyRedirect(`/${profilePath}`), null);
  }
});

test("team hub + allied health directory cards use valid inventory destinations", () => {
  const teamHtml = readPublicHtml("team.html");
  const teamHrefs = extractDoctorProfileHrefs(teamHtml);
  assert.ok(teamHrefs.length >= 5);
  for (const href of teamHrefs) {
    assert.ok(findPublishedRouteByPath(href), `team.html unknown profile link ${href}`);
  }

  const alliedHtml = readPublicHtml("team-allied-health.html");
  for (const route of PUBLISHED_PRACTITIONER_ROUTES.filter((r) =>
    r.directorySurfaces.includes("team-allied-health"),
  )) {
    assert.match(
      alliedHtml,
      new RegExp(route.profilePath.replace(/\./g, "\\.")),
      `allied directory missing link for ${route.displayName}`,
    );
  }
});

test("owner-approved booking matrix remains intact for named practitioners", () => {
  const bySlug = Object.fromEntries(PRACTITIONER_BOOKING_MATRIX.map((row) => [row.slug, row]));
  assert.equal(bySlug["dr-golnar-mortezaei"].mode, "ONLINE_HOTDOC");
  assert.equal(bySlug["dr-golnar-mortezaei"].approvedHotdocUrl, GOLNAR_APPROVED_HOTDOC_URL);
  assert.equal(bySlug["dr-mary-abadir"].mode, "PHONE_ONLY");
  assert.equal(bySlug["dr-tanya-goodwill"].mode, "ONLINE_HOTDOC");
  assert.equal(bySlug["dr-james"].mode, "ONLINE_HOTDOC");
  assert.equal(bySlug["dr-yamesha-ranatunga"].mode, "ONLINE_HOTDOC");

  assert.equal(resolvePractitionerBookingHref("dr-golnar-mortezaei", null), GOLNAR_APPROVED_HOTDOC_URL);
  assert.match(GOLNAR_APPROVED_HOTDOC_URL, /dr-golnar-mortezaei-5\?wp=w_lightbox/);

  for (const row of PRACTITIONER_BOOKING_MATRIX) {
    assert.ok(findPublishedRouteByPath(row.profilePath), row.slug);
  }
});

test("inventory expected headings are unique per profile path", () => {
  const headings = PUBLISHED_PRACTITIONER_ROUTES.map((r) => r.expectedHeading);
  assert.equal(new Set(headings).size, headings.length);
});
