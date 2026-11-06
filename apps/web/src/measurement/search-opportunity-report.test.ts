import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ClinicalReview, Page, SearchDemandSignal } from "@prisma/client";
import { buildSearchOpportunityDashboard } from "./search-opportunity-report";

function signal(partial: Partial<SearchDemandSignal> & Pick<SearchDemandSignal, "normalizedTerm">): SearchDemandSignal {
  const now = new Date("2026-11-03T02:00:00.000Z");
  return {
    id: partial.id || "sig",
    clinicId: "clinic",
    occurredAt: partial.occurredAt || now,
    normalizedTerm: partial.normalizedTerm,
    intentBucket: partial.intentBucket || "other",
    resultType: partial.resultType || "direct_page",
    resultCount: partial.resultCount ?? 1,
    noResult: partial.noResult ?? false,
    clickedResultPath: partial.clickedResultPath ?? null,
    clickedStep: partial.clickedStep ?? null,
    practitionerSlug: partial.practitionerSlug ?? null,
    pagePath: partial.pagePath || "/",
    sessionKey: null,
    createdAt: now,
  };
}

describe("search opportunity report", () => {
  it("scores live demand with rising / no-result gaps and never invents AI copy", () => {
    const now = new Date("2026-11-03T12:00:00.000Z");
    const current = Array.from({ length: 12 }, (_, i) =>
      signal({
        id: `c${i}`,
        normalizedTerm: "adhd",
        intentBucket: "mental_health",
        noResult: i < 6,
        resultType: i < 6 ? "no_result" : "care_journey",
        resultCount: i < 6 ? 0 : 2,
        occurredAt: new Date("2026-11-02T01:00:00.000Z"),
      }),
    );
    const prior = Array.from({ length: 4 }, (_, i) =>
      signal({
        id: `p${i}`,
        normalizedTerm: "adhd",
        occurredAt: new Date("2026-10-26T01:00:00.000Z"),
      }),
    );
    const clicks = [
      signal({
        id: "click",
        normalizedTerm: "adhd",
        clickedResultPath: "/knowledge/articles/example.html",
        clickedStep: "article",
        occurredAt: new Date("2026-11-02T02:00:00.000Z"),
      }),
    ];

    const report = buildSearchOpportunityDashboard({
      signals: [...current, ...prior, ...clicks],
      events: [],
      reviews: [],
      range: "last_7",
      now,
      preferDemoWhenEmpty: false,
    });

    assert.equal(report.source, "live_signals");
    assert.equal(report.top_searches[0]?.term, "adhd");
    assert.equal(report.top_searches[0]?.searches, 12);
    assert.equal(report.top_searches[0]?.no_results, 6);
    assert.equal(report.top_searches[0]?.clicks, 1);
    assert.equal(report.top_searches[0]?.trend, "rising");
    assert.ok(report.top_searches[0]!.opportunity_score >= 45);
    assert.match(report.privacy, /90 days/);
    assert.doesNotMatch(JSON.stringify(report), /openai|generated article|seo score/i);
  });

  it("falls back to demo opportunity examples when empty", () => {
    const report = buildSearchOpportunityDashboard({
      signals: [],
      events: [],
      reviews: [] as Array<ClinicalReview & { page: Pick<Page, "path" | "title" | "updatedAt"> }>,
      preferDemoWhenEmpty: true,
    });
    assert.equal(report.source, "demo_signals");
    assert.ok(report.top_searches.some((row) => row.term === "adhd"));
    assert.ok(report.opportunity_queue.length > 0);
    assert.ok(report.practitioner_opportunities.length > 0);
  });
});
