import {
  listImportedPublishedPractitioners,
  type CmsPractitionerCard,
} from "@/documents/inject-cms-practitioners";
import { matchingCareLabel } from "@/seo/care-area-service-map";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function practitionerLink(card: CmsPractitionerCard, careLabel: string, hrefPrefix: string): string {
  const href = `${hrefPrefix}${card.pagePath}`;
  return `<a class="practitioner-knowledge-link" data-cms-practitioner="${escapeHtml(card.slug)}" href="${escapeHtml(href)}"><strong>${escapeHtml(card.name)}</strong><span>${escapeHtml(careLabel)}</span><em>View practitioner profile →</em></a>`;
}

/**
 * Appends CMS-imported published GPs into service `#related-practitioners` lists when their
 * published areasOfCare match the service. Does not invent care areas or rewrite golden cards.
 */
export async function injectCmsPractitionersIntoServiceHtml(
  clinicId: string,
  pagePath: string,
  html: string,
): Promise<string> {
  if (!pagePath.startsWith("services/") || pagePath === "services.html") return html;
  if (!html.includes('id="related-practitioners"')) return html;

  const imported = await listImportedPublishedPractitioners(clinicId);
  if (!imported.length) return html;

  const additions: string[] = [];
  for (const card of imported) {
    if (html.includes(card.pagePath) || html.includes(`data-cms-practitioner="${card.slug}"`)) {
      continue;
    }
    const label = matchingCareLabel(card.areasOfCare, pagePath);
    if (!label) continue;
    additions.push(practitionerLink(card, label, "../"));
  }
  if (!additions.length) return html;

  // Prefer inserting before the closing practitioner-knowledge-links div.
  if (/class="practitioner-knowledge-links"/i.test(html)) {
    return html.replace(
      /(<div class="practitioner-knowledge-links">)([\s\S]*?)(<\/div>)/i,
      (_full, open: string, inner: string, close: string) => `${open}${inner}${additions.join("")}${close}`,
    );
  }

  // Fallback: insert before first service-inline-action inside related-practitioners.
  return html.replace(
    /(id="related-practitioners"[\s\S]*?)(<p class="service-inline-action")/i,
    (_full, before: string, action: string) =>
      `${before}<div class="practitioner-knowledge-links">${additions.join("")}</div>${action}`,
  );
}

/** Pure helper for unit tests — same matching rules without DB. */
export function buildServicePractitionerInjectLinks(
  pagePath: string,
  cards: readonly CmsPractitionerCard[],
  existingHtml: string,
): string[] {
  const links: string[] = [];
  for (const card of cards) {
    if (existingHtml.includes(card.pagePath) || existingHtml.includes(`data-cms-practitioner="${card.slug}"`)) {
      continue;
    }
    const label = matchingCareLabel(card.areasOfCare, pagePath);
    if (!label) continue;
    links.push(practitionerLink(card, label, "../"));
  }
  return links;
}
