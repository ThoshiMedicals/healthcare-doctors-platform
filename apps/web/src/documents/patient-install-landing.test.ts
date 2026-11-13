import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { refineInstallWmcAppLanding } from "./patient-install-landing";

const fixturePath = path.join(process.cwd(), "fixtures", "install-wmc-app.html");

test("refineInstallWmcAppLanding: honest DR copy + help + no Phase 3A jargon", () => {
  const fixture = readFileSync(fixturePath, "utf8");
  const once = refineInstallWmcAppLanding(fixture, "install-wmc-app.html");
  const twice = refineInstallWmcAppLanding(once, "install-wmc-app.html");

  assert.doesNotMatch(once, /Message our team without waiting on hold/i);
  assert.match(once, /common practice questions/i);
  assert.doesNotMatch(once, /Phase 3A/i);
  assert.match(once, /Need help installing/);
  assert.match(once, /tel:\+61732173344/);
  assert.match(once, /separate from the HotDoc app/i);
  assert.equal((twice.match(/data-wmc-install-landing-b1="1"/g) || []).length, 1);
});

test("refineInstallWmcAppLanding: other pages untouched", () => {
  const html = "<html><body>Hello</body></html>";
  assert.equal(refineInstallWmcAppLanding(html, "patient-hub.html"), html);
});
