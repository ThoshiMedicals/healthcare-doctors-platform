import type { Prisma } from "@prisma/client";
import { SYNTHETIC_INTERNAL } from "./markers";

type Interest = {
  id: string;
  title: string;
  description: string;
  credentialRequirements: string[];
  supportNeeded: string[];
  nursingImpact: string;
  roomImpact: string;
  growthPathway: string[];
  capacityHonesty: string;
};

const INTERESTS: Interest[] = [
  {
    id: "womens-health",
    title: "Women’s health",
    description:
      "Contraception, cervical screening, antenatal/postnatal support within GP scope, and reproductive health conversations across adult life stages — inside continuity general practice.",
    credentialRequirements: [
      "AHPRA registration and professional indemnity appropriate to proposed procedures",
      "Practice credentialing for any procedural work (e.g. IUD/implant) before listing",
      "Alignment with practice clinical policies and referral thresholds",
    ],
    supportNeeded: [
      "Clear appointment types so reception books adequate time",
      "Chaperone / privacy arrangements where clinically appropriate",
      "Reliable results and recall pathways",
    ],
    nursingImpact:
      "Nursing may support screening recalls, vaccination and treatment-room preparation; procedural lists need agreed nurse cover — not assumed.",
    roomImpact:
      "Procedural women’s health needs a prepared treatment or procedure room and protected time; competing lists can constrain same-day capacity.",
    growthPathway: [
      "Start with consultative women’s health inside ordinary sessions",
      "Add credentialed procedures only when rooms and nursing cover are confirmed",
      "Expand dedicated session blocks only against demonstrated local need and cover",
    ],
    capacityHonesty:
      "Not every interest session is open every week. Growth depends on rooms, nursing and credentialing — not marketing demand.",
  },
  {
    id: "mental-health",
    title: "Mental health",
    description:
      "Mental health care within ordinary GP time — assessment, brief intervention, care planning and coordinated referral — for an inner-south community book.",
    credentialRequirements: [
      "AHPRA registration and indemnity",
      "Familiarity with primary-care mental health frameworks used in Australian general practice",
      "Clear boundaries for acuity that needs urgent or specialist pathways",
    ],
    supportNeeded: [
      "Reception guidance on appointment length and urgency cues",
      "Documented crisis and after-hours pathways",
      "Time for follow-up that is not squeezed into acute-only slots",
    ],
    nursingImpact:
      "Nursing may assist with care-plan logistics and recalls; clinical assessment and risk decisions remain with the GP.",
    roomImpact:
      "Longer mental-health consults need protected consulting time; double-booking patterns undermine safety and continuity.",
    growthPathway: [
      "Embed mental health within mixed books first",
      "Add longer appointment types when the diary and cover allow",
      "Coordinate with external psychology/psychiatry when indicated — without promising wait times",
    ],
    capacityHonesty:
      "We do not invent access statistics or wait-time guarantees for external mental-health services.",
  },
  {
    id: "skin",
    title: "Skin",
    description:
      "Skin checks and minor procedures where the GP is credentialed, the room is prepared, and follow-up histology pathways are clear — Queensland UV context without scare marketing.",
    credentialRequirements: [
      "AHPRA registration and indemnity covering procedural skin work",
      "Practice credentialing for excisions / biopsies before advertising the interest",
      "Documented specimen and results follow-up process",
    ],
    supportNeeded: [
      "Nursing or trained assistant cover for procedures",
      "Sterile supplies and procedure-room turnaround time",
      "Clear patient information on wound care and result timing",
    ],
    nursingImpact:
      "High — procedure lists typically need nurse or assistant time for setup, assist and post-care instructions.",
    roomImpact:
      "Procedure rooms cannot run back-to-back without turnaround; skin lists compete with other treatment-room demand.",
    growthPathway: [
      "Begin with skin checks inside ordinary consults",
      "Add dedicated procedure blocks only with credentialing and nurse cover",
      "Refer complex lesions according to clinical judgement — not franchise promises",
    ],
    capacityHonesty:
      "Skin interest here is general practice skin checks and procedures — not a dedicated skin-cancer clinic, and not a volume promise.",
  },
  {
    id: "chronic-disease",
    title: "Chronic disease",
    description:
      "Longitudinal management of common chronic conditions with reviews, medication stewardship, lifestyle support and nursing pathways — continuity as the product.",
    credentialRequirements: [
      "AHPRA registration and indemnity",
      "Comfort with guideline-informed primary care for common chronic conditions",
      "Willingness to work within practice recall and care-plan processes",
    ],
    supportNeeded: [
      "Recall systems that do not rely on patient memory alone",
      "Nursing capacity for care-plan and preventive activity where appropriate",
      "Time for correspondence from hospitals and specialists",
    ],
    nursingImpact:
      "Significant — chronic disease pathways often share work between GP and nursing with clear escalation.",
    roomImpact:
      "Mostly consulting-room based; treatment-room use rises when procedures or vaccinations sit in the plan.",
    growthPathway: [
      "Build a mixed book with reliable review slots",
      "Layer nursing pathways as cover allows",
      "Expand session footprint only when continuity for existing patients is protected",
    ],
    capacityHonesty:
      "Chronic disease continuity grows with relationships over time. We do not promise patient volume or earnings.",
  },
];

export const CLINICAL_INTERESTS_BODY: Prisma.InputJsonValue = {
  ...SYNTHETIC_INTERNAL,
  schemaTypes: ["WebPage", "MedicalClinic", "BreadcrumbList"],
  metaTitle: "Clinical Interests Framework | Woolloongabba Medical Centre",
  metaDescription:
    "How clinical interests — women’s health, mental health, skin and chronic disease — sit inside continuity general practice at Woolloongabba Medical Centre.",
  honestyLine:
    "Clinical interests sit inside ordinary community general practice here — not as a specialty shopfront or vacancy list.",
  copy: "Framework for clinical interests that strengthen community care — credentials, support, nursing impact, room impact and growth pathway with capacity honesty.",
  h1: "Clinical interests inside general practice",
  lede: "We are a general practice first. Special interests are welcome when they help local patients and fit credentialing, team capacity and safe scope.",
  sections: [
    {
      id: "principles",
      heading: "Framework principles",
      bullets: [
        "Interests strengthen continuity care — they do not replace it.",
        "Credentialing and indemnity come before listing an interest publicly.",
        "Nursing and room capacity are real constraints, not afterthoughts.",
        "Growth pathways are staged; always-open specialty claims are forbidden.",
        "No invented testimonials, earnings or outcome statistics.",
      ],
    },
    {
      id: "interests",
      heading: "Interest profiles",
      interests: INTERESTS,
    },
    {
      id: "doctor-stories",
      heading: "Placeholder doctor stories (synthetic)",
      stories: [
        {
          id: "ci-story-wh",
          roleLabel: "Composite GP · women’s health interest",
          text: "Consultative women’s health fitted the mixed book first; procedures waited until nursing cover and room time were real.",
        },
        {
          id: "ci-story-mh",
          roleLabel: "Composite GP · mental health in primary care",
          text: "Longer appointments only work when the diary protects them — otherwise acute spillover erodes safety.",
        },
        {
          id: "ci-story-skin",
          roleLabel: "Composite GP · skin checks",
          text: "Skin checks in ordinary sessions; dedicated procedure blocks only after credentialing and assistant cover.",
        },
        {
          id: "ci-story-cd",
          roleLabel: "Composite GP · chronic disease",
          text: "Reviews and nursing pathways accumulate; the list grows because patients return, not because we advertise volume.",
        },
      ],
    },
    {
      id: "eoi",
      heading: "How to discuss fit",
      body: "Tell us about your interests in an expression of interest. We will discuss how they fit local need, credentialing and capacity — without turning Join Our Team into a specialty marketplace.",
    },
  ],
};
