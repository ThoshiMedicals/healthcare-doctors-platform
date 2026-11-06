import type { Prisma } from "@prisma/client";
import {
  offerFaqBillingAnswer,
  offerFaqPercentageAnswer,
  WMC_RECRUITMENT_OFFER,
} from "@/recruitment/offer-config";
import { SYNTHETIC_INTERNAL } from "./markers";

const FAQS = [
  {
    id: "billing-model",
    topic: "Billing model",
    question: "What billing model do GPs work under at Woolloongabba Medical Centre?",
    answer: offerFaqBillingAnswer(),
  },
  {
    id: "percentage-arrangements",
    topic: "Percentage arrangements",
    question: "Do you offer a percentage arrangement for GPs?",
    answer: offerFaqPercentageAnswer(),
  },
  {
    id: "nursing-support",
    topic: "Nursing support",
    question: "What nursing support is available to GPs?",
    answer:
      "Our nursing team works alongside GPs to support coordinated, patient-centred care. Nurses assist with treatment-room activity, preventive healthcare and vaccination pathways where appropriate, and help with follow-up and care coordination. The aim is practical clinical support around the consultation so you can focus on continuity and clinical judgement.",
  },
  {
    id: "reception-support",
    topic: "Reception support",
    question: "How does reception support GP consulting?",
    answer:
      "An experienced reception team manages appointments, patient enquiries and the day-to-day flow of the practice. Reception helps patients find the right appointment type, supports check-in, and works with clinical and practice-management teams so consulting time stays protected. Online booking is available through HotDoc alongside phone bookings.",
  },
  {
    id: "session-flexibility",
    topic: "Session flexibility",
    question: "Are flexible GP sessions available?",
    answer:
      "Yes. We welcome conversations about permanent sessions, part-time arrangements and staged growth of a consulting footprint. Flexibility means a clear agreement on days and reliability for patients and the team — not a casual locum marketplace. Session availability depends on rooms, nursing cover and practice need, and is confirmed individually.",
  },
  {
    id: "clinical-autonomy",
    topic: "Clinical autonomy",
    question: "Will I have clinical autonomy as a GP at Woolloongabba Medical Centre?",
    answer: `Yes. GPs practise with professional clinical autonomy within Australian standards, AHPRA expectations and our practice policies. We value clinical judgement, continuity of care and respectful teamwork. Autonomy sits alongside ${
      WMC_RECRUITMENT_OFFER.agpalAccredited ? "AGPAL-aligned" : "accredited"
    } governance, privacy and safety systems — structure that supports care, rather than replacing your decision-making.`,
  },
  {
    id: "technology-systems",
    topic: "Technology systems",
    question: "What technology systems does the practice use?",
    answer:
      "The practice uses digital systems to support appointments, clinical records and everyday operations, including HotDoc for online booking. We also maintain structured practice information for privacy, recalls and quality processes. Exact clinical software and workflow details are shared during onboarding conversations so you can assess fit with how you prefer to work.",
  },
  {
    id: "agpal-accreditation",
    topic: "AGPAL accreditation",
    question: "Is Woolloongabba Medical Centre AGPAL accredited?",
    answer: WMC_RECRUITMENT_OFFER.agpalAccredited
      ? `Yes. ${WMC_RECRUITMENT_OFFER.clinicDisplayName} is an AGPAL-accredited general practice at ${WMC_RECRUITMENT_OFFER.streetAddress}. Accreditation means independent assessment against RACGP Standards for general practices under the National General Practice Accreditation Scheme. It supports systems for safety, quality, governance, infection prevention, privacy and continuous improvement — not an advertising award.`
      : `${WMC_RECRUITMENT_OFFER.clinicDisplayName} maintains accredited general practice systems at ${WMC_RECRUITMENT_OFFER.streetAddress}. Ask the practice for the current accreditation status during a confidential discussion.`,
  },
  {
    id: "registrars",
    topic: "Registrars",
    question: "Do you accept GP registrars?",
    answer:
      "Expressions of interest from GP registrars are welcome. Supervision capacity, training alignment and timing vary, so registrar placements are considered against current practice needs rather than as an always-open intake. If you are a registrar, tell us your training stage and preferred sessions in your expression of interest and we will advise honestly.",
  },
  {
    id: "provider-number-support",
    topic: "Provider number support",
    question: "Can the practice help with my Medicare provider number?",
    answer:
      "Medicare provider numbers are issued by Services Australia — not by Woolloongabba Medical Centre. We do not issue, approve or guarantee provider numbers. What we can do is share accurate practice location details to support your Services Australia application, and help you understand onboarding steps once your provider-number pathway is clear.",
  },
  {
    id: "parking-location",
    topic: "Parking and location",
    question: "Where is the practice and is parking available for GPs?",
    answer: `We are at ${WMC_RECRUITMENT_OFFER.streetAddress}, in Brisbane’s inner south near major hospitals and with Translink public transport options. Patient parking is available near the medical centre, including disability parking. For precise parking and arrival guidance, use ${WMC_RECRUITMENT_OFFER.streetAddress} as the destination, follow on-site medical-centre signage, or call reception on (07) 3217 3344.`,
  },
  {
    id: "clinical-interests",
    topic: "Clinical interests",
    question: "Can I bring clinical interests into general practice here?",
    answer:
      "Yes, when they serve local patients and sit within credentialing, team capacity and safe scope. We remain a general practice first — interests strengthen continuity care rather than replace it. Tell us your interests in an expression of interest so we can discuss fit honestly.",
  },
] as const;

export const GP_FAQ_BODY: Prisma.InputJsonValue = {
  ...SYNTHETIC_INTERNAL,
  schemaTypes: ["FAQPage", "WebPage", "MedicalClinic", "BreadcrumbList"],
  metaTitle: "GP FAQ | Woolloongabba Medical Centre",
  metaDescription:
    "Answers GPs ask about joining Woolloongabba Medical Centre — billing conversations, nursing, sessions, accreditation and provider-number boundaries.",
  honestyLine: `Straight answers from the practice. Published commercial headline: ${WMC_RECRUITMENT_OFFER.billingPercentage} billings${WMC_RECRUITMENT_OFFER.negotiable ? " (negotiable)" : ""}. We do not issue Medicare provider numbers.`,
  copy: "Questions doctors often ask before getting in touch.",
  h2: "Questions doctors ask about joining",
  faqs: FAQS.map(({ id, topic, question, answer }) => ({ id, topic, question, answer })),
  faqPageAnswers: FAQS.map(({ question, answer }) => ({
    question,
    acceptedAnswer: answer,
  })),
};
