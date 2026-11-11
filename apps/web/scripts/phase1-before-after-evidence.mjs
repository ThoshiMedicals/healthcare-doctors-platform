import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");
const require = createRequire(import.meta.url);

// Compile-free: load via tsx register by spawning is heavier; instead re-implement
// the public refinement entry by dynamic import after registering tsx.
await import("tsx/esm/api").then((api) => api.register());

const { applyAuthoritySeoRefinements } = await import(
  pathToFileURL(path.resolve(__dirname, "../src/seo/authority-refinements.ts")).href
);
const { servicesForCareAreas } = await import(
  pathToFileURL(path.resolve(__dirname, "../src/seo/care-area-service-map.ts")).href
);

const samples = [
  {
    pagePath: "services/pathology.html",
    file: path.join(root, "old-html/services/pathology.html"),
    checks: [/data-seo-support-next="gp-directory"/, /team-general-practitioners\.html/],
  },
  {
    pagePath: "services/pharmacy.html",
    file: path.join(root, "old-html/services/pharmacy.html"),
    checks: [/data-seo-support-next="gp-directory"/],
  },
  {
    pagePath: "services/radiology.html",
    file: path.join(root, "old-html/services/radiology.html"),
    checks: [/data-seo-support-next="gp-directory"/],
  },
  {
    pagePath: "knowledge/family-health.html",
    file: path.join(root, "old-html/knowledge/family-health.html"),
    checks: [/id="related-practitioners"/, /dr-james\.html/, /dr-tanya-goodwill\.html/],
  },
  {
    pagePath: "knowledge/preventive-healthcare.html",
    file: path.join(root, "old-html/knowledge/preventive-healthcare.html"),
    checks: [/id="related-practitioners"/, /dr-sambo-luon\.html/],
  },
  {
    pagePath: "knowledge/pregnancy.html",
    file: path.join(root, "old-html/knowledge/pregnancy.html"),
    checks: [/id="related-practitioners"/, /dr-yamesha-ranatunga\.html/],
  },
  {
    pagePath: "services/mental-health.html",
    file: path.join(root, "old-html/services/mental-health.html"),
    checks: [/agpal-accreditation\.html/, /philosophy-of-care\.html/],
  },
];

const evidence = [];
for (const sample of samples) {
  const before = fs.readFileSync(sample.file, "utf8");
  const after = applyAuthoritySeoRefinements(before, sample.pagePath);
  const results = sample.checks.map((re) => ({
    pattern: String(re),
    before: re.test(before),
    after: re.test(after),
  }));
  evidence.push({
    pagePath: sample.pagePath,
    changed: before !== after,
    deltaBytes: after.length - before.length,
    results,
  });
}

const careMapEvidence = [
  {
    label: "Yamesha adolescent → children's health",
    areas: ["Adolescent and youth health"],
    paths: servicesForCareAreas(["Adolescent and youth health"]).map((s) => s.path),
  },
  {
    label: "Golnar chronic cluster",
    areas: ["Veterans' health", "Chronic disease management", "Diabetes"],
    paths: servicesForCareAreas([
      "Veterans' health",
      "Chronic disease management",
      "Diabetes",
    ]).map((s) => s.path),
  },
  {
    label: "James family/children/mental",
    areas: ["Children's health", "Mental health", "Family medicine"],
    paths: servicesForCareAreas(["Children's health", "Mental health", "Family medicine"]).map(
      (s) => s.path,
    ),
  },
];

const out = {
  generatedAt: new Date().toISOString(),
  pageEvidence: evidence,
  careMapEvidence,
};
const outPath = path.resolve(__dirname, "../.tmp-phase1-before-after.json");
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
console.log(`wrote ${outPath}`);
