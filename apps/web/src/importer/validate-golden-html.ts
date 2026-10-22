import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/db/prisma";
import { fingerprintContent } from "@/governance/fingerprint";
import { isSectionHub } from "@/importer/classify-page";
import { goldenHtmlRoot, listHtmlFiles, listRuntimeFiles, webRoot } from "@/importer/golden-root";
import { localReferences, parseDocument, parseSchemaBlocks } from "@/importer/parse-document";
import type { OwnershipFile } from "@/importer/import-golden-html";

export type ImportValidationReport = {
  generatedAt: string;
  goldenRoot: string;
  pageCount: { htmlFiles: number; imported: number; expected: number; match: boolean };
  collections: Record<string, number>;
  navigationOwnership: {
    missingInHtml: string[];
    missingInOwnership: string[];
    ownerMismatches: string[];
    hubMismatches: string[];
    routeMismatches: string[];
  };
  breadcrumbs: { brokenPaths: string[] };
  metadata: { missingTitle: string[]; missingDescription: string[]; missingCanonical: string[] };
  jsonLd: { pagesWithSchema: number; blocks: number; invalid: Array<{ path: string; error: string }> };
  links: { missing: Array<{ from: string; target: string }> };
  images: { missing: Array<{ from: string; target: string }> };
  assets: { missingRuntimeCopies: string[]; hashMismatches: string[] };
  hotDoc: { pagesWithWidget: number; pagesWithScript: number };
  digitalReception: { pagesWithScript: number; manifestCopied: boolean; manifestHashMatch: boolean };
  passed: boolean;
};

export type RenderingValidationReport = {
  generatedAt: string;
  compared: number;
  exactMatches: number;
  mismatches: Array<{ path: string; reason: string; differenceAt?: number }>;
  accepted: boolean;
};

const EXPECTED_PAGES = 199;

export async function validateGoldenImport(): Promise<{
  importReport: ImportValidationReport;
  renderingReport: RenderingValidationReport;
}> {
  const root = goldenHtmlRoot();
  const clinic = await prisma.clinic.findUnique({ where: { slug: "woolloongabba" } });
  if (!clinic) throw new Error("Woolloongabba clinic is missing.");

  const htmlFiles = listHtmlFiles(root);
  const htmlSet = new Set(htmlFiles);
  const ownership = JSON.parse(fs.readFileSync(path.join(root, "navigation-ownership.json"), "utf8")) as OwnershipFile;
  const ownershipPaths = Object.keys(ownership.pages);
  const pages = await prisma.page.findMany({
    where: { clinicId: clinic.id },
    include: { publishedRevision: true, navigationOwnership: true },
  });
  const pagesByPath = new Map(pages.map((page) => [page.path, page]));

  const ownerMismatches: string[] = [];
  const hubMismatches: string[] = [];
  const routeMismatches: string[] = [];
  const brokenPaths: string[] = [];
  const missingTitle: string[] = [];
  const missingDescription: string[] = [];
  const missingCanonical: string[] = [];
  const invalidSchema: Array<{ path: string; error: string }> = [];
  const missingLinks: Array<{ from: string; target: string }> = [];
  const missingImages: Array<{ from: string; target: string }> = [];
  let schemaBlocks = 0;
  let pagesWithSchema = 0;
  let pagesWithWidget = 0;
  let pagesWithHotdocScript = 0;
  let pagesWithReception = 0;

  for (const relativePath of htmlFiles) {
    const html = fs.readFileSync(path.join(root, relativePath), "utf8");
    const parsed = parseDocument(html, relativePath);
    const owned = ownership.pages[relativePath];
    if (!parsed.title) missingTitle.push(relativePath);
    if (!parsed.description && relativePath !== "404.html") missingDescription.push(relativePath);
    if (!parsed.canonical && relativePath !== "404.html") missingCanonical.push(relativePath);
    if (owned && (owned.section ?? "") !== parsed.navOwner) ownerMismatches.push(relativePath);
    if (parsed.navIsHub !== isSectionHub(relativePath)) hubMismatches.push(relativePath);
    if (parsed.navRoute && parsed.navRoute !== relativePath) routeMismatches.push(relativePath);
    for (const crumb of owned?.breadcrumbs ?? []) {
      if (!htmlSet.has(crumb.path)) brokenPaths.push(`${relativePath} -> ${crumb.path}`);
    }
    if (parsed.schemaBlocks.length > 0) pagesWithSchema += 1;
    schemaBlocks += parsed.schemaBlocks.length;
    const schema = parseSchemaBlocks(parsed.schemaBlocks);
    for (const error of schema.invalid) invalidSchema.push({ path: relativePath, error });
    if (html.includes("data-hotdoc-widget")) pagesWithWidget += 1;
    if (html.includes("hotdoc-widgets.min.js")) pagesWithHotdocScript += 1;
    if (html.includes("digital-reception.js")) pagesWithReception += 1;

    for (const target of localReferences(html, relativePath)) {
      const exists = fs.existsSync(path.join(root, target));
      if (exists) continue;
      const record = { from: relativePath, target };
      if (/\.(?:png|jpe?g|webp|gif|svg|avif|ico)$/i.test(target)) missingImages.push(record);
      else missingLinks.push(record);
    }
  }

  const runtimeFiles = listRuntimeFiles(root);
  const publicDir = path.join(webRoot(), "public");
  const missingRuntimeCopies: string[] = [];
  const hashMismatches: string[] = [];
  for (const relativePath of runtimeFiles) {
    const source = path.join(root, relativePath);
    const copied = path.join(publicDir, relativePath);
    if (!fs.existsSync(copied)) {
      missingRuntimeCopies.push(relativePath);
      continue;
    }
    if (!fs.readFileSync(source).equals(fs.readFileSync(copied))) hashMismatches.push(relativePath);
  }

  const manifestSource = path.join(root, "search-index/manifest.json");
  const manifestCopy = path.join(publicDir, "search-index/manifest.json");
  const manifestCopied = fs.existsSync(manifestCopy);
  const manifestHashMatch =
    manifestCopied && fs.readFileSync(manifestSource).equals(fs.readFileSync(manifestCopy));

  const collectionGroups = await collectionCounts(clinic.id);
  const renderingMismatches: RenderingValidationReport["mismatches"] = [];
  let exactMatches = 0;

  for (const relativePath of htmlFiles) {
    const fileHtml = fs.readFileSync(path.join(root, relativePath), "utf8");
    const page = pagesByPath.get(relativePath);
    const rendered = page?.publishedRevision?.html;
    if (!page || rendered == null || !page.publishedRevision?.immutable) {
      renderingMismatches.push({ path: relativePath, reason: "Published immutable revision is missing." });
      continue;
    }
    if (rendered === fileHtml && page.publishedRevision.contentSha256 === fingerprintContent(fileHtml)) {
      exactMatches += 1;
      continue;
    }
    renderingMismatches.push({
      path: relativePath,
      reason: rendered === fileHtml ? "SHA-256 does not match the golden file." : "Rendered HTML differs from the golden file.",
      differenceAt: rendered === fileHtml ? undefined : firstDifference(fileHtml, rendered),
    });
  }

  const importReport: ImportValidationReport = {
    generatedAt: new Date().toISOString(),
    goldenRoot: root,
    pageCount: {
      htmlFiles: htmlFiles.length,
      imported: pages.length,
      expected: EXPECTED_PAGES,
      match: htmlFiles.length === EXPECTED_PAGES && pages.length === htmlFiles.length,
    },
    collections: collectionGroups,
    navigationOwnership: {
      missingInHtml: ownershipPaths.filter((item) => !htmlSet.has(item)),
      missingInOwnership: htmlFiles.filter((item) => !ownership.pages[item]),
      ownerMismatches,
      hubMismatches,
      routeMismatches,
    },
    breadcrumbs: { brokenPaths },
    metadata: { missingTitle, missingDescription, missingCanonical },
    jsonLd: { pagesWithSchema, blocks: schemaBlocks, invalid: invalidSchema },
    links: { missing: missingLinks },
    images: { missing: missingImages },
    assets: { missingRuntimeCopies, hashMismatches },
    hotDoc: { pagesWithWidget, pagesWithScript: pagesWithHotdocScript },
    digitalReception: { pagesWithScript: pagesWithReception, manifestCopied, manifestHashMatch },
    passed: false,
  };
  importReport.passed = importReportPassed(importReport);

  const renderingReport: RenderingValidationReport = {
    generatedAt: new Date().toISOString(),
    compared: htmlFiles.length,
    exactMatches,
    mismatches: renderingMismatches,
    accepted: renderingMismatches.length === 0 && exactMatches === htmlFiles.length,
  };

  return { importReport, renderingReport };
}

async function collectionCounts(clinicId: string): Promise<Record<string, number>> {
  const [pages, practitioners, services, topics, articles, updates, practicePages, navigation, ownership] = await Promise.all([
    prisma.page.count({ where: { clinicId } }),
    prisma.practitioner.count({ where: { clinicId } }),
    prisma.service.count({ where: { clinicId } }),
    prisma.knowledgeTopic.count({ where: { clinicId } }),
    prisma.knowledgeArticle.count({ where: { clinicId } }),
    prisma.practiceUpdate.count({ where: { clinicId } }),
    prisma.practicePage.count({ where: { clinicId } }),
    prisma.navigationItem.count({ where: { clinicId } }),
    prisma.navigationOwnership.count({ where: { page: { clinicId } } }),
  ]);
  return {
    pages,
    navigationItems: navigation,
    navigationOwnership: ownership,
    practitioners,
    services,
    knowledgeTopics: topics,
    knowledgeArticles: articles,
    practiceUpdates: updates,
    practicePages,
  };
}

function importReportPassed(report: ImportValidationReport): boolean {
  const nav = report.navigationOwnership;
  return (
    report.pageCount.match &&
    nav.missingInHtml.length === 0 &&
    nav.missingInOwnership.length === 0 &&
    nav.ownerMismatches.length === 0 &&
    nav.hubMismatches.length === 0 &&
    nav.routeMismatches.length === 0 &&
    report.breadcrumbs.brokenPaths.length === 0 &&
    report.metadata.missingTitle.length === 0 &&
    report.metadata.missingCanonical.length === 0 &&
    report.jsonLd.invalid.length === 0 &&
    report.links.missing.length === 0 &&
    report.images.missing.length === 0 &&
    report.assets.missingRuntimeCopies.length === 0 &&
    report.assets.hashMismatches.length === 0 &&
    report.digitalReception.manifestHashMatch
  );
}

function firstDifference(expected: string, actual: string): number {
  const length = Math.min(expected.length, actual.length);
  for (let index = 0; index < length; index += 1) {
    if (expected[index] !== actual[index]) return index;
  }
  return length;
}

export function writeReports(importReport: ImportValidationReport, renderingReport: RenderingValidationReport) {
  const directory = path.join(webRoot(), "reports");
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "import-validation.json"), JSON.stringify(importReport, null, 2));
  fs.writeFileSync(path.join(directory, "rendering-validation.json"), JSON.stringify(renderingReport, null, 2));
  return directory;
}
