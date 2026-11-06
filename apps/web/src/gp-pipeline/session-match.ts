import type { MatchRunSource, Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { notifyRoles } from "./notifications";

type Day =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";
type Period = "morning" | "afternoon" | "evening";

/** Seed windows from session-capacity-matching/practice-capacity.json (proposal). */
const DEFAULT_WINDOWS: Array<{
  dayOfWeek: Day;
  period: Period;
  startsAt: string;
  endsAt: string;
  isOffered: boolean;
  activeRooms: number;
  reserveSlots: number;
  nursing: { coverageLevel: string; maxSupportedRooms: number; nurseCount: number };
  existingGps: Array<{ doctorName: string; roomLabel?: string }>;
}> = [
  {
    dayOfWeek: "monday",
    period: "morning",
    startsAt: "08:00",
    endsAt: "12:30",
    isOffered: true,
    activeRooms: 4,
    reserveSlots: 0,
    nursing: { coverageLevel: "full", maxSupportedRooms: 4, nurseCount: 2 },
    existingGps: [
      { doctorName: "Dr Chen", roomLabel: "Room 1" },
      { doctorName: "Dr Lee", roomLabel: "Room 2" },
    ],
  },
  {
    dayOfWeek: "monday",
    period: "afternoon",
    startsAt: "13:00",
    endsAt: "17:30",
    isOffered: true,
    activeRooms: 4,
    reserveSlots: 0,
    nursing: { coverageLevel: "full", maxSupportedRooms: 4, nurseCount: 2 },
    existingGps: [{ doctorName: "Dr Chen", roomLabel: "Room 1" }],
  },
  {
    dayOfWeek: "wednesday",
    period: "morning",
    startsAt: "08:00",
    endsAt: "12:30",
    isOffered: true,
    activeRooms: 4,
    reserveSlots: 0,
    nursing: { coverageLevel: "full", maxSupportedRooms: 4, nurseCount: 2 },
    existingGps: [],
  },
  {
    dayOfWeek: "friday",
    period: "afternoon",
    startsAt: "13:00",
    endsAt: "17:00",
    isOffered: true,
    activeRooms: 3,
    reserveSlots: 0,
    nursing: { coverageLevel: "limited", maxSupportedRooms: 2, nurseCount: 1 },
    existingGps: [{ doctorName: "Dr Lee", roomLabel: "Room 2" }],
  },
];

const DAY_ALIASES: Record<string, Day> = {
  mon: "monday",
  monday: "monday",
  tue: "tuesday",
  tues: "tuesday",
  tuesday: "tuesday",
  wed: "wednesday",
  wednesday: "wednesday",
  thu: "thursday",
  thur: "thursday",
  thursday: "thursday",
  fri: "friday",
  friday: "friday",
  sat: "saturday",
  saturday: "saturday",
};

const PERIOD_ALIASES: Record<string, Period> = {
  am: "morning",
  morning: "morning",
  pm: "afternoon",
  afternoon: "afternoon",
  evening: "evening",
  eve: "evening",
};

const WEIGHTS = { available: 1.0, limited: 0.46, full: 0.0 } as const;

export function parsePreferredSession(input: unknown): {
  dayOfWeek: Day;
  period: Period;
  key: string;
  label: string;
} | null {
  if (!input) return null;
  if (typeof input === "object" && input !== null) {
    const o = input as Record<string, string>;
    const dayOfWeek = DAY_ALIASES[String(o.dayOfWeek || o.day || "").toLowerCase()];
    const period = PERIOD_ALIASES[String(o.period || "").toLowerCase()];
    if (!dayOfWeek || !period) return null;
    return {
      dayOfWeek,
      period,
      key: `${dayOfWeek}_${period}`,
      label: `${dayOfWeek} ${period}`,
    };
  }
  const raw = String(input).trim().toLowerCase();
  if (raw.includes("_")) {
    const [d, p] = raw.split("_");
    const dayOfWeek = DAY_ALIASES[d];
    const period = PERIOD_ALIASES[p];
    if (!dayOfWeek || !period) return null;
    return { dayOfWeek, period, key: `${dayOfWeek}_${period}`, label: `${dayOfWeek} ${period}` };
  }
  const parts = raw.split(/\s+/);
  if (parts.length < 2) return null;
  const dayOfWeek = DAY_ALIASES[parts[0]];
  const period = PERIOD_ALIASES[parts[1]];
  if (!dayOfWeek || !period) return null;
  return { dayOfWeek, period, key: `${dayOfWeek}_${period}`, label: `${dayOfWeek} ${period}` };
}

type WindowRow = {
  key: string;
  dayOfWeek: Day;
  period: Period;
  label: string;
  isOffered: boolean;
  activeRooms: number;
  reserveSlots: number;
  nursing: { coverageLevel: string; maxSupportedRooms?: number; nurseCount?: number };
  existingGps: Array<{ doctorName: string }>;
};

function statusFor(window: WindowRow): "available" | "limited" | "full" {
  if (!window.isOffered) return "full";
  const assigned = window.existingGps.length;
  const nursingCap =
    window.nursing.coverageLevel === "none"
      ? 0
      : (window.nursing.maxSupportedRooms ?? window.activeRooms);
  const free = Math.max(0, Math.min(window.activeRooms, nursingCap) - window.reserveSlots - assigned);
  if (free <= 0) return "full";
  if (window.nursing.coverageLevel === "limited" || free === 1) return "limited";
  return "available";
}

export async function ensureDefaultCapacityWindows(clinicId: string) {
  const count = await prisma.capacitySessionWindow.count({ where: { clinicId } });
  if (count > 0) return;
  for (const w of DEFAULT_WINDOWS) {
    await prisma.capacitySessionWindow.create({
      data: {
        clinicId,
        dayOfWeek: w.dayOfWeek,
        period: w.period,
        startsAt: w.startsAt,
        endsAt: w.endsAt,
        isOffered: w.isOffered,
        activeRooms: w.activeRooms,
        reserveSlots: w.reserveSlots,
        nursingJson: w.nursing,
        existingGpsJson: w.existingGps,
      },
    });
  }
}

export async function runSessionCapacityMatch(input: {
  clinicId: string;
  preferredSessions: unknown[];
  doctorDisplayName?: string;
  enquiryId?: string;
  onboardingCaseId?: string;
  source?: MatchRunSource;
  persist?: boolean;
  createdByUserId?: string;
}) {
  await ensureDefaultCapacityWindows(input.clinicId);
  const dbWindows = await prisma.capacitySessionWindow.findMany({
    where: { clinicId: input.clinicId },
  });
  const windows: WindowRow[] = dbWindows.map((w) => ({
    key: `${w.dayOfWeek}_${w.period}`,
    dayOfWeek: w.dayOfWeek,
    period: w.period,
    label: `${w.dayOfWeek} ${w.period}`,
    isOffered: w.isOffered,
    activeRooms: w.activeRooms,
    reserveSlots: w.reserveSlots,
    nursing: w.nursingJson as WindowRow["nursing"],
    existingGps: w.existingGpsJson as WindowRow["existingGps"],
  }));

  const preferred = input.preferredSessions
    .map(parsePreferredSession)
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const perSession = preferred.map((p) => {
    const window = windows.find((w) => w.key === p.key);
    const status = window ? statusFor(window) : ("full" as const);
    return {
      key: p.key,
      label: p.label,
      status,
      weight: WEIGHTS[status],
      existingGps: window?.existingGps.map((g) => g.doctorName) ?? [],
      nursing: window?.nursing.coverageLevel ?? "unknown",
    };
  });

  const weightSum = perSession.reduce((s, r) => s + r.weight, 0);
  const compatibilityScore =
    preferred.length === 0 ? 0 : Math.round((weightSum / preferred.length) * 100);

  const availableOptions = windows
    .map((w) => ({ ...w, status: statusFor(w) }))
    .filter((w) => w.status === "available")
    .map((w) => ({ key: w.key, label: w.label, status: w.status }));

  const preferredKeys = new Set(preferred.map((p) => p.key));
  const alternatives = availableOptions.filter((o) => !preferredKeys.has(o.key)).slice(0, 5);

  const notice =
    "Advisory only. Session allocation requires human confirmation at the onboarding session_allocation gate.";

  const payload = {
    compatibilityScore,
    compatibilityLabel: `${compatibilityScore}% compatibility`,
    perSession,
    availableOptions,
    alternativeRecommendations: alternatives,
    notice,
  };

  if (!input.persist) return payload;

  const run = await prisma.sessionCapacityMatchRun.create({
    data: {
      clinicId: input.clinicId,
      source: input.source ?? "admin_manual",
      enquiryId: input.enquiryId,
      onboardingCaseId: input.onboardingCaseId,
      doctorDisplayName: input.doctorDisplayName,
      preferredKeysJson: preferred.map((p) => p.key),
      compatibilityScore,
      breakdownJson: perSession as unknown as Prisma.InputJsonValue,
      availableOptionsJson: availableOptions as unknown as Prisma.InputJsonValue,
      alternativesJson: alternatives as unknown as Prisma.InputJsonValue,
      capacitySnapshotJson: windows as unknown as Prisma.InputJsonValue,
      notice,
      createdByUserId: input.createdByUserId,
    },
  });

  await notifyRoles({
    clinicId: input.clinicId,
    eventId: "session_match_advisory",
    roles: ["practice_manager"],
    payload: {
      matchRunId: run.id,
      compatibilityScore,
      notice,
    },
    enquiryId: input.enquiryId,
    onboardingCaseId: input.onboardingCaseId,
  });

  return { ...payload, matchRunId: run.id };
}
