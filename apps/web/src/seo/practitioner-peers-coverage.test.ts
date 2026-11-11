import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { PUBLISHED_PRACTITIONER_ROUTES } from "./published-practitioner-routes";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const peersPath = path.join(webRoot, "public", "search-index", "practitioner-peers.json");
const siteJsPath = path.join(webRoot, "public", "site.js");

test("practitioner-peers.json covers all published practitioner profile paths", () => {
  const peers = JSON.parse(fs.readFileSync(peersPath, "utf8"));
  const keys = Object.keys(peers.practitioners || {});
  for (const route of PUBLISHED_PRACTITIONER_ROUTES) {
    assert.ok(
      keys.includes(route.profilePath),
      `missing peer graph entry for ${route.profilePath}`,
    );
  }
  assert.match(String(peers.generated || ""), /^\d{4}-\d{2}-\d{2}$/);
});

test("site.js PEERS embed includes James, Yamesha and Golnar", () => {
  const siteJs = fs.readFileSync(siteJsPath, "utf8");
  for (const key of [
    "doctors/dr-james.html",
    "doctors/dr-yamesha-ranatunga.html",
    "doctors/dr-golnar-mortezaei.html",
  ]) {
    assert.ok(siteJs.includes(`"${key}"`), `site.js PEERS missing ${key}`);
  }
});
