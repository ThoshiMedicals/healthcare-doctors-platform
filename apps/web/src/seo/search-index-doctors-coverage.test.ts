import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { PUBLISHED_PRACTITIONER_ROUTES } from "./published-practitioner-routes";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const doctorsPath = path.join(webRoot, "public", "search-index", "doctors.json");
const manifestPath = path.join(webRoot, "public", "search-index", "manifest.json");

test("search-index doctors shard covers every published practitioner profile", () => {
  const doctors = JSON.parse(fs.readFileSync(doctorsPath, "utf8"));
  assert.ok(Array.isArray(doctors));
  for (const row of doctors) {
    assert.equal(typeof row?.url, "string", "doctor row must have url");
    assert.ok(row.url.trim().length > 0, "doctor url must be non-empty");
  }
  const urls = new Set(doctors.map((d: { url: string }) => d.url));
  for (const route of PUBLISHED_PRACTITIONER_ROUTES) {
    assert.ok(urls.has(route.profilePath), `doctors.json missing ${route.profilePath}`);
  }
});

test("search-index manifest routes include published practitioner profiles", () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  for (const route of PUBLISHED_PRACTITIONER_ROUTES) {
    assert.equal(
      manifest.routes?.[route.profilePath],
      "doctors",
      `manifest.routes missing doctors shard for ${route.profilePath}`,
    );
  }
});
