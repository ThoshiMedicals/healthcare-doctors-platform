import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateAttractionEvent } from "./ingest";
import { looksLikePiiPayload } from "./event-schema";

describe("attraction analytics ingest guards", () => {
  it("accepts faq_open", () => {
    assert.equal(
      validateAttractionEvent({
        name: "faq_open",
        anonymousSessionId: "sess_1",
        faqId: "nursing-support",
        surface: "gp_faq",
      }),
      null,
    );
  });

  it("rejects tool_complete without toolId", () => {
    assert.match(
      validateAttractionEvent({
        name: "tool_complete",
        anonymousSessionId: "sess_1",
      }) || "",
      /toolId/,
    );
  });

  it("rejects AHPRA-like payload", () => {
    assert.ok(looksLikePiiPayload({ ahpra: "MED0000000001", note: "x" }));
  });

  it("accepts pack_download", () => {
    assert.equal(
      validateAttractionEvent({
        name: "pack_download",
        anonymousSessionId: "sess_1",
        packId: "gp-opportunity-pack",
        surface: "opportunity_pack",
      }),
      null,
    );
  });
});
