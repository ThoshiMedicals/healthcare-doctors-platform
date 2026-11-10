/**
 * Presentation-layer authority enrichment for Attraction / PE recruitment pages.
 * Surfaces verified offer facts already in Recruitment Offer Config — does not invent claims.
 * Idempotent via data-recruitment-authority-panel / data-recruitment-page-depth markers.
 */

import { isRecruitmentHoldActive } from "@/importer/recruitment-hold";
import {
  offerHourlyMinimumLine,
  offerPatientDemandSupport,
  offerScaleLine,
  WMC_RECRUITMENT_OFFER,
} from "@/recruitment/offer-config";

const OFFER = WMC_RECRUITMENT_OFFER;
const HOURLY = offerHourlyMinimumLine(OFFER);

const JOIN_CHILD =
  /^(join-our-team\/)?(gp-opportunities|gp-faq|opportunity-pack|practice-support|registrar-pathway|provider-number-readiness|dpa-navigator|session-planner)\.html$/i;
const PE_CHILD =
  /^(about-us\/)?(practice-experience|community-catchment|continuity-in-practice|clinical-interests)\.html$/i;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hrefPrefix(pagePath: string): { join: string; about: string; hub: string; eoi: string } {
  const nested = pagePath.includes("/");
  if (pagePath.startsWith("about-us/")) {
    return {
      join: "../join-our-team/",
      about: "",
      hub: "../join-our-team.html",
      eoi: isRecruitmentHoldActive()
        ? "../join-our-team.html#confidential-conversation"
        : "../join-our-team/express-interest.html",
    };
  }
  if (pagePath.startsWith("join-our-team/")) {
    return {
      join: "",
      about: "../about-us/",
      hub: "../join-our-team.html",
      eoi: isRecruitmentHoldActive()
        ? "../join-our-team.html#confidential-conversation"
        : "express-interest.html",
    };
  }
  return {
    join: nested ? "" : "join-our-team/",
    about: nested ? "" : "about-us/",
    hub: "join-our-team.html",
    eoi: isRecruitmentHoldActive()
      ? "join-our-team.html#confidential-conversation"
      : "join-our-team/express-interest.html",
  };
}

function authoritySnapshotHtml(pagePath: string): string {
  const h = hrefPrefix(pagePath);
  const agpal = OFFER.agpalAccredited
    ? `<li><strong>AGPAL accredited</strong> — governance and quality systems sit beside clinical judgement.</li>`
    : "";
  const hourly = HOURLY
    ? `<li><strong>${escapeHtml(HOURLY)}</strong> for ${escapeHtml(OFFER.guaranteeDuration)} where offered — confirmed privately.</li>`
    : "";
  return `<!--recruitment-authority-panel:start-->
<section class="article-section recruitment-authority-panel" id="practice-authority-snapshot" data-recruitment-authority-panel="true" aria-labelledby="practice-authority-heading">
<p class="eyebrow">Verified practice facts</p>
<h2 id="practice-authority-heading">Why Woolloongabba Medical Centre</h2>
<p>${escapeHtml(offerPatientDemandSupport(OFFER))} Consulting footprint: ${escapeHtml(String(OFFER.consultRooms))} rooms · ${escapeHtml(offerScaleLine(OFFER))} · ${escapeHtml(OFFER.streetAddress)}.</p>
<ul class="recruitment-authority-proof">
<li><strong>${escapeHtml(OFFER.billingPercentage)} billings</strong>${OFFER.negotiable ? " (negotiable arrangements available)" : ""} — commercial detail confirmed privately with suitable doctors.</li>
${hourly}
${agpal}
<li><strong>Continuity of care</strong> — return bookings and unfinished clinical stories stay with the session.</li>
<li><strong>Clinical autonomy</strong> — consulting style sits with the GP within AHPRA standards and practice policy.</li>
<li><strong>Nursing &amp; admin support</strong> — ${escapeHtml(OFFER.nurses)} nurses on roster plus reception workflows that protect consulting time.</li>
</ul>
<p class="recruitment-authority-links">Explore: <a href="${h.about}practice-experience.html">Practice Experience</a> · <a href="${h.join}gp-opportunities.html">GP Opportunities</a> · <a href="${h.join}practice-support.html">Practice Support</a> · <a href="${h.eoi}">Confidential conversation</a></p>
</section>
<!--recruitment-authority-panel:end-->`;
}

function pageDepthHtml(pagePath: string): string {
  const key = pagePath.split("/").pop() || pagePath;
  const h = hrefPrefix(pagePath);

  if (key === "registrar-pathway.html") {
    return `<!--recruitment-page-depth:start-->
<section class="article-section" data-recruitment-page-depth="registrar" aria-labelledby="registrar-depth-heading">
<h2 id="registrar-depth-heading">What early-career doctors should understand here</h2>
<p>Woolloongabba Medical Centre is an established inner-south Brisbane practice with ${escapeHtml(OFFER.activePatientFiles)} patient files, ${escapeHtml(String(OFFER.consultRooms))} consulting rooms and ${escapeHtml(offerScaleLine(OFFER))} on roster. Registrar and early-career pathways are capacity-dependent — supervision and rooms are not advertised as always open.</p>
<ul>
<li><strong>Why now:</strong> patient demand and continuity work already exist; the question is whether supervision and room timing align with your training stage.</li>
<li><strong>What support looks like:</strong> nursing treatment-room pathways, reception booking flow, and ${OFFER.agpalAccredited ? "AGPAL-aligned" : "accredited"} practice systems — see <a href="${h.join}practice-support.html">Practice Support</a>.</li>
<li><strong>What continuity looks like:</strong> return visits and unfinished clinical stories stay with the book — see <a href="${h.about}continuity-in-practice.html">Continuity in Practice</a>.</li>
<li><strong>Commercial clarity:</strong> published GP model is ${escapeHtml(OFFER.billingPercentage)} billings${HOURLY ? ` with ${escapeHtml(HOURLY)} where offered` : ""}; registrar commercial arrangements are confirmed privately if a place is available.</li>
</ul>
<p>Honest next step: read <a href="${h.about}practice-experience.html">Practice Experience</a> and <a href="${h.join}gp-faq.html">GP FAQ</a>, then start a <a href="${h.eoi}">confidential conversation</a> about timing — not a public intake form.</p>
</section>
<!--recruitment-page-depth:end-->`;
  }

  if (key === "practice-support.html") {
    return `<!--recruitment-page-depth:start-->
<section class="article-section" data-recruitment-page-depth="support" aria-labelledby="support-depth-heading">
<h2 id="support-depth-heading">Scale and demand around the consult</h2>
<p>${escapeHtml(offerPatientDemandSupport(OFFER))} The support matrix below is how that demand is handled without turning consulting into throughput theatre.</p>
<ul>
<li><strong>Rooms:</strong> ${escapeHtml(String(OFFER.consultRooms))} consulting rooms matched to agreed days and nursing cover.</li>
<li><strong>Team:</strong> ${escapeHtml(offerScaleLine(OFFER))} — peer discussion available; formal mentoring confirmed individually if needed.</li>
<li><strong>Income model (VR GP):</strong> ${escapeHtml(OFFER.billingPercentage)} billings${OFFER.negotiable ? " (negotiable)" : ""}${HOURLY ? `; ${escapeHtml(HOURLY)} for ${escapeHtml(OFFER.guaranteeDuration)} where offered` : ""}.</li>
<li><strong>Quality:</strong> ${OFFER.agpalAccredited ? "AGPAL accreditation" : "Practice accreditation"} underpins privacy, emergency and clinical governance.</li>
</ul>
<p>Related: <a href="${h.about}practice-experience.html">Practice Experience</a> · <a href="${h.join}gp-opportunities.html">GP Opportunities</a> · <a href="${h.join}gp-faq.html">GP FAQ</a></p>
</section>
<!--recruitment-page-depth:end-->`;
  }

  if (key === "opportunity-pack.html") {
    return `<!--recruitment-page-depth:start-->
<section class="article-section" data-recruitment-page-depth="pack" aria-labelledby="pack-depth-heading">
<h2 id="pack-depth-heading">Opportunity snapshot to keep</h2>
<p>Facts you can share with a partner before a confidential discussion — not a job offer.</p>
<ul>
<li>${escapeHtml(OFFER.clinicDisplayName)} · ${escapeHtml(OFFER.streetAddress)}</li>
<li>${escapeHtml(OFFER.activePatientFiles)} patient files · ${escapeHtml(String(OFFER.consultRooms))} rooms · ${escapeHtml(offerScaleLine(OFFER))}${OFFER.openSevenDays ? " · open 7 days" : ""}</li>
<li>${escapeHtml(OFFER.billingPercentage)} billings${OFFER.negotiable ? " (negotiable)" : ""}${HOURLY ? ` · ${escapeHtml(HOURLY)} where offered` : ""}</li>
<li>${OFFER.agpalAccredited ? "AGPAL accredited · " : ""}Continuity-first consulting · clinical autonomy within practice policy</li>
</ul>
<p>When ready: <a href="${h.eoi}">Request a confidential conversation</a> or call the recruitment contact on Join Our Team.</p>
</section>
<!--recruitment-page-depth:end-->`;
  }

  if (key === "provider-number-readiness.html") {
    return `<!--recruitment-page-depth:start-->
<section class="article-section" data-recruitment-page-depth="provider" aria-labelledby="provider-depth-heading">
<h2 id="provider-depth-heading">How this fits a move to Woolloongabba</h2>
<p>Provider numbers remain a Services Australia process. What the practice can do is share location details (${escapeHtml(OFFER.streetAddress)}), explain start-timing against rooms and nursing cover, and keep commercial discussion private until your pathway is clear.</p>
<ul>
<li>Practice scale you are joining: ${escapeHtml(OFFER.activePatientFiles)} patient files, ${escapeHtml(String(OFFER.consultRooms))} rooms, ${escapeHtml(offerScaleLine(OFFER))}.</li>
<li>Related paperwork orientation: <a href="${h.join}dpa-navigator.html">DPA &amp; 19AB</a> (skip if it does not apply).</li>
<li>Clinical and team fit: <a href="${h.about}practice-experience.html">Practice Experience</a> · <a href="${h.join}practice-support.html">Practice Support</a>.</li>
</ul>
</section>
<!--recruitment-page-depth:end-->`;
  }

  if (key === "dpa-navigator.html") {
    return `<!--recruitment-page-depth:start-->
<section class="article-section" data-recruitment-page-depth="dpa" aria-labelledby="dpa-depth-heading">
<h2 id="dpa-depth-heading">Practice context (not a government ruling)</h2>
<p>${escapeHtml(OFFER.clinicDisplayName)} is at ${escapeHtml(OFFER.streetAddress)} in Brisbane’s inner south. Official Distribution Priority Area (DPA) and Health Insurance Act s19AB outcomes sit with government sources — the practice does not certify eligibility.</p>
<ul>
<li>Use the tool above only if those rules may apply to you.</li>
<li>When your pathway is clear, discuss sessions and start timing against an established book (${escapeHtml(OFFER.activePatientFiles)} patient files) and ${escapeHtml(String(OFFER.consultRooms))} consulting rooms.</li>
<li>Next pages: <a href="${h.join}provider-number-readiness.html">Provider numbers</a> · <a href="${h.join}gp-faq.html">GP FAQ</a> · <a href="${h.eoi}">Confidential conversation</a>.</li>
</ul>
</section>
<!--recruitment-page-depth:end-->`;
  }

  if (key === "session-planner.html") {
    return `<!--recruitment-page-depth:start-->
<section class="article-section" data-recruitment-page-depth="sessions" aria-labelledby="sessions-depth-heading">
<h2 id="sessions-depth-heading">Flexibility against real capacity</h2>
<p>${OFFER.openSevenDays ? "The practice is open seven days so patients can access care — weekend sessions are not a blanket requirement for every GP." : "Consulting days are agreed individually."} Preferred days below are notes for you; rooms and nursing cover are confirmed in conversation across ${escapeHtml(String(OFFER.consultRooms))} consulting rooms.</p>
<ul>
<li>Part-time, permanent sessions and staged growth can be discussed — reliability for patients and the team matters more than a casual marketplace.</li>
<li>Nursing cover (${escapeHtml(OFFER.nurses)} on roster) and reception booking flow shape what days are realistic.</li>
<li>Related: <a href="${h.join}practice-support.html">Practice Support</a> · <a href="${h.about}continuity-in-practice.html">Continuity in Practice</a> · <a href="${h.eoi}">Confidential conversation</a>.</li>
</ul>
</section>
<!--recruitment-page-depth:end-->`;
  }

  if (key === "gp-opportunities.html") {
    return `<!--recruitment-page-depth:start-->
<section class="article-section" data-recruitment-page-depth="opportunities" aria-labelledby="opp-depth-heading">
<h2 id="opp-depth-heading">Opportunity clarity</h2>
<p>${escapeHtml(offerPatientDemandSupport(OFFER))}</p>
<ul>
<li><strong>Income model:</strong> ${escapeHtml(OFFER.billingPercentage)} billings${OFFER.negotiable ? " (negotiable)" : ""}${HOURLY ? `; ${escapeHtml(HOURLY)} for ${escapeHtml(OFFER.guaranteeDuration)} where offered` : ""}.</li>
<li><strong>Support:</strong> ${escapeHtml(offerScaleLine(OFFER))} · ${escapeHtml(String(OFFER.consultRooms))} rooms${OFFER.agpalAccredited ? " · AGPAL accredited" : ""}.</li>
<li><strong>Special interests:</strong> explore <a href="${h.about}clinical-interests.html">Clinical Interests</a> inside general practice — not as a parallel specialty clinic.</li>
<li><strong>Long-term success:</strong> continuity relationships, protected consulting time, and a community already booking into HotDoc and phone pathways.</li>
</ul>
</section>
<!--recruitment-page-depth:end-->`;
  }

  if (key === "community-catchment.html") {
    return `<!--recruitment-page-depth:start-->
<section class="article-section" data-recruitment-page-depth="community" aria-labelledby="community-depth-heading">
<h2 id="community-depth-heading">Demand and continuity in this catchment</h2>
<p>${escapeHtml(offerPatientDemandSupport(OFFER))} The catchment is inner-south Brisbane around ${escapeHtml(OFFER.locationLabel)} — Mater and Princess Alexandra Hospitals nearby, with onsite pathology, chemistry and parking supporting day-to-day care.</p>
<p>For GPs: <a href="${h.about}continuity-in-practice.html">Continuity in Practice</a> · <a href="${h.join}gp-opportunities.html">GP Opportunities</a> · <a href="${h.hub}">Join Our Team</a></p>
</section>
<!--recruitment-page-depth:end-->`;
  }

  if (key === "continuity-in-practice.html") {
    return `<!--recruitment-page-depth:start-->
<section class="article-section" data-recruitment-page-depth="continuity" aria-labelledby="continuity-depth-heading">
<h2 id="continuity-depth-heading">Why continuity is the career model</h2>
<p>Long-term GP careers here are built on return bookings and unfinished clinical stories staying with the session — supported by ${escapeHtml(OFFER.nurses)} nurses, reception workflows and ${OFFER.agpalAccredited ? "AGPAL-aligned" : "accredited"} systems across ${escapeHtml(String(OFFER.consultRooms))} rooms.</p>
<p>Next: <a href="${h.about}clinical-interests.html">Clinical Interests</a> · <a href="${h.join}gp-opportunities.html">GP Opportunities</a> · <a href="${h.eoi}">Confidential conversation</a></p>
</section>
<!--recruitment-page-depth:end-->`;
  }

  if (key === "clinical-interests.html") {
    return `<!--recruitment-page-depth:start-->
<section class="article-section" data-recruitment-page-depth="interests" aria-labelledby="interests-depth-heading">
<h2 id="interests-depth-heading">Interests inside an established book</h2>
<p>Special interests sit inside family medicine and continuity — not as a replacement for general practice. The patient community (${escapeHtml(OFFER.activePatientFiles)} files) and appointment demand give room for interests to grow where capacity and clinical governance allow.</p>
<p>Related: <a href="${h.about}practice-experience.html">Practice Experience</a> · <a href="${h.join}gp-opportunities.html">GP Opportunities</a> · <a href="${h.join}practice-support.html">Practice Support</a></p>
</section>
<!--recruitment-page-depth:end-->`;
  }

  return "";
}

function insertBeforeRecommendedNext(html: string, block: string): string {
  if (!block) return html;
  if (/data-attraction-next|Recommended next|id="recommended-next"/i.test(html)) {
    const next = html.replace(
      /(<section\b[^>]*(?:data-attraction-next|id="recommended-next")[^>]*>)/i,
      `${block}$1`,
    );
    if (next !== html) return next;
  }
  if (/<\/main>/i.test(html)) return html.replace(/<\/main>/i, `${block}</main>`);
  return `${html}${block}`;
}

function insertAfterFirstArticleSection(html: string, block: string): string {
  if (!block) return html;
  const match = html.match(/<section\b[^>]*class="[^"]*article-section[^"]*"[^>]*>[\s\S]*?<\/section>/i);
  if (match && match.index != null) {
    const end = match.index + match[0].length;
    return `${html.slice(0, end)}\n${block}${html.slice(end)}`;
  }
  return insertBeforeRecommendedNext(html, block);
}

/**
 * Enrich Attraction / PE recruitment HTML with verified authority proof and thin-page depth.
 */
export function enrichRecruitmentAuthorityPages(html: string, pagePath: string): string {
  const normalized = pagePath.replace(/^\/+/, "").replace(/\\/g, "/");
  if (normalized === "join-our-team.html") return html;
  if (!JOIN_CHILD.test(normalized) && !PE_CHILD.test(normalized)) return html;

  let next = html;

  if (!/data-recruitment-authority-panel="true"/i.test(next)) {
    next = next.replace(
      /<!--recruitment-authority-panel:start-->[\s\S]*?<!--recruitment-authority-panel:end-->\s*/gi,
      "",
    );
    next = insertAfterFirstArticleSection(next, authoritySnapshotHtml(normalized));
  }

  if (!/data-recruitment-page-depth=/i.test(next)) {
    next = next.replace(
      /<!--recruitment-page-depth:start-->[\s\S]*?<!--recruitment-page-depth:end-->\s*/gi,
      "",
    );
    const depth = pageDepthHtml(normalized);
    if (depth) next = insertBeforeRecommendedNext(next, depth);
  }

  // Minimal presentation polish for new panels (no redesign). Re-inject after public-ux
  // style strip so applyPublicUxRefinements stays idempotent on re-apply.
  next = next.replace(/<style\b[^>]*id="wmc-recruitment-authority-enrich"[\s\S]*?<\/style>\s*/gi, "");
  if (/data-recruitment-authority-panel="true"/i.test(next)) {
    const style = `<style id="wmc-recruitment-authority-enrich">
.recruitment-authority-panel,.article-section[data-recruitment-page-depth]{margin:1.5rem 0}
.recruitment-authority-proof{margin:.75rem 0 1rem;padding:0;list-style:none;display:grid;gap:.55rem}
.recruitment-authority-proof li{padding:.65rem .85rem;border:1px solid rgba(22,61,104,.14);border-radius:12px;background:#f7fafc;line-height:1.45}
.recruitment-authority-links{margin:0;font-size:.95rem}
.recruitment-authority-links a{font-weight:600}
</style>`;
    next = next.includes("</head>") ? next.replace(/<\/head>/i, `${style}</head>`) : `${style}${next}`;
  }

  return next;
}
