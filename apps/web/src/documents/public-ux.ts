/**
 * Public-facing HTML presentation only.
 * Leave frozen golden pages, canonical URLs, classification and schema intact.
 */
export function applyPublicUxRefinements(html: string, pagePath: string): string {
  let next = html;
  // A new URL bypasses stale browser/Cloudflare CSS after visual-polish deployment.
  next = next.replace(/styles\.css(?=")/g, "styles.css?v=wmc-polish-20261029b");

  // Add Join Our Team in every public primary navigation using the Updates
  // link's existing relative prefix (works for nested services/knowledge pages).
  next = next.replace(/<nav\b[^>]*\bid="primary-nav"[^>]*>[\s\S]*?<\/nav>/i, nav => {
    if (nav.includes('data-nav-key="join-team"')) return nav;

    // Use Contact as the stable anchor even if the Updates link markup changes.
    const contact = nav.match(/<a\b(?=[^>]*\bdata-nav-key="contact")[^>]*>[\s\S]*?<\/a>/i)?.[0];
    const contactHref = contact?.match(/\bhref="([^"]*contact\.html)"/i)?.[1];
    if (!contact || !contactHref) return nav;
    const joinHref = contactHref.replace(/contact\.html$/i, "join-our-team.html");
    const onJoinPage = pagePath === "join-our-team.html";
    let updatedNav = nav.replace(
      contact,
      `<a href="${joinHref}" data-nav-key="join-team"${onJoinPage ? ' aria-current="page"' : ""}>Join Our Team</a>${contact}`,
    );

    if (onJoinPage) {
      // Preserve page-level active state in the existing site.js nav enhancer.
      updatedNav = updatedNav.replace('data-nav-is-hub="false"', 'data-nav-is-hub="true"');
      // Only the primary-nav active section changes; the page's internal
      // About Us taxonomy and breadcrumbs remain untouched.
      updatedNav = updatedNav.replace('data-nav-owner="about"', 'data-nav-owner="join-team"');
      updatedNav = updatedNav.replace(
        /(<a\b[^>]*data-nav-key="about"[^>]*?)\saria-current="location"/,
        "$1",
      );
    }
    return updatedNav;
  });

  if (pagePath !== "index.html") return next;

  // Position the new route alongside the existing View all hours action.
  // The links share one responsive footer row within the approved hours block.
  const hoursLink =
    '<a class="hero-hours-link" href="contact.html">View all hours <span aria-hidden="true">→</span></a>';
  if (!next.includes('class="hero-hours-actions"') && next.includes(hoursLink)) {
    next = next.replace(hoursLink,
      '<div class="hero-hours-actions">' +
      hoursLink +
      '<a class="hero-hours-link hero-hours-after-care-link" href="after-hours-care.html">After Hours Care <span aria-hidden="true">→</span></a>' +
      '</div>',
    );
  }

  return next;
}
