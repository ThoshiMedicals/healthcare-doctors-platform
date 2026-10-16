import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { goldenHtmlRoot, listHtmlFiles, listRuntimeFiles, webRoot } from "@/importer/golden-root";
import { firstDifference, pageRegions, type PageRegions } from "@/regression/regions";

loadEnv(path.join(webRoot(), ".env"));

const REGION_KEYS = ["header", "navigation", "footer", "schema", "skipLink", "mainOpen", "appointmentActions", "digitalReceptionScripts"] as const;

test("navigation, header, footer, schema, accessibility, and Digital Reception match the golden master", async () => {
  const { prisma } = await import("@/db/prisma");
  const clinic = await prisma.clinic.findUnique({ where: { slug: "woolloongabba" } });
  assert.ok(clinic, "Woolloongabba clinic is missing. Seed and import the golden master before running regression tests.");

  const root = goldenHtmlRoot();
  const pages = await prisma.page.findMany({
    where: { clinicId: clinic.id, status: "published" },
    include: { publishedRevision: true },
  });
  const rendered = new Map(pages.map((page) => [page.path, page.publishedRevision?.html ?? null]));
  const failures: string[] = [];

  for (const relativePath of listHtmlFiles(root)) {
    const goldenHtml = fs.readFileSync(path.join(root, relativePath), "utf8");
    const platformHtml = rendered.get(relativePath);
    if (platformHtml == null) {
      failures.push(`${relativePath}: published HTML is missing`);
      continue;
    }
    const golden = pageRegions(goldenHtml);
    const platform = pageRegions(platformHtml);
    failures.push(...compareRegions(relativePath, golden, platform));
  }

  assert.equal(failures.length, 0, formatFailures(failures));
});

test("accessibility stylesheet and interaction script match the golden master", () => {
  assert.equal(compareFile("styles.css"), null);
  assert.equal(compareFile("site.js"), null);
});

test("Digital Reception script and search index match the golden master", () => {
  const root = goldenHtmlRoot();
  const failures = ["digital-reception.js", "digital-reception-index.js", ...listRuntimeFiles(root).filter((file) => file.startsWith("search-index/"))]
    .map((file) => compareFile(file))
    .filter((failure): failure is string => failure !== null);

  assert.equal(failures.length, 0, formatFailures(failures));
});

function compareRegions(relativePath: string, golden: PageRegions, platform: PageRegions): string[] {
  const failures: string[] = [];
  for (const key of REGION_KEYS) {
    const expected = JSON.stringify(golden[key]);
    const actual = JSON.stringify(platform[key]);
    if (expected === actual) continue;
    const at = firstDifference(expected, actual);
    failures.push(
      `${relativePath} ${key} differs at ${at}: golden ${expected.slice(at, at + 80)} platform ${actual.slice(at, at + 80)}`,
    );
  }
  return failures;
}

function compareFile(relativePath: string): string | null {
  const golden = path.join(goldenHtmlRoot(), relativePath);
  const platform = path.join(webRoot(), "public", relativePath);
  if (!fs.existsSync(platform)) return `${relativePath}: platform copy is missing`;
  if (!fs.readFileSync(golden).equals(fs.readFileSync(platform))) return `${relativePath}: bytes differ from the golden master`;
  return null;
}

function formatFailures(failures: string[]): string {
  const shown = failures.slice(0, 12).join("\n");
  const extra = failures.length > 12 ? `\n${failures.length - 12} more` : "";
  return `${failures.length} regression failure(s)\n${shown}${extra}`;
}

function loadEnv(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}
