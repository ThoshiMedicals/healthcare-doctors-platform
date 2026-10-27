import fs from "node:fs";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import { prisma } from "../src/db/prisma";
import { fingerprintContent } from "../src/governance/fingerprint";
import { classifyPage, isSectionHub } from "../src/importer/classify-page";
import { goldenHtmlRoot } from "../src/importer/golden-root";
import { parseDocument } from "../src/importer/parse-document";

const pages = process.argv.slice(2);
if (!pages.length) {
  console.error("Usage: tsx scripts/import-selected-pages.ts <relative-html-paths...>");
  process.exit(1);
}

async function main() {
  const root = goldenHtmlRoot();
  const clinic = await prisma.clinic.findUnique({ where: { slug: "woolloongabba" } });
  if (!clinic) throw new Error("Missing clinic");
  const ownership = JSON.parse(
    fs.readFileSync(path.join(root, "navigation-ownership.json"), "utf8")
  ) as {
    pages: Record<string, { section: string | null; breadcrumbs: Array<{ label: string; path: string }> }>;
  };

  for (const relativePath of pages) {
    const html = fs.readFileSync(path.join(root, relativePath), "utf8");
    const parsed = parseDocument(html, relativePath);
    const classified = classifyPage(relativePath);
    const owned = ownership.pages[relativePath];
    const contentSha256 = fingerprintContent(html);
    const body: Prisma.InputJsonValue = {
      source: "golden-master",
      goldenPath: relativePath,
      schema: parsed.schemaBlocks,
      navOwner: parsed.navOwner,
      navIsHub: parsed.navIsHub,
      navRoute: parsed.navRoute,
    };

    const page = await prisma.page.upsert({
      where: { clinicId_path: { clinicId: clinic.id, path: relativePath } },
      create: {
        clinicId: clinic.id,
        path: relativePath,
        template: classified.template,
        collection: classified.collection,
        indexable: parsed.indexable,
        title: parsed.title,
        description: parsed.description,
        canonicalPath: parsed.canonical || relativePath,
        robots: parsed.robots,
        openGraph: parsed.openGraph,
        breadcrumb: owned?.breadcrumbs ?? [],
        status: "published",
      },
      update: {
        template: classified.template,
        collection: classified.collection,
        indexable: parsed.indexable,
        title: parsed.title,
        description: parsed.description,
        canonicalPath: parsed.canonical || relativePath,
        robots: parsed.robots,
        openGraph: parsed.openGraph,
        breadcrumb: owned?.breadcrumbs ?? [],
        status: "published",
      },
    });

    const existingRevision = await prisma.pageRevision.findFirst({
      where: { pageId: page.id, contentSha256, immutable: true },
    });
    const revision =
      existingRevision ??
      (await prisma.pageRevision.create({
        data: { pageId: page.id, html, body, contentSha256, immutable: true },
      }));

    if (page.publishedRevisionId !== revision.id) {
      await prisma.page.update({
        where: { id: page.id },
        data: { publishedRevisionId: revision.id, status: "published" },
      });
    }

    await prisma.navigationOwnership.upsert({
      where: { pageId: page.id },
      update: {
        sectionKey: owned?.section ?? parsed.navOwner,
        isHub: parsed.navIsHub || isSectionHub(relativePath),
        breadcrumb: owned?.breadcrumbs ?? [],
      },
      create: {
        pageId: page.id,
        sectionKey: owned?.section ?? parsed.navOwner,
        isHub: parsed.navIsHub || isSectionHub(relativePath),
        breadcrumb: owned?.breadcrumbs ?? [],
      },
    });

    console.log("published", relativePath, revision.id);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
