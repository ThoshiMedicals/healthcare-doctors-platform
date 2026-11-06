/**
 * P0 SEO redirect verification: old path → single 301 → target → 200.
 * Usage: node scripts/verify-seo-p0-redirects.mjs [--base=http://127.0.0.1:3100]
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const REDIRECTS = {
  "/doctor/dr-golnar-mortezaei-gp-fracgp": "/doctors/dr-golnar-mortezaei.html",
  "/doctor/dr-james-general-practitioner": "/doctors/dr-james.html",
  "/bulk-billing-doctors-woolloongabba": "/bulk-billing.html",
  "/family-doctors-woolloongabba": "/services/family-health.html",
  "/skin-cancer-clinic-doctors-brisbane": "/services/skin-checks.html",
  "/your-complete-guide-to-a-skin-check-at-gabba-medical-centre":
    "/knowledge/articles/when-should-i-book-a-skin-check.html",
  "/free-flu-vaccine-woolloongabba-2026": "/services/vaccinations.html",
  "/diabetes-doctor-woolloongabba": "/services/chronic-disease-care.html",
  "/local-gp-woolloongabba": "/team-general-practitioners.html",
  "/find-the-best-doctor-near-me-in-brisbane": "/team-general-practitioners.html",
  "/services/sexual-health-doctors": "/services/family-health.html",
  "/services/travel-health-doctors": "/services/vaccinations.html",
};

const baseArg = process.argv.find((a) => a.startsWith("--base="));
const base = (baseArg ? baseArg.slice("--base=".length) : "http://127.0.0.1:3100").replace(/\/$/, "");

async function probe(url) {
  const res = await fetch(url, { redirect: "manual", headers: { accept: "text/html" } });
  return {
    status: res.status,
    location: res.headers.get("location") || "",
    xrobots: res.headers.get("x-robots-tag") || "",
  };
}

function locPath(location) {
  if (!location) return "";
  return new URL(location, base).pathname.replace(/\/$/, "") || "/";
}

const rows = [];
let pass = 0;
let fail = 0;

for (const [from, to] of Object.entries(REDIRECTS)) {
  for (const pathVariant of [from, `${from}/`]) {
    const url = `${base}${pathVariant}`;
    try {
      const hop = await probe(url);
      const got = locPath(hop.location);
      const expected = to.replace(/\/$/, "");
      const oneHop = hop.status === 301 && got === expected;
      let finalStatus = null;
      let chain = false;
      if (oneHop) {
        const finalUrl = new URL(hop.location, base).toString();
        const fin = await probe(finalUrl);
        finalStatus = fin.status;
        chain = fin.status >= 300 && fin.status < 400;
      }
      const ok = oneHop && finalStatus === 200 && !chain;
      rows.push({ from: pathVariant, expected: to, status: hop.status, location: hop.location, finalStatus, chain, ok });
      if (ok) pass++;
      else fail++;
    } catch (err) {
      rows.push({ from: pathVariant, expected: to, status: -1, location: String(err?.message || err), finalStatus: null, chain: false, ok: false });
      fail++;
    }
  }
}

const report = { generatedAt: new Date().toISOString(), base, pass, fail, total: rows.length, rows };
const repoDocs = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "docs", "WMC-SEO-P0-REDIRECT-VERIFICATION.json");
writeFileSync(repoDocs, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ base, pass, fail, total: rows.length, report: repoDocs }, null, 2));
for (const r of rows.filter((x) => !x.ok)) {
  console.log("FAIL", r.from, r.status, r.location, "final", r.finalStatus, "chain", r.chain);
}
process.exit(fail ? 1 : 0);
