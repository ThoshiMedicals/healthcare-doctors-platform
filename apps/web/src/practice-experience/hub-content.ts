import type { PracticeExperienceHubContent } from "./types";
import { PRACTICE_EXPERIENCE_PATH } from "./types";

/**
 * Placeholder Practice Experience Hub content.
 * Outlines follow docs/proposals/practice-experience-content-pack/content-pack.json.
 * Replace ledes, quotes, and media with consented story-capture output before production cutover.
 */
export const PRACTICE_EXPERIENCE_HUB_CONTENT: PracticeExperienceHubContent = {
  id: "wmc-practice-experience-hub",
  version: "1.0.0",
  path: PRACTICE_EXPERIENCE_PATH,
  title: "Practice Experience | Woolloongabba Medical Centre",
  metaDescription:
    "How consulting days, nursing, reception, team work, community, continuity and sessions feel at Woolloongabba Medical Centre — practice experience, not a job advertisement.",
  h1: "What practising here is like",
  lede:
    "How a consulting week runs at this inner-south practice — day shape, nursing, reception, continuity and sessions — so you can judge fit for yourself.",
  honestyLine:
    "This practice experience page describes how the practice works. These are not job advertisements.",
  modules: [
    {
      id: "typical_day",
      label: "Typical Day",
      hubTitle: "Typical consulting day",
      order: 1,
      anchor: "typical-day",
      lede:
        "A consulting day here moves from list review through a mixed book to results, recalls and notes — paced general practice that leaves room for context, not a throughput theatre.",
      blocks: [
        {
          id: "td_open",
          type: "timeline",
          heading: "Open — arrive / list review",
          points: [
            "Arrive, review the list, and flag known recalls or results that need same-day attention.",
            "Brief check-in with nursing and reception on running late or complex bookings.",
            "Set a documentation posture before the first patient.",
          ],
        },
        {
          id: "td_core",
          type: "bullets",
          heading: "Core — mixed book",
          points: [
            "Acute presentations interleaved with reviews.",
            "Preventive care and mental health within ordinary GP time.",
            "Procedures only where credentialed and roomed.",
            "Session length reflects continuity work, not maximising throughput alone.",
          ],
        },
        {
          id: "td_close",
          type: "timeline",
          heading: "Close — results, recalls, notes, handover",
          points: [
            "Results and correspondence triage.",
            "Recall actions and nurse handover where needed.",
            "Finish notes while context is fresh.",
          ],
        },
        {
          id: "td_honesty",
          type: "callout",
          heading: "Honesty cue",
          points: [
            "This day shape may not suit GPs seeking maximum throughput alone.",
            "Placeholder copy — replace with consented day-shape interview.",
          ],
        },
      ],
      media: {
        // Temporary concept photography. Replace with approved WMC photography when available.
        src: "../assets/practice-experience/typical-day.jpg",
        alt: "GP in a consulting room with a patient during an ordinary appointment",
        kind: "pending",
        assetRef: "concept-2-typical-day",
      },
      pullQuote: {
        id: "PQ-TD-placeholder",
        text: "The book mixes acute and review work; notes stay with the session so the next visit has context.",
        attribution: "Composite GP voice · placeholder",
        voice: "composite_placeholder",
      },
      internalLinks: [
        { href: "../philosophy-of-care.html", label: "Philosophy of Care" },
        { href: "../team-general-practitioners.html", label: "GP team" },
        { href: "../join-our-team.html", label: "Join Our Team" },
      ],
    },
    {
      id: "nursing",
      label: "Nursing",
      hubTitle: "Nursing collaboration",
      order: 2,
      anchor: "nursing",
      lede:
        "Nurses protect consulting time through treatment-room work, preventive pathways and recalls — clinical partnership with clear escalation back to the GP.",
      blocks: [
        {
          id: "nu_roles",
          type: "bullets",
          heading: "Where nursing sits in the day",
          points: [
            "Treatment-room coordination around GP lists.",
            "Immunisation, wound care and chronic-disease pathways.",
            "Recall and preventive work that does not need a full GP slot.",
            "Shared safety cues and escalation back to the GP.",
          ],
        },
        {
          id: "nu_handoff",
          type: "timeline",
          heading: "Example handoff",
          points: [
            "Reception or GP flags a pathway.",
            "Nurse prepares room, consent and equipment.",
            "GP joins for the procedure or reviews the outcome.",
            "Documentation and recall are closed.",
          ],
        },
        {
          id: "nu_honesty",
          type: "callout",
          heading: "Honesty cue",
          points: [
            "Capacity depends on nursing cover for the session.",
            "On thinner nursing days the list changes — capacity is planned, not assumed.",
          ],
        },
      ],
      media: {
        // Temporary concept photography. Replace with approved WMC photography when available.
        src: "../assets/practice-experience/nursing.jpg",
        alt: "Practice nurse preparing treatment with a GP nearby in the treatment room",
        kind: "pending",
        assetRef: "concept-3-nursing",
      },
      pullQuote: {
        id: "PQ-NU-placeholder",
        text: "Nursing changes the consult when the pathway is prepared before I join — then we close the recall together.",
        attribution: "Composite GP voice · placeholder",
        voice: "composite_placeholder",
      },
      internalLinks: [
        { href: "../team.html", label: "Our Team" },
        { href: "../join-our-team.html", label: "Join Our Team" },
      ],
    },
    {
      id: "reception",
      label: "Reception",
      hubTitle: "Reception workflows",
      order: 3,
      anchor: "reception",
      lede:
        "Reception matches appointment type to clinical need, routes enquiries that should not interrupt a consult, and keeps patient flow calm when the list runs late.",
      blocks: [
        {
          id: "rx_booking",
          type: "bullets",
          heading: "Booking and triage principles",
          points: [
            "Match appointment type to clinical need and GP session pattern.",
            "Running-late norms are communicated calmly.",
            "Urgent same-day cues are routed without collapsing the whole list.",
          ],
        },
        {
          id: "rx_enquiries",
          type: "bullets",
          heading: "Enquiries that should not interrupt a consult",
          points: [
            "Results follow-up routing.",
            "Scripts and referral status checks.",
            "Administrative forms and certificates process.",
          ],
        },
        {
          id: "rx_honesty",
          type: "callout",
          heading: "Honesty cue",
          points: [
            "These are systems descriptions — not front-of-house marketing.",
            "Screens in real photography must stay privacy-blanked.",
          ],
        },
      ],
      media: {
        // Temporary concept photography. Replace with approved WMC photography when available.
        src: "../assets/practice-experience/reception.jpg",
        alt: "Reception team supporting patient arrival at the front desk",
        kind: "pending",
        assetRef: "concept-4-reception",
      },
      pullQuote: {
        id: "PQ-RX-placeholder",
        text: "Most results and script checks never need to interrupt a consult — the desk routes them first.",
        attribution: "Composite reception voice · placeholder",
        voice: "composite_placeholder",
      },
      internalLinks: [
        { href: "../patient-information.html", label: "Patient Information" },
        { href: "../contact.html", label: "Contact" },
      ],
    },
    {
      id: "team_interactions",
      label: "Team Interactions",
      hubTitle: "Team interactions",
      order: 4,
      anchor: "team-interactions",
      lede:
        "Peer discussion, clinical handover and shared problem-solving sit beside clinical autonomy — structure that supports judgement rather than replacing it.",
      blocks: [
        {
          id: "ti_modes",
          type: "bullets",
          heading: "How the team talks",
          points: [
            "Informal corridor or treatment-room clinical questions.",
            "Planned case discussion when complexity needs another view.",
            "Handover notes that assume a shared practice history.",
          ],
        },
        {
          id: "ti_autonomy",
          type: "bullets",
          heading: "Autonomy with governance",
          points: [
            "GPs practise with professional clinical autonomy within Australian standards.",
            "AGPAL-aligned policies, privacy and safety systems sit alongside that autonomy.",
          ],
        },
        {
          id: "ti_honesty",
          type: "callout",
          heading: "Honesty cue",
          points: [
            "Team access is real; it is not a promise of instant specialist cover.",
            "Replace placeholder with consented peer-discussion vignette.",
          ],
        },
      ],
      media: {
        // Temporary concept photography. Replace with approved WMC photography when available.
        src: "../assets/practice-experience/team-interactions.jpg",
        alt: "Colleagues speaking briefly between consults in the practice corridor",
        kind: "pending",
        assetRef: "concept-5-team-interactions",
      },
      pullQuote: {
        id: "PQ-TI-placeholder",
        text: "I can ask a peer a concrete clinical question without turning the day into a committee.",
        attribution: "Composite GP voice · placeholder",
        voice: "composite_placeholder",
      },
      internalLinks: [
        { href: "../why-team-based-care-matters.html", label: "Team-based care" },
        { href: "../team.html", label: "Our Team" },
      ],
    },
    {
      id: "community",
      label: "Community",
      hubTitle: "Community demographics",
      order: 5,
      anchor: "community",
      lede:
        "Inner-south Brisbane catchment and life-stage mix shape the consulting book — place and case mix without invented census percentages.",
      blocks: [
        {
          id: "cm_place",
          type: "bullets",
          heading: "Place",
          points: [
            "468 Vulture Street, Woolloongabba — inner south Brisbane.",
            "Catchment includes East Brisbane, South Brisbane, Kangaroo Point, Greenslopes, Stones Corner and Dutton Park.",
            "Hospital and transit proximity is clinical context, not a boast list.",
          ],
        },
        {
          id: "cm_mix",
          type: "bullets",
          heading: "Life-stage mix that shapes the book",
          points: [
            "Families and children’s health.",
            "Working-age adults.",
            "Older adults and chronic disease continuity.",
            "Nearby residents and students where that matches the list.",
          ],
        },
        {
          id: "cm_honesty",
          type: "callout",
          heading: "Honesty cue",
          points: [
            "No invented census percentages.",
            "List-building follows relationships over time — we do not promise a full book on day one.",
          ],
        },
      ],
      media: {
        // Temporary concept photography. Replace with approved WMC photography when available.
        src: "../assets/practice-experience/community.jpg",
        alt: "Patients and families in and around the practice community setting",
        kind: "pending",
        assetRef: "concept-6-community",
      },
      pullQuote: {
        id: "PQ-CM-placeholder",
        text: "Local context shows up clinically in the book — that is catchment, not marketing copy.",
        attribution: "Composite GP voice · placeholder",
        voice: "composite_placeholder",
      },
      internalLinks: [
        { href: "../community.html", label: "Our Community" },
        { href: "../local-healthcare-access.html", label: "Local Healthcare Access" },
      ],
    },
    {
      id: "continuity",
      label: "Continuity",
      hubTitle: "Continuity stories",
      order: 6,
      anchor: "continuity",
      lede:
        "Composite, privacy-safe examples of care over time — what shared history changes in the next consult.",
      blocks: [
        {
          id: "co_vA",
          type: "vignette",
          heading: "Vignette A — family over years (composite)",
          points: [
            "Label: composite example — not an identifiable patient story.",
            "Same GP and practice knowing family context across visits.",
            "The consult changes because history is already shared.",
          ],
        },
        {
          id: "co_vB",
          type: "vignette",
          heading: "Vignette B — chronic disease arc (composite)",
          points: [
            "Label: composite example.",
            "Reviews, nursing pathways, medication and lifestyle over time.",
            "Avoid rare-disease detail that could identify someone.",
          ],
        },
        {
          id: "co_effect",
          type: "bullets",
          heading: "What continuity changes clinically",
          points: [
            "Faster recognition of change from baseline.",
            "Safer prescribing with known history.",
            "Fewer repeated whole-story retellings for the patient.",
          ],
        },
        {
          id: "co_honesty",
          type: "callout",
          heading: "Honesty cue",
          points: [
            "We publish composite examples only — never identifiable clinical detail.",
            "Continuity is operational: same-GP booking, recalls, and notes that assume shared history.",
          ],
        },
      ],
      media: {
        // Temporary concept photography. Replace with approved WMC photography when available.
        src: "../assets/practice-experience/continuity.jpg",
        alt: "GP with a returning family during a continuity-focused consult",
        kind: "pending",
        assetRef: "concept-7-continuity",
      },
      pullQuote: {
        id: "PQ-CO-placeholder",
        text: "Continuity is operational: same-GP booking, recalls, and notes that assume a shared history.",
        attribution: "Composite GP voice · placeholder",
        voice: "composite_placeholder",
      },
      internalLinks: [
        { href: "../philosophy-of-care.html", label: "Philosophy of Care" },
        { href: "../story.html", label: "Our Story" },
      ],
    },
    {
      id: "flexible_sessions",
      label: "Flexible Sessions",
      hubTitle: "Flexible consulting examples",
      order: 7,
      anchor: "flexible-sessions",
      lede:
        "Worked session patterns — full days, part-week, and staged growth — with real constraints: rooms, nursing cover and reliability for patients.",
      blocks: [
        {
          id: "fs_a",
          type: "example",
          heading: "Example A — four full days",
          points: [
            "A continuity-heavy footprint with stable nursing and reception cover.",
            "Suits doctors building a long list with predictable availability.",
          ],
        },
        {
          id: "fs_b",
          type: "example",
          heading: "Example B — two to three midweek sessions",
          points: [
            "Part-week continuity via recalls, results habits and buddy cover.",
            "Patients are told clearly about availability.",
          ],
        },
        {
          id: "fs_c",
          type: "example",
          heading: "Example C — staged increase after settling",
          points: [
            "Start smaller; grow when rooms, nursing and demand align.",
            "Preferred days are not guaranteed at expression of interest.",
          ],
        },
        {
          id: "fs_honesty",
          type: "callout",
          heading: "Honesty cue",
          points: [
            "Part-time here is a reliability agreement with patients and the team, not unlimited flexibility.",
            "Sessions grow when capacity aligns — not when a marketing page needs a vacancy.",
          ],
        },
      ],
      media: {
        src: "../assets/practice-experience/flexible-sessions.jpg",
        alt: "Session planning materials on a consulting desk at Woolloongabba Medical Centre",
        kind: "ai_placeholder",
        assetRef: "PE-FS-01 / CR-02",
        caption: "Placeholder visual — replace with consented diary / room still.",
      },
      pullQuote: {
        id: "PQ-FS-placeholder",
        text: "Part-time here is a reliability agreement with patients and the team, not unlimited flexibility.",
        attribution: "Composite GP voice · placeholder",
        voice: "composite_placeholder",
      },
      internalLinks: [
        { href: "../join-our-team.html", label: "Join Our Team" },
        { href: "../team-general-practitioners.html", label: "GP team" },
      ],
    },
  ],
};
