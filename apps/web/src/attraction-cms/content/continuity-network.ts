import type { Prisma } from "@prisma/client";
import { SYNTHETIC_INTERNAL } from "./markers";

/**
 * Local Continuity Network — how continuity operates with nearby care partners.
 * Not a referral marketplace or specialist directory.
 */
export const CONTINUITY_NETWORK_BODY: Prisma.InputJsonValue = {
  ...SYNTHETIC_INTERNAL,
  schemaTypes: ["WebPage", "MedicalClinic", "BreadcrumbList"],
  metaTitle: "Local Continuity Network | Woolloongabba Medical Centre",
  metaDescription:
    "How continuity operates at Woolloongabba Medical Centre with nearby hospitals, specialists, allied health and community services — workflow, not a directory.",
  honestyLine:
    "This explains how continuity works day to day. It is not a specialist directory or a promise of guaranteed access.",
  copy: "Care coordination patterns around an inner-south general practice — hospitals nearby, correspondence load, allied health and community services — for doctors assessing fit.",
  h1: "How continuity works here",
  lede: "Same-GP booking habits, recalls, notes that assume shared history, and clear handoffs when care moves outside the practice.",
  sections: [
    {
      id: "principle",
      heading: "Continuity first",
      bullets: [
        "The GP remains the longitudinal clinical point for everyday and ongoing care.",
        "External partners are engaged when patients need support beyond the practice.",
        "We do not invent wait times, outcome rates or preferred-provider league tables.",
      ],
    },
    {
      id: "hospital-context",
      heading: "Hospital proximity (geographic context)",
      body: "Inner-south Brisbane places the practice near major hospital campuses. That proximity is clinical context — shared care, post-discharge follow-up and specialist correspondence — not a boast list or guaranteed bed access.",
      implications: [
        "Discharge summaries and investigation results often return to the GP for reconciliation.",
        "Patients may expect the practice to help interpret specialist letters and next steps.",
        "Acute redirections still use emergency and after-hours pathways — the practice is not an ED substitute.",
      ],
    },
    {
      id: "specialist-letters",
      heading: "Specialists and correspondence",
      body: "Specialist care is engaged through ordinary referral pathways. Continuity means the practice keeps the thread: indication, results, medicines and follow-up plans.",
      continuityExamples: [
        {
          id: "ex-letter",
          title: "Composite example — letter back to the book",
          label: "Composite — not an identifiable case",
          steps: [
            "GP refers with a clear question and relevant history.",
            "Specialist correspondence returns to the practice inbox.",
            "GP (with nursing support where appropriate) reconciles medicines and recalls.",
            "Next consult starts from shared history rather than a blank slate.",
          ],
        },
      ],
    },
    {
      id: "allied-health",
      heading: "Allied health and community services",
      body: "Allied health and community services support care plans when clinically appropriate. Partnerships are capacity- and need-dependent — not a fixed package advertised to candidates.",
      partnerTypes: [
        "Allied health (e.g. physiotherapy, psychology, dietetics) via clinical indication",
        "Community and preventive pathways coordinated with nursing where appropriate",
        "Hospital outpatient and shared-care arrangements when indicated",
      ],
    },
    {
      id: "practice-ops",
      heading: "Practice operations that protect continuity",
      items: [
        "Same-GP booking preferences where clinically suitable",
        "Recall and results workflows that do not rely on patient memory alone",
        "Nursing pathways for treatment-room and preventive work with GP escalation",
        "Reception triage that protects consulting time without blocking urgent need",
        "Documentation habits that assume the next clinician may be a peer covering the list",
      ],
    },
    {
      id: "continuity-examples",
      heading: "Continuity examples (synthetic)",
      examples: [
        {
          id: "co-family",
          title: "Family over years",
          label: "Composite vignette — not identifiable",
          narrative:
            "The same GP and practice knowing family context across visits changes the consult because history is already shared.",
        },
        {
          id: "co-chronic",
          title: "Chronic disease arc",
          label: "Composite vignette — not identifiable",
          narrative:
            "Reviews, nursing pathways, medication and lifestyle work accumulate over time. Rare-disease detail that could identify someone is never used in public copy.",
        },
        {
          id: "co-post-discharge",
          title: "After hospital contact",
          label: "Composite vignette — not identifiable",
          narrative:
            "Post-discharge medicines and follow-up are reconciled into the practice record so the next visit continues the plan rather than restarting it.",
        },
      ],
    },
    {
      id: "doctor-voices",
      heading: "Placeholder doctor stories",
      stories: [
        {
          id: "cn-voice-1",
          roleLabel: "Composite GP · continuity",
          text: "Continuity is operational: same-GP booking, recalls, and notes that assume a shared history.",
        },
        {
          id: "cn-voice-2",
          roleLabel: "Composite GP · coordination",
          text: "Hospital proximity means correspondence volume — the work is reconciling care, not collecting brand names.",
        },
      ],
    },
    {
      id: "links",
      heading: "Related surfaces",
      links: [
        { label: "Practice Experience — Continuity", href: "practice-experience.html#continuity" },
        { label: "Philosophy of Care", href: "../philosophy-of-care.html" },
        { label: "Local Healthcare Access", href: "../local-healthcare-access.html" },
        { label: "Opportunity Pack", href: "../join-our-team/opportunity-pack.html" },
      ],
    },
  ],
};
