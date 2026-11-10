import { prisma } from "@/db/prisma";
import { portraitBasename } from "@/cms/practitioner-media";
import { practitionerFromPayload } from "@/cms/overlay";
import { growthFromPayload, growthSearchKeywords } from "@/cms/practitioner-growth";
import { Prisma } from "@prisma/client";

export type CmsPractitionerCard = {
  slug: string;
  name: string;
  role: string;
  qualifications: string[];
  areasOfCare: string[];
  portraitFile: string | null;
  bookingUrl: string | null;
  pagePath: string;
  growthKeywords?: string[];
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Published practitioners whose doctor pages are not part of the golden HTML set. */
export async function listImportedPublishedPractitioners(
  clinicId: string,
): Promise<CmsPractitionerCard[]> {
  const rows = await prisma.practitioner.findMany({
    where: {
      clinicId,
      status: "published",
      publishedPayload: { not: Prisma.DbNull },
      page: { is: { status: "published", path: { startsWith: "doctors/" } } },
    },
    include: {
      page: {
        select: {
          path: true,
          publishedRevision: { select: { body: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return rows
    .filter((row) => {
      const body = row.page?.publishedRevision?.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) return false;
      return (body as { source?: string }).source === "practitioner_import";
    })
    .map((row) => {
      const payload = practitionerFromPayload(row.publishedPayload);
      const portraitFile =
        payload?.portraitFile ||
        portraitBasename(row.portraitPath) ||
        null;
      const growth = growthFromPayload(row.publishedPayload);
      return {
        slug: row.slug,
        name: payload?.name || row.name,
        role: row.role || "General Practitioner",
        qualifications: payload?.qualifications?.length
          ? payload.qualifications
          : row.qualifications,
        areasOfCare: payload?.areasOfCare?.length ? payload.areasOfCare : row.areasOfCare,
        portraitFile,
        bookingUrl: payload?.bookingUrl || row.bookingUrl,
        pagePath: row.page?.path || `doctors/${row.slug}.html`,
        growthKeywords: growthSearchKeywords(growth),
      } satisfies CmsPractitionerCard;
    });
}

const VISIBLE_CARE_AREA_COUNT = 3;

/** Keep all clinical interests; collapse extras behind an accessible disclosure. */
export function renderCareAreaListItems(areasOfCare: readonly string[]): string {
  const areas = areasOfCare.length ? [...areasOfCare] : ["General practice"];
  const visible = areas.slice(0, VISIBLE_CARE_AREA_COUNT);
  const rest = areas.slice(VISIBLE_CARE_AREA_COUNT);
  const visibleHtml = visible.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  if (!rest.length) return visibleHtml;
  const restHtml = rest.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const moreLabel = rest.length === 1 ? "1 more clinical interest" : `${rest.length} more clinical interests`;
  return `${visibleHtml}<li class="gp-discovery-areas-more"><details class="gp-discovery-areas-disclosure"><summary>${escapeHtml(moreLabel)}</summary><ul class="gp-discovery-areas-extra">${restHtml}</ul></details></li>`;
}

function discoveryCard(card: CmsPractitionerCard): string {
  const profileHref = card.pagePath;
  const areas = renderCareAreaListItems(card.areasOfCare);
  const quals = card.qualifications.join(", ") || "—";
  const bookHref = card.bookingUrl || "tel:+61732173344";
  const bookIsPhone = bookHref.startsWith("tel:");
  const bookAttrs = bookIsPhone
    ? `href="${escapeHtml(bookHref)}" aria-label="Call reception to book with ${escapeHtml(card.name)}"`
    : `data-hotdoc-button="" data-hotdoc-widget="lightbox" href="${escapeHtml(bookHref)}" aria-label="Book Appointment" rel="noopener"`;
  const bookLabel = bookIsPhone ? "Call Reception to Book" : "Book Appointment";
  const photo = card.portraitFile
    ? `<div class="team-authority-photo"><img alt="${escapeHtml(card.name)}" data-local-team-src="assets/team/${escapeHtml(card.portraitFile)}" data-practitioner-image="true" decoding="async" height="1000" loading="lazy" sizes="(min-width: 1211px) 116px, (min-width: 1025px) 90px, (min-width: 701px) 116px, (min-width: 366px) 96px, 80px" src="assets/team/${escapeHtml(card.portraitFile)}" srcset="assets/team/${escapeHtml(card.portraitFile.replace(/\.webp$/i, "-640.webp"))} 640w, assets/team/${escapeHtml(card.portraitFile)} 1122w" width="800"/></div>`
    : `<div role="img" aria-label="Portrait for ${escapeHtml(card.name)} is not currently published" class="team-authority-photo team-authority-photo-unavailable"><span>Photo to be published</span></div>`;

  return `<li class="team-authority-person gp-discovery-card" data-cms-practitioner="${escapeHtml(card.slug)}">${photo}<div class="gp-discovery-info"><h3 class="gp-discovery-name">${escapeHtml(card.name)}</h3><p class="gp-discovery-care-label">Helping patients with:</p><ul class="gp-discovery-areas">${areas}</ul><p class="gp-discovery-qualifications"><span>Qualifications</span>${escapeHtml(quals)}</p></div><div class="gp-discovery-actions"><a class="gp-discovery-profile" href="${escapeHtml(profileHref)}" aria-label="View profile for ${escapeHtml(card.name)}">View Profile</a><a class="button wmc-book-appointment gp-discovery-book" ${bookAttrs}>${bookLabel}</a></div></li>`;
}

function directoryCard(card: CmsPractitionerCard): string {
  const profileHref = card.pagePath;
  const quals = card.qualifications.join(", ") || "—";
  const focus = (card.areasOfCare.length ? card.areasOfCare : ["General practice"])
    .slice(0, 3)
    .join(" · ");
  const photo = card.portraitFile
    ? `<a aria-label="View ${escapeHtml(card.name)} profile" class="portrait" data-photo-fallback="${escapeHtml(card.name)} photo temporarily unavailable" href="${escapeHtml(profileHref)}"><img alt="${escapeHtml(card.name)}" data-local-team-src="assets/team/${escapeHtml(card.portraitFile)}" data-practitioner-image="true" decoding="async" height="1000" loading="lazy" src="assets/team/${escapeHtml(card.portraitFile)}" width="800" srcset="assets/team/${escapeHtml(card.portraitFile.replace(/\.webp$/i, "-640.webp"))} 640w, assets/team/${escapeHtml(card.portraitFile)} 1122w" sizes="(min-width: 1200px) 288px, (min-width: 701px) min(312px, 33vw), calc(50vw - 16px)"/></a>`
    : `<a aria-label="View ${escapeHtml(card.name)} profile" class="portrait team-authority-photo-unavailable" href="${escapeHtml(profileHref)}"><span>Photo to be published</span></a>`;

  return `<article class="practitioner practitioner-directory-card practitioner-${escapeHtml(card.slug)}" data-cms-practitioner="${escapeHtml(card.slug)}">${photo}<div class="practitioner-meta"><h3><a href="${escapeHtml(profileHref)}">${escapeHtml(card.name)}</a></h3><p class="credentials">${escapeHtml(quals)}</p><p class="focus">${escapeHtml(focus)}</p><p class="role">${escapeHtml(card.role)}</p><a class="text-link" href="${escapeHtml(profileHref)}">View profile</a></div></article>`;
}

/**
 * Injects CMS-imported practitioners into team directory surfaces without editing golden HTML.
 * Idempotent via data-cms-practitioner markers.
 */
export async function injectCmsPractitionersIntoTeamHtml(
  clinicId: string,
  pagePath: string,
  html: string,
): Promise<string> {
  if (pagePath !== "team-general-practitioners.html" && pagePath !== "team.html") {
    return html;
  }

  const imported = await listImportedPublishedPractitioners(clinicId);
  if (!imported.length) return html;

  let next = html;
  // Drop previous inject markers so republish refreshes card content.
  next = next.replace(/<li\b[^>]*\bdata-cms-practitioner="[^"]+"[\s\S]*?<\/li>/gi, "");
  next = next.replace(/<article\b[^>]*\bdata-cms-practitioner="[^"]+"[\s\S]*?<\/article>/gi, "");

  const missing = imported.filter((card) => !next.includes(card.pagePath));
  if (!missing.length) return next;

  if (pagePath === "team-general-practitioners.html") {
    const cards = missing.map(discoveryCard).join("");
    // Require </ul></section> so nested gp-discovery-areas lists are not matched.
    if (!/<ul\b[^>]*\bgp-discovery-list\b/i.test(next)) return next;
    return next.replace(
      /(<ul\b[^>]*\bgp-discovery-list\b[^>]*>)([\s\S]*?)(<\/ul>\s*<\/section>)/i,
      (_full, open: string, inner: string, close: string) => `${open}${inner}${cards}${close}`,
    );
  }

  // team.html — append into the GP directory grid when present.
  // Require </div></section> so the first nested </div> inside a card (e.g. .practitioner-meta)
  // is not treated as the end of .team-directory-grid.
  const cards = missing.map(directoryCard).join("");
  if (/id="general-practitioners"[\s\S]*?class="team-directory-grid"/i.test(next)) {
    next = next.replace(
      /(id="general-practitioners"[\s\S]*?<div class="team-directory-grid">)([\s\S]*?)(<\/div>\s*<\/section>)/i,
      (_full, open: string, inner: string, close: string) => `${open}${inner}${cards}${close}`,
    );
  }
  return next;
}

export function buildReceptionIndexEntries(
  cards: readonly CmsPractitionerCard[],
): Array<Record<string, unknown>> {
  return cards.map((card) => {
    const quals = card.qualifications.join(", ");
    const areas = card.areasOfCare.join(", ");
    const langs = ""; // languages live on payload; kept empty here when not passed
    const growthKeys = card.growthKeywords || [];
    return {
      title: card.name,
      h1: card.name,
      category: "Doctor",
      description: `Meet ${card.name} at Woolloongabba Medical Centre. Explore areas of care, practitioner background and booking options.`,
      headings: [
        `How ${card.name} helps patients`,
        `About ${card.name}`,
        "Qualifications",
        "Languages",
        "Professional Interests",
        "Related Services",
        "Frequently Asked Questions",
        "Practical information before you book.",
      ],
      keywords: [
        "doctor",
        "dr",
        "gp",
        "practitioner",
        "clinician",
        "healthcare professional",
        "book with doctor",
        `doctors ${card.name.toLowerCase()}`,
        `book with ${card.name}`,
        card.name.toLowerCase(),
        card.slug.replace(/^dr-/, "").replace(/-/g, " "),
        ...growthKeys,
      ],
      related: [
        "services/family-health.html",
        "team-general-practitioners.html",
        "new-patients.html",
        "practice-information.html",
        "faqs.html",
      ],
      text: `Meet Our Team ${card.name} ${card.role} Helping patients with ${areas} Qualifications ${quals} Languages ${langs} ${growthKeys.join(" ")}`.trim(),
      url: card.pagePath,
    };
  });
}

/** Append CMS-imported doctor entries into the Digital Reception index JS payload. */
export function mergeImportedPractitionersIntoReceptionIndex(
  source: string,
  cards: readonly CmsPractitionerCard[],
): string {
  if (!cards.length) return source;
  const marker = "window.WMC_DIGITAL_RECEPTION_INDEX = ";
  const start = source.indexOf(marker);
  if (start < 0) return source;
  const jsonStart = start + marker.length;
  const jsonEnd = source.lastIndexOf(";");
  if (jsonEnd <= jsonStart) return source;

  let items: Array<Record<string, unknown>>;
  try {
    items = JSON.parse(source.slice(jsonStart, jsonEnd)) as Array<Record<string, unknown>>;
  } catch {
    return source;
  }

  const existingUrls = new Set(items.map((item) => String(item.url ?? "")));
  const additions = buildReceptionIndexEntries(cards).filter(
    (entry) => !existingUrls.has(String(entry.url)),
  );
  if (!additions.length) return source;
  return `${source.slice(0, jsonStart)}${JSON.stringify(items.concat(additions))}${source.slice(jsonEnd)}`;
}
