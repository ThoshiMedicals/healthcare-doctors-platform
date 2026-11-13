import type {
  DemoAnnouncement,
  DemoDashboardMetrics,
  DemoDeliveryFunnel,
  DemoPreferenceTopic,
  DemoSubscriberRow,
} from "./types";

/** All titles/bodies are labelled demonstration content — not live notices. */
export const C1_DEMO_PREFIX = "[DEMO]";

export const DEMO_PREFERENCE_TOPICS: readonly DemoPreferenceTopic[] = [
  {
    id: "operational",
    label: "Hours and closures",
    description: "Public holiday hours, temporary closures, and general opening changes.",
    requiresPromotionalConsent: false,
  },
  {
    id: "access",
    label: "Access and parking",
    description: "Entry changes, parking, and building access disruptions.",
    requiresPromotionalConsent: false,
  },
  {
    id: "practice_news",
    label: "Practice news",
    description: "Public practice updates such as welcoming a new GP to the team.",
    requiresPromotionalConsent: false,
  },
  {
    id: "educational",
    label: "Health education (optional)",
    description: "General education articles. Separate from appointment reminders.",
    requiresPromotionalConsent: true,
  },
  {
    id: "promotional",
    label: "Practice promotions (optional)",
    description: "Optional campaigns about services or events. Requires extra consent.",
    requiresPromotionalConsent: true,
  },
] as const;

export const DEMO_ANNOUNCEMENTS: readonly DemoAnnouncement[] = [
  {
    id: "demo-easter-hours",
    title: `${C1_DEMO_PREFIX} Easter Saturday hours`,
    summary: "We open 9:00 AM–1:00 PM on Easter Saturday. HotDoc booking remains available.",
    body:
      "This is labelled demonstration content for the Patient Engagement prototype.\n\n" +
      "On Easter Saturday the clinic plans to open 9:00 AM–1:00 PM. " +
      "Appointment reminders and recalls continue through HotDoc — not this inbox.\n\n" +
      "Call reception on (07) 3217 3344 if you need help.",
    category: "operational",
    classification: "operational",
    status: "published",
    publishedAt: "2026-11-10T09:00:00+10:00",
    scheduledFor: null,
    expiresAt: "2027-04-20T18:00:00+10:00",
    actionLabel: "Contact & location",
    actionHref: "/contact.html",
    authorLabel: "demo.editor",
    approverLabel: "demo.approver",
    demoUnreadDefault: true,
  },
  {
    id: "demo-entry-works",
    title: `${C1_DEMO_PREFIX} Temporary entry via side door`,
    summary: "Front entrance works this week — please use the side door marked Reception.",
    body:
      "Demonstration notice only.\n\n" +
      "Building works may affect the Vulture Street front doors. Follow signs to the side entrance. " +
      "If you need assistance arriving, call (07) 3217 3344.",
    category: "access",
    classification: "operational",
    status: "published",
    publishedAt: "2026-11-11T14:30:00+10:00",
    scheduledFor: null,
    expiresAt: null,
    actionLabel: "Get directions",
    actionHref: "/contact.html",
    authorLabel: "demo.editor",
    approverLabel: "demo.approver",
    demoUnreadDefault: true,
  },
  {
    id: "demo-welcome-gp",
    title: `${C1_DEMO_PREFIX} Welcoming a new GP to the team`,
    summary: "Public practice news example — not a personal clinical message.",
    body:
      "Demonstration practice-news item.\n\n" +
      "In a live system this might introduce a new GP with a link to their public profile. " +
      "It must never include private health information.",
    category: "practice_news",
    classification: "operational",
    status: "published",
    publishedAt: "2026-11-08T11:00:00+10:00",
    scheduledFor: null,
    expiresAt: null,
    actionLabel: "Meet our team",
    actionHref: "/our-team.html",
    authorLabel: "demo.editor",
    approverLabel: "demo.publisher",
    demoUnreadDefault: false,
  },
  {
    id: "demo-flu-education",
    title: `${C1_DEMO_PREFIX} Seasonal health education tip`,
    summary: "Optional educational example — requires promotional/education consent when live.",
    body:
      "Demonstration educational content.\n\n" +
      "General information only. Not personal medical advice. " +
      "Speak with your GP about what is right for you.",
    category: "educational",
    classification: "educational",
    status: "published",
    publishedAt: "2026-11-05T08:00:00+10:00",
    scheduledFor: null,
    expiresAt: null,
    actionLabel: null,
    actionHref: null,
    authorLabel: "demo.editor",
    approverLabel: "demo.approver",
    demoUnreadDefault: false,
  },
  {
    id: "demo-draft-promo",
    title: `${C1_DEMO_PREFIX} Draft — women’s health evening (promo)`,
    summary: "Draft promotional example awaiting approval — not visible in patient inbox.",
    body: "Staff-only draft demonstration. Must not send. Requires approver ≠ author when live.",
    category: "promotional",
    classification: "promotional",
    status: "pending_approval",
    publishedAt: null,
    scheduledFor: null,
    expiresAt: null,
    actionLabel: null,
    actionHref: null,
    authorLabel: "demo.editor",
    approverLabel: null,
    demoUnreadDefault: false,
  },
  {
    id: "demo-scheduled",
    title: `${C1_DEMO_PREFIX} Scheduled — Christmas Eve hours`,
    summary: "Scheduled operational example for the admin workflow UI.",
    body: "Would publish later. Demonstration only.",
    category: "operational",
    classification: "operational",
    status: "scheduled",
    publishedAt: null,
    scheduledFor: "2026-12-20T09:00:00+10:00",
    expiresAt: "2026-12-25T18:00:00+10:00",
    actionLabel: "View hours",
    actionHref: "/contact.html",
    authorLabel: "demo.editor",
    approverLabel: "demo.approver",
    demoUnreadDefault: false,
  },
] as const;

export const DEMO_PUBLISHED_INBOX = DEMO_ANNOUNCEMENTS.filter((a) => a.status === "published");

export const DEMO_DASHBOARD: DemoDashboardMetrics = {
  activePushSubscriptions: 128,
  installationsWithOperationalConsent: 96,
  publishedLast30Days: 4,
  pushAcceptedNotProofOfRead: 210,
  inboxOpensDeviceEvents: 74,
  explicitGotItTaps: 31,
  estimatedSmsAvoidedAud: 18.4,
};

export const DEMO_SUBSCRIBERS: readonly DemoSubscriberRow[] = [
  {
    installationKeyPrefix: "inst_7f3a…",
    status: "active",
    topics: ["operational", "access", "practice_news"],
    lastSeenAt: "2026-11-12T16:20:00+10:00",
  },
  {
    installationKeyPrefix: "inst_91bc…",
    status: "active",
    topics: ["operational", "educational"],
    lastSeenAt: "2026-11-11T09:05:00+10:00",
  },
  {
    installationKeyPrefix: "inst_02de…",
    status: "unsubscribed",
    topics: [],
    lastSeenAt: "2026-11-01T12:00:00+10:00",
  },
  {
    installationKeyPrefix: "inst_55aa…",
    status: "invalid",
    topics: ["operational"],
    lastSeenAt: "2026-10-28T08:40:00+10:00",
  },
] as const;

export const DEMO_DELIVERY: readonly DemoDeliveryFunnel[] = [
  {
    announcementId: "demo-easter-hours",
    queued: 96,
    attempted: 96,
    pushAccepted: 88,
    pushRejected: 8,
    notificationClicked: 22,
    inboxOpened: 41,
    acknowledged: 18,
  },
  {
    announcementId: "demo-entry-works",
    queued: 96,
    attempted: 90,
    pushAccepted: 84,
    pushRejected: 6,
    notificationClicked: 19,
    inboxOpened: 33,
    acknowledged: 13,
  },
] as const;

export const DEMO_SMS_BASELINE = {
  periodLabel: "Oct 2026 (demonstration)",
  avoidableGeneralSmsCount: 230,
  costPerSmsAud: 0.08,
  notes:
    "Demonstration baseline only. Excludes clinical reminders and recalls (HotDoc). Not a forecast.",
};

export function categoryLabel(category: DemoAnnouncement["category"]): string {
  switch (category) {
    case "operational":
      return "Hours & closures";
    case "access":
      return "Access";
    case "practice_news":
      return "Practice news";
    case "promotional":
      return "Promotional";
    case "educational":
      return "Education";
    default:
      return category;
  }
}

export function findDemoAnnouncement(id: string): DemoAnnouncement | undefined {
  return DEMO_ANNOUNCEMENTS.find((row) => row.id === id);
}
