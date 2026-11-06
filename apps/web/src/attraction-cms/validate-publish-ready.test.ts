import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Prisma } from "@prisma/client";
import { validateAttractionBody } from "./validate-schema";
import { PUBLISH_READY_SPECS } from "./content";

describe("publish-ready attraction packs", () => {
  for (const spec of PUBLISH_READY_SPECS) {
    it(`${spec.kind}:${spec.slug} passes schema validation`, () => {
      const result = validateAttractionBody(
        spec.kind,
        spec.draftBody as Prisma.JsonValue,
      );
      assert.equal(result.passed, true, result.violations.join("; "));
    });

    it(`${spec.kind}:${spec.slug} is marked synthetic`, () => {
      const body = spec.draftBody as Record<string, unknown>;
      assert.equal(body.contentClass, "synthetic_placeholder");
    });
  }
});
