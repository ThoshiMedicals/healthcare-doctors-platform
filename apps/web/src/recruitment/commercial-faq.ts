import { WMC_RECRUITMENT_CONTACT } from "./contact";
import {
  offerFaqBillingAnswer,
  WMC_RECRUITMENT_OFFER,
  type RecruitmentOfferConfig,
} from "./offer-config";

export type CommercialFaqItem = {
  id: string;
  question: string;
  answer: string;
};

/**
 * Join Our Team “Understanding the Opportunity” FAQ.
 * Commercial / scale facts come only from Recruitment Offer Config + contact SSoT.
 */
export function offerCommercialFaqItems(
  offer: RecruitmentOfferConfig = WMC_RECRUITMENT_OFFER,
): CommercialFaqItem[] {
  const contact = WMC_RECRUITMENT_CONTACT;
  return [
    {
      id: "billing-75",
      question: `How does the ${offer.billingPercentage} arrangement work?`,
      answer: offerFaqBillingAnswer(offer),
    },
    {
      id: "patient-allocation",
      question: "How are patients allocated?",
      answer: `Patients book through HotDoc and phone reception into the practice diary. ${offer.activePatientFiles} active patient files and ongoing appointment demand mean incoming GPs join an established community rather than building awareness from scratch. Continuity bookings and return visits are encouraged; exact list growth depends on your sessions, clinical mix and how patients choose to book — confirmed honestly during onboarding.`,
    },
    {
      id: "weekend-work",
      question: "Is weekend work required?",
      answer: offer.openSevenDays
        ? `No. The practice is open seven days, including evenings and weekends, so patients can access care — but weekend sessions are not a blanket requirement for every GP. Your consulting days are agreed individually against rooms, nursing cover and practice need.`
        : `Weekend sessions are not a blanket requirement. Consulting days are agreed individually against rooms, nursing cover and practice need.`,
    },
    {
      id: "part-time-sessions",
      question: "Can sessions be part-time?",
      answer: `Yes. Permanent sessions, part-time arrangements and staged growth of a consulting footprint can be discussed across ${offer.consultRooms} consult rooms. Flexibility means a clear agreement on days and reliability for patients and the team — not a casual locum marketplace. Availability depends on rooms, nursing cover and practice need, and is confirmed individually.`,
    },
    {
      id: "practice-support",
      question: "What support is available?",
      answer: `GPs practise alongside ${offer.nurses} nurses on roster, an experienced reception team, and practice operations support. Nursing covers treatment-room and preventive pathways where appropriate; reception manages appointments, enquiries and patient flow so consulting time stays protected. ${
        offer.agpalAccredited ? "AGPAL-aligned" : "Accredited"
      } governance, privacy and emergency processes sit alongside peer colleagues you can ask — without replacing your clinical judgement.`,
    },
    {
      id: "clinic-software",
      question: "What software does the clinic use?",
      answer:
        "Online booking runs through HotDoc alongside phone bookings. Clinical records, appointments and day-to-day practice operations run on digital systems used across the clinic. Exact clinical software names and workflow details are shared in a confidential discussion and during onboarding so you can assess fit with how you prefer to work.",
    },
    {
      id: "onboarding",
      question: "What is onboarding like?",
      answer: `Onboarding covers rooms and emergency processes, privacy and practice policies, orientation to nursing and reception pathways, HotDoc/roster visibility matched to your agreed sessions, and the commercial arrangement confirmed privately. Timing depends on credentialing, provider-number pathway and start date — we do not rush paperwork that sits with Services Australia or AHPRA.`,
    },
    {
      id: "recruitment-contact",
      question: "Who responds to recruitment enquiries?",
      answer: `${contact.name}, ${contact.role}, responds to confidential GP recruitment enquiries for ${offer.clinicDisplayName}. ${contact.note} Start a confidential conversation, email ${contact.email}, or call the practice — you will not be passed to an external recruitment agency for the first conversation.`,
    },
  ];
}
