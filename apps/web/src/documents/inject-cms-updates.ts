import { prisma } from "@/db/prisma";
import { servicesForCareAreas } from "@/seo/care-area-service-map";
import { Prisma } from "@prisma/client";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type CmsUpdateCard = {
  path: string;
  slug: string;
  title: string;
  summary: string;
  author: string;
  categoryLabel: string;
  publishedAt: string | null;
  imageSrc: string;
  imageAlt: string;
};

function categoryLabel(category: string | null | undefined): string {
  if (!category) return "Practice Updates";
  if (/patient/i.test(category)) return "Patient Education";
  return "Practice Updates";
}

function imageFor(slug: string, imagePath: string | null | undefined): string {
  const base = (imagePath || slug).replace(/\.(webp|jpg|jpeg|png)$/i, "");
  // Prefer welcome portrait assets when present; fall back to clinic storefront used by golden cards.
  if (/^welcome-dr-/i.test(base) || /^dr-/i.test(base)) {
    return `../assets/team/${base}.webp`;
  }
  return "../assets/location-storefront-polished.webp";
}

export async function listImportedPublishedUpdates(clinicId: string): Promise<CmsUpdateCard[]> {
  const pages = await prisma.page.findMany({
    where: {
      clinicId,
      status: "published",
      path: { startsWith: "updates/" },
      publishedRevision: {
        is: {
          body: { not: Prisma.DbNull },
        },
      },
    },
    include: {
      practiceUpdate: true,
      publishedRevision: { select: { body: true } },
    },
    orderBy: { path: "asc" },
  });

  return pages
    .filter((page) => {
      if (page.path === "updates/index.html" || page.path === "updates/article.html") return false;
      const body = page.publishedRevision?.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) return false;
      return (body as { source?: string }).source === "practice_update_publish";
    })
    .map((page) => {
      const update = page.practiceUpdate;
      const slug = page.path.replace(/^updates\//, "").replace(/\.html$/, "");
      const body = page.publishedRevision?.body as { publishedAt?: string } | null;
      return {
        path: page.path,
        slug,
        title: update?.title || page.title || slug,
        summary: update?.summary || "",
        author: update?.author || "Practice Team",
        categoryLabel: categoryLabel(update?.category),
        publishedAt: body?.publishedAt || null,
        imageSrc: imageFor(slug, update?.imagePath),
        imageAlt: update?.imageAlt || update?.title || page.title || slug,
      } satisfies CmsUpdateCard;
    });
}

function formatTime(iso: string | null): { datetime: string; label: string } {
  if (!iso) {
    return { datetime: "", label: "" };
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { datetime: "", label: "" };
  const label = d.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
  return { datetime: d.toISOString().slice(0, 10), label };
}

function archiveCard(card: CmsUpdateCard): string {
  const href = card.path.replace(/^updates\//, "");
  const time = formatTime(card.publishedAt);
  const timeHtml = time.datetime
    ? `<time datetime="${escapeHtml(time.datetime)}">${escapeHtml(time.label)}</time>`
    : "";
  return `<article class="health-update-card" data-cms-update="${escapeHtml(card.slug)}"><a aria-label="${escapeHtml(card.title)}" class="health-update-image" href="${escapeHtml(href)}"><img alt="${escapeHtml(card.imageAlt)}" decoding="async" loading="lazy" src="${escapeHtml(card.imageSrc)}" width="1800" height="1013"/></a><div class="health-update-copy"><div class="health-update-meta"><span>${escapeHtml(card.categoryLabel)}</span>${timeHtml}</div><h3><a href="${escapeHtml(href)}">${escapeHtml(card.title)}</a></h3><p>${escapeHtml(card.summary)}</p><a class="editorial-link" href="${escapeHtml(href)}">Read update</a></div></article>`;
}

/**
 * Lists CMS practice updates on updates/index.html when golden archive cards omit them.
 */
export async function injectCmsUpdatesIntoIndexHtml(
  clinicId: string,
  pagePath: string,
  html: string,
): Promise<string> {
  if (pagePath !== "updates/index.html") return html;

  const imported = await listImportedPublishedUpdates(clinicId);
  if (!imported.length) return html;

  const cleaned = html.replace(/<article\b[^>]*\bdata-cms-update="[^"]+"[\s\S]*?<\/article>/gi, "");
  const missing = imported.filter(
    (card) => !cleaned.includes(card.path.replace(/^updates\//, "")) && !cleaned.includes(card.path),
  );
  if (!missing.length) return cleaned;

  const cards = missing.map(archiveCard).join("");
  if (/data-update-archive="/i.test(cleaned)) {
    return cleaned.replace(
      /(<div class="updates-archive-grid"[^>]*data-update-archive=""[^>]*>)([\s\S]*?)(<\/div>)/i,
      (_full, open: string, inner: string, close: string) => `${open}${cards}${inner}${close}`,
    );
  }
  return cleaned.replace(
    /(<div class="updates-archive-grid"[^>]*>)([\s\S]*?)(<\/div>)/i,
    (_full, open: string, inner: string, close: string) => `${open}${cards}${inner}${close}`,
  );
}

const WELCOME_PROFILE: Record<string, { profile: string; areas: string[]; bookingHref: string | null }> = {
  "updates/welcome-dr-golnar-mortezaei.html": {
    profile: "doctors/dr-golnar-mortezaei.html",
    areas: ["Veterans' health", "Chronic disease management", "Diabetes"],
    bookingHref: "tel:+61732173344",
  },
  "updates/welcome-dr-james-chanaka.html": {
    profile: "doctors/dr-james.html",
    areas: ["Children's health", "Mental health", "Family medicine"],
    bookingHref: null, // resolve from live page HotDoc when present; fallback tel in injector
  },
};

/**
 * Adds profile / service / booking resource links on welcome update articles when missing.
 * Uses only published care areas already associated with each doctor — no invented topics.
 */
export function injectWelcomeUpdateAuthorityLinks(
  pagePath: string,
  html: string,
  bookingHrefOverride?: string | null,
): string {
  const meta = WELCOME_PROFILE[pagePath];
  if (!meta) return html;
  if (html.includes('data-cms-welcome-links="true"')) return html;

  const services = servicesForCareAreas(meta.areas);
  const links: string[] = [];
  links.push(
    `<a class="resource-link" href="../${escapeHtml(meta.profile)}"><span>View practitioner profile</span><span aria-hidden="true">→</span></a>`,
  );
  for (const svc of services) {
    links.push(
      `<a class="resource-link" href="../${escapeHtml(svc.path)}"><span>${escapeHtml(svc.label)}</span><span aria-hidden="true">→</span></a>`,
    );
  }
  const bookHref = bookingHrefOverride || meta.bookingHref || "tel:+61732173344";
  const bookLabel = bookHref.startsWith("tel:") ? "Call reception to book" : "Book appointment";
  const bookAttrs = bookHref.startsWith("tel:")
    ? `href="${escapeHtml(bookHref)}"`
    : `data-hotdoc-button="" data-hotdoc-widget="lightbox" href="${escapeHtml(bookHref)}" rel="noopener"`;
  links.push(
    `<a class="resource-link" ${bookAttrs}><span>${escapeHtml(bookLabel)}</span><span aria-hidden="true">→</span></a>`,
  );

  const block = `<section class="article-section" id="related-services" data-cms-welcome-links="true"><p class="eyebrow">Related links</p><h2>Continue to care and booking</h2><div class="resource-links">${links.join("")}</div></section>`;

  if (/id="related-services"/i.test(html)) {
    // Already has a related-services block — append links into its resource-links if empty of doctor profile.
    if (html.includes(meta.profile)) return html;
    return html.replace(
      /(id="related-services"[\s\S]*?<div class="resource-links">)([\s\S]*?)(<\/div>)/i,
      (_full, open: string, inner: string, close: string) => `${open}${links.join("")}${inner}${close}`,
    );
  }

  if (/<\/main>/i.test(html)) {
    return html.replace(/<\/main>/i, `${block}</main>`);
  }
  if (/id="faqs"/i.test(html)) {
    return html.replace(/(<section[^>]*id="faqs")/i, `${block}$1`);
  }
  return `${html}${block}`;
}

/**
 * On CMS doctor profiles, surface the matching welcome update when it exists and is unpublished from the profile.
 */
export function injectProfileWelcomeUpdateLink(pagePath: string, html: string, welcomePath: string | null): string {
  if (!pagePath.startsWith("doctors/") || !welcomePath) return html;
  if (html.includes(welcomePath) || html.includes('data-cms-welcome-profile-link="true"')) return html;
  const href = `../${welcomePath}`;
  const link = `<a class="resource-link" data-cms-welcome-profile-link="true" href="${escapeHtml(href)}"><span>Welcome update</span><span aria-hidden="true">→</span></a>`;
  if (/id="related-services"[\s\S]*?<div class="resource-links">/i.test(html)) {
    return html.replace(
      /(id="related-services"[\s\S]*?<div class="resource-links">)/i,
      `$1${link}`,
    );
  }
  return html;
}

export const PROFILE_WELCOME_UPDATE: Readonly<Record<string, string>> = {
  "doctors/dr-golnar-mortezaei.html": "updates/welcome-dr-golnar-mortezaei.html",
  "doctors/dr-james.html": "updates/welcome-dr-james-chanaka.html",
};
