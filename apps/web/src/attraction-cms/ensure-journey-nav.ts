/**
 * Force a single, current JOIN_ATTRACTION_NAV side-rail on every recruitment surface.
 * DB-stored EV HTML can lag code (stale "Express Interest" labels / ordering).
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

  let next = html.replace(
    /<aside\b[^>]*(?:id="related-pages"|data-ev-journey-nav="true"|class="[^"]*\bpage-nav\b[^"]*")[^>]*>[\s\S]*?<\/aside>/gi,
    "",
  );

  // Prefer original aside slot: after breadcrumb explore link, else after breadcrumb bar, else start of main.
  if (/breadcrumb-explore-link/i.test(next)) {
    next = next.replace(
      /(<\/div>\s*<\/div>\s*)(<main\b)/i,
      `$1${nav}$2`,
    );
    if (next.includes('data-ev-journey-nav="true"')) return next;
  }

  if (/class="[^"]*\bbreadcrumb-bar\b/i.test(next)) {
    const replaced = next.replace(
      /(<div\b[^>]*class="[^"]*\bbreadcrumb-bar\b[^"]*"[^>]*>[\s\S]*?<\/div>\s*)/i,
      `$1${nav}`,
    );
    if (replaced !== next) return replaced;
  }

  if (/<main\b[^>]*>/i.test(next)) {
    return next.replace(/(<main\b[^>]*>)/i, `$1${nav}`);
  }

  return `${nav}${next}`;
}

/** HOLD hygiene: any remaining Express Interest labels that already point at the hub stack. */
export function rewriteStaleExpressInterestLabels(html: string): string {
  return html.replace(
    /(<a\b[^>]*href=["'][^"']*(?:#confidential-conversation|join-our-team\.html#confidential-conversation)[^"']*["'][^>]*>)\s*Express Interest\s*(<\/a>)/gi,
    "$1Confidential conversation$2",
  );
}
