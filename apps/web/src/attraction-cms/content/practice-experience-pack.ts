import type { Prisma } from "@prisma/client";
import { PRACTICE_EXPERIENCE_HUB_CONTENT } from "@/practice-experience/hub-content";
import { SYNTHETIC_INTERNAL } from "./markers";

/** Full Practice Experience Content Pack — mirrors hub modules + synthetic doctor stories. */
export const PRACTICE_EXPERIENCE_PACK_BODY: Prisma.InputJsonValue = {
  ...SYNTHETIC_INTERNAL,
  schemaTypes: ["WebPage", "MedicalClinic", "BreadcrumbList"],
  metaTitle: PRACTICE_EXPERIENCE_HUB_CONTENT.title,
  metaDescription: PRACTICE_EXPERIENCE_HUB_CONTENT.metaDescription,
  honestyLine: PRACTICE_EXPERIENCE_HUB_CONTENT.honestyLine,
  copy: PRACTICE_EXPERIENCE_HUB_CONTENT.lede,
  h1: PRACTICE_EXPERIENCE_HUB_CONTENT.h1,
  packId: "wmc-practice-experience-content-pack",
  packVersion: "1.0.0-synthetic",
  modules: PRACTICE_EXPERIENCE_HUB_CONTENT.modules.map((m) => ({
    id: m.id,
    label: m.label,
    hubTitle: m.hubTitle,
    order: m.order,
    anchor: m.anchor,
    lede: m.lede,
    blocks: m.blocks,
    media: m.media,
    pullQuote: m.pullQuote,
    internalLinks: m.internalLinks,
  })),
  assetIds: PRACTICE_EXPERIENCE_HUB_CONTENT.modules.map((m) => m.media.assetRef ?? m.id),
  doctorStories: [
    {
      id: "pe-story-day-shape",
      module: "typical_day",
      roleLabel: "Composite GP · mixed book",
      title: "Day shape without throughput theatre",
      narrative:
        "Morning list review flags recalls that need same-day attention. The book interleaves acute presentations with reviews and preventive work. Notes close while context is fresh so the next visit inherits the story.",
      continuityCue: "Documentation posture protects shared history across visits.",
      synthetic: true,
    },
    {
      id: "pe-story-nursing",
      module: "nursing",
      roleLabel: "Composite GP · nursing partnership",
      title: "Treatment-room handoff",
      narrative:
        "Reception or the GP flags a pathway. Nursing prepares the room and consent. The GP joins for the procedure or reviews the outcome. Recall closes without turning every step into a full GP slot.",
      continuityCue: "Escalation back to the GP stays explicit.",
      synthetic: true,
    },
    {
      id: "pe-story-community",
      module: "community",
      roleLabel: "Composite GP · catchment awareness",
      title: "Place shows up in the book",
      narrative:
        "Inner-south life stages — families, working-age adults, older adults and nearby residents — shape what walks through the door. Continuity is invited deliberately because apartment and renter patterns can fragment care if the practice does not offer it.",
      continuityCue: "Catchment language stays qualitative; no invented census percentages.",
      synthetic: true,
    },
    {
      id: "pe-story-continuity",
      module: "continuity",
      roleLabel: "Composite GP · longitudinal care",
      title: "Family context across years (composite vignette)",
      narrative:
        "Label: composite example — not an identifiable patient. The same GP and practice knowing family context changes the consult because history is already shared. Safer prescribing and fewer whole-story retellings follow from that operational continuity.",
      continuityCue: "We publish composite examples only.",
      synthetic: true,
    },
    {
      id: "pe-story-sessions",
      module: "flexible_sessions",
      roleLabel: "Composite GP · staged footprint",
      title: "Part-week that still holds a list",
      narrative:
        "Two to three midweek sessions can sustain continuity when recalls, results habits and buddy cover are explicit. Patients are told clearly about availability. Growth waits until rooms and nursing cover support a larger footprint.",
      continuityCue: "Flexibility is reliability, not a casual marketplace.",
      synthetic: true,
    },
  ],
  communityNarratives: [
    {
      id: "cn-inner-south",
      title: "Inner-south neighbours",
      body: "Patients come from Woolloongabba and neighbouring East Brisbane, South Brisbane, Kangaroo Point, Greenslopes, Stones Corner and Dutton Park — shared roads, hospitals, schools and workplaces, not separate marketing territories.",
      sourcePages: ["community.html", "local-healthcare-access.html"],
    },
    {
      id: "cn-access",
      title: "Access without travel-time claims",
      body: "Practical guidance points patients to current Translink and parking information. Fixed travel-time marketing claims are avoided because conditions change.",
      sourcePages: ["local-healthcare-access.html", "access-parking.html"],
    },
  ],
};
