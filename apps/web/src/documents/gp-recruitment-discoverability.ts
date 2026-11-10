/**
 * Light discoverability bridges from patient entry pages into the GP joining journey.
 * No redesign — compact band before footer.
 */

const DISCOVER_STYLE = `<style id="wmc-gp-recruit-discover">
.gp-recruit-discover{margin:0;padding:1.1rem 0 1.35rem;border-top:1px solid rgba(22,61,104,.12);background:#f5f8fc}
.gp-recruit-discover-inner{max-width:72rem;margin:0 auto;padding:0 1.25rem;display:flex;flex-wrap:wrap;gap:.65rem 1.25rem;align-items:center}
.gp-recruit-discover-label{margin:0;font-size:.78rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#64748b}
.gp-recruit-discover-links{display:flex;flex-wrap:wrap;gap:.55rem .9rem;align-items:center}
.gp-recruit-discover-links a{font-weight:650;color:#163D68;text-decoration:none}
.gp-recruit-discover-links a:hover{text-decoration:underline}
</style>`;

function prefixFor(pagePath: string): string {
  if (pagePath.includes("/")) return "../";
  return "";
}

const ENTRY_PAGES = new Set([
  "index.html",
  "team.html",
  "team-general-practitioners.html",
  "about-us.html",
  "contact.html",
  "services.html",
]);

export function injectGpRecruitmentDiscoverability(html: string, pagePath: string): string {
  const normalized = pagePath.replace(/^\/+/, "").replace(/\\/g, "/");
  if (!ENTRY_PAGES.has(normalized) && !normalized.startsWith("doctors/")) return html;

  const p = prefixFor(normalized);
  const band = `<!--gp-recruit-discover:start-->
<aside class="gp-recruit-discover" data-gp-recruit-discover="true" aria-label="For GPs considering joining">
<div class="gp-recruit-discover-inner">
<p class="gp-recruit-discover-label">For GPs considering joining</p>
<nav class="gp-recruit-discover-links">
<a href="${p}join-our-team.html">Join Our Team</a>
<a href="${p}about-us/practice-experience.html">Practice Experience</a>
<a href="${p}join-our-team/gp-opportunities.html">GP Opportunities</a>
<a href="${p}join-our-team.html#confidential-conversation">Confidential conversation</a>
</nav>
</div>
</aside>
<!--gp-recruit-discover:end-->`;

  let next = html.replace(/<!--gp-recruit-discover:start-->[\s\S]*?<!--gp-recruit-discover:end-->\s*/gi, "");
  next = next.replace(/<style\b[^>]*id="wmc-gp-recruit-discover"[\s\S]*?<\/style>\s*/gi, "");
  next = next.includes("</head>")
    ? next.replace(/<\/head>/i, `${DISCOVER_STYLE}</head>`)
    : `${DISCOVER_STYLE}${next}`;

  if (/<footer\b/i.test(next)) {
    return next.replace(/<footer\b/i, `${band}<footer`);
  }
  if (/<\/main>/i.test(next)) {
    return next.replace(/<\/main>/i, `</main>${band}`);
  }
  return `${next}${band}`;
}
