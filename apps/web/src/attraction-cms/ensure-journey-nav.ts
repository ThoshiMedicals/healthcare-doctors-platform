/**
 * Force a single, current JOIN_ATTRACTION_NAV side-rail on every recruitment surface.
 * DB-stored EV HTML can lag code (stale "Express Interest" labels / ordering).
 *
 * Critical layout contract: the rail MUST be the first child of `.page-layout`
 * (alongside `.article`). Inserting it into `.breadcrumb-bar` or before `<main>`
 * leaves `.page-layout` with a single child that collapses into the 280px grid
 * track — content renders ~280px wide with a broken full-bleed nav strip.
 */

import {
  JOIN_ATTRACTION_NAV,
  attractionPageKey,
} from "./ev-shell";

const RECRUIT_CHILD =
  /^(join-our-team\/)?(gp-opportunities|gp-faq|opportunity-pack|practice-support|registrar-pathway|provider-number-readiness|dpa-navigator|session-planner)\.html$/i;
const PE_CHILD =
  /^(about-us\/)?(practice-experience|community-catchment|continuity-in-practice|clinical-interests)\.html$/i;

function navPrefixFor(pagePath: string): string {
  if (pagePath === "join-our-team.html") return "";
  return pagePath.includes("/") ? "../" : "";
}

function insertJourneyNav(html: string, nav: string): string {
  // Primary: restore rail as first child of the content grid.
  if (/class="[^"]*\bpage-layout\b/i.test(html)) {
    const intoLayout = html.replace(
      /(<div\b[^>]*class="[^"]*\bpage-layout\b[^"]*"[^>]*>)/i,
      `$1${nav}`,
    );
    if (intoLayout !== html && /data-ev-journey-nav="true"/i.test(intoLayout)) {
      return intoLayout;
    }
  }

  // Fallbacks keep pages from losing the rail entirely if markup drifts.
  if (/breadcrumb-explore-link/i.test(html)) {
    const afterExplore = html.replace(/(<\/div>\s*<\/div>\s*)(<main\b)/i, `$1${nav}$2`);
    if (afterExplore.includes('data-ev-journey-nav="true"')) return afterExplore;
  }

  if (/class="[^"]*\bbreadcrumb-bar\b/i.test(html)) {
    const afterCrumb = html.replace(
      /(<div\b[^>]*class="[^"]*\bbreadcrumb-bar\b[^"]*"[^>]*>[\s\S]*?<\/div>\s*)/i,
      `$1${nav}`,
    );
    if (afterCrumb !== html) return afterCrumb;
  }

  if (/<main\b[^>]*>/i.test(html)) {
    return html.replace(/(<main\b[^>]*>)/i, `$1${nav}`);
  }

  return `${nav}${html}`;
}

/**
 * Replace any related-pages / journey aside with the canonical rail.
 * Join hub keeps a compact in-page journey map (no side-rail) to preserve prospectus layout.
 */
export function ensureUnifiedRecruitmentJourneyNav(html: string, pagePath: string): string {
  const normalized = pagePath.replace(/^\/+/, "").replace(/\\/g, "/");
  if (/express-interest\.html$/i.test(normalized)) return html;

  const isChild = RECRUIT_CHILD.test(normalized) || PE_CHILD.test(normalized);
  if (!isChild) return html;

  const active = attractionPageKey(normalized);
  const nav = JOIN_ATTRACTION_NAV(active, navPrefixFor(normalized));

  const withoutRails = html.replace(
    /<aside\b[^>]*(?:id="related-pages"|data-ev-journey-nav="true"|class="[^"]*\bpage-nav\b[^"]*")[^>]*>[\s\S]*?<\/aside>/gi,
    "",
  );

  return insertJourneyNav(withoutRails, nav);
}

/** HOLD hygiene: any remaining Express Interest labels that already point at the hub stack. */
export function rewriteStaleExpressInterestLabels(html: string): string {
  return html.replace(
    /(<a\b[^>]*href=["'][^"']*(?:#confidential-conversation|join-our-team\.html#confidential-conversation)[^"']*["'][^>]*>)\s*Express Interest\s*(<\/a>)/gi,
    "$1Confidential conversation$2",
  );
}
