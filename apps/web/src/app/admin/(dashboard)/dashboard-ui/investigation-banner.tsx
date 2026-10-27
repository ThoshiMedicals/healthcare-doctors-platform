import Link from "next/link";
import {
  buildInvestigationBannerModel,
  type InvestigationBannerModel,
  type InvestigationEntityCounts,
  type InvestigationLink,
  type InvestigationView,
} from "./investigation";
import { INVESTIGATION_SOURCE_LABEL } from "./investigation-source";
import type { InsightsFilters } from "./insights-filters";

/** Canonical investigation banner (D6) — Viewing · Continue · Recommendations · Clear filter. */
export function InvestigationBanner({
  model,
}: {
  model: InvestigationBannerModel;
}) {
  return (
    <div
      className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-950"
      role="status"
      aria-label="Investigation"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-900/70">
            {INVESTIGATION_SOURCE_LABEL[model.source]}
          </p>
          <p>
            <span className="font-medium">Viewing · </span>
            <span className="font-semibold">{model.viewing.title}</span>
            {model.viewing.detail ? (
              <span className="text-indigo-900/90"> · {model.viewing.detail}</span>
            ) : null}
          </p>

          {model.continueLinks.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-indigo-900/80">Continue investigation</p>
              <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {model.continueLinks.map((link) => (
                  <Link
                    key={`${link.label}-${link.href}`}
                    href={link.href}
                    className="underline underline-offset-2 hover:text-indigo-800"
                  >
                    {link.label} →
                  </Link>
                ))}
              </p>
            </div>
          ) : null}

          {model.recommendations.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-indigo-900/80">Recommendations</p>
              <ul className="list-inside list-disc text-xs text-indigo-950/90">
                {model.recommendations.map((rec) => (
                  <li key={rec}>{rec}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <Link
          href={model.clearHref}
          className="shrink-0 font-medium underline underline-offset-2 hover:text-indigo-800"
        >
          Clear filter
        </Link>
      </div>
    </div>
  );
}

/**
 * Auto-builds the shared investigation banner from Insights filters.
 * Use on every dashboard that can be opened from KPI / recommendation / chart / health / queue.
 */
export function InsightsInvestigationBanner({
  filters,
  pathname,
  month,
  counts,
  continueLinks,
  recommendations,
  viewing,
}: {
  filters: InsightsFilters;
  pathname: string;
  /** Monthly report period, if this banner is used on a monthly dashboard. */
  month?: string;
  counts?: InvestigationEntityCounts;
  continueLinks?: InvestigationLink[];
  recommendations?: string[];
  viewing?: InvestigationView;
}) {
  const model = buildInvestigationBannerModel({
    filters,
    pathname,
    month,
    counts,
    continueLinks,
    recommendations,
    viewing,
  });
  if (!model) return null;
  return <InvestigationBanner model={model} />;
}
