import type { PracticeConversionIntelligenceReport } from "@/measurement/conversion-intelligence-report";
import type { PracticeDigitalReceptionDashboard } from "@/measurement/digital-reception-report";
import type { PracticeExecutiveDashboard } from "@/measurement/executive-report";
import { buildPracticeExecutiveDashboardForDates } from "@/measurement/executive-report";
import type { PracticePractitionerAuthorityDashboard } from "@/measurement/practitioner-authority-report";
import { brisbaneDateIso, brisbaneMonthKey } from "@/measurement/periods";
import type { PracticeServiceAuthorityDashboard } from "@/measurement/service-authority-report";
import type { MeasurementEvent, RawMeasurementEvent } from "@/measurement/types";
import type { PracticeGovernanceManagementReport } from "@/governance/management-report";

const BRISBANE_TZ = "Australia/Brisbane";

/** Escape a CSV cell (RFC 4180-ish). */
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function toCsv(rows: Array<Array<string | number | null | undefined>>): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/** Generation timestamp labelled for Australia/Brisbane (shareable exports). */
export function brisbaneGeneratedStamp(now = new Date()): string {
  const stamp = new Intl.DateTimeFormat("en-AU", {
    timeZone: BRISBANE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);
  return `${stamp} ${BRISBANE_TZ}`;
}

function exportMetaBlock(input: {
  dashboard: string;
  range_label: string;
  start: string;
  end: string;
  generated_at?: string;
  extra?: Array<[string, string | number | null | undefined, string?]>;
}): Array<Array<string | number | null | undefined>> {
  const generated = input.generated_at?.trim() || brisbaneGeneratedStamp();
  const rows: Array<Array<string | number | null | undefined>> = [
    ["section", "metric", "value", "note"],
    ["meta", "dashboard", input.dashboard, "Woolloongabba Medical Centre"],
    ["meta", "range_label", input.range_label, `${input.start} → ${input.end}`],
    ["meta", "date_range_start", input.start, BRISBANE_TZ],
    ["meta", "date_range_end", input.end, BRISBANE_TZ],
    ["meta", "timezone", BRISBANE_TZ, "All range dates are Brisbane calendar days"],
    ["meta", "generated_at", generated, "Export generation timestamp"],
  ];
  for (const [metric, value, note] of input.extra ?? []) {
    rows.push(["meta", metric, value, note ?? ""]);
  }
  return rows;
}

export function executiveDashboardToCsv(report: PracticeExecutiveDashboard): string {
  const sections: Array<Array<string | number | null | undefined>> = [
    ...exportMetaBlock({
      dashboard: "executive",
      range_label: report.range_label,
      start: report.start,
      end: report.end,
      generated_at: brisbaneGeneratedStamp(),
      extra: [
        ["compared_to", `${report.previous_start} → ${report.previous_end}`, "equal-length prior window"],
      ],
    }),
    ["kpi", "traffic", report.kpis.traffic, "page views"],
    ["kpi", "sessions", report.kpis.sessions, "distinct session IDs"],
    ["kpi", "booking_clicks", report.kpis.booking_clicks, "HotDoc booking controls"],
    ["kpi", "clinic_calls", report.kpis.clinic_calls, "call clinic clicks"],
  ];

  for (const rate of report.rates) {
    sections.push(["rate", rate.key, rate.value, rate.definition]);
  }

  sections.push(["", "", "", ""]);
  sections.push(["top_pages", "rank", "path", "views"]);
  report.top_pages.forEach((row, index) => {
    sections.push(["top_pages", index + 1, row.key, row.count]);
  });

  sections.push(["", "", "", ""]);
  sections.push(["top_services", "rank", "service", "views"]);
  report.top_services.forEach((row, index) => {
    sections.push(["top_services", index + 1, row.key, row.count]);
  });

  sections.push(["", "", "", ""]);
  sections.push(["top_practitioners", "rank", "practitioner", "views"]);
  report.top_practitioners.forEach((row, index) => {
    sections.push(["top_practitioners", index + 1, row.key, row.count]);
  });

  sections.push(["", "", "", ""]);
  sections.push(["booking_placement", "placement", "count", "share_pct"]);
  for (const row of report.booking_placement_mix) {
    sections.push(["booking_placement", row.placement, row.count, row.share]);
  }

  sections.push(["", "", "", ""]);
  sections.push(["digital_reception", "metric", "value", ""]);
  sections.push(["digital_reception", "opens", report.digital_reception.opens, ""]);
  sections.push(["digital_reception", "searches", report.digital_reception.searches, ""]);
  sections.push(["digital_reception", "result_clicks", report.digital_reception.result_clicks, ""]);
  sections.push(["digital_reception", "booking_clicks", report.digital_reception.booking_clicks, ""]);
  sections.push(["digital_reception", "clinic_calls", report.digital_reception.clinic_calls, ""]);

  sections.push(["", "", "", ""]);
  sections.push(["daily_series", "date", "traffic", "booking_clicks", "call_clicks", "contact_rate"]);
  for (const point of report.series) {
    sections.push([
      "daily_series",
      point.date,
      point.traffic,
      point.booking_clicks,
      point.call_clicks,
      point.contact_rate,
    ]);
  }

  return toCsv(sections);
}

export function executiveDashboardSummaryLines(report: PracticeExecutiveDashboard): string[] {
  const rate = (key: string) => report.rates.find((card) => card.key === key)?.value;
  const fmtRate = (value: number | null | undefined) =>
    value === null || value === undefined ? "—" : `${value.toFixed(1)}%`;
  const trendLine = (label: string, trend: PracticeExecutiveDashboard["trends"]["traffic"]) => {
    const pct =
      trend.delta_pct === null ? "new" : `${trend.delta_pct > 0 ? "+" : ""}${trend.delta_pct.toFixed(1)}%`;
    return `${label}: ${trend.current} (${pct} vs prior, ${trend.direction})`;
  };
  const generated = brisbaneGeneratedStamp();

  return [
    "Woolloongabba Medical Centre",
    "Executive performance summary",
    `Range: ${report.range_label}`,
    `Dates: ${report.start} to ${report.end} (${BRISBANE_TZ})`,
    `Compared with ${report.previous_start} to ${report.previous_end}`,
    `Generated: ${generated}`,
    "",
    "Headline KPIs",
    `Traffic (page views): ${report.kpis.traffic}`,
    `Sessions: ${report.kpis.sessions}`,
    `Booking clicks: ${report.kpis.booking_clicks}`,
    `Clinic calls: ${report.kpis.clinic_calls}`,
    `Contact rate: ${fmtRate(rate("contact_rate"))}`,
    `Booking intent rate: ${fmtRate(rate("booking_intent_rate"))}`,
    `Call intent rate: ${fmtRate(rate("call_intent_rate"))}`,
    "",
    "Period trends",
    trendLine("Traffic", report.trends.traffic),
    trendLine("Sessions", report.trends.sessions),
    trendLine("Bookings", report.trends.booking_clicks),
    trendLine("Clinic calls", report.trends.clinic_calls),
    trendLine("Contact rate", report.trends.contact_rate),
    "",
    "Digital Reception",
    `Opens: ${report.digital_reception.opens}`,
    `Searches: ${report.digital_reception.searches}`,
    `Result clicks: ${report.digital_reception.result_clicks}`,
    `DR bookings: ${report.digital_reception.booking_clicks}`,
    `DR clinic calls: ${report.digital_reception.clinic_calls}`,
    "",
    "Booking placement mix",
    ...report.booking_placement_mix.map(
      (row) => `${row.placement}: ${row.count} (${row.share.toFixed(1)}%)`,
    ),
    "",
    "Top pages",
    ...report.top_pages.slice(0, 8).map((row, i) => `${i + 1}. ${row.key} — ${row.count}`),
    "",
    "Top practitioners",
    ...report.top_practitioners.slice(0, 8).map((row, i) => `${i + 1}. ${row.key} — ${row.count}`),
    "",
    "Top services",
    ...report.top_services.slice(0, 8).map((row, i) => `${i + 1}. ${row.key} — ${row.count}`),
    "",
    "Shareable management export — measurement 2G",
    `Timezone ${BRISBANE_TZ}`,
  ];
}

/**
 * Minimal multi-page PDF (Helvetica) with no external dependencies.
 * Suitable for management summaries that can be emailed externally.
 */
export function buildSimplePdf(lines: string[], title = "Executive summary"): Uint8Array {
  const safeLines = lines.map((line) => line.replace(/[^\x09\x20-\x7E]/g, "?"));
  const linesPerPage = 48;
  const pages: string[][] = [];
  for (let i = 0; i < safeLines.length; i += linesPerPage) {
    pages.push(safeLines.slice(i, i + linesPerPage));
  }
  if (pages.length === 0) pages.push([""]);

  const contentStreams = pages.map((pageLines, pageIndex) => {
    const contentLines: string[] = ["BT", "/F1 11 Tf", "50 780 Td", "14 TL"];
    const pageTitle = pages.length > 1 ? `${title} (${pageIndex + 1}/${pages.length})` : title;
    contentLines.push(`(${escapePdfText(pageTitle)}) Tj`, "T*", "T*", "/F1 10 Tf");
    for (const line of pageLines) {
      contentLines.push(`(${escapePdfText(line)}) Tj`, "T*");
    }
    contentLines.push("ET");
    return contentLines.join("\n");
  });

  const objects: string[] = [];
  // 1 Catalog, 2 Pages, then per page: Page + Contents, finally Font
  const fontObjectNumber = 3 + pages.length * 2;
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  const kidRefs = pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ");
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kidRefs}] /Count ${pages.length} >>\nendobj\n`);

  for (let index = 0; index < pages.length; index += 1) {
    const pageObjectNumber = 3 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    const stream = contentStreams[index]!;
    objects.push(
      `${pageObjectNumber} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObjectNumber} 0 R /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> >>\nendobj\n`,
    );
    objects.push(
      `${contentObjectNumber} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    );
  }
  objects.push(
    `${fontObjectNumber} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
  );

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += object;
  }
  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(pdf, "utf8"));
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export type MonthWindow = {
  monthKey: string;
  label: string;
  start: string;
  end: string;
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0, 12, 0, 0)).getUTCDate();
}

/** Previous full calendar month in Australia/Brisbane, or an explicit YYYY-MM key. */
export function resolveMonthWindow(monthKey?: string | null, now = new Date()): MonthWindow {
  let key = monthKey && /^\d{4}-\d{2}$/.test(monthKey) ? monthKey : "";
  if (!key) {
    const current = brisbaneMonthKey(now);
    const [y, m] = current.split("-").map(Number);
    const prevMonth = m === 1 ? 12 : m - 1;
    const prevYear = m === 1 ? y - 1 : y;
    key = `${prevYear}-${pad2(prevMonth)}`;
  }
  const [year, month] = key.split("-").map(Number);
  const start = `${key}-01`;
  const end = `${key}-${pad2(daysInMonth(year, month))}`;
  const labelDate = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0));
  const label = new Intl.DateTimeFormat("en-AU", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(labelDate);
  return { monthKey: key, label, start, end };
}

export function buildMonthlyExecutiveReport(
  raw: Array<RawMeasurementEvent | MeasurementEvent>,
  monthKey?: string | null,
  now = new Date(),
): { window: MonthWindow; report: PracticeExecutiveDashboard } {
  const window = resolveMonthWindow(monthKey, now);
  const report = buildPracticeExecutiveDashboardForDates(raw, window.start, window.end, `Monthly · ${window.label}`);
  return { window, report };
}

export function governanceQueuesToCsv(report: PracticeGovernanceManagementReport): string {
  const rows: Array<Array<string | number | null | undefined>> = [
    ...exportMetaBlock({
      dashboard: "governance_management",
      range_label: `Horizon ${report.horizon_days} days`,
      start: report.generated_on,
      end: report.generated_on,
      generated_at: brisbaneGeneratedStamp(),
      extra: [
        ["horizon_days", report.horizon_days, "Due-soon window"],
        ["total_records", report.totals.total, ""],
        ["awaiting_review", report.totals.awaiting_review, ""],
        ["due_within_60_days", report.totals.due_within_60_days, ""],
        ["expired", report.totals.expired, ""],
        ["missing_ownership", report.totals.missing_ownership, ""],
      ],
    }),
    ["", "", "", ""],
    [
      "queue",
      "path",
      "title",
      "status",
      "segment",
      "content_owner",
      "next_review_due",
      "days_remaining",
    ],
  ];

  const push = (queue: string, list: PracticeGovernanceManagementReport["pages_awaiting_review"]) => {
    for (const row of list) {
      rows.push([
        queue,
        row.path,
        row.title,
        row.status,
        row.segment,
        row.contentOwner,
        row.nextReviewDue,
        row.daysRemaining,
      ]);
    }
  };

  push("awaiting_review", report.pages_awaiting_review);
  push("due_soon", report.pages_due_within_60_days);
  push("expired", report.pages_expired);
  push("missing_ownership", report.pages_missing_ownership);

  return toCsv(rows);
}

export function governanceQueuesSummaryLines(report: PracticeGovernanceManagementReport): string[] {
  const generated = brisbaneGeneratedStamp();
  const listLines = (
    label: string,
    list: PracticeGovernanceManagementReport["pages_awaiting_review"],
  ) => [
    label,
    ...list.slice(0, 8).map((row, i) => {
      const due = row.nextReviewDue || "no due date";
      return `${i + 1}. ${row.title || row.path} — ${row.status} · due ${due}`;
    }),
    list.length > 8 ? `… +${list.length - 8} more` : "",
  ].filter(Boolean);

  return [
    "Woolloongabba Medical Centre",
    "Governance workload summary",
    `Horizon: ${report.horizon_days} days`,
    `Snapshot date: ${report.generated_on} (${BRISBANE_TZ})`,
    `Generated: ${generated}`,
    "",
    "Queue totals",
    `Total records: ${report.totals.total}`,
    `Awaiting review: ${report.totals.awaiting_review}`,
    `Due within 60 days: ${report.totals.due_within_60_days}`,
    `Expired: ${report.totals.expired}`,
    `Missing ownership: ${report.totals.missing_ownership}`,
    "",
    ...listLines("Expired", report.pages_expired),
    "",
    ...listLines("Awaiting review", report.pages_awaiting_review),
    "",
    ...listLines("Due soon", report.pages_due_within_60_days),
    "",
    ...listLines("Missing ownership", report.pages_missing_ownership),
    "",
    "Shareable governance export",
    `Timezone ${BRISBANE_TZ}`,
  ];
}

export function digitalReceptionDashboardToCsv(report: PracticeDigitalReceptionDashboard): string {
  const rows: Array<Array<string | number | null | undefined>> = [
    ...exportMetaBlock({
      dashboard: "digital_reception",
      range_label: report.range_label,
      start: report.start,
      end: report.end,
      generated_at: brisbaneGeneratedStamp(),
    }),
    ["kpi", "opens", report.kpis.opens, ""],
    ["kpi", "sessions", report.kpis.sessions, ""],
    ["kpi", "searches", report.kpis.searches, ""],
    ["kpi", "open_rate", report.kpis.open_rate, "opens ÷ sessions"],
    ["kpi", "resolution_rate", report.kpis.resolution_rate, report.kpis.resolution_band],
    ["kpi", "zero_result_rate", report.kpis.zero_result_rate, ""],
    ["kpi", "resolved_searches", report.kpis.resolved_searches, ""],
    ["kpi", "zero_result_searches", report.kpis.zero_result_searches, ""],
    ["", "", "", ""],
    ["funnel", "step", "count", "conversion_from_previous", "share_of_opens"],
    ...report.funnel.map((step) => [
      "funnel",
      step.label,
      step.count,
      step.conversion_from_previous,
      step.share_of_opens,
    ]),
    ["", "", "", ""],
    [
      "intent",
      "intent_bucket",
      "searches",
      "resolved",
      "zero_results",
      "result_clicks",
      "resolution_rate",
      "resolution_band",
      "flagged",
    ],
    ...report.top_intent_buckets.map((row) => [
      "intent",
      row.intent_bucket,
      row.searches,
      row.resolved,
      row.zero_results,
      row.result_clicks,
      row.resolution_rate,
      row.resolution_band,
      row.flagged ? "yes" : "no",
    ]),
    ["", "", "", ""],
    ["destination", "key", "count", ""],
    ...report.top_search_destinations.map((row) => ["destination", row.key, row.count, ""]),
    ["", "", "", ""],
    ["watchlist", "intent", "searches", "resolution_rate", "resolution_band"],
    ...report.watchlist.map((row) => [
      "watchlist",
      row.intent_bucket,
      row.searches,
      row.resolution_rate,
      row.resolution_band,
    ]),
    ["", "", "", ""],
    ["flagged_intent", "intent_bucket", "searches", "resolution_rate"],
    ...report.flagged_intents.map((row) => [
      "flagged_intent",
      row.intent_bucket,
      row.searches,
      row.resolution_rate,
    ]),
  ];
  return toCsv(rows);
}

export function practitionerAuthorityDashboardToCsv(
  report: PracticePractitionerAuthorityDashboard,
): string {
  const rows: Array<Array<string | number | null | undefined>> = [
    ...exportMetaBlock({
      dashboard: "practitioner_authority",
      range_label: report.range_label,
      start: report.start,
      end: report.end,
      generated_at: brisbaneGeneratedStamp(),
      extra: [["compared_to", `${report.previous_start} → ${report.previous_end}`, "prior window"]],
    }),
    ["kpi", "profile_views", report.totals.profile_views, ""],
    ["kpi", "booking_clicks", report.totals.booking_clicks, ""],
    ["kpi", "call_clicks", report.totals.call_clicks, ""],
    ["kpi", "contact_rate", report.totals.contact_rate, ""],
    ["kpi", "booking_intent", report.totals.booking_intent, ""],
    ["tier_count", "Hub", report.tier_counts.Hub, ""],
    ["tier_count", "Developing", report.tier_counts.Developing, ""],
    ["tier_count", "Thin", report.tier_counts.Thin, ""],
    ["", "", "", ""],
    [
      "practitioner",
      "slug",
      "title",
      "tier",
      "authority_score",
      "profile_views",
      "booking_clicks",
      "call_clicks",
      "contact_rate",
      "booking_intent",
      "dr_recommendations",
      "dr_selections",
    ],
    ...report.practitioners.map((row) => [
      "practitioner",
      row.slug,
      row.title,
      row.tier,
      row.authority_score,
      row.profile_views,
      row.booking_clicks,
      row.call_clicks,
      row.contact_rate,
      row.booking_intent,
      row.digital_reception_recommendations,
      row.digital_reception_selections,
    ]),
  ];
  return toCsv(rows);
}

export function serviceAuthorityDashboardToCsv(report: PracticeServiceAuthorityDashboard): string {
  const rows: Array<Array<string | number | null | undefined>> = [
    ...exportMetaBlock({
      dashboard: "service_authority",
      range_label: report.range_label,
      start: report.start,
      end: report.end,
      generated_at: brisbaneGeneratedStamp(),
    }),
    ["kpi", "service_views", report.totals.service_views, ""],
    ["kpi", "booking_clicks", report.totals.booking_clicks, ""],
    ["kpi", "call_clicks", report.totals.call_clicks, ""],
    ["kpi", "contact_rate", report.totals.contact_rate, ""],
    ["kpi", "booking_intent", report.totals.booking_intent, ""],
    ["kpi", "digital_reception_entrances", report.totals.digital_reception_entrances, ""],
    ["kpi", "digital_reception_outcomes", report.totals.digital_reception_outcomes, ""],
    ["tier_count", "Hub", report.tier_counts.Hub, ""],
    ["tier_count", "Developing", report.tier_counts.Developing, ""],
    ["tier_count", "Thin", report.tier_counts.Thin, ""],
    ["", "", "", ""],
    [
      "tier_conversion",
      "tier",
      "services",
      "service_views",
      "booking_clicks",
      "contact_actions",
      "views_share",
      "contact_share",
      "dr_entrance_share",
    ],
    ...report.conversion_by_tier.map((row) => [
      "tier_conversion",
      row.tier,
      row.services,
      row.service_views,
      row.booking_clicks,
      row.contact_actions,
      row.views_share,
      row.contact_share,
      row.dr_entrance_share,
    ]),
    ["", "", "", ""],
    [
      "service",
      "slug",
      "title",
      "tier",
      "authority_score",
      "service_views",
      "booking_clicks",
      "call_clicks",
      "contact_rate",
      "booking_intent",
      "dr_entrances",
      "dr_outcomes",
    ],
    ...report.services.map((row) => [
      "service",
      row.slug,
      row.title,
      row.tier,
      row.authority_score,
      row.service_views,
      row.booking_clicks,
      row.call_clicks,
      row.contact_rate,
      row.booking_intent,
      row.digital_reception_entrances,
      row.digital_reception_outcomes,
    ]),
  ];
  return toCsv(rows);
}

export function conversionIntelligenceDashboardToCsv(
  report: PracticeConversionIntelligenceReport,
): string {
  const rows: Array<Array<string | number | null | undefined>> = [
    ...exportMetaBlock({
      dashboard: "conversion_intelligence",
      range_label: report.range_label,
      start: report.start,
      end: report.end,
      generated_at: brisbaneGeneratedStamp(),
    }),
    ["funnel", "step", "sessions", "conversion_from_previous", "drop_from_previous", "bottleneck"],
    ...report.funnel.map((step) => [
      "funnel",
      step.label,
      step.sessions,
      step.conversion_from_previous,
      step.drop_from_previous,
      step.bottleneck ? "yes" : "no",
    ]),
    ["", "", "", ""],
    ["top_practitioner", "key", "label", "sessions", "bookings", "conversion_rate"],
    ...report.highest_converting_practitioners.map((row) => [
      "top_practitioner",
      row.key,
      row.label,
      row.sessions,
      row.bookings,
      row.conversion_rate,
    ]),
    ["", "", "", ""],
    ["low_practitioner", "key", "label", "sessions", "bookings", "conversion_rate"],
    ...report.lowest_converting_practitioners.map((row) => [
      "low_practitioner",
      row.key,
      row.label,
      row.sessions,
      row.bookings,
      row.conversion_rate,
    ]),
    ["", "", "", ""],
    ["top_service", "key", "label", "sessions", "bookings", "conversion_rate"],
    ...report.highest_converting_services.map((row) => [
      "top_service",
      row.key,
      row.label,
      row.sessions,
      row.bookings,
      row.conversion_rate,
    ]),
    ["", "", "", ""],
    ["low_service", "key", "label", "sessions", "bookings", "conversion_rate"],
    ...report.lowest_converting_services.map((row) => [
      "low_service",
      row.key,
      row.label,
      row.sessions,
      row.bookings,
      row.conversion_rate,
    ]),
    ["", "", "", ""],
    ["exit_page", "path", "label", "exits", "share"],
    ...report.highest_exit_pages.map((row) => ["exit_page", row.path, row.label, row.exits, row.share]),
    ["", "", "", ""],
    ["abandonment", "journey", "last_stage", "sessions", "share"],
    ...report.highest_abandonment_journeys.map((row) => [
      "abandonment",
      row.journey,
      row.last_stage,
      row.sessions,
      row.share_of_abandoners,
    ]),
    ["", "", "", ""],
    ["opportunity", "category", "key", "label", "sessions", "bookings", "conversion_rate", "reason"],
    ...[
      ...report.opportunities.weak_booking_paths,
      ...report.opportunities.weak_service_journeys,
      ...report.opportunities.weak_practitioner_journeys,
    ].map((row) => [
      "opportunity",
      row.category,
      row.key,
      row.label,
      row.sessions,
      row.bookings,
      row.conversion_rate,
      row.reason,
    ]),
  ];
  return toCsv(rows);
}

export function downloadFilename(prefix: string, ext: "csv" | "pdf", stamp = brisbaneDateIso(new Date())): string {
  return `wmc-${prefix}-${stamp}.${ext}`;
}
