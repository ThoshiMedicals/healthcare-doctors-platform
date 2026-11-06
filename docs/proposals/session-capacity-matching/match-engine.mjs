/**
 * Session-to-Capacity Matching Engine
 * Advisory only — does not allocate rooms or approve hire.
 */

const WEIGHTS = { available: 1.0, limited: 0.46, full: 0.0 };

const DAY_ALIASES = {
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

const PERIOD_ALIASES = {
  am: "morning",
  morning: "morning",
  pm: "afternoon",
  afternoon: "afternoon",
  evening: "evening",
  eve: "evening",
};

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const PERIOD_ORDER = ["morning", "afternoon", "evening"];

const SHORT_DAY = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
};

const SHORT_PERIOD = {
  morning: "AM",
  afternoon: "PM",
  evening: "Eve",
};

export function labelFor(dayOfWeek, period) {
  return `${SHORT_DAY[dayOfWeek] || dayOfWeek} ${SHORT_PERIOD[period] || period}`;
}

export function keyFor(dayOfWeek, period) {
  return `${dayOfWeek}_${period}`;
}

/** Parse "Mon PM" | {dayOfWeek, period} | {day, period} | "monday_afternoon" */
export function parsePreferredSession(input) {
  if (!input) return null;
  if (typeof input === "object") {
    const dayRaw = String(input.dayOfWeek || input.day || "").toLowerCase().trim();
    const periodRaw = String(input.period || "").toLowerCase().trim();
    const dayOfWeek = DAY_ALIASES[dayRaw];
    const period = PERIOD_ALIASES[periodRaw];
    if (!dayOfWeek || !period) return null;
    return { dayOfWeek, period, key: keyFor(dayOfWeek, period), label: labelFor(dayOfWeek, period) };
  }
  const raw = String(input).trim();
  if (raw.includes("_")) {
    const [d, p] = raw.toLowerCase().split("_");
    const dayOfWeek = DAY_ALIASES[d];
    const period = PERIOD_ALIASES[p];
    if (!dayOfWeek || !period) return null;
    return { dayOfWeek, period, key: keyFor(dayOfWeek, period), label: labelFor(dayOfWeek, period) };
  }
  const parts = raw.split(/\s+/);
  if (parts.length < 2) return null;
  const dayOfWeek = DAY_ALIASES[parts[0].toLowerCase()];
  const period = PERIOD_ALIASES[parts[1].toLowerCase()];
  if (!dayOfWeek || !period) return null;
  return { dayOfWeek, period, key: keyFor(dayOfWeek, period), label: labelFor(dayOfWeek, period) };
}

export function evaluateWindow(window) {
  if (!window || !window.isOffered) {
    return {
      status: "full",
      freeEffectiveSlots: 0,
      offeredSlots: 0,
      usedSlots: 0,
      utilisation: 1,
      nursing: window?.nursing?.coverageLevel || "none",
    };
  }
  const nursing = window.nursing || { coverageLevel: "none", maxSupportedRooms: 0 };
  let maxByNursing = nursing.maxSupportedRooms;
  if (nursing.coverageLevel === "none") maxByNursing = 0;
  if (maxByNursing == null) {
    maxByNursing =
      nursing.coverageLevel === "limited"
        ? Math.floor((window.activeRooms || 0) / 2)
        : window.activeRooms || 0;
  }
  const offeredSlots = Math.min(window.activeRooms || 0, maxByNursing);
  const usedSlots = (window.existingGps || []).filter((g) => g).length;
  const reserve = window.reserveSlots || 0;
  const freeEffectiveSlots = Math.max(0, offeredSlots - usedSlots - reserve);
  const utilisation = offeredSlots === 0 ? 1 : usedSlots / offeredSlots;

  let status = "available";
  if (freeEffectiveSlots <= 0) status = "full";
  else if (freeEffectiveSlots === 1 || utilisation >= 0.67) status = "limited";

  return {
    status,
    freeEffectiveSlots,
    offeredSlots,
    usedSlots,
    utilisation: Number(utilisation.toFixed(3)),
    nursing: nursing.coverageLevel,
  };
}

function enrichCapacity(capacity) {
  return (capacity.windows || []).map((w) => {
    const evald = evaluateWindow(w);
    return {
      ...w,
      key: w.key || keyFor(w.dayOfWeek, w.period),
      label: w.label || labelFor(w.dayOfWeek, w.period),
      ...evald,
    };
  });
}

function adjacentPeriod(period) {
  const idx = PERIOD_ORDER.indexOf(period);
  if (idx < 0) return [];
  const out = [];
  if (idx > 0) out.push(PERIOD_ORDER[idx - 1]);
  if (idx < PERIOD_ORDER.length - 1) out.push(PERIOD_ORDER[idx + 1]);
  return out;
}

function nearbyDays(day) {
  const idx = DAY_ORDER.indexOf(day);
  if (idx < 0) return [];
  const out = [];
  if (idx > 0) out.push(DAY_ORDER[idx - 1]);
  if (idx < DAY_ORDER.length - 1) out.push(DAY_ORDER[idx + 1]);
  return out;
}

/**
 * @param {object} capacity practice-capacity.json
 * @param {Array} preferredInputs preferred session list
 */
export function matchSessions(capacity, preferredInputs, options = {}) {
  const windows = enrichCapacity(capacity);
  const byKey = new Map(windows.map((w) => [w.key, w]));

  const preferred = [];
  for (const input of preferredInputs || []) {
    const parsed = parsePreferredSession(input);
    if (parsed) preferred.push(parsed);
  }

  if (!preferred.length) {
    return {
      compatibilityScore: 0,
      compatibilityLabel: "0% compatibility",
      perSession: [],
      availableOptions: [],
      alternativeRecommendations: [],
      notice: "No preferred sessions provided. Advisory only — human confirmation required to allocate.",
    };
  }

  const perSession = preferred.map((p) => {
    const w = byKey.get(p.key);
    const evald = w || evaluateWindow(null);
    return {
      key: p.key,
      label: p.label,
      dayOfWeek: p.dayOfWeek,
      period: p.period,
      status: evald.status,
      weight: WEIGHTS[evald.status] ?? 0,
      freeEffectiveSlots: evald.freeEffectiveSlots ?? 0,
      offeredSlots: evald.offeredSlots ?? 0,
      usedSlots: evald.usedSlots ?? 0,
      existingGps: (w?.existingGps || []).map((g) => g.doctorName),
      nursing: evald.nursing || "none",
      startsAt: w?.startsAt || null,
      endsAt: w?.endsAt || null,
    };
  });

  const mean = perSession.reduce((s, row) => s + row.weight, 0) / perSession.length;
  const compatibilityScore = Math.round(100 * mean);

  const availableOptions = perSession
    .filter((row) => row.status === "available" || row.status === "limited")
    .map((row) => ({
      key: row.key,
      label: row.label,
      status: row.status,
      freeEffectiveSlots: row.freeEffectiveSlots,
      reason:
        row.status === "available"
          ? "Preferred window has capacity under current room and nursing cover."
          : "Preferred window is limited — only one effective slot (or high utilisation).",
    }));

  const preferredKeys = new Set(preferred.map((p) => p.key));
  const alternatives = [];
  const altSeen = new Set();

  for (const row of perSession) {
    if (row.status === "available") continue;
    // Same day adjacent period
    for (const period of adjacentPeriod(row.period)) {
      const key = keyFor(row.dayOfWeek, period);
      const w = byKey.get(key);
      if (!w || preferredKeys.has(key) || altSeen.has(key)) continue;
      if (w.status !== "available") continue;
      altSeen.add(key);
      alternatives.push({
        forPreferred: row.label,
        key,
        label: w.label,
        status: w.status,
        freeEffectiveSlots: w.freeEffectiveSlots,
        rationale: `${row.label} is ${row.status}; ${w.label} is available the same day.`,
      });
    }
    // Nearby day same period
    for (const day of nearbyDays(row.dayOfWeek)) {
      const key = keyFor(day, row.period);
      const w = byKey.get(key);
      if (!w || preferredKeys.has(key) || altSeen.has(key)) continue;
      if (w.status !== "available" && w.status !== "limited") continue;
      altSeen.add(key);
      alternatives.push({
        forPreferred: row.label,
        key,
        label: w.label,
        status: w.status,
        freeEffectiveSlots: w.freeEffectiveSlots,
        rationale: `${row.label} is ${row.status}; ${w.label} is a nearby same-period option.`,
      });
    }
  }

  return {
    compatibilityScore,
    compatibilityLabel: `${compatibilityScore}% compatibility`,
    doctorDisplayName: options.doctorDisplayName || null,
    enquiryId: options.enquiryId || null,
    preferredSessions: preferred.map((p) => p.label),
    perSession,
    availableOptions,
    alternativeRecommendations: alternatives.slice(0, options.maxAlternatives || 5),
    capacitySummary: windows.map((w) => ({
      key: w.key,
      label: w.label,
      status: w.status,
      freeEffectiveSlots: w.freeEffectiveSlots,
      existingGps: (w.existingGps || []).map((g) => g.doctorName),
      nursing: w.nursing,
    })),
    notice:
      "Advisory only. Compatibility does not allocate rooms or approve hiring. A practice team member confirms session allocation.",
  };
}

export function exampleMatch(capacity) {
  return matchSessions(capacity, ["Mon PM", "Wed AM", "Fri PM"], {
    doctorDisplayName: "Example GP",
  });
}
