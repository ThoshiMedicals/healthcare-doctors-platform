import { AUTHORITY_TIER_FRIENDLY as AUTHORITY_TIER_FRIENDLY_FROM_FRAMEWORK } from "@/measurement/authority-framework";
import type { InsightsDestination } from "./links";

/** Healthy / Watch / Critical — management language (not platform jargon). */
export type MetricHealthLevel = "healthy" | "watch" | "critical" | "neutral";

export const METRIC_HEALTH_LABEL: Record<MetricHealthLevel, string> = {
  healthy: "Healthy",
  watch: "Needs watch",
  critical: "Needs attention",
  neutral: "No target",
};

export const METRIC_HEALTH_TONE: Record<MetricHealthLevel, "good" | "warn" | "bad" | "neutral"> = {
  healthy: "good",
  watch: "warn",
  critical: "bad",
  neutral: "neutral",
};

export type MetricGuide = {
  id: string;
  /** Clinic-manager friendly name shown on the tile. */
  label: string;
  /** One sentence: what this number means for the practice. */
  meaning: string;
  /** What to do when the number moves. */
  guidance: string;
  /** Plain-language target range, e.g. "Aim for 5% or higher". */
  target?: string;
  /** Optional thresholds for health indicator (higherIsBetter default true). */
  thresholds?: {
    healthy: number;
    watch: number;
    higherIsBetter?: boolean;
  };
};

export type HowToReadGuide = {
  id: InsightsDestination | "monthly-executive";
  title: string;
  /** 60-second briefing for a first-time clinic manager. */
  inSixtySeconds: string;
  /** What “good” looks like on this page. */
  whatGoodLooksLike: string;
  /** Colour / status key in plain English. */
  statusKey: Array<{ level: MetricHealthLevel; meaning: string }>;
  /** Ordered scan path. */
  scanOrder: string[];
  metrics: MetricGuide[];
};

/** Authority tiers in management language (content strength, not clinical quality). */
export const AUTHORITY_TIER_FRIENDLY = AUTHORITY_TIER_FRIENDLY_FROM_FRAMEWORK;

export const AUTHORITY_TIER_GUIDANCE =
  "These labels describe how strongly a page is linked across the website — not clinical skill or patient feedback.";

export const RESOLUTION_BAND_FRIENDLY: Record<"green" | "amber" | "red" | "unknown", string> = {
  green: "Healthy",
  amber: "Needs watch",
  red: "Needs attention",
  unknown: "Not enough data",
};

export function healthFromValue(
  value: number | null | undefined,
  thresholds?: MetricGuide["thresholds"],
): MetricHealthLevel {
  if (value === null || value === undefined || !thresholds) return "neutral";
  const higher = thresholds.higherIsBetter !== false;
  if (higher) {
    if (value >= thresholds.healthy) return "healthy";
    if (value >= thresholds.watch) return "watch";
    return "critical";
  }
  if (value <= thresholds.healthy) return "healthy";
  if (value <= thresholds.watch) return "watch";
  return "critical";
}

export const HOW_TO_READ_GUIDES: Record<InsightsDestination | "monthly-executive", HowToReadGuide> = {
  "command-centre": {
    id: "command-centre",
    title: "Command Centre",
    inSixtySeconds:
      "Start with Overall Health Score, then Recommended actions, then any red or amber alerts. This page is the daily briefing — open a link only when something needs fixing.",
    whatGoodLooksLike:
      "Health score in the Healthy band, few open alerts, and recommended actions cleared or shrinking week to week.",
    statusKey: [
      { level: "healthy", meaning: "Stable — keep monitoring." },
      { level: "watch", meaning: "Something needs a closer look this week." },
      { level: "critical", meaning: "Act now — open the linked queue or dashboard." },
    ],
    scanOrder: [
      "Overall Health Score and domain tiles",
      "Recommended actions (do these first)",
      "Booking, call, and contact trends",
      "Alert panels for governance, search, and conversion",
    ],
    metrics: [
      {
        id: "overall_health",
        label: "Overall Health Score",
        meaning: "A single practice score combining search, reception, governance, traffic, bookings, content strength, and accessibility.",
        guidance: "If Needs attention, open the weakest domain tile and follow the linked dashboard.",
        target: "Healthy at 85+ · Watch 70–84 · Needs attention under 70",
        thresholds: { healthy: 85, watch: 70 },
      },
      {
        id: "contact_rate",
        label: "Contact rate",
        meaning: "Share of visits that led to a booking click or clinic call.",
        guidance: "Rising is good. Falling with steady traffic usually means journeys or booking buttons need work.",
        target: "Aim for about 5% or higher",
        thresholds: { healthy: 5, watch: 2 },
      },
    ],
  },
  executive: {
    id: "executive",
    title: "Website overview",
    inSixtySeconds:
      "Check whether more people are visiting, and whether more of them book or call. Then scan top pages, services, and doctors to see what patients are looking at.",
    whatGoodLooksLike:
      "Steady or rising visits, contact rate at or above target, and booking/call activity moving with traffic — not collapsing while traffic holds.",
    statusKey: [
      { level: "healthy", meaning: "Visits and patient actions look stable." },
      { level: "watch", meaning: "Traffic or contact rate is soft — check Conversion and Digital Reception." },
      { level: "critical", meaning: "Contact actions are very low for the visits you are getting." },
    ],
    scanOrder: [
      "Visits and patient sessions",
      "Contact rate (bookings + calls)",
      "Booking clicks and clinic calls",
      "Top pages, services, and doctors",
    ],
    metrics: [
      {
        id: "traffic",
        label: "Page views",
        meaning: "How many times clinic pages were viewed in this period.",
        guidance: "Use with Contact rate — high views with low contact means interest is not converting.",
        target: "Trend up or steady vs the previous period",
      },
      {
        id: "sessions",
        label: "Patient visits",
        meaning: "Distinct browsing visits (a person may view several pages in one visit).",
        guidance: "This is the base for contact and booking rates.",
        target: "Trend up or steady vs the previous period",
      },
      {
        id: "contact_rate",
        label: "Contact rate",
        meaning: "Percentage of visits that clicked Book or Call.",
        guidance: "If low, open Conversion Intelligence for where journeys stall.",
        target: "Aim for about 5% or higher",
        thresholds: { healthy: 5, watch: 2 },
      },
      {
        id: "booking_intent",
        label: "Booking click rate",
        meaning: "Percentage of visits that clicked a booking button (HotDoc).",
        guidance: "If low while calls are high, patients may prefer phone — still check booking button placement.",
        target: "Aim for about 3% or higher",
        thresholds: { healthy: 3, watch: 1.5 },
      },
      {
        id: "booking_clicks",
        label: "Booking clicks",
        meaning: "Times someone pressed Book appointment.",
        guidance: "Open Conversion Intelligence to see which pages drive bookings.",
      },
      {
        id: "clinic_calls",
        label: "Clinic call clicks",
        meaning: "Times someone tapped or clicked to call the clinic.",
        guidance: "Spike with low bookings can be normal for urgent care; sudden drop with steady traffic is a watch signal.",
      },
    ],
  },
  "monthly-executive": {
    id: "monthly-executive",
    title: "Monthly website report",
    inSixtySeconds:
      "This is the shareable month-end summary. Read the headline visits and contact rate, then the narrative bullets — suitable for practice meetings without opening other dashboards.",
    whatGoodLooksLike:
      "Month-on-month visits and contact actions that the practice can explain (campaigns, seasonality, or content changes).",
    statusKey: [
      { level: "healthy", meaning: "Month looks in line with recent history." },
      { level: "watch", meaning: "Contact rate or bookings softened — investigate in weekly dashboards." },
      { level: "critical", meaning: "Sharp drop in patient actions for the month." },
    ],
    scanOrder: ["Month headline metrics", "Comparison to prior month", "Export or print for the meeting pack"],
    metrics: [
      {
        id: "contact_rate",
        label: "Contact rate",
        meaning: "Share of visits that booked or called in the month.",
        guidance: "Compare to last month before changing website priorities.",
        target: "Aim for about 5% or higher",
        thresholds: { healthy: 5, watch: 2 },
      },
    ],
  },
  "digital-reception": {
    id: "digital-reception",
    title: "Online reception & search",
    inSixtySeconds:
      "Ask: when patients search on the site, do they find a useful next step? Check resolution rate first, then flagged topics and the watchlist — those are the topics to improve.",
    whatGoodLooksLike:
      "Most searches find a helpful result (Healthy band), few zero-result searches, and watchlist topics staying green.",
    statusKey: [
      { level: "healthy", meaning: "Search is helping patients (about 70%+ resolved)." },
      { level: "watch", meaning: "Mixed results (about 50–69%) — review flagged topics." },
      { level: "critical", meaning: "Many searches fail (under 50%) — fix content or shortcuts soon." },
    ],
    scanOrder: [
      "Search success rate (resolution)",
      "How often reception is opened",
      "Topics that failed (flagged / watchlist)",
      "Where successful searches sent people",
    ],
    metrics: [
      {
        id: "resolution_rate",
        label: "Search success rate",
        meaning: "Share of site searches that led to a useful result click (not a dead end).",
        guidance: "Below 50% needs attention. Open flagged topics and improve those pages or shortcuts.",
        target: "Healthy at 70%+ · Watch 50–69% · Needs attention under 50%",
        thresholds: { healthy: 70, watch: 50 },
      },
      {
        id: "open_rate",
        label: "Reception open rate",
        meaning: "Share of visits that opened the online reception / search panel.",
        guidance: "Very low may mean patients are not discovering search; very high with poor success means content gaps.",
        target: "Often healthy around 40%+ of visits",
        thresholds: { healthy: 40, watch: 20 },
      },
      {
        id: "zero_result_rate",
        label: "No-result search rate",
        meaning: "Share of searches that returned nothing useful.",
        guidance: "Lower is better. High rates point to missing pages or weak topic matching.",
        target: "Healthy at 15% or lower · Watch to 30% · Needs attention above 30%",
        thresholds: { healthy: 15, watch: 30, higherIsBetter: false },
      },
      {
        id: "searches",
        label: "Searches",
        meaning: "How many times patients searched in online reception.",
        guidance: "Volume alone is not good or bad — pair with search success rate.",
      },
    ],
  },
  "practitioner-authority": {
    id: "practitioner-authority",
    title: "Doctor profile strength",
    inSixtySeconds:
      "See which doctor pages patients view, and whether those views lead to booking or calling. “Well connected” means the profile is linked well across the site — not a clinical rating.",
    whatGoodLooksLike:
      "Profiles patients care about get views and a healthy share of booking/call clicks; thin profiles are improved with better links from services and advice articles.",
    statusKey: [
      { level: "healthy", meaning: "Views with solid booking or call interest." },
      { level: "watch", meaning: "Views without enough booking interest — check the profile journey." },
      { level: "critical", meaning: "Important profiles barely converting — fix links and booking placement." },
    ],
    scanOrder: [
      "Profile views and booking interest",
      "Well connected / Building / Needs more links counts",
      "Roster: who is viewed but not converting",
    ],
    metrics: [
      {
        id: "profile_views",
        label: "Profile views",
        meaning: "Times doctor profile pages were viewed.",
        guidance: "High views with low booking interest means the profile or booking path needs work.",
      },
      {
        id: "booking_intent",
        label: "Booking interest",
        meaning: "Share of profile engagement that led toward booking.",
        guidance: "Compare doctors with similar view volume before judging performance.",
        target: "Often watch below about 25% on well-viewed hubs",
      },
      {
        id: "contact_rate",
        label: "Contact rate",
        meaning: "Share of profile activity that led to book or call.",
        guidance: "Use with Conversion Intelligence for weak paths.",
      },
    ],
  },
  "service-authority": {
    id: "service-authority",
    title: "Service page strength",
    inSixtySeconds:
      "See which clinic services patients look at and whether those pages lead to contact. Link labels describe website structure — not clinical priority.",
    whatGoodLooksLike:
      "Key services are viewed and convert reasonably; thin service pages get stronger links from related advice and doctor pages.",
    statusKey: [
      { level: "healthy", meaning: "Service interest with healthy contact." },
      { level: "watch", meaning: "Views without enough contact — improve journey and booking cues." },
      { level: "critical", meaning: "Important services rarely converting." },
    ],
    scanOrder: [
      "Service views and contact rate",
      "Well connected / Building / Needs more links mix",
      "How patients arrive from online reception",
    ],
    metrics: [
      {
        id: "service_views",
        label: "Service page views",
        meaning: "Times service pages were viewed.",
        guidance: "Pair with contact rate — interest without action is the usual improvement opportunity.",
      },
      {
        id: "contact_rate",
        label: "Contact rate",
        meaning: "Share of service interest that led to book or call.",
        guidance: "Low rates: check Conversion Intelligence and Digital Reception destinations.",
        target: "Often watch at or below about 25% on busy pages",
      },
    ],
  },
  "conversion-intelligence": {
    id: "conversion-intelligence",
    title: "Booking journey",
    inSixtySeconds:
      "Follow the patient path from visit → interest → booking/call. The bottleneck step is where most people drop off — fix that page or button first.",
    whatGoodLooksLike:
      "A smooth funnel without a huge drop at one step, and few “weak paths” (busy pages that rarely lead to contact).",
    statusKey: [
      { level: "healthy", meaning: "Journey steps look balanced." },
      { level: "watch", meaning: "A clear bottleneck or a few weak paths." },
      { level: "critical", meaning: "Many weak paths or a severe drop into booking." },
    ],
    scanOrder: [
      "Funnel steps and the marked bottleneck",
      "Where people leave (exits / abandonment)",
      "Best and weakest converting pages",
      "Opportunity list — pages to improve",
    ],
    metrics: [
      {
        id: "funnel",
        label: "Patient journey steps",
        meaning: "How many visits progress toward booking or calling.",
        guidance: "Focus on the bottleneck step labelled on the chart.",
      },
      {
        id: "weak_paths",
        label: "Weak booking paths",
        meaning: "Busy pages or journeys that rarely lead to contact (about 25% or less).",
        guidance: "Treat these as an improvement backlog — start with the highest-traffic weak path.",
        target: "Fewer weak paths over time",
      },
    ],
  },
  "governance-review": {
    id: "governance-review",
    title: "Content review list",
    inSixtySeconds:
      "This is the worklist of pages needing clinical or practice review. Open a record to complete ownership, dates, and approval — public website text only updates when approval rules are met.",
    whatGoodLooksLike:
      "Queues shrinking; expired and missing-ownership counts near zero.",
    statusKey: [
      { level: "healthy", meaning: "Little overdue work." },
      { level: "watch", meaning: "Items due soon or awaiting review." },
      { level: "critical", meaning: "Expired reviews or missing owners — prioritise these." },
    ],
    scanOrder: ["Active queue filter", "Records in the list", "Open a record to complete review fields"],
    metrics: [
      {
        id: "queue",
        label: "Review queue",
        meaning: "Pages filtered to a workload type (awaiting, due soon, expired, missing owner).",
        guidance: "Clear expired and missing ownership before routine due-soon items.",
      },
    ],
  },
  "governance-management": {
    id: "governance-management",
    title: "Content review board",
    inSixtySeconds:
      "Treat the four workload cards as your triage board: Expired and Missing Owner first, then Due Soon and Awaiting Review. Each click opens remediation with next action, owner, and due date.",
    whatGoodLooksLike:
      "Expired near zero, ownership filled in, and due-soon items scheduled into the calendar.",
    statusKey: [
      { level: "healthy", meaning: "Workload under control." },
      { level: "watch", meaning: "Due soon or awaiting review building up." },
      { level: "critical", meaning: "Expired reviews or missing owners." },
    ],
    scanOrder: [
      "Workload cards (Expired / Missing Owner first)",
      "Progress by content type",
      "Calendar and upcoming expiry",
      "Action lists",
    ],
    metrics: [
      {
        id: "expired",
        label: "Expired reviews",
        meaning: "Pages past their next review date.",
        guidance: "Clear these first — they are the highest compliance risk.",
        target: "Aim for zero",
        thresholds: { healthy: 0, watch: 1, higherIsBetter: false },
      },
      {
        id: "due_soon",
        label: "Due within 60 days",
        meaning: "Reviews coming up in the next two months.",
        guidance: "Schedule into the calendar so they do not become expired.",
      },
      {
        id: "missing_ownership",
        label: "Missing Owner",
        meaning: "Pages without a named content owner.",
        guidance: "Assign an owner before approval can complete.",
        target: "Aim for zero",
        thresholds: { healthy: 0, watch: 1, higherIsBetter: false },
      },
      {
        id: "awaiting_review",
        label: "Awaiting review",
        meaning: "Items sitting in the review pipeline.",
        guidance: "Keep this queue moving so it does not become a backlog.",
      },
    ],
  },
  "governance-expiry": {
    id: "governance-expiry",
    title: "Review due dates",
    inSixtySeconds:
      "See how many pages are overdue, due soon, current, or still waiting for approval. Use the coloured buckets to jump into the matching work queue.",
    whatGoodLooksLike:
      "Most pages Current; Overdue near zero; Awaiting review not stuck for long.",
    statusKey: [
      { level: "healthy", meaning: "Mostly current reviews." },
      { level: "watch", meaning: "Due soon building up." },
      { level: "critical", meaning: "Overdue bucket growing." },
    ],
    scanOrder: ["Overdue bucket", "Due soon", "Current vs awaiting approval", "Open the matching queue"],
    metrics: [
      {
        id: "overdue",
        label: "Overdue",
        meaning: "Reviews past their due date.",
        guidance: "Open the Expired queue on the management board.",
        target: "Aim for zero",
        thresholds: { healthy: 0, watch: 1, higherIsBetter: false },
      },
    ],
  },
};

export function getHowToReadGuide(id: InsightsDestination | "monthly-executive"): HowToReadGuide {
  return HOW_TO_READ_GUIDES[id];
}

export function getMetricGuide(
  dashboard: InsightsDestination | "monthly-executive",
  metricId: string,
): MetricGuide | undefined {
  return HOW_TO_READ_GUIDES[dashboard].metrics.find((metric) => metric.id === metricId);
}
