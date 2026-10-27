import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPracticeConversionIntelligenceReport } from "@/measurement/conversion-intelligence-report";
import { buildPracticeDigitalReceptionDashboard } from "@/measurement/digital-reception-report";
import { buildPracticeExecutiveDashboard } from "@/measurement/executive-report";
import { buildExecutiveFixtureEvents } from "@/measurement/fixtures";
import {
  brisbaneGeneratedStamp,
  buildMonthlyExecutiveReport,
  buildSimplePdf,
  conversionIntelligenceDashboardToCsv,
  digitalReceptionDashboardToCsv,
  executiveDashboardSummaryLines,
  executiveDashboardToCsv,
  governanceQueuesSummaryLines,
  governanceQueuesToCsv,
  practitionerAuthorityDashboardToCsv,
  resolveMonthWindow,
  serviceAuthorityDashboardToCsv,
} from "@/measurement/management-exports";
import { buildPracticePractitionerAuthorityDashboard } from "@/measurement/practitioner-authority-report";
import { buildPracticeServiceAuthorityDashboard } from "@/measurement/service-authority-report";
import type { PracticeGovernanceManagementReport } from "@/governance/management-report";

function sampleGovernanceReport(): PracticeGovernanceManagementReport {
  return {
    dashboard: "governance_management",
    generated_on: "2026-10-26",
    horizon_days: 60,
    calendar_month: "2026-10",
    calendar_month_label: "October 2026",
    totals: {
      total: 2,
      awaiting_review: 1,
      due_within_60_days: 1,
      expired: 0,
      missing_ownership: 0,
      missing_approval: 0,
      missing_review_metadata: 0,
    },
    breakdowns: [],
    workload_by_month: [],
    review_calendar: [],
    pages_awaiting_review: [
      {
        id: "1",
        path: "services/telehealth.html",
        title: "Telehealth",
        status: "under_review",
        collection: "service",
        segment: "services",
        contentOwner: "Practice Manager",
        reviewedBy: null,
        approvedBy: null,
        lastReviewed: null,
        nextReviewDue: "2026-11-01",
        daysRemaining: 6,
        flags: {
          awaiting_review: true,
          due_within_60_days: true,
          expired: false,
          missing_ownership: false,
          missing_approval: true,
          missing_review_metadata: true,
        },
      },
    ],
    pages_due_within_60_days: [],
    pages_expired: [],
    pages_missing_ownership: [],
    pages_missing_approval: [],
    pages_missing_review_metadata: [],
    rows: [],
  };
}

describe("management exports (B7 + C3)", () => {
  it("builds CSV and enhanced multi-page PDF summary for the executive dashboard", () => {
    const report = buildPracticeExecutiveDashboard(buildExecutiveFixtureEvents(), "last_7");
    const csv = executiveDashboardToCsv(report);
    assert.match(csv, /kpi,traffic,/);
    assert.match(csv, /top_practitioners,/);
    assert.match(csv, /digital_reception,opens,/);
    assert.match(csv, /Australia\/Brisbane/);
    assert.match(csv, /date_range_start/);
    assert.match(csv, /generated_at/);

    const lines = executiveDashboardSummaryLines(report);
    assert.ok(lines.some((line) => line.includes("Headline KPIs")));
    assert.ok(lines.some((line) => line.includes("Period trends")));
    assert.ok(lines.some((line) => line.includes("Booking placement mix")));
    assert.ok(lines.some((line) => line.includes("Australia/Brisbane")));
    assert.ok(lines.some((line) => line.startsWith("Generated:")));

    const pdf = buildSimplePdf(lines, "Executive summary");
    const head = Buffer.from(pdf.slice(0, 8)).toString("utf8");
    assert.equal(head.startsWith("%PDF-1."), true);
    assert.ok(pdf.length > 200);
  });

  it("builds a monthly executive report for a calendar month", () => {
    const window = resolveMonthWindow("2026-09");
    assert.equal(window.monthKey, "2026-09");
    assert.equal(window.start, "2026-09-01");
    assert.equal(window.end, "2026-09-30");
    assert.match(window.label, /September/);

    const { report } = buildMonthlyExecutiveReport(buildExecutiveFixtureEvents(), "2026-09");
    assert.equal(report.start, "2026-09-01");
    assert.equal(report.end, "2026-09-30");
    assert.match(report.range_label, /September/);
  });

  it("exports Digital Reception, Authority, and Conversion CSVs with Brisbane meta", () => {
    const now = new Date("2026-10-26T02:00:00.000Z");
    const events = buildExecutiveFixtureEvents(now);
    const stamp = brisbaneGeneratedStamp(now);
    assert.match(stamp, /Australia\/Brisbane/);

    const drCsv = digitalReceptionDashboardToCsv(
      buildPracticeDigitalReceptionDashboard(events, "last_7", now),
    );
    assert.match(drCsv, /dashboard,digital_reception/);
    assert.match(drCsv, /date_range_start/);
    assert.match(drCsv, /Australia\/Brisbane/);
    assert.match(drCsv, /resolution_rate/);

    const paCsv = practitionerAuthorityDashboardToCsv(
      buildPracticePractitionerAuthorityDashboard(events, [], "last_7", now),
    );
    assert.match(paCsv, /dashboard,practitioner_authority/);
    assert.match(paCsv, /tier_count,Hub,/);

    const saCsv = serviceAuthorityDashboardToCsv(
      buildPracticeServiceAuthorityDashboard(events, [], "last_7", now),
    );
    assert.match(saCsv, /dashboard,service_authority/);
    assert.match(saCsv, /tier_conversion/);

    const ciCsv = conversionIntelligenceDashboardToCsv(
      buildPracticeConversionIntelligenceReport(events, "last_7", now),
    );
    assert.match(ciCsv, /dashboard,conversion_intelligence/);
    assert.match(ciCsv, /funnel,/);
    assert.match(ciCsv, /opportunity,/);
  });

  it("builds governance CSV and PDF with generation stamp", () => {
    const report = sampleGovernanceReport();
    const csv = governanceQueuesToCsv(report);
    assert.match(csv, /dashboard,governance_management/);
    assert.match(csv, /Australia\/Brisbane/);
    assert.match(csv, /awaiting_review,/);

    const lines = governanceQueuesSummaryLines(report);
    assert.ok(lines.some((line) => line.includes("Governance workload summary")));
    assert.ok(lines.some((line) => line.includes("Australia/Brisbane")));
    const pdf = buildSimplePdf(lines, "Governance summary");
    assert.equal(Buffer.from(pdf.slice(0, 5)).toString("utf8"), "%PDF-");
  });
});
