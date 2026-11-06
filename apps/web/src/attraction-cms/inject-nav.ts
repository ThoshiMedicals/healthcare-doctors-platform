/**
 * Inject GP Attraction navigation into public HTML (About + Join Our Team)
 * without editing golden master files.
 */

const ABOUT_LINKS = [
  ["about-us/practice-experience.html", "Practice Experience"],
  ["about-us/community-catchment.html", "Community &amp; Catchment"],
  ["about-us/continuity-in-practice.html", "Continuity in Practice"],
  ["about-us/clinical-interests.html", "Clinical Interests"],
] as const;

function prefixFor(pagePath: string): string {
  if (pagePath.includes("/")) return "../";
  return "";
}

function rel(pagePath: string, target: string): string {
  const prefix = prefixFor(pagePath);
  if (pagePath.startsWith("about-us/") && target.startsWith("about-us/")) {
    return target.replace(/^about-us\//, "");
  }
  if (pagePath.startsWith("join-our-team/") && target.startsWith("join-our-team/")) {
    return target.replace(/^join-our-team\//, "");
  }
  if (pagePath === "join-our-team.html" && target.startsWith("join-our-team/")) {
    return target;
  }
  if (pagePath === "about-us.html" && target.startsWith("about-us/")) {
    return target;
  }
  return `${prefix}${target}`;
}

export function injectAttractionNavigation(html: string, pagePath: string): string {
  let next = html;
  if (!next.includes('class="page-nav"') && !next.includes("id=\"related-pages\"")) {
    return next;
  }

  // About family pages — ensure attraction about links exist before Join Our Team.
  const isAboutFamily =
    pagePath === "about-us.html" ||
    pagePath.startsWith("about-us/") ||
    [
      "philosophy-of-care.html",
      "story.html",
      "community.html",
      "local-healthcare-access.html",
      "agpal-accreditation.html",
      "medical-centre-network.html",
      "team.html",
    ].includes(pagePath);

  if (isAboutFamily) {
    for (const [path, label] of ABOUT_LINKS) {
      const href = rel(pagePath, path);
      if (next.includes(`href="${href}"`) || next.includes(`href="${path}"`)) continue;
      if (next.includes('href="join-our-team.html"')) {
        next = next.replace(
          /(<a\b[^>]*href="(?:\.\.\/)?join-our-team\.html"[^>]*>Join Our Team<\/a>)/i,
          `<a href="${href}">${label}</a>$1`,
        );
      }
    }
  }

  // Attraction EV pages already ship a single journey side-rail via
  // JOIN_ATTRACTION_NAV (data-ev-journey-nav). Do not prepend a second list.
  if (next.includes('data-ev-journey-nav="true"')) {
    return next;
  }

  return next;
}
