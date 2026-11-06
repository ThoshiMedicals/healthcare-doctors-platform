/**
 * Single source of truth for public GP recruitment facts.
 * Join Our Team, vacancy cards, FAQ and opportunity pages must read from here.
 * Do not hard-code competing numbers elsewhere.
 */
export type RecruitmentOfferConfig = {
  billingPercentage: string;
  billingSplitLabel: string;
  negotiable: boolean;
  hourlyGuarantee: string;
  guaranteeDuration: string;
  activePatientFiles: string;
  consultRooms: number;
  /** Public roster scale — may include a trailing + for “or more”. */
  gps: string;
  nurses: string;
  agpalAccredited: boolean;
  openSevenDays: boolean;
  locationLabel: string;
  streetAddress: string;
  clinicDisplayName: string;
};

export const WMC_RECRUITMENT_OFFER: RecruitmentOfferConfig = {
  billingPercentage: "75%",
  billingSplitLabel: "75/25",
  negotiable: true,
  hourlyGuarantee: "$250/hr",
  guaranteeDuration: "agreed sessions",
  activePatientFiles: "70,000+",
  consultRooms: 11,
  gps: "10+",
  nurses: "5+",
  agpalAccredited: true,
  openSevenDays: true,
  locationLabel: "Woolloongabba, Brisbane",
  streetAddress: "468 Vulture Street, Woolloongabba QLD 4102",
  clinicDisplayName: "Woolloongabba Medical Centre",
};

export function offerPatientDemandHeadline(): string {
  return "Established Patient Demand";
}

export function offerPatientDemandSupport(offer: RecruitmentOfferConfig = WMC_RECRUITMENT_OFFER): string {
  return `Supported by an established patient community, ${offer.activePatientFiles} patient files and ongoing appointment demand.`;
}

export function offerHasHourlyGuarantee(offer: RecruitmentOfferConfig = WMC_RECRUITMENT_OFFER): boolean {
  return Boolean(offer.hourlyGuarantee.trim() && offer.guaranteeDuration.trim());
}

/** Compact public line for hero / snapshot — minimum payment framing. */
export function offerHourlyMinimumLine(offer: RecruitmentOfferConfig = WMC_RECRUITMENT_OFFER): string {
  if (!offer.hourlyGuarantee.trim()) return "";
  return `${offer.hourlyGuarantee} Minimum`;
}

export function offerBillingHeadline(offer: RecruitmentOfferConfig = WMC_RECRUITMENT_OFFER): string {
  return offer.negotiable
    ? `${offer.billingPercentage} billings (negotiable arrangements available)`
    : `${offer.billingPercentage} billings`;
}

export function offerFeaturedHighlights(offer: RecruitmentOfferConfig = WMC_RECRUITMENT_OFFER): string[] {
  // Role-facing vacancy pills — commercial % / guarantee live in rail + commercial strip.
  const items = ["Established Patient Demand", "Flexible Consulting Sessions"];
  if (offer.agpalAccredited) items.push("AGPAL Accredited Practice");
  if (offerHasHourlyGuarantee(offer)) {
    items.unshift(`${offer.hourlyGuarantee} for ${offer.guaranteeDuration}`);
  }
  return items;
}

export function offerScaleLine(offer: RecruitmentOfferConfig = WMC_RECRUITMENT_OFFER): string {
  return `${offer.gps} GPs · ${offer.nurses} Nurses`;
}

export function offerFaqBillingAnswer(offer: RecruitmentOfferConfig = WMC_RECRUITMENT_OFFER): string {
  const negotiable = offer.negotiable
    ? " Arrangements remain negotiable for the right candidate and are confirmed privately against sessions, experience and start timing."
    : "";
  const guarantee = offerHasHourlyGuarantee(offer)
    ? ` Where offered, an hourly guarantee of ${offer.hourlyGuarantee} may apply for ${offer.guaranteeDuration}.`
    : "";
  return `${offer.clinicDisplayName} offers a ${offer.billingPercentage} billings model for GPs (${offer.billingSplitLabel} split).${negotiable}${guarantee} Detailed commercial terms are confirmed in a confidential discussion — not as a one-size public rate card.`;
}

export function offerFaqPercentageAnswer(offer: RecruitmentOfferConfig = WMC_RECRUITMENT_OFFER): string {
  return `Yes. The published model is ${offer.billingPercentage} billings to the GP (${offer.billingSplitLabel})${
    offer.negotiable ? ", with negotiable arrangements available for the right candidate" : ""
  }. Suitable doctors receive a clear explanation of billings, practice fees and support services before any commitment.`;
}

/** Public remuneration line for GP roles — only verified offer facts. */
export function offerPublicRemunerationNote(offer: RecruitmentOfferConfig = WMC_RECRUITMENT_OFFER): string {
  return offer.negotiable
    ? `${offer.billingPercentage} billings (negotiable)`
    : `${offer.billingPercentage} billings`;
}

const REMUNERATION_CLAIM_RE =
  /(\$\s*\d|\d+\s*%|per\s*hour|\/\s*hr|billings?|guarantee|remunerat|rate\s*card|hourly)/i;

function isVerifiedHourlyGuaranteeClaim(text: string, offer: RecruitmentOfferConfig): boolean {
  if (!offerHasHourlyGuarantee(offer)) return false;
  const lower = text.toLowerCase();
  return (
    lower.includes(offer.hourlyGuarantee.toLowerCase()) &&
    lower.includes(offer.guaranteeDuration.toLowerCase())
  );
}

function isVerifiedBillingClaim(text: string, offer: RecruitmentOfferConfig): boolean {
  const lower = text.toLowerCase();
  if (!/(billings?|\d+\s*%|\d+\s*\/\s*\d+)/i.test(text)) return false;
  if (/guarantee|per\s*hour|\/\s*hr|\$\s*\d/i.test(text) && !isVerifiedHourlyGuaranteeClaim(text, offer)) {
    return false;
  }
  return (
    lower.includes(offer.billingPercentage.toLowerCase()) ||
    lower.includes(offer.billingSplitLabel.toLowerCase())
  );
}

/**
 * Strip unverified remuneration / guarantee claims from CMS vacancy bullets.
 * GP roles keep non-commercial bullets and inject the verified billings line once.
 */
export function sanitizeVacancyOfferHighlights(
  highlights: string[],
  options: { isGpRole: boolean; offer?: RecruitmentOfferConfig } = { isGpRole: false },
): string[] {
  const offer = options.offer ?? WMC_RECRUITMENT_OFFER;
  const kept: string[] = [];
  let sawVerifiedGuarantee = false;

  for (const raw of highlights) {
    const item = raw.replace(/\s+/g, " ").trim();
    if (!item) continue;
    if (!REMUNERATION_CLAIM_RE.test(item)) {
      kept.push(item);
      continue;
    }
    if (isVerifiedHourlyGuaranteeClaim(item, offer)) {
      if (!sawVerifiedGuarantee) {
        kept.push(`${offer.hourlyGuarantee} for ${offer.guaranteeDuration}`);
        sawVerifiedGuarantee = true;
      }
      continue;
    }
    if (options.isGpRole && isVerifiedBillingClaim(item, offer)) {
      // Verified billing claims are collapsed into a single SSoT line below.
      continue;
    }
    // Unverified remuneration / guarantee — drop.
  }

  if (options.isGpRole) {
    const billingLine = `${offer.billingPercentage} Billings`;
    if (!kept.some((h) => h.toLowerCase() === billingLine.toLowerCase())) {
      kept.unshift(billingLine);
    }
  }

  return Array.from(new Set(kept));
}

/**
 * Public remuneration meta for vacancy cards.
 * GP roles always use offer config. Non-GP notes are dropped if they look like GP billing/guarantee claims.
 */
export function resolvePublicRemunerationNote(
  remunerationNote: string,
  options: { isGpRole: boolean; featured?: boolean; offer?: RecruitmentOfferConfig },
): string {
  const offer = options.offer ?? WMC_RECRUITMENT_OFFER;
  const note = remunerationNote.replace(/\s+/g, " ").trim();

  if (options.isGpRole) {
    if (!note) {
      return options.featured ? offerPublicRemunerationNote(offer) : "";
    }
    if (isVerifiedBillingClaim(note, offer) && !/guarantee|per\s*hour|\/\s*hr|\$\s*\d/i.test(note)) {
      return offerPublicRemunerationNote(offer);
    }
    if (isVerifiedHourlyGuaranteeClaim(note, offer)) {
      return `${offer.hourlyGuarantee} for ${offer.guaranteeDuration}`;
    }
    // Unverified CMS remuneration — replace with offer when featured, else omit.
    return options.featured ? offerPublicRemunerationNote(offer) : "";
  }

  if (!note) return "";
  if (REMUNERATION_CLAIM_RE.test(note)) return "";
  return note;
}
