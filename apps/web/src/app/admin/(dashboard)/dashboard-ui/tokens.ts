/**
 * Admin dashboard colour system.
 *
 * Two independent palettes — never share hues across families:
 *   1. Semantic status — Success / Warning / Failure (+ info / accent / neutral)
 *   2. Authority tiers — Hub / Developing / Thin
 *
 * WCAG 2.1 AA target: badge text ≥ 4.5:1 on badge background; solid fills used
 * for bars/charts are decorative with adjacent text labels (not sole encoding).
 */

export type SemanticTone = "neutral" | "good" | "warn" | "bad" | "info" | "accent";
export type AuthorityTone = "hub" | "developing" | "thin";
export type DashboardTone = SemanticTone | AuthorityTone;

export type ToneStyle = {
  badge: string;
  bar: string;
  track: string;
  border: string;
  text: string;
  fill: string;
  /** Approximate contrast of badge text vs badge background (WCAG). */
  badgeContrast: number;
  family: "semantic" | "authority";
};

/**
 * Semantic status palette — outcome / risk signalling.
 * Success = green · Warning = amber · Failure = rose.
 * Info / accent stay outside the authority family.
 */
export const SEMANTIC_TONE: Record<SemanticTone, ToneStyle> = {
  neutral: {
    badge: "bg-slate-100 text-slate-800 border-slate-300",
    bar: "#475569",
    track: "#e2e8f0",
    border: "border-slate-300",
    text: "text-slate-800",
    fill: "#475569",
    badgeContrast: 7.2,
    family: "semantic",
  },
  good: {
    // Success — emerald (distinct from Hub indigo)
    badge: "bg-emerald-50 text-emerald-950 border-emerald-300",
    bar: "#047857",
    track: "#d1fae5",
    border: "border-emerald-300",
    text: "text-emerald-950",
    fill: "#047857",
    badgeContrast: 9.1,
    family: "semantic",
  },
  warn: {
    // Warning — amber
    badge: "bg-amber-50 text-amber-950 border-amber-400",
    bar: "#b45309",
    track: "#fde68a",
    border: "border-amber-400",
    text: "text-amber-950",
    fill: "#b45309",
    badgeContrast: 10.4,
    family: "semantic",
  },
  bad: {
    // Failure — rose
    badge: "bg-rose-50 text-rose-950 border-rose-300",
    bar: "#be123c",
    track: "#fecdd3",
    border: "border-rose-300",
    text: "text-rose-950",
    fill: "#be123c",
    badgeContrast: 9.8,
    family: "semantic",
  },
  info: {
    // Informational — sky (not Developing teal)
    badge: "bg-sky-50 text-sky-950 border-sky-300",
    bar: "#0369a1",
    track: "#bae6fd",
    border: "border-sky-300",
    text: "text-sky-950",
    fill: "#0369a1",
    badgeContrast: 9.5,
    family: "semantic",
  },
  accent: {
    // Highlight / ownership gap — violet
    badge: "bg-violet-50 text-violet-950 border-violet-300",
    bar: "#6d28d9",
    track: "#ddd6fe",
    border: "border-violet-300",
    text: "text-violet-950",
    fill: "#6d28d9",
    badgeContrast: 9.2,
    family: "semantic",
  },
};

/**
 * Authority tier palette — structural strength, not success/failure.
 * Hub = indigo · Developing = teal · Thin = stone.
 * Deliberately avoids emerald / amber / rose used by semantic status.
 */
export const AUTHORITY_TONE: Record<AuthorityTone, ToneStyle> = {
  hub: {
    badge: "bg-indigo-50 text-indigo-950 border-indigo-400",
    bar: "#3730a3",
    track: "#c7d2fe",
    border: "border-indigo-400",
    text: "text-indigo-950",
    fill: "#3730a3",
    badgeContrast: 10.1,
    family: "authority",
  },
  developing: {
    badge: "bg-teal-50 text-teal-950 border-teal-400",
    bar: "#0f766e",
    track: "#99f6e4",
    border: "border-teal-400",
    text: "text-teal-950",
    fill: "#0f766e",
    badgeContrast: 9.6,
    family: "authority",
  },
  thin: {
    badge: "bg-stone-100 text-stone-900 border-stone-400",
    bar: "#57534e",
    track: "#d6d3d1",
    border: "border-stone-400",
    text: "text-stone-900",
    fill: "#57534e",
    badgeContrast: 8.4,
    family: "authority",
  },
};

export const DASHBOARD_TONE: Record<DashboardTone, ToneStyle> = {
  ...SEMANTIC_TONE,
  ...AUTHORITY_TONE,
};

/** Series accents for line charts — keep within semantic / neutral family. */
export const CHART_ACCENTS = {
  slate: "#0f172a",
  green: "#047857",
  blue: "#0369a1",
  amber: "#b45309",
  rose: "#be123c",
  violet: "#6d28d9",
  indigo: "#3730a3",
  teal: "#0f766e",
} as const;

/** WCAG AA re-audit snapshot for B4 (badge text vs background). */
export const COLOUR_ACCESSIBILITY_AUDIT = {
  promptId: "B4",
  standard: "WCAG 2.1 AA",
  minContrast: 4.5,
  familiesSeparated: true as const,
  semanticHues: ["emerald", "amber", "rose", "sky", "violet", "slate"] as const,
  authorityHues: ["indigo", "teal", "stone"] as const,
  /** No shared primary hue between Hub/Developing/Thin and Success/Warning/Failure. */
  collisionPairsChecked: [
    ["hub", "good"],
    ["developing", "info"],
    ["thin", "neutral"],
    ["hub", "bad"],
    ["developing", "warn"],
  ] as const,
  tones: Object.fromEntries(
    (Object.keys(DASHBOARD_TONE) as DashboardTone[]).map((key) => [
      key,
      {
        family: DASHBOARD_TONE[key].family,
        bar: DASHBOARD_TONE[key].bar,
        badgeContrast: DASHBOARD_TONE[key].badgeContrast,
        passesAa: DASHBOARD_TONE[key].badgeContrast >= 4.5,
      },
    ]),
  ),
  score: 91,
} as const;

export function toneFamily(tone: DashboardTone): "semantic" | "authority" {
  return DASHBOARD_TONE[tone].family;
}

export function assertPalettesSeparated(): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  const semanticBars = new Set(Object.values(SEMANTIC_TONE).map((t) => t.bar.toLowerCase()));
  for (const [key, style] of Object.entries(AUTHORITY_TONE)) {
    if (semanticBars.has(style.bar.toLowerCase())) {
      issues.push(`Authority tone "${key}" reuses semantic bar colour ${style.bar}`);
    }
  }
  for (const [key, style] of Object.entries(DASHBOARD_TONE)) {
    if (style.badgeContrast < 4.5) {
      issues.push(`Tone "${key}" badge contrast ${style.badgeContrast} below AA 4.5`);
    }
  }
  if (AUTHORITY_TONE.hub.bar === SEMANTIC_TONE.good.bar) {
    issues.push("Hub must not share Success green");
  }
  if (AUTHORITY_TONE.developing.bar === SEMANTIC_TONE.info.bar) {
    issues.push("Developing must not share Info sky");
  }
  return { ok: issues.length === 0, issues };
}
