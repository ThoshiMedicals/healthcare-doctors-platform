import type { ClinicalReview, Page } from "@prisma/client";
import {
  buildHealthcareDemoGovernanceRows,
  HEALTHCARE_DEMO_GOVERNANCE_META,
  type DemoGovernanceRow,
} from "@/measurement/demo/healthcare-demo-governance";
import type { InsightsDataMode } from "@/measurement/insights-data-mode";

export type GovernanceDataset = {
  rows: DemoGovernanceRow[];
  mode: InsightsDataMode;
  isDemo: boolean;
  feedLabel: string;
  datasetId?: string;
};

/**
 * Resolve governance rows for Live / Demo / Empty without writing demo rows to Prisma.
 */
export function resolveGovernanceDataset(
  mode: InsightsDataMode,
  liveRows: Array<ClinicalReview & { page: Pick<Page, "path" | "title"> }>,
  now = new Date(),
): GovernanceDataset {
  if (mode === "empty") {
    return {
      rows: [],
      mode,
      isDemo: false,
      feedLabel: "Empty mode · zero governance records",
    };
  }
  if (mode === "demo") {
    return {
      rows: buildHealthcareDemoGovernanceRows(now),
      mode,
      isDemo: true,
      feedLabel: `Demo data · ${HEALTHCARE_DEMO_GOVERNANCE_META.label}`,
      datasetId: HEALTHCARE_DEMO_GOVERNANCE_META.id,
    };
  }
  return {
    rows: liveRows,
    mode: "live",
    isDemo: false,
    feedLabel: liveRows.length
      ? "Live · clinic governance records"
      : "Live · no governance records yet",
  };
}
