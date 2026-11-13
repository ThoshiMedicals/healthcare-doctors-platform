import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { APPROVED_GP_CATALOG } from "./patient-preferred-gp";
import { injectDirectoryPreferredGpSave } from "./patient-directory-preferred-gp";

const teamHtml = readFileSync(
  path.join(import.meta.dirname, "..", "..", "..", "..", "old-html", "team.html"),
  "utf8",
);

const maryHtml = readFileSync(
  path.join(
    import.meta.dirname,
    "..",
    "..",
    "..",
    "..",
    "old-html",
    "doctors",
    "dr-mary-abadir.html",
  ),
  "utf8",
);

test("M2: team directory injects Save Preferred GP for catalog GPs", () => {
  const once = injectDirectoryPreferredGpSave(teamHtml, "team.html");
  const twice = injectDirectoryPreferredGpSave(once, "team.html");

  assert.match(once, /data-wmc-directory-preferred-banner/);
  assert.match(once, /data-wmc-save-preferred-gp="dr-tanya-goodwill"/);
  assert.match(once, /data-wmc-save-preferred-gp="dr-mary-abadir"/);
  assert.match(once, /patient-preferred-gp\.js\?v=wmc-preferred-gp-20261113m2/);
  assert.match(once, /id="wmc-directory-preferred-gp-runtime"/);
  assert.equal(
    (once.match(/data-wmc-save-preferred-gp=/g) || []).length,
    (twice.match(/data-wmc-save-preferred-gp=/g) || []).length,
  );

  // Only cards present on team.html (full GP list is on team-general-practitioners.html).
  for (const entry of APPROVED_GP_CATALOG) {
    const onPage =
      teamHtml.includes(`doctors/${entry.slug}.html`) &&
      teamHtml.includes(`practitioner-${entry.slug}`);
    if (onPage) {
      assert.match(once, new RegExp(`data-wmc-save-preferred-gp="${entry.slug}"`));
    }
  }
});

test("M2: GP directory page injects Save Preferred GP for remaining catalog GPs", () => {
  const gpDir = readFileSync(
    path.join(
      import.meta.dirname,
      "..",
      "..",
      "..",
      "..",
      "old-html",
      "team-general-practitioners.html",
    ),
    "utf8",
  );
  const once = injectDirectoryPreferredGpSave(gpDir, "team-general-practitioners.html");
  assert.match(once, /data-wmc-save-preferred-gp="dr-debra-larkins"/);
  assert.match(once, /data-wmc-save-preferred-gp="dr-tanya-goodwill"/);
  assert.match(once, /patient-preferred-gp\.js/);
});

test("M2: Mary profile Save Preferred GP preserves phone-only page", () => {
  const once = injectDirectoryPreferredGpSave(maryHtml, "doctors/dr-mary-abadir.html");
  assert.match(once, /data-wmc-save-preferred-gp="dr-mary-abadir"/);
  assert.match(once, /tel:/i);
  assert.doesNotMatch(once, /data-wmc-save-preferred-gp="dr-golnar/);
});

test("M2: non-directory pages untouched", () => {
  const off = injectDirectoryPreferredGpSave("<html><body>hi</body></html>", "index.html");
  assert.doesNotMatch(off, /data-wmc-save-preferred-gp/);
});
