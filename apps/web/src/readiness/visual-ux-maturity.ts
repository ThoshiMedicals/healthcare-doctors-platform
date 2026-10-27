export type VisualUxMaturityScorecard = {
  promptId: string;
  assessedOn: string;
  scores: {
    visualMaturity: number;
    brandMaturity: number;
    uxMaturity: number;
    conversionMaturity: number;
    overallWebsiteMaturity: number;
  };
  recommendation: string;
  highPriorityCount: number;
  quickWinCount: number;
  reportPath: string;
};

/** Published 3I visual/UX/brand maturity snapshot. */
export const VISUAL_UX_MATURITY_SCORECARD_3I: VisualUxMaturityScorecard = {
  promptId: "3I",
  assessedOn: "2026-10-26",
  scores: {
    visualMaturity: 78,
    brandMaturity: 76,
    uxMaturity: 82,
    conversionMaturity: 84,
    overallWebsiteMaturity: 80,
  },
  recommendation: "STRONG_BASELINE_POLISH_NEXT_NOT_REBUILD",
  highPriorityCount: 4,
  quickWinCount: 6,
  reportPath: "old-html/qa/VISUAL_UX_BRAND_MATURITY_AUDIT_3I.md",
};

export function getVisualUxMaturityScorecard(): VisualUxMaturityScorecard {
  return VISUAL_UX_MATURITY_SCORECARD_3I;
}
