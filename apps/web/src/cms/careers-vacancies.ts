import type { Vacancy, VacancyRoleCategory, VacancyStatus } from "@prisma/client";
import { prisma } from "@/db/prisma";
import {
  eoiHrefForPage,
  renderRecruitmentContactHtml,
  resolveRecruitmentContact,
} from "@/recruitment/contact";
import {
  WMC_RECRUITMENT_OFFER,
  offerFeaturedHighlights,
  resolvePublicRemunerationNote,
  sanitizeVacancyOfferHighlights,
} from "@/recruitment/offer-config";

function isGpVacancyRole(role: VacancyRoleCategory): boolean {
  return role === "general_practitioner" || role === "gp_registrar";
}

export const VACANCY_STATUS_LABEL: Record<VacancyStatus, string> = {
  now_hiring: "Open",
  expression_of_interest: "Expression of Interest",
  future_opportunity: "Future Opportunity",
  closed: "Closed",
};

export const VACANCY_ROLE_LABEL: Record<VacancyRoleCategory, string> = {
  general_practitioner: "General Practitioner",
  gp_registrar: "GP Registrar",
  practice_nurse: "Practice Nurse",
  enrolled_nurse: "Enrolled Nurse",
  reception: "Medical Receptionist",
  practice_manager: "Practice Manager",
  allied_health: "Allied Health",
  psychologist: "Psychologist",
  dietitian: "Dietitian",
  physiotherapist: "Physiotherapist",
  student_placement: "Student Placement",
  other: "Other",
};

export const VACANCY_STATUS_OPTIONS = Object.entries(VACANCY_STATUS_LABEL) as Array<[VacancyStatus, string]>;
export const VACANCY_ROLE_OPTIONS = Object.entries(VACANCY_ROLE_LABEL) as Array<[VacancyRoleCategory, string]>;

export type VacancyRenderVariant = "careers" | "gp-recruit";

const EOI_HREF_JOIN = "join-our-team/express-interest.html";
const EOI_HREF_NESTED = "express-interest.html";

const EMPTY_STATE_CAREERS =
  '<p class="careers-opportunity-empty">We are not currently advertising a specific role. Expressions of interest are welcome.</p>';

/** Offer-sourced featured card when CMS has no live vacancies — keeps Join Our Team prospectus honest. */
function renderOfferFeaturedVacancyCard(pagePath: string): string {
  const applyHref = eoiHrefForPage(pagePath) || EOI_HREF_JOIN;
  const offerPills = offerFeaturedHighlights()
    .slice(0, 4)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  return `<article class="gp-recruit-vacancy-card gp-recruit-vacancy-card--featured" role="listitem" data-opportunity-type="GP" data-featured="true" data-offer-featured="true">
<p class="gp-recruit-vacancy-featured-label">Featured Opportunity</p>
<div class="gp-recruit-vacancy-badges"><span class="gp-recruit-vacancy-badge">Open</span><span class="gp-recruit-vacancy-badge">General Practitioner</span></div>
<h3>VR General Practitioner</h3>
<p class="gp-recruit-vacancy-dept">General Practitioner · Flexible</p>
<p class="gp-recruit-vacancy-location">${escapeHtml(WMC_RECRUITMENT_OFFER.locationLabel)}</p>
<ul class="gp-recruit-vacancy-featured-points">${offerPills}</ul>
<p class="gp-recruit-vacancy-summary">Join an established community-focused general practice focused on continuity of care, clinical excellence and long-term patient relationships.</p>
<div class="gp-recruit-vacancy-actions">
<a class="button gp-recruit-primary gp-recruit-primary-on-dark" href="${escapeHtml(applyHref)}" data-track-opportunity-cta="eoi" data-opportunity-type="GP">View Opportunity</a>
<a class="button button-secondary gp-recruit-primary-on-dark" href="#gp-readiness-portal" data-gp-readiness-open="true">GP Readiness Portal</a>
</div>
</article>`;
}

const VACANCY_TRUST_STRIP = `<ul class="gp-recruit-vacancy-trust" aria-label="Recruitment assurances">
<li><span aria-hidden="true">✓</span>Confidential discussions available</li>
<li><span aria-hidden="true">✓</span>No CV required for initial discussion</li>
<li><span aria-hidden="true">✓</span>Named recruitment contact</li>
<li><span aria-hidden="true">✓</span>Established Brisbane practice</li>
</ul>`;

function wrapRecruitVacanciesBlock(inner: string, pagePath: string): string {
  const eoiHref = eoiHrefForPage(pagePath);
  const contact = renderRecruitmentContactHtml(resolveRecruitmentContact(undefined, eoiHref));
  return `<div class="gp-recruit-vacancies-block" data-careers-vacancies-root="" data-gp-recruit-vacancies="true">
${inner}
${VACANCY_TRUST_STRIP}
${contact}
</div>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function statusClass(status: VacancyStatus): string {
  if (status === "now_hiring") return "careers-status-hiring";
  if (status === "future_opportunity") return "careers-status-future";
  if (status === "closed") return "careers-status-closed";
  return "careers-status-eoi";
}

function listHtml(items: string[], className: string): string {
  if (items.length === 0) return "";
  return `<ul class="${className}">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function paragraphsHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      const bulletLines = lines.filter((line) => /^[-•]\s+/.test(line));
      if (bulletLines.length > 0 && bulletLines.length === lines.length) {
        return `<ul class="careers-vacancy-bullets">${lines
          .map((line) => `<li>${escapeHtml(line.replace(/^[-•]\s*/, ""))}</li>`)
          .join("")}</ul>`;
      }
      if (bulletLines.length > 0) {
        const intro = lines.filter((line) => !/^[-•]\s+/.test(line));
        const list = `<ul class="careers-vacancy-bullets">${bulletLines
          .map((line) => `<li>${escapeHtml(line.replace(/^[-•]\s*/, ""))}</li>`)
          .join("")}</ul>`;
        return `${intro.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}${list}`;
      }
      return `<p>${escapeHtml(lines.join(" "))}</p>`;
    })
    .join("");
}

/** Employer-brand opportunityType tokens for Attraction analytics (not job-board taxonomy). */
export function opportunityTypeToken(role: VacancyRoleCategory): string {
  if (role === "gp_registrar") return "gp-registrar";
  if (role === "general_practitioner") return "gp-full-time";
  return role.replaceAll("_", "-");
}

function isRecentlyPublished(vacancy: Vacancy, days = 21): boolean {
  const stamp = vacancy.publishedAt ?? vacancy.createdAt;
  if (!stamp) return false;
  return Date.now() - stamp.getTime() < days * 24 * 60 * 60 * 1000;
}

function employmentChips(employmentType: string): string[] {
  const chips: string[] = [];
  const raw = employmentType || "";
  if (/part[-\s]?time/i.test(raw)) chips.push("Part Time");
  if (/full[-\s]?time/i.test(raw)) chips.push("Full Time");
  if (/contract|casual|sessional/i.test(raw)) chips.push("Contract");
  return chips;
}

function vacancyBadges(vacancy: Vacancy): string[] {
  const badges: string[] = [];
  if (vacancy.status === "now_hiring") badges.push("Open");
  else if (vacancy.status === "expression_of_interest") badges.push("EOI");
  else if (vacancy.status === "future_opportunity") badges.push("Future");

  const blob = `${vacancy.title} ${vacancy.shortSummary} ${vacancy.offerHighlights.join(" ")}`;
  if (/urgent/i.test(blob)) badges.push("Urgent");
  if (isRecentlyPublished(vacancy)) badges.push("New");
  for (const chip of employmentChips(vacancy.employmentType)) {
    if (!badges.includes(chip)) badges.push(chip);
  }
  return badges;
}

function resolveApplyHref(vacancy: Vacancy, pagePath: string): string {
  const custom = vacancy.applyUrl.trim();
  if (custom) return custom;
  if (pagePath.startsWith("join-our-team/")) return EOI_HREF_NESTED;
  if (pagePath === "join-our-team.html") return EOI_HREF_JOIN;
  return "#talent-community";
}

function truncateSummary(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function renderVacancyCard(vacancy: Vacancy, pagePath = "join-our-team.html"): string {
  const badge = VACANCY_STATUS_LABEL[vacancy.status];
  const roleLabel = VACANCY_ROLE_LABEL[vacancy.roleCategory];
  const opportunityType = opportunityTypeToken(vacancy.roleCategory);
  const applyHref = resolveApplyHref(vacancy, pagePath);
  const detailId = `vacancy-detail-${vacancy.id}`;
  const isGp = isGpVacancyRole(vacancy.roleCategory);
  const remuneration = resolvePublicRemunerationNote(vacancy.remunerationNote, {
    isGpRole: isGp,
    featured: vacancy.featured,
  });
  const safeHighlights = sanitizeVacancyOfferHighlights(vacancy.offerHighlights, { isGpRole: isGp });
  const meta = [
    vacancy.location ? `<span>${escapeHtml(vacancy.location)}</span>` : "",
    vacancy.employmentType ? `<span>${escapeHtml(vacancy.employmentType)}</span>` : "",
    remuneration ? `<span>${escapeHtml(remuneration)}</span>` : "",
  ]
    .filter(Boolean)
    .join("");

  const highlights = safeHighlights.length
    ? `<div class="careers-vacancy-block"><h4>Offer highlights</h4>${listHtml(safeHighlights, "careers-vacancy-bullets")}</div>`
    : "";
  const requirements = vacancy.requirements.length
    ? `<div class="careers-vacancy-block"><h4>Requirements</h4>${listHtml(vacancy.requirements, "careers-vacancy-bullets")}</div>`
    : "";
  const description = vacancy.fullDescription.trim()
    ? `<div class="careers-vacancy-block"><h4>About this role</h4>${paragraphsHtml(vacancy.fullDescription)}</div>`
    : "";

  return `<details class="careers-opportunity-card careers-vacancy-card" data-vacancy-id="${escapeHtml(vacancy.id)}" data-opportunity-id="${escapeHtml(vacancy.id)}" data-opportunity-type="${escapeHtml(opportunityType)}" data-role-category="${escapeHtml(roleLabel)}"${vacancy.featured ? ' data-featured="true"' : ""}>
<summary class="careers-vacancy-summary">
<span class="careers-status-badge ${statusClass(vacancy.status)}">${escapeHtml(badge)}</span>
<span class="careers-vacancy-summary-copy">
<strong class="careers-vacancy-title">${escapeHtml(vacancy.title)}</strong>
<span class="careers-opportunity-meta">${meta}</span>
<span class="careers-vacancy-summary-text">${escapeHtml(vacancy.shortSummary || "Register your interest for this healthcare role.")}</span>
</span>
<span class="careers-vacancy-toggle" aria-hidden="true">View Opportunity</span>
</summary>
<div class="careers-vacancy-detail" id="${detailId}">
${description}
${highlights}
${requirements}
<p class="careers-vacancy-apply-note">Apply via a confidential discussion with the practice.</p>
<div class="careers-opportunity-actions">
<a class="button" href="${escapeHtml(applyHref)}" data-talent-role="${escapeHtml(roleLabel)}" data-talent-vacancy-id="${escapeHtml(vacancy.id)}" data-track-opportunity-cta="eoi" data-opportunity-id="${escapeHtml(vacancy.id)}" data-opportunity-type="${escapeHtml(opportunityType)}">Apply Confidentially</a>
</div>
</div>
</details>`;
}

function renderRecruitVacancyCard(vacancy: Vacancy, pagePath: string): string {
  const roleLabel = VACANCY_ROLE_LABEL[vacancy.roleCategory];
  const opportunityType = opportunityTypeToken(vacancy.roleCategory);
  const applyHref = resolveApplyHref(vacancy, pagePath);
  const badges = vacancyBadges(vacancy)
    .map((b) => `<span class="gp-recruit-vacancy-badge">${escapeHtml(b)}</span>`)
    .join("");
  const isGp = isGpVacancyRole(vacancy.roleCategory);
  const location = vacancy.location.trim() || WMC_RECRUITMENT_OFFER.locationLabel;
  const employment = vacancy.employmentType.trim() || "Flexible";
  const remuneration = resolvePublicRemunerationNote(vacancy.remunerationNote, {
    isGpRole: isGp,
    featured: vacancy.featured,
  });
  const summary = truncateSummary(
    vacancy.shortSummary || "Confidential expressions of interest are welcome for this healthcare role.",
  );
  if (vacancy.featured) {
    // Featured bullets always come from recruitment offer SSoT so commercial facts stay consistent.
    const offerPills = offerFeaturedHighlights()
      .slice(0, 4)
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");
    return `<article class="gp-recruit-vacancy-card gp-recruit-vacancy-card--featured" role="listitem" data-vacancy-id="${escapeHtml(vacancy.id)}" data-opportunity-id="${escapeHtml(vacancy.id)}" data-opportunity-type="${escapeHtml(opportunityType)}" data-featured="true">
<p class="gp-recruit-vacancy-featured-label">Featured Opportunity</p>
<div class="gp-recruit-vacancy-badges">${badges}</div>
<h3>${escapeHtml(vacancy.title)}</h3>
<p class="gp-recruit-vacancy-dept">${escapeHtml(roleLabel)} · ${escapeHtml(employment)}</p>
<p class="gp-recruit-vacancy-location">${escapeHtml(location)}</p>
<ul class="gp-recruit-vacancy-featured-points">${offerPills}</ul>
<p class="gp-recruit-vacancy-summary">${escapeHtml(summary)}</p>
<div class="gp-recruit-vacancy-actions">
<a class="button gp-recruit-primary gp-recruit-primary-on-dark" href="${escapeHtml(applyHref)}" data-track-opportunity-cta="eoi" data-opportunity-id="${escapeHtml(vacancy.id)}" data-opportunity-type="${escapeHtml(opportunityType)}" data-talent-vacancy-id="${escapeHtml(vacancy.id)}">View Opportunity</a>
${isGp ? `<a class="button button-secondary gp-recruit-primary-on-dark" href="#gp-readiness-portal" data-gp-readiness-open="true">GP Readiness Portal</a>` : ""}
</div>
</article>`;
  }

  return `<article class="gp-recruit-vacancy-card" role="listitem" data-vacancy-id="${escapeHtml(vacancy.id)}" data-opportunity-id="${escapeHtml(vacancy.id)}" data-opportunity-type="${escapeHtml(opportunityType)}">
<div class="gp-recruit-vacancy-badges">${badges}</div>
<h3>${escapeHtml(vacancy.title)}</h3>
<p class="gp-recruit-vacancy-dept">${escapeHtml(roleLabel)}</p>
<ul class="gp-recruit-vacancy-meta">
<li><span>Location</span>${escapeHtml(location)}</li>
<li><span>Type</span>${escapeHtml(employment)}</li>
${remuneration ? `<li><span>Remuneration</span>${escapeHtml(remuneration)}</li>` : ""}
</ul>
<p class="gp-recruit-vacancy-summary">${escapeHtml(summary)}</p>
<div class="gp-recruit-vacancy-actions">
<a class="button button-secondary gp-recruit-vacancy-cta" href="${escapeHtml(applyHref)}" data-track-opportunity-cta="eoi" data-opportunity-id="${escapeHtml(vacancy.id)}" data-opportunity-type="${escapeHtml(opportunityType)}" data-talent-vacancy-id="${escapeHtml(vacancy.id)}">View Opportunity</a>
${isGp ? `<a class="button button-secondary" href="#gp-readiness-portal" data-gp-readiness-open="true">Prepare Your Onboarding</a>` : ""}
</div>
</article>`;
}

export function renderVacanciesMarkup(
  vacancies: Vacancy[],
  options: { variant?: VacancyRenderVariant; pagePath?: string } = {},
): string {
  const variant = options.variant ?? "careers";
  const pagePath = options.pagePath ?? "join-our-team.html";

  if (variant === "gp-recruit") {
    if (vacancies.length === 0) {
      return wrapRecruitVacanciesBlock(
        `<div class="gp-recruit-vacancy-grid" role="list">${renderOfferFeaturedVacancyCard(pagePath)}</div>`,
        pagePath,
      );
    }
    const ordered = [...vacancies].sort((a, b) => Number(b.featured) - Number(a.featured));
    return wrapRecruitVacanciesBlock(
      `<div class="gp-recruit-vacancy-grid" role="list">${ordered
        .map((vacancy) => renderRecruitVacancyCard(vacancy, pagePath))
        .join("")}</div>`,
      pagePath,
    );
  }

  if (vacancies.length === 0) {
    return `<div class="careers-opportunity-grid" data-careers-vacancies-root="">${EMPTY_STATE_CAREERS}</div>`;
  }
  return `<div class="careers-opportunity-grid" data-careers-vacancies-root="" role="list">${vacancies
    .map((vacancy) => renderVacancyCard(vacancy, pagePath))
    .join("")}</div>`;
}

export async function listPublicVacancies(clinicId: string): Promise<Vacancy[]> {
  const now = new Date();
  return prisma.vacancy.findMany({
    where: {
      clinicId,
      active: true,
      status: { not: "closed" },
      AND: [
        { OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      ],
    },
    orderBy: [{ featured: "desc" }, { displayOrder: "asc" }, { updatedAt: "desc" }],
  });
}

const VACANCY_INJECT_PATHS = new Set(["join-our-team.html", "join-our-team/gp-opportunities.html"]);

/** Replaces careers vacancy grids with live CMS vacancies (Join Our Team + GP Opportunities). */
export async function injectCareersVacancies(html: string, pagePath: string, clinicId: string): Promise<string> {
  if (!VACANCY_INJECT_PATHS.has(pagePath)) return html;

  // Recruitment HOLD: keep vacancy listing display on the join hub; block form enhancement only.
  const { canOperateRecruitmentPublicWorkflows } = await import("@/importer/recruitment-hold");
  const workflowsOpen = canOperateRecruitmentPublicWorkflows();

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { slug: true, practiceName: true },
  });
  let next = html;
  if (workflowsOpen && pagePath === "join-our-team.html" && clinic?.slug) {
    const { enhanceTalentCommunityForm } = await import("@/cms/careers-applications");
    next = enhanceTalentCommunityForm(html, clinic.slug, clinic.practiceName);
  }

  if (!next.includes('id="current-opportunities"') && !next.includes("data-careers-vacancies-root")) return next;

  const vacancies = await listPublicVacancies(clinicId);
  const variant: VacancyRenderVariant =
    pagePath === "join-our-team.html" && /data-gp-recruit-vacancies|gp-recruit-vacancies/i.test(next)
      ? "gp-recruit"
      : "careers";

  let grid = renderVacanciesMarkup(vacancies, { variant, pagePath });

  if (pagePath === "join-our-team/gp-opportunities.html") {
    grid = grid
      .replaceAll('href="#talent-community"', 'href="express-interest.html"')
      .replaceAll(
        "Apply via a confidential discussion with the practice.",
        "Express interest with the practice, keep the pages that help you decide, or call about joining.",
      )
      .replaceAll(
        "Register your interest for this healthcare role.",
        "Express interest with the practice about this role.",
      )
      .replace(
        /(<div class="careers-opportunity-actions">)\s*<a class="button" href="express-interest\.html"([^>]*)>Apply Confidentially<\/a>\s*(<\/div>)/g,
        (_m, open: string, attrs: string, close: string) => {
          const idMatch = attrs.match(/data-opportunity-id="([^"]+)"/);
          const typeMatch = attrs.match(/data-opportunity-type="([^"]+)"/);
          const oid = idMatch?.[1] ?? "";
          const otype = typeMatch?.[1] ?? "GP";
          return `${open}<a class="button" href="express-interest.html"${attrs}>Express Interest</a>
<a class="button-secondary" href="opportunity-pack.html" data-track-opportunity-cta="pack" data-opportunity-id="${oid}" data-opportunity-type="${otype}">Pages to keep</a>
<a class="button-secondary" href="tel:+61732173344" data-track-opportunity-cta="contact" data-opportunity-id="${oid}" data-opportunity-type="${otype}">Call about joining</a>${close}`;
        },
      )
      .replace(/Apply Confidentially/g, "Express Interest");
  }

  const markup = `<!--careers-vacancies:start-->${grid}<!--careers-vacancies:end-->`;

  if (next.includes("<!--careers-vacancies:start-->")) {
    next = next.replace(/<!--careers-vacancies:start-->[\s\S]*?<!--careers-vacancies:end-->/i, markup);
  } else if (next.includes('id="current-opportunities"')) {
    next = next.replace(
      /(<section\b[^>]*\bid="current-opportunities"[^>]*>[\s\S]*?<h2[^>]*>Current Opportunities<\/h2>)([\s\S]*?)(<\/section>)/i,
      (_match, open: string, _body: string, close: string) => {
        const lede =
          variant === "gp-recruit"
            ? `<p class="gp-recruit-section-lede">Explore current opportunities at ${WMC_RECRUITMENT_OFFER.clinicDisplayName}. If a suitable role is not listed today, we welcome confidential expressions of interest.</p>`
            : `<p>Roles may arise across general practice, nursing, allied health, reception or other practice functions. Active opportunities are listed below when available.</p>`;
        return `${open}${lede}${markup}${close}`;
      },
    );
  }

  return next;
}

export function linesToList(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

export function listToLines(items: string[]): string {
  return items.join("\n");
}

export function isVacancyStatus(value: string): value is VacancyStatus {
  return value in VACANCY_STATUS_LABEL;
}

export function isVacancyRoleCategory(value: string): value is VacancyRoleCategory {
  return value in VACANCY_ROLE_LABEL;
}
