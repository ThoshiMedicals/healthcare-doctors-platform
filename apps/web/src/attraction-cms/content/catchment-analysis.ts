import type { Prisma } from "@prisma/client";
import { SYNTHETIC_INTERNAL } from "./markers";

/**
 * Community & Catchment — doctor-facing place and case-mix picture.
 * Suburb list from published community / local-healthcare-access pages.
 * No fabricated percentages; ABS figures belong off public join pages unless reviewed.
 */
export const CATCHMENT_ANALYSIS_BODY: Prisma.InputJsonValue = {
  ...SYNTHETIC_INTERNAL,
  schemaTypes: ["WebPage", "MedicalClinic", "BreadcrumbList"],
  metaTitle: "Who we look after | Woolloongabba Medical Centre",
  metaDescription:
    "Where Woolloongabba Medical Centre sits in Brisbane, who we look after nearby, and how that shapes the consulting book for GPs considering joining.",
  honestyLine:
    "We describe place and community in plain language only. We do not invent census percentages, patient volumes or earnings claims.",
  copy: "How Woolloongabba and neighbouring inner-south Brisbane communities shape the consulting book — place and case-mix awareness for doctors assessing fit.",
  h1: "Who we look after around here",
  lede: "Where we are in Brisbane, who lives and works nearby, and how that shapes the consulting book — so you can sense whether this practice matches how you want to practise.",
  sections: [
    {
      id: "place",
      heading: "Where we are",
      body: "Woolloongabba Medical Centre is at 468 Vulture Street, Woolloongabba — in Brisbane’s inner south, Queensland, Australia. We sit near major hospitals (including Princess Alexandra Hospital and the Mater campuses), with public transport nearby.",
      suburbs: [
        "Woolloongabba",
        "East Brisbane",
        "South Brisbane",
        "Kangaroo Point",
        "Greenslopes",
        "Stones Corner",
        "Dutton Park",
      ],
      note: "Patients also travel from other nearby suburbs including Coorparoo. These are neighbouring parts of one inner-south community — the people who shape a typical consulting week here.",
      sourcePages: ["community.html", "local-healthcare-access.html"],
    },
    {
      id: "life-stage-mix",
      heading: "Who we look after",
      body: "What we see week to week in the rooms — not a statistics table. This is the shape of the consulting book you would walk into.",
      themes: [
        {
          title: "Families and children’s health",
          body: "Family presentations and childhood illness sit alongside adult care; continuity with the same GP matters when caregivers return.",
        },
        {
          title: "Working-age adults",
          body: "Acute care, preventive screening windows, mental health in primary care, and skin checks are common consulting themes.",
        },
        {
          title: "Older adults and chronic disease continuity",
          body: "Reviews, medication stewardship and coordinated pathways with nursing support where appropriate.",
        },
        {
          title: "Nearby residents and students",
          body: "Where the list includes nearby residents and students, short-stay patterns make deliberate continuity offers important.",
        },
      ],
    },
    {
      id: "care-demand-themes",
      heading: "Care themes you should expect",
      body: "Themes GPs should expect in an inner-south Brisbane community practice — not ranked statistics.",
      themes: [
        "Mental health within ordinary GP time",
        "Reproductive and women’s health across adult life stages",
        "Skin checks and minor procedures where credentialed and roomed",
        "Preventive care and screening engagement",
        "Chronic disease reviews with nursing pathway support",
        "Post-discharge and specialist-letter coordination near tertiary campuses",
      ],
    },
    {
      id: "continuity-implication",
      heading: "Why that matters for your week",
      bullets: [
        "Apartment and renter patterns can fragment care unless the practice invites return visits deliberately.",
        "Hospital proximity increases shared-care and correspondence load — GP coordination is part of the day.",
        "List-building follows relationships over time; we do not promise a full book on day one.",
      ],
    },
    {
      id: "community-narratives",
      heading: "Community narratives (synthetic placeholders)",
      narratives: [
        {
          id: "catch-nar-1",
          roleLabel: "Composite GP · catchment",
          text: "Local context shows up clinically in the book — that is catchment, not marketing copy.",
        },
        {
          id: "catch-nar-2",
          roleLabel: "Composite GP · access",
          text: "Patients choose us for proximity, familiarity and the chance to keep care in one organised practice — not because we invent travel-time claims.",
        },
      ],
    },
    {
      id: "analyst-note",
      heading: "Internal analyst note",
      body: "Detailed ABS suburb tables (if required for workforce planning) must use cited official sources and stay off public attraction pages unless clinically and legally reviewed. This document intentionally omits percentage tables.",
    },
  ],
};
