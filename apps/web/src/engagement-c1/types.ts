/** Phase C1 UI foundation — types for labelled demonstration data only. */

export type EngagementCategory =
  | "operational"
  | "access"
  | "practice_news"
  | "promotional"
  | "educational";

export type AnnouncementWorkflowStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "scheduled"
  | "published"
  | "expired"
  | "retracted";

export type DemoAnnouncement = {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: EngagementCategory;
  classification: "operational" | "promotional" | "educational";
  status: AnnouncementWorkflowStatus;
  publishedAt: string | null;
  scheduledFor: string | null;
  expiresAt: string | null;
  actionLabel: string | null;
  actionHref: string | null;
  authorLabel: string;
  approverLabel: string | null;
  /** Demonstration only — never a real patient identity */
  demoUnreadDefault: boolean;
};

export type DemoPreferenceTopic = {
  id: EngagementCategory;
  label: string;
  description: string;
  requiresPromotionalConsent: boolean;
};

export type DemoSubscriberRow = {
  installationKeyPrefix: string;
  status: "active" | "unsubscribed" | "invalid" | "paused";
  topics: EngagementCategory[];
  lastSeenAt: string;
};

export type DemoDeliveryFunnel = {
  announcementId: string;
  queued: number;
  attempted: number;
  pushAccepted: number;
  pushRejected: number;
  notificationClicked: number;
  inboxOpened: number;
  acknowledged: number;
};

export type DemoDashboardMetrics = {
  activePushSubscriptions: number;
  installationsWithOperationalConsent: number;
  publishedLast30Days: number;
  pushAcceptedNotProofOfRead: number;
  inboxOpensDeviceEvents: number;
  explicitGotItTaps: number;
  estimatedSmsAvoidedAud: number;
};
