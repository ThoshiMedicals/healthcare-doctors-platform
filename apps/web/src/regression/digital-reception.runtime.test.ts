import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { applyPublicUxRefinements } from "@/documents/public-ux";
import {
  APPROVED_RUNTIME_EXCEPTIONS,
  assertDigitalReceptionRuntimeContracts,
  digitalReceptionRuntimeIntegrity,
  isApprovedRuntimeException,
  approvedDigitalReceptionPaths,
} from "@/regression/approved-runtime";

test("Digital Reception R1 exception is documented and excludes byte-equality", () => {
  assert.equal(isApprovedRuntimeException("digital-reception.js"), true);
  const dr = APPROVED_RUNTIME_EXCEPTIONS.find((entry) => entry.relativePath === "digital-reception.js");
  assert.ok(dr, "Digital Reception approved-runtime exception must be registered");
  assert.equal(dr.goldenByteEqualityRequired, false);
  assert.match(dr.reason, /Phase 5C/i);
});

test("approved public digital-reception.js has integrity checksum and required contracts", () => {
  const integrity = digitalReceptionRuntimeIntegrity();
  assert.equal(integrity.exceptionDocumented, true);
  assert.match(integrity.publicSha256, /^[a-f0-9]{64}$/);
  assert.match(integrity.goldenSha256, /^[a-f0-9]{64}$/);
  const source = fs.readFileSync(approvedDigitalReceptionPaths().publicFile, "utf8");
  const failures = assertDigitalReceptionRuntimeContracts(source);
  assert.equal(failures.length, 0, failures.join("\n"));
});

test("SSR launcher reuse injects exactly one Digital Reception launcher into the care dock", () => {
  const html = `<!doctype html><html><head></head><body>
<nav class="persistent-care-actions" aria-label="Care">
<div class="persistent-care-actions-inner"><a href="book-appointment.html">Book</a></div>
</nav>
<script src="digital-reception.js"></script>
</body></html>`;
  const next = applyPublicUxRefinements(html, "index.html", "woolloongabba");
  assert.equal((next.match(/class="digital-reception-launcher digital-reception-dock-action"/g) || []).length, 1);
  assert.match(next, /has-action-dock/);
  const again = applyPublicUxRefinements(next, "index.html", "woolloongabba");
  assert.equal(
    (again.match(/class="digital-reception-launcher digital-reception-dock-action"/g) || []).length,
    1,
  );
});

test("404 handling remains in approved runtime (no dock bootstrap on 404)", () => {
  const source = fs.readFileSync(approvedDigitalReceptionPaths().publicFile, "utf8");
  assert.match(source, /404\\.html/);
  assert.match(source, /skip entirely/i);
});

test("keyboard Escape and focus restoration contracts remain in the approved runtime", () => {
  const source = fs.readFileSync(approvedDigitalReceptionPaths().publicFile, "utf8");
  assert.match(source, /Escape/);
  assert.match(source, /returnFocus|target\.focus/);
  assert.match(source, /trapFocus/);
});

test("booking dock hold class remains for journey regression protection", () => {
  const source = fs.readFileSync(approvedDigitalReceptionPaths().publicFile, "utf8");
  assert.match(source, /booking-journey-held/);
});
