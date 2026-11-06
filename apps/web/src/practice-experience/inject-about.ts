import { PRACTICE_EXPERIENCE_PATH } from "./types";

const HUB_CARD = `<section class="about-hub-card" id="practice-experience" data-pe-hub-card="true"><h2>Practice Experience</h2><p>How consulting days, nursing, reception, team work, community, continuity and sessions feel in this practice.</p><div class="about-hub-links"><a href="about-us/practice-experience.html">Practice Experience Hub <span aria-hidden="true">→</span></a></div></section>`;

/**
 * Inject Practice Experience into About Us hub + about side-navs without editing golden master files.
 */
export function injectPracticeExperienceAboutLinks(html: string, pagePath: string): string {
  let next = html;

  if (pagePath === "about-us.html" && !next.includes('data-pe-hub-card="true"')) {
    // Place before Careers card when present; otherwise append inside about-hub-grid.
    if (next.includes('id="careers"')) {
      next = next.replace(
        /<section class="about-hub-card" id="careers">/i,
        `${HUB_CARD}<section class="about-hub-card" id="careers">`,
      );
    } else {
      next = next.replace(
        /(<div class="about-hub-grid">)([\s\S]*?)(<\/div><\/article>)/i,
        (_m, open: string, body: string, close: string) => `${open}${body}${HUB_CARD}${close}`,
      );
    }
  }

  // About family side navigation (root pages).
  if (
    !pagePath.includes("/") &&
    next.includes('class="page-nav"') &&
    next.includes("join-our-team.html") &&
    !next.includes(`href="${PRACTICE_EXPERIENCE_PATH}"`) &&
    !next.includes('href="about-us/practice-experience.html"')
  ) {
    next = next.replace(
      /(<a\b[^>]*href="join-our-team\.html"[^>]*>Join Our Team<\/a>)/i,
      `<a href="about-us/practice-experience.html">Practice Experience</a>$1`,
    );
  }

  return next;
}
