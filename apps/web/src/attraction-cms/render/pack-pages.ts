import type { StorySurfaceQuote } from "@/story-capture/integration";
import { WMC_RECRUITMENT_OFFER } from "@/recruitment/offer-config";
import {
  JOIN_ATTRACTION_NAV,
  escapeHtml,
  renderEvPageShell,
  renderRecommendedNextBand,
  type EvShellInput,
} from "../ev-shell";
import { journeyFor, type JourneyPageKey } from "../journey-questions";
import {
  cleanPublicHeading,
  isStakeholderSafeText,
  shouldSuppressPublicSection,
} from "../stakeholder-integrity";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function shellWithJourney(pageKey: JourneyPageKey, input: EvShellInput): string {
  const j = journeyFor(pageKey);
  return renderEvPageShell({
    ...input,
    heroEyebrow: j?.question ?? input.heroEyebrow,
    h1: j?.h1 ?? input.h1,
    lede: j?.answerLede ?? input.lede,
  });
}

/** Only consented (non-composite) quotes — otherwise omit entirely. */
function renderQuotes(quotes: StorySurfaceQuote[]): string {
  const approved = quotes.filter((q) => !q.compositeExampleFlag && isStakeholderSafeText(q.pullQuote || q.bodyText));
  if (!approved.length) return "";
  return approved
    .slice(0, 3)
    .map((q) => {
      const text = q.pullQuote || q.bodyText;
      const byline = q.publicByline || "GP voice";
      return `<blockquote class="pe-pull-quote" data-story-id="${escapeHtml(q.storyId)}"><p>${escapeHtml(text)}</p><footer><cite>${escapeHtml(byline)}</cite></footer></blockquote>`;
    })
    .join("\n");
}

/** Render list-ish JSON values without String(object) → "[object Object]". */
function renderRichListItem(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return `<li>${escapeHtml(String(value))}</li>`;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const rec = asRecord(value);
  const title = str(rec.title, str(rec.label, str(rec.heading, str(rec.roleLabel))));
  const narrative = str(
    rec.narrative,
    str(rec.body, str(rec.text, str(rec.summary, str(rec.description)))),
  );
  const steps = Array.isArray(rec.steps)
    ? `<ol>${rec.steps
        .map((s) => `<li>${escapeHtml(typeof s === "string" ? s : str(asRecord(s).text, str(asRecord(s).title)))}</li>`)
        .join("")}</ol>`
    : "";
  const publicTitle = isStakeholderSafeText(title) ? title : "";
  const publicNarrative = isStakeholderSafeText(narrative) ? narrative : "";
  if (!publicTitle && !publicNarrative && !steps) return "";
  if (publicTitle && publicNarrative) {
    return `<li><strong>${escapeHtml(publicTitle)}</strong> — ${escapeHtml(publicNarrative)}${steps}</li>`;
  }
  if (publicTitle) return `<li><strong>${escapeHtml(publicTitle)}</strong>${steps}</li>`;
  if (publicNarrative) return `<li>${escapeHtml(publicNarrative)}${steps}</li>`;
  return "";
}

function renderStringOrRichList(values: unknown[]): string {
  const items = values.map(renderRichListItem).filter(Boolean).join("");
  return items ? `<ul>${items}</ul>` : "";
}

/** Composite / synthetic stories suppressed until approved. */
function renderStories(_values: unknown[]): string {
  return "";
}

function renderSectionLinks(values: unknown[]): string {
  const links = values
    .map((raw) => {
      if (typeof raw === "string") return "";
      const rec = asRecord(raw);
      const href = str(rec.href);
      const label = str(rec.label, str(rec.title));
      if (!href || !label) return "";
      return `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`;
    })
    .filter(Boolean)
    .join("");
  return links ? `<ul>${links}</ul>` : "";
}

/** Clinical interest profile cards (nested under Interest profiles). */
function renderInterestProfiles(values: unknown[]): string {
  const cards = values
    .map((raw) => {
      const item = asRecord(raw);
      const title = str(item.title, str(item.name));
      const description = str(item.description, str(item.body, str(item.summary)));
      if (!title || !isStakeholderSafeText(title)) return "";
      if (description && !isStakeholderSafeText(description)) return "";
      const growth = Array.isArray(item.growthPathway)
        ? item.growthPathway
            .filter((s): s is string => typeof s === "string" && isStakeholderSafeText(s))
            .map((s) => `<li>${escapeHtml(s)}</li>`)
            .join("")
        : "";
      const honesty =
        item.capacityHonesty && isStakeholderSafeText(str(item.capacityHonesty))
          ? `<p class="ev-hint">${escapeHtml(str(item.capacityHonesty))}</p>`
          : "";
      const nursing =
        item.nursingImpact && isStakeholderSafeText(str(item.nursingImpact))
          ? `<p><strong>Nursing:</strong> ${escapeHtml(str(item.nursingImpact))}</p>`
          : "";
      const rooms =
        item.roomImpact && isStakeholderSafeText(str(item.roomImpact))
          ? `<p><strong>Rooms:</strong> ${escapeHtml(str(item.roomImpact))}</p>`
          : "";
      return `<article class="join-journey-card join-journey-card--story" id="${escapeHtml(str(item.id, title.toLowerCase().replace(/\s+/g, "-")))}"><h3>${escapeHtml(title)}</h3>${
        description ? `<p>${escapeHtml(description)}</p>` : ""
      }${nursing}${rooms}${growth ? `<p><strong>How it usually grows</strong></p><ul>${growth}</ul>` : ""}${honesty}</article>`;
    })
    .filter(Boolean)
    .join("");
  return cards ? `<div class="join-journey-grid join-journey-grid--2">${cards}</div>` : "";
}

function renderSection(section: JsonRecord): string {
  const rawId = str(section.id, "section");
  const rawHeading = str(section.heading, str(section.title, "Section"));
  if (shouldSuppressPublicSection({ id: rawId, heading: rawHeading })) return "";
  const id = escapeHtml(rawId);
  const heading = escapeHtml(cleanPublicHeading(rawHeading) || rawHeading);
  const eyebrow =
    section.eyebrow && isStakeholderSafeText(str(section.eyebrow))
      ? `<p class="eyebrow">${escapeHtml(str(section.eyebrow))}</p>`
      : "";
  const body =
    section.body && isStakeholderSafeText(str(section.body))
      ? `<p>${escapeHtml(str(section.body))}</p>`
      : "";
  const bullets = Array.isArray(section.bullets) ? renderStringOrRichList(section.bullets) : "";
  const items = Array.isArray(section.items) ? renderStringOrRichList(section.items) : "";
  const examples = Array.isArray(section.examples) ? renderStringOrRichList(section.examples) : "";
  const implications = Array.isArray(section.implications)
    ? renderStringOrRichList(section.implications)
    : "";
  const partnerTypes = Array.isArray(section.partnerTypes)
    ? renderStringOrRichList(section.partnerTypes)
    : "";
  const continuityExamples = Array.isArray(section.continuityExamples)
    ? renderStringOrRichList(section.continuityExamples)
    : "";
  const stories = Array.isArray(section.stories) ? renderStories(section.stories) : "";
  const interestProfiles = Array.isArray(section.interests)
    ? renderInterestProfiles(section.interests)
    : "";
  const links = Array.isArray(section.links) ? renderSectionLinks(section.links) : "";
  const suburbs = Array.isArray(section.suburbs)
    ? `<p><strong>Neighbouring suburbs:</strong> ${section.suburbs.map((s) => escapeHtml(String(s))).join(", ")}</p>`
    : "";
  const themes = Array.isArray(section.themes)
    ? section.themes
        .map((t) => {
          if (typeof t === "string") {
            return isStakeholderSafeText(t) ? `<li>${escapeHtml(t)}</li>` : "";
          }
          const rec = asRecord(t);
          const tTitle = str(rec.title);
          const tBody = str(rec.body);
          if (!isStakeholderSafeText(tTitle) || !isStakeholderSafeText(tBody)) return "";
          return `<li><strong>${escapeHtml(tTitle)}</strong> — ${escapeHtml(tBody)}</li>`;
        })
        .filter(Boolean)
        .join("")
    : "";
  const themesBlock = themes ? `<ul>${themes}</ul>` : "";
  const canAssist = Array.isArray(section.canAssist)
    ? `<div><h3>What we can assist with</h3>${renderStringOrRichList(section.canAssist)}</div>`
    : "";
  const cannot = Array.isArray(section.cannotDo)
    ? `<div><h3>What we cannot do</h3>${renderStringOrRichList(section.cannotDo)}</div>`
    : "";
  const note =
    section.note && isStakeholderSafeText(str(section.note))
      ? `<p>${escapeHtml(str(section.note))}</p>`
      : "";
  const cta =
    section.ctaHref && section.ctaLabel && isStakeholderSafeText(str(section.ctaLabel))
      ? `<p><a class="button" href="${escapeHtml(str(section.ctaHref))}">${escapeHtml(str(section.ctaLabel))}</a></p>`
      : "";

  const inner = `${body}${bullets}${items}${implications}${partnerTypes}${continuityExamples}${examples}${interestProfiles}${stories}${links}${suburbs}${themesBlock}${canAssist}${cannot}${note}${cta}`;
  // Drop empty headings (e.g. suppressed story blocks) so public pages never show orphan H2s.
  if (!inner.trim()) return "";
  return `<section class="article-section" id="${id}">${eyebrow}<h2>${heading}</h2>${inner}</section>`;
}

function renderFaqItems(body: JsonRecord): string {
  const faqs = Array.isArray(body.faqs) ? body.faqs : [];
  if (!faqs.length) return "<p>No FAQ items in this pack yet.</p>";
  return faqs
    .map((raw) => {
      const faq = asRecord(raw);
      const id = escapeHtml(str(faq.id, "faq"));
      return `<details class="attraction-tool-panel" id="${id}" data-faq-id="${id}" data-track-faq-open="${id}"><summary><strong>${escapeHtml(str(faq.question))}</strong></summary><p>${escapeHtml(str(faq.answer))}</p></details>`;
    })
    .join("\n");
}

export function renderOpportunitiesHtml(
  body: unknown,
  quotes: StorySurfaceQuote[] = [],
): string {
  const b = asRecord(body);
  const sections = Array.isArray(b.sections) ? b.sections.map((s) => renderSection(asRecord(s))) : [];
  const [lead, ...rest] = sections;
  // Temporary concept photography. Replace with approved WMC photography when available.
  const journeyFeature = `<!-- Temporary concept photography. Replace with approved WMC photography when available. -->
<figure class="attraction-story-figure attraction-journey-feature" data-journey-feature="gp-opportunities">
<img src="../assets/attraction/journey/gp-opportunities-feature.jpg" alt="GPs and nursing colleagues reviewing care together in a consulting room" width="1200" height="675" decoding="async" loading="eager"/>
</figure>`;
  const dominant = `<div class="attraction-conversion-panel" id="decision-hero">${
    lead ||
    `<section class="article-section"><h2>Suitability &amp; practice fit</h2><p>Explore whether Woolloongabba Medical Centre is a fit — then take a pack or express interest.</p></section>`
  }</div>`;
  const voiceHtml = renderQuotes(quotes);
  const voices = voiceHtml
    ? `<section class="article-section" id="gp-voices"><h2>GP voices</h2>${voiceHtml}</section>`
    : "";
  const fitPillars = `<section class="article-section attraction-fit-pillars" id="practice-fit-pillars" data-attraction-fit-pillars="true" data-gp-opportunities-section="why-choose">
<p class="eyebrow">Why GPs choose WMC</p>
<h2>Practice fit — not a job board</h2>
<p>Roles are one signal. The lasting question is whether this way of practising suits you.</p>
<ul class="attraction-fit-pillar-list">
<li><strong>Clinical autonomy</strong> — judgement within ${WMC_RECRUITMENT_OFFER.agpalAccredited ? "AGPAL-aligned" : "accredited"} standards, not throughput theatre.</li>
<li><strong>Community impact</strong> — continuity with people across ${escapeHtml(WMC_RECRUITMENT_OFFER.locationLabel)} and the inner south (${escapeHtml(WMC_RECRUITMENT_OFFER.activePatientFiles)} patient files).</li>
<li><strong>Team culture</strong> — ${escapeHtml(WMC_RECRUITMENT_OFFER.nurses)} nurses, reception and practice management that protect consulting time.</li>
<li><strong>Commercial clarity</strong> — ${escapeHtml(WMC_RECRUITMENT_OFFER.billingPercentage)} billings${WMC_RECRUITMENT_OFFER.negotiable ? " (negotiable)" : ""}${WMC_RECRUITMENT_OFFER.hourlyGuarantee ? `; ${escapeHtml(WMC_RECRUITMENT_OFFER.hourlyGuarantee)} minimum for ${escapeHtml(WMC_RECRUITMENT_OFFER.guaranteeDuration)} where offered` : ""} — detail confirmed privately.</li>
<li><strong>Support pathways</strong> — orientation and paperwork help the practice can give; clear limits on what it cannot approve.</li>
<li><strong>Practice facilities</strong> — ${WMC_RECRUITMENT_OFFER.consultRooms} rooms, treatment pathways and systems built for continuity care.</li>
</ul>
</section>`;
  const currentOpportunities = `<section class="article-section careers-opportunities" id="current-opportunities" data-gp-opportunities-section="open-roles">
<p class="eyebrow">Current opportunities</p>
<h2>Open opportunities</h2>
<p>When roles are open, they appear here first. Headline terms on an advert show what is currently offered; full commercial arrangements are still discussed privately with suitable doctors. Fit content below still applies — an advertisement does not replace a conversation with the practice.</p>
<!--careers-vacancies:start-->
<div class="careers-opportunity-grid" data-careers-vacancies-root="">
<p class="careers-opportunity-empty">We are not currently advertising a specific role. Expressions of interest are welcome — start with fit, then write or call.</p>
</div>
<!--careers-vacancies:end-->
</section>`;

  const nextSteps = `<section class="article-section attraction-opp-next-steps" id="opportunity-next-steps" data-gp-opportunities-section="next-steps">
<p class="eyebrow">When you are ready</p>
<h2>Pages to keep, then a conversation</h2>
<p>Keep a short set of practice pages for later reading, or write to the practice when the shape of the work feels right. Commercial detail stays a private discussion with suitable doctors.</p>
<div class="join-hub-cta-row">
<a class="button-secondary join-hub-cta-highlight" href="opportunity-pack.html" data-track-opportunity-cta="pack" data-opportunity-id="page" data-opportunity-type="practice_fit">Download Opportunity Pack</a>
<a class="button" href="express-interest.html" data-track-opportunity-cta="eoi" data-opportunity-id="page" data-opportunity-type="practice_fit">Express Interest</a>
<a class="button-secondary" href="tel:+61732173344" data-track-opportunity-cta="contact" data-opportunity-id="page" data-opportunity-type="practice_fit">Call about joining</a>
</div>
</section>`;

  /** Hero → Open opportunities → Why GPs choose WMC → practice sections → Pack / EOI */
  const article = `${journeyFeature}
${dominant}
${currentOpportunities}
${fitPillars}
${rest.filter(Boolean).join("\n")}
${voices}
${nextSteps}
${renderRecommendedNextBand("join-our-team/gp-opportunities.html")}`;

  return shellWithJourney("gp-opportunities.html", {
    path: "join-our-team/gp-opportunities.html",
    title: str(b.metaTitle, "GP Opportunities | Woolloongabba Medical Centre"),
    metaDescription: str(b.metaDescription, "Practice fit for GPs considering Woolloongabba Medical Centre."),
    h1: str(b.h1, "GP Opportunities"),
    lede: str(b.lede, str(b.copy)),
    honestyLine: str(b.honestyLine),
    breadcrumb: [
      { label: "Home", href: "../index.html" },
      { label: "Join Our Team", href: "../join-our-team.html" },
      { label: "GP Opportunities" },
    ],
    navOwner: "join-team",
    sideNavHtml: JOIN_ATTRACTION_NAV("gp-opportunities.html"),
    onThisPageHtml: `<a href="#current-opportunities">Current opportunities</a><a href="#practice-fit-pillars">Why GPs choose WMC</a><a href="#decision-hero">Could you work here?</a><a href="#opportunity-next-steps">Pack &amp; next step</a>`,
    articleHtml: article,
    bodyClass: "ev-opportunities-page",
    pageType: "conversion",
  });
}

export function renderFaqHtml(body: unknown): string {
  const b = asRecord(body);
  const article = `<section class="article-section" id="gp-faq"><h2>Questions GPs ask</h2>
<p>${escapeHtml(str(b.lede, str(b.copy)))}</p>
${renderFaqItems(b)}
</section>
${renderRecommendedNextBand("join-our-team/gp-faq.html")}`;

  return shellWithJourney("gp-faq.html", {
    path: "join-our-team/gp-faq.html",
    title: str(b.metaTitle, "GP FAQ | Woolloongabba Medical Centre"),
    metaDescription: str(b.metaDescription, "Answers for GPs considering Woolloongabba Medical Centre."),
    h1: str(b.h1, "GP FAQ"),
    lede: str(b.lede, str(b.copy)),
    honestyLine: str(b.honestyLine),
    breadcrumb: [
      { label: "Home", href: "../index.html" },
      { label: "Join Our Team", href: "../join-our-team.html" },
      { label: "GP FAQ" },
    ],
    navOwner: "join-team",
    sideNavHtml: JOIN_ATTRACTION_NAV("gp-faq.html"),
    articleHtml: article,
    bodyClass: "ev-faq-page",
    pageType: "tool",
  });
}

export function renderCatchmentHtml(body: unknown): string {
  const b = asRecord(body);
  const sections = Array.isArray(b.sections) ? b.sections.map((s) => renderSection(asRecord(s))) : [];
  // Temporary concept photography. Replace with approved WMC photography when available.
  const journeyFeature = `<!-- Temporary concept photography. Replace with approved WMC photography when available. -->
<figure class="attraction-story-figure attraction-journey-feature" data-journey-feature="community-catchment">
<img src="../assets/attraction/journey/community-catchment-feature.jpg" alt="Street entrance to Woolloongabba Medical Centre with local patients and the neighbourhood beyond" width="1200" height="675" decoding="async" loading="eager"/>
</figure>`;
  return shellWithJourney("community-catchment.html", {
    path: "about-us/community-catchment.html",
    title: str(b.metaTitle, "Community & Catchment | Woolloongabba Medical Centre"),
    metaDescription: str(b.metaDescription),
    h1: str(b.h1, "Community & Catchment"),
    lede: str(b.lede, str(b.copy)),
    honestyLine: str(b.honestyLine),
    breadcrumb: [
      { label: "Home", href: "../index.html" },
      { label: "Join Our Team", href: "../join-our-team.html" },
      { label: "Community & Catchment" },
    ],
    navOwner: "join-team",
    sideNavHtml: JOIN_ATTRACTION_NAV("community-catchment.html"),
    articleHtml: `${journeyFeature}
${sections.join("\n")}${renderRecommendedNextBand("about-us/community-catchment.html")}`,
    bodyClass: "ev-catchment-page",
    pageType: "story",
  });
}

export function renderContinuityHtml(body: unknown): string {
  const b = asRecord(body);
  const sections = Array.isArray(b.sections)
    ? b.sections.map((s) => renderSection(asRecord(s))).filter(Boolean)
    : [];
  // Also render workflow / nodes if present
  const network = asRecord(b.network);
  const nodes = Array.isArray(network.nodes)
    ? `<section class="article-section" id="network"><h2>Local continuity network</h2><div class="join-journey-grid join-journey-grid--2">${network.nodes
        .map((n) => {
          const node = asRecord(n);
          return `<article class="join-journey-card join-journey-card--story"><h3>${escapeHtml(str(node.label, str(node.name)))}</h3><p>${escapeHtml(str(node.role, str(node.body)))}</p></article>`;
        })
        .join("")}</div></section>`
    : "";
  return shellWithJourney("continuity-in-practice.html", {
    path: "about-us/continuity-in-practice.html",
    title: str(b.metaTitle, "Continuity in Practice | Woolloongabba Medical Centre"),
    metaDescription: str(b.metaDescription),
    h1: str(b.h1, "Continuity in Practice"),
    lede: str(b.lede, str(b.copy)),
    honestyLine: str(b.honestyLine),
    breadcrumb: [
      { label: "Home", href: "../index.html" },
      { label: "Join Our Team", href: "../join-our-team.html" },
      { label: "Continuity in Practice" },
    ],
    navOwner: "join-team",
    sideNavHtml: JOIN_ATTRACTION_NAV("continuity-in-practice.html"),
    articleHtml: `${sections.join("\n")}${nodes}${renderRecommendedNextBand("about-us/continuity-in-practice.html")}`,
    bodyClass: "ev-continuity-page",
    pageType: "story",
  });
}

export function renderClinicalInterestsHtml(body: unknown): string {
  const b = asRecord(body);
  const sections = Array.isArray(b.sections)
    ? b.sections.map((s) => renderSection(asRecord(s))).filter(Boolean)
    : [];
  const interests = Array.isArray(b.interests)
    ? `<section class="article-section" id="framework"><h2>Interest pathways</h2><div class="join-journey-grid join-journey-grid--2">${b.interests
        .map((raw) => {
          const item = asRecord(raw);
          return `<article class="join-journey-card join-journey-card--story"><h3>${escapeHtml(str(item.title, str(item.name)))}</h3><p>${escapeHtml(str(item.body, str(item.summary)))}</p></article>`;
        })
        .join("")}</div></section>`
    : "";
  return shellWithJourney("clinical-interests.html", {
    path: "about-us/clinical-interests.html",
    title: str(b.metaTitle, "Clinical Interests | Woolloongabba Medical Centre"),
    metaDescription: str(b.metaDescription),
    h1: str(b.h1, "Clinical Interests"),
    lede: str(b.lede, str(b.copy)),
    honestyLine: str(b.honestyLine),
    breadcrumb: [
      { label: "Home", href: "../index.html" },
      { label: "Join Our Team", href: "../join-our-team.html" },
      { label: "Clinical Interests" },
    ],
    navOwner: "join-team",
    sideNavHtml: JOIN_ATTRACTION_NAV("clinical-interests.html"),
    articleHtml: `${sections.join("\n")}${interests}${renderRecommendedNextBand("about-us/clinical-interests.html")}`,
    bodyClass: "ev-clinical-interests-page",
    pageType: "story",
  });
}
