/**
 * Public-facing HTML presentation only.
 * Leave frozen golden pages, canonical URLs, classification and schema intact.
 */
export function applyPublicUxRefinements(html: string, pagePath: string): string {
  let next = html;

  // Add Join Our Team in every public primary navigation using the Updates
  // link's existing relative prefix (works for nested services/knowledge pages).
  next = next.replace(/<nav\b[^>]*\bid="primary-nav"[^>]*>[\s\S]*?<\/nav>/i, nav => {
    if (nav.includes('data-nav-key="join-team"')) return nav;

    const updates = nav.match(/<a\b[^>]*\bdata-nav-key="updates"[^>]*>Updates<\/a>/i);
    const updatesHref = updates?.[0].match(/\bhref="([^"]*updates\/index\.html)"/i)?.[1];
    if (!updates || !updatesHref) return nav;

    const joinHref = updatesHref.replace(/updates\/index\.html$/i, "join-our-team.html");
    const onJoinPage = pagePath === "join-our-team.html";
    let updatedNav = nav.replace(
      updates[0],
      `${updates[0]}<a href="${joinHref}" data-nav-key="join-team"${onJoinPage ? ' aria-current="page"' : ""}>Join Our Team</a>`,
    );

    if (onJoinPage) {
      // Preserve aria-current="page" through the existing site.js nav enhancer.
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
