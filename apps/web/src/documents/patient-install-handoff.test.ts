import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  INSTALL_HANDOFF_PATH,
  PRODUCTION_INSTALL_HOST,
  normalizeInstallHandoffHost,
  resolveInstallHandoffUrl,
} from "./patient-install-handoff";

test("normalizeInstallHandoffHost: strips www and ports", () => {
  assert.equal(normalizeInstallHandoffHost("www.gabbamedicalcentre.com.au"), PRODUCTION_INSTALL_HOST);
  assert.equal(normalizeInstallHandoffHost("Staging.GabbaMedicalCentre.com.au:443"), "staging.gabbamedicalcentre.com.au");
});

test("resolveInstallHandoffUrl: staging hosts stay on themselves", () => {
  assert.equal(
    resolveInstallHandoffUrl({ hostname: "staging.gabbamedicalcentre.com.au" }),
    `https://staging.gabbamedicalcentre.com.au${INSTALL_HANDOFF_PATH}`,
  );
  assert.equal(
    resolveInstallHandoffUrl({ hostname: "mediumslateblue-eagle-960503.hostingersite.com" }),
    `https://mediumslateblue-eagle-960503.hostingersite.com${INSTALL_HANDOFF_PATH}`,
  );
});

test("resolveInstallHandoffUrl: production apex preserved", () => {
  assert.equal(
    resolveInstallHandoffUrl({ hostname: "gabbamedicalcentre.com.au" }),
    `https://${PRODUCTION_INSTALL_HOST}${INSTALL_HANDOFF_PATH}`,
  );
  assert.equal(
    resolveInstallHandoffUrl({ hostname: "www.gabbamedicalcentre.com.au" }),
    `https://${PRODUCTION_INSTALL_HOST}${INSTALL_HANDOFF_PATH}`,
  );
});

test("resolveInstallHandoffUrl: unknown host uses origin", () => {
  assert.equal(
    resolveInstallHandoffUrl({
      hostname: "127.0.0.1",
      origin: "http://127.0.0.1:3100",
    }),
    `http://127.0.0.1:3100${INSTALL_HANDOFF_PATH}`,
  );
});

test("patient-install-qr.js: embeds host-aware matrices and resolvers", () => {
  const jsPath = path.join(process.cwd(), "public", "patient-install-qr.js");
  const src = readFileSync(jsPath, "utf8");
  assert.match(src, /resolveInstallHandoffUrl/);
  assert.match(src, /staging\.gabbamedicalcentre\.com\.au/);
  assert.match(src, /mediumslateblue-eagle-960503\.hostingersite\.com/);
  assert.match(src, /gabbamedicalcentre\.com\.au/);
  assert.doesNotMatch(src, /var HANDOFF_URL =\s*"https:\/\/gabbamedicalcentre\.com\.au/);
});
