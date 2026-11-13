import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { refinePatientHubMobileDashboard } from "../src/documents/patient-hub-mobile-dashboard";
import { refinePatientJourneyEnhancements } from "../src/documents/patient-journey-enhancements";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.resolve(root, "../../docs/phase-journey-evidence/2026-11-13");
mkdirSync(outDir, { recursive: true });

const fixture = readFileSync(path.join(root, "fixtures/patient-hub.html"), "utf8");
let html = refinePatientHubMobileDashboard(fixture, "patient-hub.html");
html = refinePatientJourneyEnhancements(html, "patient-hub.html");
const fixtureDir = path.join(root, "fixtures");
html = html.replace("</head>", `<base href="${pathToFileURL(fixtureDir + "/").href}"></head>`);
const outHtml = path.join(outDir, "patient-hub-journey-fixture.html");
writeFileSync(outHtml, html);
console.log(outHtml);
