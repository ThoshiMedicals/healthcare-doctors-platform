/**
 * EEAT / authority-network refinements applied at public render time.
 * Uses only existing clinic localities, approved practitioner links, and existing
 * trust pages. No invented credentials, social profiles, or redesign.
 */

import { applyApprovedPractitionerLanguages } from "@/documents/practitioner-authority-languages";

const CLINIC_AREA_SERVED = [
  "Woolloongabba",
  "East Brisbane",
  "South Brisbane",
  "Kangaroo Point",
  "Greenslopes",
  "Stones Corner",
  "Dutton Park",
] as const;

type HubPractitioner = { href: string; name: string; label: string };

/** Clinically relevant rails for knowledge hubs that already book + link services but lack GP discovery. */
const KNOWLEDGE_HUB_PRACTITIONER_RAILS: Readonly<Record<string, readonly HubPractitioner[]>> = {
  "knowledge/family-health.html": [
    { href: "../doctors/dr-tanya-goodwill.html", name: "Dr Tanya Goodwill", label: "Family health" },
    { href: "../doctors/dr-wasantha-hettiarchchi.html", name: "Dr Wasantha Hettiarchchi", label: "Family health" },
    { href: "../doctors/dr-sumita-singh.html", name: "Dr Sumita Singh", label: "Family health" },
    { href: "../doctors/dr-anand-singh.html", name: "Dr Anand Singh", label: "Family health" },
    // CMS-published; approved interest: Family medicine
    { href: "../doctors/dr-james.html", name: "Dr James Chanaka", label: "Family medicine" },
  ],
  "knowledge/preventive-healthcare.html": [
    { href: "../doctors/dr-tanya-goodwill.html", name: "Dr Tanya Goodwill", label: "Preventive care" },
    { href: "../doctors/dr-wasantha-hettiarchchi.html", name: "Dr Wasantha Hettiarchchi", label: "Preventive care" },
    { href: "../doctors/dr-sumita-singh.html", name: "Dr Sumita Singh", label: "Preventive care" },
    // Golden interest: Preventive medicine
    { href: "../doctors/dr-sambo-luon.html", name: "Dr Sambo Luon", label: "Preventive medicine" },
  ],
  "knowledge/pregnancy.html": [
    { href: "../doctors/dr-tanya-goodwill.html", name: "Dr Tanya Goodwill", label: "Women’s health" },
    { href: "../doctors/dr-sumita-singh.html", name: "Dr Sumita Singh", label: "Women’s health" },
    { href: "../doctors/dr-debra-larkins.html", name: "Dr Debra Larkins", label: "Shared antenatal care" },
    { href: "../doctors/dr-mary-abadir.html", name: "Dr Mary Abadir", label: "Obstetrics & gynaecology" },
    // CMS-published; approved interest: Women's health
    { href: "../doctors/dr-yamesha-ranatunga.html", name: "Dr Yamesha Ranatunga", label: "Women's health" },
  ],
};

const SERVICE_TRUST_PAGES = new Set([
  "services/family-health.html",
  "services/chronic-disease-care.html",
  "services/womens-health.html",
  "services/mens-health.html",
  "services/mental-health.html",
  "services/childrens-health.html",
  "services/preventive-healthcare.html",
]);

/** Support services with no practitioner rail — keep patients moving toward GP care without inventing expertise. */
const SUPPORT_SERVICE_NEXT_STEP_PAGES = new Set([
  "services/pathology.html",
  "services/pharmacy.html",
  "services/radiology.html",
  // Golden rail present but empty — keep patients moving without inventing allied roster claims.
  "services/allied-health.html",
]);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Keep the telehealth “doctors can help” section that lists GPs; drop the empty duplicate id. */
export function dedupeTelehealthRelatedPractitioners(html: string, pagePath: string): string {
  if (pagePath !== "services/telehealth.html") return html;
  const sectionRe =
    /<section\b[^>]*\bid="related-practitioners"[^>]*>[\s\S]*?<\/section>/gi;
  const sections = html.match(sectionRe);
  if (!sections || sections.length < 2) return html;

  const keep =
    sections.find((section) => /class="practitioner-knowledge-links"/i.test(section)) ??
    sections[sections.length - 1];
  let removed = false;
  return html.replace(sectionRe, (section) => {
    if (section === keep) return section;
    if (!removed) {
      removed = true;
      return "";
    }
    return "";
  });
}

function rewriteSameAsToCanonical(sameAs: unknown, personUrl: unknown): unknown {
  const canonical =
    typeof personUrl === "string" && /\/doctors\/[^"\s]+\.html$/i.test(personUrl) ? personUrl : null;

  if (typeof sameAs === "string") {
    if (/\/doctor\//i.test(sameAs) && canonical) return canonical;
    if (/\/doctor\//i.test(sameAs)) {
      return sameAs.replace(
        /https:\/\/gabbamedicalcentre\.com\.au\/doctor\/([^/]+)\/?/i,
        (_m, slug: string) => `https://gabbamedicalcentre.com.au/doctors/${slug}.html`,
      );
    }
    return sameAs;
  }
  if (Array.isArray(sameAs)) {
    const next = sameAs.map((entry) => rewriteSameAsToCanonical(entry, personUrl));
    // Deduplicate after WP→canonical collapse.
    return [...new Set(next.map(String))];
  }
  return sameAs;
}

function enrichGraphNode(node: Record<string, unknown>): Record<string, unknown> {
  const type = node["@type"];
  const types = Array.isArray(type) ? type.map(String) : [String(type ?? "")];
  const isPerson = types.some((t) => t === "Person");
  if (!isPerson) return node;

  const next = { ...node };
  if (next.areaServed == null) {
    next.areaServed = [...CLINIC_AREA_SERVED];
  }
  if (next.sameAs != null) {
    next.sameAs = rewriteSameAsToCanonical(next.sameAs, next.url);
  }
  return next;
}

/** Copy clinic localities onto Person and point sameAs at live .html profiles. */
export function enrichPractitionerPersonSchema(html: string, pagePath: string): string {
  if (!pagePath.startsWith("doctors/") || !pagePath.endsWith(".html")) return html;

  return html.replace(
    /<script\b([^>]*\btype=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi,
    (full, attrs: string, raw: string) => {
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown> | { "@graph"?: unknown[] };
        if (parsed && Array.isArray((parsed as { "@graph"?: unknown[] })["@graph"])) {
          const graph = (parsed as { "@graph": unknown[] })["@graph"].map((node) =>
            node && typeof node === "object"
              ? enrichGraphNode(node as Record<string, unknown>)
              : node,
          );
          return `<script${attrs}>${JSON.stringify({ ...(parsed as object), "@graph": graph })}</script>`;
        }
        if (parsed && typeof parsed === "object") {
          return `<script${attrs}>${JSON.stringify(enrichGraphNode(parsed as Record<string, unknown>))}</script>`;
        }
      } catch {
        return full;
      }
      return full;
    },
  );
}

function renderHubPractitionerRail(practitioners: readonly HubPractitioner[]): string {
  const links = practitioners
    .map(
      (p) =>
        `<a class="practitioner-knowledge-link" href="${escapeHtml(p.href)}"><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.label)}</span><em>View practitioner profile →</em></a>`,
    )
    .join("");
  return (
    `<section class="article-section service-team-cta service-doctors-can-help authority-related-practitioners" id="related-practitioners" data-seo-authority-rail="true">` +
    `<p class="eyebrow">Our doctors can help</p><h2>Our doctors can help.</h2>` +
    `<p>These profiles are listed because a publicly verified interest or area of care matches this topic. Listing here is not a ranking, endorsement, or guarantee of availability.</p>` +
    `<div class="practitioner-knowledge-links">${links}</div>` +
    `<p class="service-inline-action"><a class="text-link" href="../team-general-practitioners.html">View all General Practitioners →</a></p>` +
    `</section>`
  );
}

/** Add GP discovery rails on knowledge hubs that already book + link services. */
export function ensureKnowledgeHubAuthorityRails(html: string, pagePath: string): string {
  const rail = KNOWLEDGE_HUB_PRACTITIONER_RAILS[pagePath];
  if (!rail) return html;
  if (/id="related-practitioners"/i.test(html)) return html;

  const block = renderHubPractitionerRail(rail);
  if (/class="knowledge-final-cta"/i.test(html)) {
    return html.replace(/<section\b[^>]*class="[^"]*\bknowledge-final-cta\b[^"]*"[^>]*>/i, `${block}$&`);
  }
  if (/<\/main>/i.test(html)) {
    return html.replace(/<\/main>/i, `${block}</main>`);
  }
  return html;
}

/** Surface existing AGPAL + continuity pages on key service templates (no new copy). */
export function ensureServiceTrustLinks(html: string, pagePath: string): string {
  if (!SERVICE_TRUST_PAGES.has(pagePath)) return html;
  if (/agpal-accreditation\.html/i.test(html) && /philosophy-of-care\.html/i.test(html)) {
    // Footer already links AGPAL; still add mid-body practical links when missing from resource-links.
  }

  const trustLinks =
    `<a class="resource-link" href="../agpal-accreditation.html" data-seo-trust-link="agpal"><span>AGPAL Accreditation</span><span aria-hidden="true">→</span></a>` +
    `<a class="resource-link" href="../philosophy-of-care.html" data-seo-trust-link="continuity"><span>Continuity of Care</span><span aria-hidden="true">→</span></a>`;

  if (/data-seo-trust-link="agpal"/i.test(html)) return html;

  if (/id="practical-information"[\s\S]*?<div class="resource-links">/i.test(html)) {
    return html.replace(
      /(id="practical-information"[\s\S]*?<div class="resource-links">)/i,
      `$1${trustLinks}`,
    );
  }
  if (/id="related-services"[\s\S]*?<div class="resource-links">/i.test(html)) {
    return html.replace(
      /(id="related-services"[\s\S]*?<div class="resource-links">)/i,
      `$1${trustLinks}`,
    );
  }
  return html;
}

/**
 * Pathology / pharmacy / radiology have no practitioner expertise claims in CMS.
 * Keep patients moving to GP discovery + contact without inventing who “does” these services.
 */
export function ensureSupportServiceNextSteps(html: string, pagePath: string): string {
  if (!SUPPORT_SERVICE_NEXT_STEP_PAGES.has(pagePath)) return html;
  if (/data-seo-support-next="gp-directory"/i.test(html)) return html;

  const nextStepLinks =
    `<a class="resource-link" href="../team-general-practitioners.html" data-seo-support-next="gp-directory"><span>Talk with a General Practitioner</span><span aria-hidden="true">→</span></a>` +
    `<a class="resource-link" href="../contact.html" data-seo-support-next="contact"><span>Contact the clinic</span><span aria-hidden="true">→</span></a>`;

  if (/id="practical-information"[\s\S]*?<div class="resource-links">/i.test(html)) {
    return html.replace(
      /(id="practical-information"[\s\S]*?<div class="resource-links">)/i,
      `$1${nextStepLinks}`,
    );
  }
  if (/id="related-services"[\s\S]*?<div class="resource-links">/i.test(html)) {
    return html.replace(
      /(id="related-services"[\s\S]*?<div class="resource-links">)/i,
      `$1${nextStepLinks}`,
    );
  }
  if (/<\/main>/i.test(html)) {
    return html.replace(
      /<\/main>/i,
      `<section class="article-section" id="practical-next-steps" data-seo-support-next="section"><p class="eyebrow">Next steps</p><h2>Need help arranging this care?</h2><p>Our reception team can guide you to a suitable General Practitioner appointment.</p><div class="resource-links">${nextStepLinks}</div></section></main>`,
    );
  }
  return html;
}

export function applyAuthoritySeoRefinements(html: string, pagePath: string): string {
  const normalized = pagePath.replace(/^\/+/, "").replace(/\\/g, "/");
  let next = dedupeTelehealthRelatedPractitioners(html, normalized);
  next = enrichPractitionerPersonSchema(next, normalized);
  next = applyApprovedPractitionerLanguages(next, normalized);
  next = ensureKnowledgeHubAuthorityRails(next, normalized);
  next = ensureServiceTrustLinks(next, normalized);
  next = ensureSupportServiceNextSteps(next, normalized);
  return next;
}
