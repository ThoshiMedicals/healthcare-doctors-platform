import { prisma } from "@/db/prisma";
import { practitionerFromPayload } from "@/cms/overlay";
import {
  ACCEPTING_NEW_PATIENTS_LABEL,
  AVAILABILITY_LABELS,
  CARE_FILTER_OPTIONS,
  careFilterTokens,
  isNewToPracticeActive,
  NEW_TO_WMC_LABEL,
  parseGrowthFields,
  resolvePractitionerServices,
  type PractitionerGrowthFields,
} from "@/cms/practitioner-growth";
export type PractitionerGrowthCard = {
  slug: string;
  name: string;
  pagePath: string;
  areasOfCare: string[];
  growth: PractitionerGrowthFields;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function listPublishedPractitionerGrowth(clinicId: string): Promise<PractitionerGrowthCard[]> {
  const rows = await prisma.practitioner.findMany({
    where: {
      clinicId,
      status: "published",
      page: { is: { status: "published", path: { startsWith: "doctors/" } } },
    },
    include: { page: { select: { path: true } } },
    orderBy: { name: "asc" },
  });

  return rows.map((row) => {
    const payload = practitionerFromPayload(row.publishedPayload);
    const live = row.publishedPayload && typeof row.publishedPayload === "object" && !Array.isArray(row.publishedPayload)
      ? (row.publishedPayload as Record<string, unknown>)
      : null;
    const growth = parseGrowthFields({
      acceptingNewPatients: live && "acceptingNewPatients" in live ? live.acceptingNewPatients : row.acceptingNewPatients,
      newToPracticeAt: live && "newToPracticeAt" in live ? live.newToPracticeAt : row.newToPracticeAt,
      availabilityStatus: live && "availabilityStatus" in live ? live.availabilityStatus : row.availabilityStatus,
      relatedServices:
        live && Array.isArray(live.relatedServices) && live.relatedServices.length
          ? live.relatedServices
          : row.relatedServices,
    });
    return {
      slug: row.slug,
      name: payload?.name || row.name,
      pagePath: row.page?.path || `doctors/${row.slug}.html`,
      areasOfCare: payload?.areasOfCare?.length ? payload.areasOfCare : row.areasOfCare,
      growth,
    };
  });
}

function badgeHtml(growth: PractitionerGrowthFields): string {
  const parts: string[] = [];
  if (isNewToPracticeActive(growth.newToPracticeAt)) {
    parts.push(
      `<span class="wmc-practitioner-badge wmc-practitioner-badge--new">${escapeHtml(NEW_TO_WMC_LABEL)}</span>`,
    );
  }
  if (growth.acceptingNewPatients && growth.availabilityStatus !== "not_accepting") {
    parts.push(
      `<span class="wmc-practitioner-badge wmc-practitioner-badge--accepting">${escapeHtml(ACCEPTING_NEW_PATIENTS_LABEL)}</span>`,
    );
  }
  const availability = AVAILABILITY_LABELS[growth.availabilityStatus];
  if (growth.availabilityStatus !== "available_this_week" || !growth.acceptingNewPatients) {
    parts.push(
      `<span class="wmc-practitioner-badge wmc-practitioner-badge--availability" data-availability="${escapeHtml(growth.availabilityStatus)}">${escapeHtml(availability)}</span>`,
    );
  }
  if (!parts.length) return "";
  return `<div class="wmc-practitioner-badges" data-cms-growth-badges="true">${parts.join("")}</div>`;
}

function filterToolbarHtml(): string {
  const buttons = CARE_FILTER_OPTIONS.map(
    (opt) =>
      `<button type="button" class="wmc-gp-filter" data-gp-filter="${escapeHtml(opt.id)}" aria-pressed="false">${escapeHtml(opt.label)}</button>`,
  ).join("");
  return `<div class="wmc-gp-filters" data-gp-care-filters="true" role="group" aria-label="Filter general practitioners by area of care"><p class="wmc-gp-filters-label">Filter by care focus</p><div class="wmc-gp-filters-row"><button type="button" class="wmc-gp-filter is-active" data-gp-filter="all" aria-pressed="true">All GPs</button>${buttons}</div><p class="wmc-gp-filters-status" data-gp-filter-status hidden></p></div>`;
}

function byPath(cards: readonly PractitionerGrowthCard[]): Map<string, PractitionerGrowthCard> {
  const map = new Map<string, PractitionerGrowthCard>();
  for (const card of cards) {
    map.set(card.pagePath.replace(/^\//, ""), card);
    map.set(card.slug, card);
  }
  return map;
}

function enrichDiscoveryCard(cardHtml: string, card: PractitionerGrowthCard): string {
  if (cardHtml.includes('data-cms-growth-badges="true"')) return cardHtml;
  const tokens = careFilterTokens(card.areasOfCare).join(" ");
  let next = cardHtml.replace(
    /^(<li\b[^>]*\bgp-discovery-card\b[^>]*)(>)/i,
    (_full, open: string, close: string) => {
      const withAttrs = open.includes("data-care-tags=")
        ? open
        : `${open} data-care-tags="${escapeHtml(tokens)}" data-accepting="${card.growth.acceptingNewPatients ? "true" : "false"}" data-availability="${escapeHtml(card.growth.availabilityStatus)}"`;
      return `${withAttrs}${close}`;
    },
  );
  const badges = badgeHtml(card.growth);
  if (badges) {
    next = next.replace(
      /(<h3 class="gp-discovery-name">[\s\S]*?<\/h3>)/i,
      `$1${badges}`,
    );
  }
  return next;
}

function enrichDirectoryCard(cardHtml: string, card: PractitionerGrowthCard): string {
  if (cardHtml.includes('data-cms-growth-badges="true"')) return cardHtml;
  const tokens = careFilterTokens(card.areasOfCare).join(" ");
  let next = cardHtml.replace(
    /^(<article\b[^>]*\bpractitioner-directory-card\b[^>]*)(>)/i,
    (_full, open: string, close: string) => {
      const withAttrs = open.includes("data-care-tags=")
        ? open
        : `${open} data-care-tags="${escapeHtml(tokens)}" data-accepting="${card.growth.acceptingNewPatients ? "true" : "false"}" data-availability="${escapeHtml(card.growth.availabilityStatus)}"`;
      return `${withAttrs}${close}`;
    },
  );
  const badges = badgeHtml(card.growth);
  if (badges) {
    next = next.replace(/(<h3>[\s\S]*?<\/h3>)/i, `$1${badges}`);
  }
  return next;
}

function injectProfileGrowth(html: string, card: PractitionerGrowthCard): string {
  let next = html;
  const badges = badgeHtml(card.growth);
  if (badges && !next.includes('data-cms-growth-badges="true"')) {
    next = next.replace(
      /(<p class="doctor-role">[\s\S]*?<\/p>)/i,
      `$1${badges}`,
    );
  }

  const services = resolvePractitionerServices(card.growth.relatedServices, card.areasOfCare);
  if (services.length && /id="related-services"/i.test(next)) {
    // Ensure each mapped service appears as a resource-link (idempotent by href).
    const missing = services.filter((svc) => !next.includes(svc.path));
    if (missing.length) {
      const prefix = next.includes('href="../services/') ? "../" : "";
      const links = missing
        .map(
          (svc) =>
            `<a class="resource-link" data-cms-growth-service="true" href="${escapeHtml(prefix + svc.path)}"><span>${escapeHtml(svc.label)}</span><span aria-hidden="true">→</span></a>`,
        )
        .join("");
      next = next.replace(
        /(id="related-services"[\s\S]*?<div class="resource-links">)/i,
        `$1${links}`,
      );
    }
    // Rename heading to Services Provided when still "Related Services"
    next = next.replace(
      /(id="related-services"[\s\S]*?<h2>)Related Services(<\/h2>)/i,
      "$1Services Provided$2",
    );
  }

  // Availability note near booking CTA when not the default open state.
  if (
    !next.includes('data-cms-growth-availability="true"') &&
    (card.growth.availabilityStatus !== "available_this_week" || !card.growth.acceptingNewPatients)
  ) {
    const note = `<p class="wmc-practitioner-availability" data-cms-growth-availability="true">${escapeHtml(AVAILABILITY_LABELS[card.growth.availabilityStatus])}${card.growth.acceptingNewPatients ? "" : ` · Not ${ACCEPTING_NEW_PATIENTS_LABEL.toLowerCase()}`}</p>`;
    next = next.replace(
      /(<a[^>]*class="[^"]*wmc-book-appointment[^"]*"[^>]*>[\s\S]*?<\/a>)/i,
      `${note}$1`,
    );
  }
  return next;
}

/**
 * Public growth inject: badges, care filters, services provided, availability.
 * Does not redesign golden layout — additive markers only.
 */
export async function injectPractitionerGrowth(
  clinicId: string,
  pagePath: string,
  html: string,
): Promise<string> {
  // Growth badges / filters only apply to team directories and doctor profiles.
  // Skip the practitioner list query on every other public path.
  if (
    pagePath !== "team.html" &&
    pagePath !== "team-general-practitioners.html" &&
    !pagePath.startsWith("doctors/")
  ) {
    return html;
  }

  const cards = await listPublishedPractitionerGrowth(clinicId);
  if (!cards.length) return html;
  const index = byPath(cards);
  let next = html;

  if (pagePath === "team-general-practitioners.html" || pagePath === "team.html") {
    if (!next.includes('data-gp-care-filters="true"')) {
      if (pagePath === "team-general-practitioners.html") {
        next = next.replace(
          /(<ul\b[^>]*\bgp-discovery-list\b)/i,
          `${filterToolbarHtml()}$1`,
        );
      } else {
        next = next.replace(
          /(id="general-practitioners"[\s\S]*?<div class="team-directory-grid")/i,
          (full) => full.replace(/<div class="team-directory-grid"/i, `${filterToolbarHtml()}<div class="team-directory-grid"`),
        );
      }
    }

    // Opening-tag enrichment only — nested <li> inside care-area lists must not truncate cards.
    next = next.replace(/<li\b([^>]*\bgp-discovery-card\b[^>]*)>/gi, (full, attrs, offset) => {
      const window = next.slice(offset, offset + 2800);
      const href = (window.match(/href="([^"]*doctors\/[^"]+)"/i) || [])[1] || "";
      const path = href.replace(/^\.\.\//, "").replace(/^\//, "");
      const card = index.get(path) || index.get(path.replace(/^doctors\//, "").replace(/\.html$/, ""));
      if (!card || /data-care-tags=/.test(attrs)) return full;
      const tokens = careFilterTokens(card.areasOfCare).join(" ");
      return `<li ${attrs} data-care-tags="${escapeHtml(tokens)}" data-accepting="${card.growth.acceptingNewPatients ? "true" : "false"}" data-availability="${escapeHtml(card.growth.availabilityStatus)}">`;
    });
    next = next.replace(
      /(<li\b[^>]*\bgp-discovery-card\b[^>]*>)([\s\S]*?)(<h3 class="gp-discovery-name">[\s\S]*?<\/h3>)/gi,
      (full, open: string, mid: string, heading: string) => {
        if (/data-cms-growth-badges="true"/.test(full)) return full;
        const href = ((open + mid + heading).match(/href="([^"]*doctors\/[^"]+)"/i) || [])[1] || "";
        const path = href.replace(/^\.\.\//, "").replace(/^\//, "");
        const card = index.get(path) || index.get(path.replace(/^doctors\//, "").replace(/\.html$/, ""));
        if (!card) return full;
        // Prefer slug/data attribute when href sits after the heading (CMS cards put photo first).
        return `${open}${mid}${heading}${badgeHtml(card.growth)}`;
      },
    );
    // CMS cards: href is after the heading — resolve via data-cms-practitioner when present.
    next = next.replace(
      /(<li\b[^>]*\bdata-cms-practitioner="([^"]+)"[^>]*>)([\s\S]*?)(<h3 class="gp-discovery-name">[\s\S]*?<\/h3>)(?![\s\S]*?data-cms-growth-badges)/gi,
      (full, open: string, slug: string, mid: string, heading: string) => {
        if (/data-cms-growth-badges="true"/.test(full)) return full;
        const card = index.get(slug) || index.get(`doctors/${slug}.html`);
        if (!card) return full;
        return `${open}${mid}${heading}${badgeHtml(card.growth)}`;
      },
    );

    next = next.replace(/<article\b([^>]*\bpractitioner-directory-card\b[^>]*)>/gi, (full, attrs, offset) => {
      const window = next.slice(offset, offset + 2800);
      const href = (window.match(/href="([^"]*doctors\/[^"]+)"/i) || [])[1] || "";
      const path = href.replace(/^\.\.\//, "").replace(/^\//, "");
      const card = index.get(path) || index.get(path.replace(/^doctors\//, "").replace(/\.html$/, ""));
      if (!card || /data-care-tags=/.test(attrs)) return full;
      const tokens = careFilterTokens(card.areasOfCare).join(" ");
      return `<article ${attrs} data-care-tags="${escapeHtml(tokens)}" data-accepting="${card.growth.acceptingNewPatients ? "true" : "false"}" data-availability="${escapeHtml(card.growth.availabilityStatus)}">`;
    });
    next = next.replace(/<article\b[^>]*\bpractitioner-directory-card\b[\s\S]*?<\/article>/gi, (block) => {
      const href = (block.match(/href="([^"]*doctors\/[^"]+)"/i) || [])[1] || "";
      const path = href.replace(/^\.\.\//, "").replace(/^\//, "");
      const card = index.get(path) || index.get(path.replace(/^doctors\//, "").replace(/\.html$/, ""));
      if (!card || block.includes('data-cms-growth-badges="true"')) return block;
      return enrichDirectoryCard(block, card);
    });
  }

  if (pagePath.startsWith("doctors/")) {
    const card = index.get(pagePath);
    if (card) next = injectProfileGrowth(next, card);
  }

  return next;
}

/** Lightweight CSS for badges + filters (public-ux companion; no layout redesign). */
export const PRACTITIONER_GROWTH_STYLE = `<style id="wmc-practitioner-growth">
.wmc-practitioner-badges{display:flex;flex-wrap:wrap;gap:.4rem;margin:.55rem 0 .35rem}
.wmc-practitioner-badge{display:inline-block;font-size:.72rem;font-weight:600;letter-spacing:.01em;line-height:1.2;padding:.28rem .55rem;border:1px solid #c5d4ce;border-radius:2px;background:#f4f8f6;color:#1f3d34}
.wmc-practitioner-badge--new{border-color:#b7c9e8;background:#eef3fb;color:#1e3a5f}
.wmc-practitioner-badge--accepting{border-color:#b7d4c4;background:#eef8f2;color:#1b4d38}
.wmc-practitioner-badge--availability{border-color:#d6c7a8;background:#fbf6ea;color:#5c4a22}
.wmc-practitioner-availability{margin:.75rem 0 .35rem;font-size:.92rem;color:#3d4f47}
.wmc-gp-filters{margin:0 0 1.1rem;padding:0}
.wmc-gp-filters-label{margin:0 0 .45rem;font-size:.85rem;font-weight:600;color:#31443c}
.wmc-gp-filters-row{display:flex;flex-wrap:wrap;gap:.4rem}
.wmc-gp-filter{appearance:none;border:1px solid #c5d4ce;background:#fff;color:#1f3d34;font:inherit;font-size:.8rem;padding:.35rem .65rem;border-radius:2px;cursor:pointer}
.wmc-gp-filter.is-active,.wmc-gp-filter[aria-pressed="true"]{background:#1f3d34;border-color:#1f3d34;color:#fff}
.wmc-gp-filters-status{margin:.55rem 0 0;font-size:.82rem;color:#4a5c54}
.gp-discovery-card.is-gp-filter-hidden,.practitioner-directory-card.is-gp-filter-hidden{display:none!important}
</style>`;

export function withPractitionerGrowthStyle(html: string): string {
  if (html.includes('id="wmc-practitioner-growth"')) return html;
  if (!/wmc-practitioner-badge|wmc-gp-filters|data-gp-care-filters/.test(html)) return html;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${PRACTITIONER_GROWTH_STYLE}</head>`);
  return `${PRACTITIONER_GROWTH_STYLE}${html}`;
}
