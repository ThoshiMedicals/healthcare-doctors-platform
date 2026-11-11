import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashPreviewToken, mintPreviewTokenSecret } from "./draft-preview";

describe("draft preview tokens", () => {
  it("mints unique secrets and hashes stably", () => {
    const a = mintPreviewTokenSecret();
    const b = mintPreviewTokenSecret();
    assert.notEqual(a, b);
    assert.equal(hashPreviewToken(a), hashPreviewToken(a));
    assert.notEqual(hashPreviewToken(a), hashPreviewToken(b));
    assert.match(hashPreviewToken(a), /^[a-f0-9]{64}$/);
  });
});
