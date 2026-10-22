import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { passwordProblems } from "./password";

describe("password acceptance", () => {
  it("requires eight characters and a matching confirmation", () => {
    assert.equal(passwordProblems("short", "short"), "short");
    assert.equal(passwordProblems("long-enough", "different"), "mismatch");
    assert.equal(passwordProblems("long-enough", "long-enough"), null);
  });
});
