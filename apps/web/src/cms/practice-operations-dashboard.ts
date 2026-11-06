import type { CareerApplicationDashboardStats } from "@/cms/careers-applications";
import type { MediaLibraryDashboardStats } from "@/cms/media-library-shared";
import type { PatientRequestDashboardStats } from "@/cms/patient-requests";

export type PracticeActionItem = {
  id: string;
  label: string;
  value: number;
  href: string;
  hint: string;
  tone: "critical" | "attention" | "watch" | "ok";
};

export type PracticeKpiCard = {
  label: string;
  value: number | string;
  href: string;
  hint: string;
};

export type PracticeOperationsSnapshot = {
  actionCentre: PracticeActionItem[];
  needsAttentionTotal: number;
  recruitment: PracticeKpiCard[];
  patientOps: PracticeKpiCard[];
  content: PracticeKpiCard[];
  search: PracticeKpiCard[];
  media: PracticeKpiCard[];
};

export type PracticeSearchOpsKpis = {
  topSearches: number;
  risingSearches: number;
  noResults: number;
  highestOpportunityScore: number;
  opportunityQueue: number;
  pagesDue: number;
  reviewsOverdue: number;
  pagesUpdatedThisMonth: number;
};

function toneForCount(value: number, criticalAt = 5): PracticeActionItem["tone"] {
  if (value <= 0) return "ok";
  if (value >= criticalAt) return "critical";
  if (value >= 2) return "attention";
  return "watch";
}

/** Pure assembler — keeps Practice Briefing queries in one place for QA. */
export function buildPracticeOperationsSnapshot(input: {
  careers: CareerApplicationDashboardStats | null;
  patients: PatientRequestDashboardStats | null;
  media: MediaLibraryDashboardStats | null;
  search: PracticeSearchOpsKpis | null;
  contentOpportunities?: number;
}): PracticeOperationsSnapshot {
  const careers = input.careers;
  const patients = input.patients;
  const media = input.media;
  const search = input.search;

  const actionCentre: PracticeActionItem[] = [
    {
      id: "applications",
      label: "Applications awaiting review",
      value: careers?.awaitingReview ?? 0,
      href: "/admin/careers/applications?status=reviewing",
      hint: "New + reviewing talent applications",
      tone: toneForCount(careers?.awaitingReview ?? 0, 4),
    },
    {
      id: "patient-requests",
      label: "Patient requests awaiting action",
      value: patients?.awaitingAction ?? 0,
      href: "/admin/operations/patient-requests?status=new",
      hint: "New or waiting for patient",
      tone: toneForCount(patients?.awaitingAction ?? 0, 3),
    },
    {
      id: "reviews-due",
      label: "Reviews due",
      value: search?.pagesDue ?? 0,
      href: "/admin/governance/expiry",
      hint: "Clinical review due within horizon",
      tone: toneForCount(search?.pagesDue ?? 0, 5),
    },
    {
      id: "overdue-content",
      label: "Overdue content",
      value: search?.reviewsOverdue ?? 0,
      href: "/admin/governance/expiry",
      hint: "Past next-review date",
      tone: toneForCount(search?.reviewsOverdue ?? 0, 1),
    },
    {
      id: "missing-media",
      label: "Missing media metadata",
      value: media?.missingAlt ?? 0,
      href: "/admin/media?alt=missing",
      hint: "Assets without CMS alt text",
      tone: toneForCount(media?.missingAlt ?? 0, 8),
    },
    {
      id: "open-vacancies",
      label: "Open vacancies",
      value: careers?.openVacancies ?? 0,
      href: "/admin/careers/vacancies",
      hint: "Active roles on Join Our Team",
      tone: (careers?.openVacancies ?? 0) > 0 ? "watch" : "ok",
    },
  ];

  const needsAttentionTotal = actionCentre
    .filter((item) => item.id !== "open-vacancies")
    .reduce((sum, item) => sum + item.value, 0);

  return {
    actionCentre,
    needsAttentionTotal,
    recruitment: [
      {
        label: "Active vacancies",
        value: careers?.openVacancies ?? 0,
        href: "/admin/careers/vacancies",
        hint: "Not closed",
      },
      {
        label: "Applications today",
        value: careers?.applicationsToday ?? 0,
        href: "/admin/careers/applications",
        hint: "Submitted today",
      },
      {
        label: "Awaiting review",
        value: careers?.awaitingReview ?? 0,
        href: "/admin/careers/applications?status=reviewing",
        hint: "New + reviewing",
      },
      {
        label: "Interviews",
        value: careers?.interviews ?? 0,
        href: "/admin/careers/applications?status=interview",
        hint: "Interview stage",
      },
      {
        label: "Hired this month",
        value: careers?.hiredThisMonth ?? 0,
        href: "/admin/careers/applications?status=hired",
        hint: "Status updated this month",
      },
    ],
    patientOps: [
      {
        label: "New requests",
        value: patients?.newToday ?? 0,
        href: "/admin/operations/patient-requests?status=new",
        hint: "Created today",
      },
      {
        label: "Assigned",
        value: patients?.assigned ?? 0,
        href: "/admin/operations/patient-requests?status=assigned",
        hint: "Assigned or in progress",
      },
      {
        label: "Waiting for patient",
        value: patients?.waitingForPatient ?? 0,
        href: "/admin/operations/patient-requests?status=waiting_for_patient",
        hint: "Blocked on patient reply",
      },
      {
        label: "Overdue",
        value: patients?.overdue ?? 0,
        href: "/admin/operations/patient-requests",
        hint: "Open longer than 3 days",
      },
      {
        label: "Closed this week",
        value: patients?.closedThisWeek ?? 0,
        href: "/admin/operations/patient-requests?status=closed",
        hint: "Completed or closed (7d)",
      },
    ],
    content: [
      {
        label: "Reviews due",
        value: search?.pagesDue ?? 0,
        href: "/admin/governance/expiry",
        hint: "Due within review horizon",
      },
      {
        label: "Reviews overdue",
        value: search?.reviewsOverdue ?? 0,
        href: "/admin/governance/expiry",
        hint: "Past next-review date",
      },
      {
        label: "Pages updated this month",
        value: search?.pagesUpdatedThisMonth ?? 0,
        href: "/admin/pages",
        hint: "Reviewed or page updated (30d)",
      },
      {
        label: "Content opportunities",
        value: input.contentOpportunities ?? search?.opportunityQueue ?? 0,
        href: "/admin/search-opportunities#sco-queue",
        hint: "Scored search gaps",
      },
    ],
    search: [
      {
        label: "Top searches",
        value: search?.topSearches ?? 0,
        href: "/admin/search-opportunities#sco-top",
        hint: "Leading term volume",
      },
      {
        label: "Rising searches",
        value: search?.risingSearches ?? 0,
        href: "/admin/search-opportunities",
        hint: "Rising or new terms",
      },
      {
        label: "No-result searches",
        value: search?.noResults ?? 0,
        href: "/admin/search-opportunities#sco-noresult",
        hint: "Unmatched demand",
      },
      {
        label: "Highest opportunity score",
        value: search?.highestOpportunityScore ?? 0,
        href: "/admin/search-opportunities#sco-queue",
        hint: "Top scored content gap",
      },
    ],
    media: [
      {
        label: "Assets",
        value: media?.total ?? 0,
        href: "/admin/media",
        hint: "Catalogued images",
      },
      {
        label: "Missing alt text",
        value: media?.missingAlt ?? 0,
        href: "/admin/media?alt=missing",
        hint: "CMS alt empty",
      },
      {
        label: "Unused assets",
        value: media?.unused ?? 0,
        href: "/admin/media?usage=unused",
        hint: "Not on published pages",
      },
      {
        label: "Recent uploads",
        value: media?.recentUploads ?? 0,
        href: "/admin/media?sort=uploaded",
        hint: "Last 7 days",
      },
    ],
  };
}
