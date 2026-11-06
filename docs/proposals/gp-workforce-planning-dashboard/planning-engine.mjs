/**
 * GP Workforce Planning Engine — advisory aggregates only.
 * Does not hire, roster, or auto-advance onboarding.
 */

function nursingCap(window) {
  const nursing = window.nursing || { coverageLevel: "none", maxSupportedRooms: 0 };
  if (nursing.coverageLevel === "none") return 0;
  if (nursing.maxSupportedRooms != null) return nursing.maxSupportedRooms;
  if (nursing.coverageLevel === "limited") return Math.floor((window.activeRooms || 0) / 2);
  return window.activeRooms || 0;
}

function evaluateWindow(window) {
  const offered = Math.min(window.activeRooms || 0, nursingCap(window));
  const used = (window.existingGps || []).length;
  const reserve = window.reserveSlots || 0;
  const free = Math.max(0, offered - used - reserve);
  const utilisation = offered === 0 ? 1 : used / offered;
  let status = "available";
  if (free <= 0) status = "full";
  else if (free === 1 || utilisation >= 0.67) status = "limited";
  return { offered, used, free, utilisation, status };
}

export function buildWorkforcePlan(inputs) {
  const {
    capacity,
    eoiPipeline = [],
    onboardingPipeline = [],
    targetSessionsPerGp = 4,
    reserveSessions = 1,
    scenario = "moderate",
  } = inputs;

  const growth = { stable: 1.0, moderate: 1.08, pressure: 1.15 }[scenario] || 1.08;
  const windows = (capacity.windows || []).filter((w) => w.isOffered !== false);

  let offeredSessions = 0;
  let usedSessions = 0;
  const roomUtilisation = [];
  const gpNames = new Set();

  for (const w of windows) {
    const ev = evaluateWindow(w);
    offeredSessions += ev.offered;
    usedSessions += ev.used;
    (w.existingGps || []).forEach((g) => gpNames.add(g.doctorName));
    roomUtilisation.push({
      key: w.key,
      label: w.label || w.key,
      dayOfWeek: w.dayOfWeek,
      period: w.period,
      status: ev.status,
      offered: ev.offered,
      used: ev.used,
      free: ev.free,
      utilisationPercent: Number((ev.utilisation * 100).toFixed(1)),
      nursing: w.nursing?.coverageLevel || "unknown",
      existingGps: (w.existingGps || []).map((g) => g.doctorName),
    });
  }

  const availableSessions = Math.max(0, offeredSessions - usedSessions - reserveSessions);
  const utilisationPercent = offeredSessions
    ? Number(((100 * usedSessions) / offeredSessions).toFixed(1))
    : 0;
  const recruitmentTargetGps = Math.ceil(availableSessions / Math.max(targetSessionsPerGp, 1));

  const availableSessionList = roomUtilisation
    .filter((r) => r.status === "available" || r.status === "limited")
    .sort((a, b) => b.free - a.free);

  const fullWindows = roomUtilisation.filter((r) => r.status === "full");
  const limitedWindows = roomUtilisation.filter((r) => r.status === "limited");

  const eoiByStatus = {};
  const eoiByBand = {};
  let eoiPriorityReview = 0;
  let eoiHardFlags = 0;
  for (const e of eoiPipeline) {
    eoiByStatus[e.status] = (eoiByStatus[e.status] || 0) + 1;
    eoiByBand[e.scoreBand] = (eoiByBand[e.scoreBand] || 0) + 1;
    if (e.scoreBand === "priority_review" || e.scoreBand === "strong_fit") eoiPriorityReview += 1;
    if ((e.hardFlags || []).length) eoiHardFlags += 1;
  }

  const onboardingByStage = {};
  let onboardingAwaitingExternal = 0;
  for (const o of onboardingPipeline) {
    const stage = o.currentStageId || o.stage || "unknown";
    onboardingByStage[stage] = (onboardingByStage[stage] || 0) + 1;
    if (o.status === "awaiting_external") onboardingAwaitingExternal += 1;
  }

  const horizons = [4, 12, 26];
  const capacityForecasts = horizons.map((weeks) => {
    const demandSessions = Number((offeredSessions * growth * (1 + (weeks / 52) * 0.02)).toFixed(1));
    const shortageSessions = Number(Math.max(0, demandSessions - offeredSessions).toFixed(1));
    const impliedGpNeed = Math.ceil(shortageSessions / Math.max(targetSessionsPerGp, 1));
    return {
      horizonWeeks: weeks,
      scenario,
      demandSessions,
      offeredSessions,
      shortageSessions,
      impliedAdditionalGps: impliedGpNeed,
      label:
        shortageSessions > 0
          ? `Forecast shortage ~${shortageSessions} sessions by week ${weeks}`
          : `No session shortage under ${scenario} scenario to week ${weeks}`,
    };
  });

  const priorityGaps = [];
  for (const w of fullWindows) {
    priorityGaps.push({
      id: `gap_full_${w.key}`,
      severity: "high",
      type: "full_window",
      label: `${w.label} is full`,
      detail: `No free effective slots (used ${w.used}/${w.offered}).`,
      score: 3,
    });
  }
  for (const w of limitedWindows) {
    priorityGaps.push({
      id: `gap_lim_${w.key}`,
      severity: "medium",
      type: "limited_window",
      label: `${w.label} is limited`,
      detail: `Only ${w.free} free slot(s); nursing=${w.nursing}.`,
      score: 1.5,
    });
  }
  if (recruitmentTargetGps > 0) {
    priorityGaps.push({
      id: "gap_recruit_target",
      severity: recruitmentTargetGps >= 2 ? "high" : "medium",
      type: "unfilled_recruitment",
      label: `${recruitmentTargetGps} GP recruitment target(s) from spare sessions`,
      detail: `${availableSessions} available sessions ÷ ${targetSessionsPerGp} target sessions/GP.`,
      score: 2 * recruitmentTargetGps,
    });
  }
  if (onboardingAwaitingExternal > 0) {
    priorityGaps.push({
      id: "gap_onboarding_external",
      severity: "medium",
      type: "onboarding_lag",
      label: `${onboardingAwaitingExternal} onboarding case(s) awaiting external`,
      detail: "Provider number / external agency lag — practice cannot clear automatically.",
      score: 1 * onboardingAwaitingExternal,
    });
  }
  priorityGaps.sort((a, b) => b.score - a.score);

  const recommendations = [];
  if (recruitmentTargetGps > 0 && eoiPriorityReview > 0) {
    recommendations.push({
      id: "rec_review_eoi",
      kind: "open_eoi_review",
      priority: "high",
      title: "Review priority EOIs against spare sessions",
      rationale: `${eoiPriorityReview} priority/strong-fit EOI(s) while ~${recruitmentTargetGps} GP target(s) of capacity exist.`,
      suggestedHumanAction: "Open Admin GP Enquiries; assign reviewer; do not auto-offer.",
    });
  } else if (recruitmentTargetGps > 0) {
    recommendations.push({
      id: "rec_attract",
      kind: "recruit_sessions",
      priority: "medium",
      title: "Attract GPs for available consulting sessions",
      rationale: `${availableSessions} sessions available after reserve; pipeline may need nurturing.`,
      suggestedHumanAction: "Confirm capacity still true, then open recruitment conversation carefully.",
    });
  } else {
    recommendations.push({
      id: "rec_hold",
      kind: "hold_recruitment",
      priority: "low",
      title: "Hold net-new recruitment for now",
      rationale: "Little spare session capacity after reserve; focus on utilisation quality and onboarding.",
      suggestedHumanAction: "Human confirms hold; revisit after roster or nursing changes.",
    });
  }

  if (fullWindows.length || limitedWindows.length) {
    recommendations.push({
      id: "rec_rebalance",
      kind: "rebalance_sessions",
      priority: fullWindows.length ? "high" : "medium",
      title: "Rebalance sessions into available windows",
      rationale: `${fullWindows.length} full and ${limitedWindows.length} limited window(s).`,
      suggestedHumanAction: "Use Session–Capacity Matching with candidate prefs; human allocates.",
    });
  }

  if (onboardingPipeline.some((o) => o.status === "ready_for_go_live" || o.currentStageId === "go_live")) {
    recommendations.push({
      id: "rec_onboarding_gate",
      kind: "advance_onboarding",
      priority: "high",
      title: "Human go-live review for onboarding cases",
      rationale: "At least one case near go-live — checklist requires named approver.",
      suggestedHumanAction: "Open onboarding workflow; record gate — never auto-release.",
    });
  }

  if (limitedWindows.some((w) => w.nursing === "limited")) {
    recommendations.push({
      id: "rec_nursing",
      kind: "adjust_nursing_cover",
      priority: "medium",
      title: "Review nursing cover on limited windows",
      rationale: "Nursing caps reduce effective rooms independent of physical room count.",
      suggestedHumanAction: "Nurse lead + practice manager discuss roster — not an automated change.",
    });
  }

  const forecastShortages = capacityForecasts.filter((f) => f.shortageSessions > 0);

  return {
    generatedAt: new Date().toISOString(),
    clinicId: capacity.clinicId || "woolloongabba",
    notice:
      "Human decision-making only. Targets and forecasts are advisory. This dashboard does not hire, decline, or publish rosters.",
    currentGpCapacity: {
      activeGpCount: gpNames.size,
      activeGps: [...gpNames].sort(),
      offeredSessions,
      usedSessions,
      availableSessions,
      reserveSessions,
      utilisationPercent,
      targetSessionsPerGp,
    },
    forecastShortages,
    availableSessions: {
      total: availableSessions,
      windows: availableSessionList,
    },
    recruitmentTargets: {
      recommendedGpCount: recruitmentTargetGps,
      basis: `ceil(${availableSessions} available / ${targetSessionsPerGp} sessions per GP)`,
      alignedPriorityEois: eoiPriorityReview,
      note: "Recommendation only — practice decides whether to recruit.",
    },
    eoiPipeline: {
      total: eoiPipeline.length,
      byStatus: eoiByStatus,
      byBand: eoiByBand,
      priorityOrStrong: eoiPriorityReview,
      hardFlagged: eoiHardFlags,
      items: eoiPipeline.map((e) => ({
        id: e.id,
        name: e.doctorDisplayName,
        status: e.status,
        priorityScore: e.priorityScore,
        scoreBand: e.scoreBand,
        hardFlags: e.hardFlags || [],
      })),
    },
    onboardingPipeline: {
      total: onboardingPipeline.length,
      byStage: onboardingByStage,
      awaitingExternal: onboardingAwaitingExternal,
      items: onboardingPipeline.map((o) => ({
        id: o.id,
        name: o.doctorDisplayName,
        status: o.status,
        stage: o.currentStageId || o.stage,
      })),
    },
    roomUtilisation,
    capacityForecasts,
    recruitmentRecommendations: recommendations,
    priorityGaps,
    links: {
      capacityMatching: "http://127.0.0.1:4183/",
      gpEnquiries: "http://127.0.0.1:4182/",
      onboarding: "http://127.0.0.1:4180/dashboard.html",
      attractionAnalytics: "http://127.0.0.1:4181/",
    },
  };
}
