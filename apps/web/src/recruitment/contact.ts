import type { ClinicBranding } from "@/clinics/branding";
import { WMC_RECRUITMENT_OFFER } from "./offer-config";

export type RecruitmentContactConfig = {
  name: string;
  role: string;
  email: string;
  phoneDisplay: string;
  phoneTel: string;
  label: string;
  note: string;
  eoiHref: string;
};

export const WMC_RECRUITMENT_CONTACT = {
  name: "Roshan Samarawickrema",
  role: "Practice Operations",
  email: "roshan@tmedicals.com.au",
  /** Direct recruitment mobile — not the patient clinic reception line. */
  phoneDisplay: "0481 706 474",
  phoneTel: "0481706474",
  label: "Confidential GP Recruitment Contact",
  note: "Confidential GP recruitment discussions. No CV required for an initial conversation.",
} as const;

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

export function phoneTelHref(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("0")) return `+61${cleaned.slice(1)}`;
  if (cleaned.startsWith("61")) return `+${cleaned}`;
  return cleaned;
}

/** Inbox-filterable subject for GP recruitment mailtos. */
export function recruitmentMailtoSubject(
  offer: typeof WMC_RECRUITMENT_OFFER = WMC_RECRUITMENT_OFFER,
): string {
  // Keep “Woolloongabba” explicit so filters work even when the clinic name varies.
  const suburb = offer.locationLabel.split(",")[0]?.trim() || "Woolloongabba";
  return `GP opportunity — ${suburb}`;
}

/** Short prefilled body — enough structure to reply, no CV required. */
export function recruitmentMailtoBody(
  offer: typeof WMC_RECRUITMENT_OFFER = WMC_RECRUITMENT_OFFER,
): string {
  return [
    `Hi ${WMC_RECRUITMENT_CONTACT.name.split(" ")[0]},`,
    "",
    `I'm interested in the GP opportunity at ${offer.clinicDisplayName}.`,
    "",
    "Name:",
    "Preferred contact (phone or email):",
    "Availability / sessions of interest:",
    "",
    "Thanks,",
  ].join("\n");
}

export function recruitmentMailtoHref(
  email: string = WMC_RECRUITMENT_CONTACT.email,
  offer: typeof WMC_RECRUITMENT_OFFER = WMC_RECRUITMENT_OFFER,
): string {
  const subject = encodeURIComponent(recruitmentMailtoSubject(offer));
  const body = encodeURIComponent(recruitmentMailtoBody(offer));
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

export function resolveRecruitmentContact(
  _branding?: Partial<ClinicBranding>,
  eoiHref = "join-our-team/express-interest.html",
): RecruitmentContactConfig {
  return {
    name: WMC_RECRUITMENT_CONTACT.name,
    role: WMC_RECRUITMENT_CONTACT.role,
    email: WMC_RECRUITMENT_CONTACT.email,
    phoneDisplay: WMC_RECRUITMENT_CONTACT.phoneDisplay,
    phoneTel: phoneTelHref(WMC_RECRUITMENT_CONTACT.phoneTel),
    label: WMC_RECRUITMENT_CONTACT.label,
    note: WMC_RECRUITMENT_CONTACT.note,
    eoiHref,
  };
}

export function renderRecruitmentContactHtml(
  contact: RecruitmentContactConfig,
  options: { className?: string; compact?: boolean } = {},
): string {
  const cls = ["gp-recruit-contact-card", options.className].filter(Boolean).join(" ");
  const mailHref = escapeHtmlAttr(recruitmentMailtoHref(contact.email));
  return `<aside class="${cls}" aria-label="Confidential GP recruitment contact" data-recruitment-contact="true">
<p class="gp-recruit-contact-label">${escapeHtml(contact.label)}</p>
<p class="gp-recruit-contact-name">${escapeHtml(contact.name)}</p>
<p class="gp-recruit-contact-role">${escapeHtml(contact.role)}</p>
<p class="gp-recruit-contact-note">${escapeHtml(contact.note)}</p>
<ul class="gp-recruit-contact-channels">
<li><a aria-label="Call ${escapeHtmlAttr(contact.name)} about joining" href="tel:${escapeHtmlAttr(contact.phoneTel)}">Call</a></li>
<li><a aria-label="Email ${escapeHtmlAttr(contact.name)} about the GP opportunity" href="${mailHref}">Email</a></li>
<li><a href="${escapeHtmlAttr(contact.eoiHref)}">Request a callback</a></li>
</ul>
</aside>`;
}

export function renderConfidentialityPanelHtml(variant: "light" | "dark" = "light"): string {
  const cls =
    variant === "dark" ? "gp-recruit-trust-panel gp-recruit-trust-panel--dark" : "gp-recruit-trust-panel";
  return `<aside class="${cls}" aria-label="Confidentiality assurances" data-recruitment-confidentiality="true">
<h3>Confidential Means Confidential</h3>
<ul>
<li>Your enquiry is reviewed only by ${escapeHtml(WMC_RECRUITMENT_OFFER.clinicDisplayName)} recruitment representatives.</li>
<li>We will never contact your current employer.</li>
<li>No CV is required for an initial discussion.</li>
<li>No obligations. No commitments. Just a private conversation.</li>
</ul>
</aside>`;
}

export function eoiHrefForPage(pagePath: string): string {
  if (pagePath.startsWith("join-our-team/")) return "express-interest.html";
  if (pagePath.startsWith("about-us/")) return "../join-our-team/express-interest.html";
  return "join-our-team/express-interest.html";
}
