import {
  WMC_RECRUITMENT_CONTACT,
  recruitmentMailtoHref,
  resolveRecruitmentContact,
  type RecruitmentContactConfig,
} from "./contact";
import {
  WMC_RECRUITMENT_OFFER,
  offerHourlyMinimumLine,
  type RecruitmentOfferConfig,
} from "./offer-config";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeHtmlAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

/**
 * Compact left-rail evidence panel for Join Our Team.
 * Facts only — not navigation, journey, or resource directory.
 */
export function renderRecruitmentEvidencePanelHtml(options: {
  eoiHref: string;
  phoneDisplay?: string;
  phoneTel?: string;
  opportunityHref?: string;
  offer?: RecruitmentOfferConfig;
  contact?: RecruitmentContactConfig;
}): string {
  const offer = options.offer ?? WMC_RECRUITMENT_OFFER;
  const contact =
    options.contact ??
    resolveRecruitmentContact(
      { phoneDisplay: options.phoneDisplay, phoneTel: options.phoneTel },
      options.eoiHref,
    );
  const opportunityHref = escapeHtmlAttr(options.opportunityHref ?? "#current-opportunities");
  const eoiHref = escapeHtmlAttr(options.eoiHref);
  const mailHref = escapeHtmlAttr(recruitmentMailtoHref(contact.email, offer));
  const hourlyMinimum = offerHourlyMinimumLine(offer);
  // Commercial hierarchy: rail owns billings / guarantee / patient files only.
  const snapshotItems = [
    `${offer.billingPercentage} Billings`,
    ...(hourlyMinimum ? [hourlyMinimum] : []),
    `${offer.activePatientFiles} Patient Files`,
  ];

  return `<aside class="gp-recruit-evidence-panel" aria-label="Recruitment evidence" data-recruitment-evidence-panel="true">
<section class="gp-recruit-evidence-block" aria-labelledby="evidence-snapshot-heading">
<p class="gp-recruit-evidence-label" id="evidence-snapshot-heading">Opportunity Snapshot</p>
<ul class="gp-recruit-evidence-facts">
${snapshotItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
</ul>
</section>
<section class="gp-recruit-evidence-block" aria-labelledby="evidence-opportunity-heading">
<p class="gp-recruit-evidence-label" id="evidence-opportunity-heading">Current Opportunity</p>
<p class="gp-recruit-evidence-title">VR General Practitioner</p>
<p class="gp-recruit-evidence-meta">Woolloongabba · Flexible sessions</p>
<a class="gp-recruit-evidence-link" href="${opportunityHref}">View Opportunity</a>
</section>
<section class="gp-recruit-evidence-block" aria-labelledby="evidence-contact-heading">
<p class="gp-recruit-evidence-label" id="evidence-contact-heading">Confidential Contact</p>
<p class="gp-recruit-evidence-title">${escapeHtml(contact.name)}</p>
<p class="gp-recruit-evidence-meta">${escapeHtml(contact.role || WMC_RECRUITMENT_CONTACT.role)}</p>
<ul class="gp-recruit-evidence-channels">
<li><a href="tel:${escapeHtmlAttr(contact.phoneTel)}">Phone</a></li>
<li><a href="${mailHref}">Email</a></li>
</ul>
<a class="gp-recruit-evidence-link gp-recruit-evidence-link--accent" href="${eoiHref}">Request Callback</a>
</section>
<section class="gp-recruit-evidence-block gp-recruit-evidence-block--trust" aria-labelledby="evidence-confidentiality-heading">
<p class="gp-recruit-evidence-label" id="evidence-confidentiality-heading">Confidentiality</p>
<ul class="gp-recruit-evidence-trust">
<li><span aria-hidden="true">✓</span>No CV required</li>
<li><span aria-hidden="true">✓</span>Confidential discussion</li>
<li><span aria-hidden="true">✓</span>Current employer will not be contacted</li>
</ul>
</section>
</aside>`;
}
