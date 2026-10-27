import Link from "next/link";
import { requireAction } from "@/cms/context";
import { buildMonthlyExecutiveReport, resolveMonthWindow } from "@/measurement/management-exports";
import {
  DashboardCard,
  DashboardHeader,
  DashboardMeta,
  DataModeBanner,
  DataModeSwitcher,
  ExportActions,
  HowToReadDashboard,
  InsightsFilterSync,
  InsightsNav,
  formatCount,
  formatRate,
  withInsightsQuery,
} from "../../dashboard-ui";
import { resolveInsightsDashboardData } from "../../dashboard-ui/resolve-insights-data";
import { resolveInsightsFilters } from "../../dashboard-ui/resolve-insights-filters";

export const dynamic = "force-dynamic";

export default async function MonthlyExecutiveReportPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string; data?: string; range?: string }>;
}) {
  await requireAction("manage_settings");
  const params = searchParams ? await searchParams : {};
  const baseFilters = await resolveInsightsFilters(params);
  const { mode, filters: active, loaded } = await resolveInsightsDashboardData(baseFilters);
  const { window, report } = buildMonthlyExecutiveReport(loaded.events, params.month);
  const previous = resolveMonthWindow(
    (() => {
      const [y, m] = window.monthKey.split("-").map(Number);
      const prevMonth = m === 1 ? 12 : m - 1;
      const prevYear = m === 1 ? y - 1 : y;
      return `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
    })(),
  );

  const contact = report.rates.find((card) => card.key === "contact_rate");
  const booking = report.rates.find((card) => card.key === "booking_intent_rate");

  return (
    <main className="print:max-w-none">
      <DashboardHeader
        title={`Monthly website report · ${window.label}`}
        description="Shareable month-end summary for practice meetings — visits, bookings, and calls without technical jargon."
        actions={
          <ExportActions
            csvHref={`/api/admin/exports/monthly-executive?format=csv&month=${window.monthKey}&data=${mode}`}
            pdfHref={`/api/admin/exports/monthly-executive?format=pdf&month=${window.monthKey}&data=${mode}`}
            extra={
              <Link href={withInsightsQuery("/admin/executive", active)} className="text-slate-600 underline">
                Back to Executive
              </Link>
            }
          />
        }
        meta={
          <>
            {window.start} → {window.end}
            <span className="block sm:inline sm:before:content-['·_']">
              vs prior {report.previous_start} → {report.previous_end}
            </span>
            <span className="block sm:inline sm:before:content-['·_']">{loaded.feedLabel}</span>
          </>
        }
      />

      <div className="mt-6 space-y-3 print:hidden">
        <InsightsFilterSync filters={active} />
        <InsightsNav current="executive" filters={active} />
        <DataModeBanner mode={mode} feedLabel={loaded.feedLabel} />
        <HowToReadDashboard dashboard="monthly-executive" />
        <DataModeSwitcher path="/admin/executive/monthly" filters={active} active={mode} />
      </div>

      <p className="mt-4 text-sm text-slate-600 print:hidden">
        Previous month:{" "}
        <Link
          href={`/admin/executive/monthly?month=${previous.monthKey}`}
          className="underline underline-offset-2"
        >
          {previous.label}
        </Link>
      </p>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Traffic</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{formatCount(report.kpis.traffic)}</p>
        </DashboardCard>
        <DashboardCard>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sessions</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{formatCount(report.kpis.sessions)}</p>
        </DashboardCard>
        <DashboardCard>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Contact rate</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{formatRate(contact?.value ?? null)}</p>
        </DashboardCard>
        <DashboardCard>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Booking intent</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{formatRate(booking?.value ?? null)}</p>
        </DashboardCard>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <DashboardCard>
          <h2 className="text-sm font-semibold text-slate-900">Bookings & calls</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Booking clicks</dt>
              <dd className="tabular-nums font-medium">{formatCount(report.kpis.booking_clicks)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Clinic calls</dt>
              <dd className="tabular-nums font-medium">{formatCount(report.kpis.clinic_calls)}</dd>
            </div>
          </dl>
        </DashboardCard>
        <DashboardCard>
          <h2 className="text-sm font-semibold text-slate-900">Digital Reception</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Opens</dt>
              <dd className="tabular-nums font-medium">{formatCount(report.digital_reception.opens)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Searches</dt>
              <dd className="tabular-nums font-medium">{formatCount(report.digital_reception.searches)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">DR bookings</dt>
              <dd className="tabular-nums font-medium">
                {formatCount(report.digital_reception.booking_clicks)}
              </dd>
            </div>
          </dl>
        </DashboardCard>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <DashboardCard>
          <h2 className="text-sm font-semibold text-slate-900">Top practitioners</h2>
          <ol className="mt-3 space-y-2 text-sm">
            {report.top_practitioners.slice(0, 8).map((row, index) => (
              <li key={row.key} className="flex justify-between gap-3">
                <span>
                  {index + 1}. {row.key}
                </span>
                <span className="tabular-nums text-slate-600">{formatCount(row.count)}</span>
              </li>
            ))}
            {report.top_practitioners.length === 0 ? (
              <li className="text-slate-500">No practitioner traffic this month.</li>
            ) : null}
          </ol>
        </DashboardCard>
        <DashboardCard>
          <h2 className="text-sm font-semibold text-slate-900">Top services</h2>
          <ol className="mt-3 space-y-2 text-sm">
            {report.top_services.slice(0, 8).map((row, index) => (
              <li key={row.key} className="flex justify-between gap-3">
                <span>
                  {index + 1}. {row.key}
                </span>
                <span className="tabular-nums text-slate-600">{formatCount(row.count)}</span>
              </li>
            ))}
            {report.top_services.length === 0 ? (
              <li className="text-slate-500">No service traffic this month.</li>
            ) : null}
          </ol>
        </DashboardCard>
      </section>

      <DashboardMeta>
        Monthly executive export for external sharing · {window.monthKey} · measurement 2G · print this page or
        download CSV / PDF summary
      </DashboardMeta>
    </main>
  );
}
