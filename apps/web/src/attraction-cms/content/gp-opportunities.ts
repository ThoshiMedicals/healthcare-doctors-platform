import type { Prisma } from "@prisma/client";
import {
  offerBillingHeadline,
  WMC_RECRUITMENT_OFFER,
} from "@/recruitment/offer-config";
import { SYNTHETIC_INTERNAL } from "./markers";

/** Publish-ready GP Opportunities body — employer-brand decision page, not a job board. */
export const GP_OPPORTUNITIES_BODY: Prisma.InputJsonValue = {
  ...SYNTHETIC_INTERNAL,
  schemaTypes: ["WebPage", "BreadcrumbList", "MedicalClinic", "FAQPage"],
  metaTitle: "GP Opportunities | Woolloongabba Medical Centre",
  metaDescription:
    "Understand practice fit at Woolloongabba Medical Centre — continuity, nursing support, flexible sessions and clinical interests inside community general practice.",
  honestyLine: `Use this to decide suitability — whether this practice is likely to fit you. Published commercial headline: ${offerBillingHeadline()}. Advertised roles below are managed by the practice and may change.`,
  copy: `Practice experience and fit at ${WMC_RECRUITMENT_OFFER.clinicDisplayName} — continuity, team support and clinical autonomy within ${WMC_RECRUITMENT_OFFER.agpalAccredited ? "AGPAL-aligned" : "accredited"} systems.`,
  h1: "Is Woolloongabba Medical Centre the right practice for you?",
  lede: `We practise continuity and long-term relationships across ${WMC_RECRUITMENT_OFFER.activePatientFiles} active patient files and ${WMC_RECRUITMENT_OFFER.consultRooms} consult rooms. See any current roles early, then judge fit — commercial detail starts from ${offerBillingHeadline()}.`,
  sections: [
    {
      id: "decision-hero",
      eyebrow: "GP Opportunities",
      heading: "Could you work here?",
      body: "Current roles appear first when we are hiring. Below that: how consulting days, nursing, reception and continuity actually work — so you can decide whether a conversation makes sense.",
    },
    {
      id: "philosophy",
      eyebrow: "How we practise",
      heading: "Continuity on an established book",
      bullets: [
        `${WMC_RECRUITMENT_OFFER.activePatientFiles} active patient files — return bookings and notes stay with the session.`,
        `Clinical autonomy within Australian standards${WMC_RECRUITMENT_OFFER.agpalAccredited ? " and AGPAL-aligned practice policy" : ""}.`,
        `${WMC_RECRUITMENT_OFFER.nurses} nurses and reception protect consulting time across ${WMC_RECRUITMENT_OFFER.consultRooms} rooms.`,
      ],
    },
    {
      id: "community-care",
      heading: "Community care",
      body: `We care for people across ${WMC_RECRUITMENT_OFFER.locationLabel} and neighbouring inner-south Brisbane suburbs — everyday health needs, changing life stages, and relationships that build over time.`,
    },
    {
      id: "commercial-terms",
      heading: "Commercial terms",
      body: `Published model: ${offerBillingHeadline()}. Session footprint is confirmed against rooms, nursing cover and practice need. A public vacancy does not replace a confidential discussion.`,
    },
    {
      id: "flexibility",
      heading: "Flexible consulting",
      body: `Permanent sessions, part-time arrangements and staged growth can be discussed across ${WMC_RECRUITMENT_OFFER.consultRooms} consult rooms with ${WMC_RECRUITMENT_OFFER.nurses} nurses on roster. Flexibility means a clear agreement on days and reliability — confirmed individually.`,
    },
    {
      id: "clinical-interests",
      heading: "Clinical interests inside general practice",
      body: "Interests that strengthen community general practice are welcome when they fit local need, credentialing and team capacity. We remain a general practice first — interests sit inside continuity care, not instead of it.",
      examples: [
        "Women’s health & antenatal care",
        "Skin checks & minor procedures",
        "Chronic disease management",
        "Mental health in primary care",
        "Children’s & adolescent health",
        "Preventive & lifestyle medicine",
      ],
    },
    {
      id: "collaboration",
      heading: "Professional collaboration",
      body: "GPs practise alongside nurses, reception, practice management and allied health where relevant — colleagues you can ask and co-manage with, without replacing your professional judgement.",
    },
    {
      id: "facilities",
      heading: "Practice facilities",
      body: "Facilities exist to protect consulting time.",
      items: [
        "Consulting rooms suited to continuity-based general practice",
        "Nursing support for treatment-room and preventive pathways where appropriate",
        "Reception managing appointments, enquiries and patient flow",
        "Online booking (HotDoc) alongside phone bookings",
        ...(WMC_RECRUITMENT_OFFER.agpalAccredited
          ? ["Policies aligned with AGPAL expectations for privacy, safety and quality"]
          : ["Policies aligned with accredited general practice expectations for privacy, safety and quality"]),
        `Inner-south Brisbane location at ${WMC_RECRUITMENT_OFFER.streetAddress} — near major hospitals, with public transport nearby`,
        "Patient parking near the medical centre, including disability parking",
      ],
    },
    {
      id: "support-boundaries",
      heading: "What the practice can and cannot do",
      canAssist: [
        "Share verified practice location details for Services Australia paperwork",
        "Orient you to rooms, emergency processes, privacy and day-to-day workflows",
        "Introduce nursing and reception pathways that protect consulting time",
        "Discuss session patterns against room and nursing capacity",
      ],
      cannotApprove: [
        "Medicare provider numbers",
        "DPA (Distribution Priority Area) or Health Insurance Act s19AB outcomes",
        "Visas, work rights, or migration outcomes",
        "Guaranteed patient volume, or earnings or hourly guarantees beyond the published Recruitment Offer Config",
      ],
    },
    {
      id: "composite-voices",
      heading: "Placeholder doctor voices (synthetic)",
      note: "Composite role voices — not named practitioners; not consented testimonials.",
      stories: [
        {
          id: "voice-established",
          roleLabel: "Composite GP · established",
          text: "The book mixes acute and review work. Notes stay with the session so the next visit has context.",
        },
        {
          id: "voice-part-time",
          roleLabel: "Composite GP · part-week continuity",
          text: "Fewer days still work when recalls, results habits and buddy cover keep the list coherent for patients.",
        },
        {
          id: "voice-interest",
          roleLabel: "Composite GP · clinical interest inside GP",
          text: "Interest clinics only work here when nursing, rooms and credentialing keep them inside ordinary community care.",
        },
      ],
    },
    {
      id: "decision-faq",
      heading: "Questions doctors often ask",
      body: "See the GP FAQ for the full set of straight answers before you write or call.",
    },
    {
      id: "cta",
      heading: "Next step",
      body: "If the practice shape fits how you want to work, express interest with the practice. Session availability, start timing and the full commercial arrangement are discussed privately with suitable doctors.",
      ctaLabel: "Express interest with the practice",
      ctaHref: "express-interest.html",
    },
  ],
};
