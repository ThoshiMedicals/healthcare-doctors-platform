import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { fingerprintContent } from "@/governance/fingerprint";
import { classifyPage, isSectionHub, textBetween, toUpdateCategory } from "@/importer/classify-page";
import { goldenHtmlRoot, listHtmlFiles, listRuntimeFiles } from "@/importer/golden-root";
import { maybeCopyRuntimeFiles, resolveRuntimeCopyPolicy } from "@/importer/runtime-copy";
import { parseDocument } from "@/importer/parse-document";

export type OwnershipFile = {
  version: string;
  baseUrl: string;
  sections: Array<{ key: string; label: string; hub: string }>;
  pages: Record<string, { section: string | null; breadcrumbs: Array<{ label: string; path: string }> }>;
};

export type PracticeUpdateSource = {
  id: string;
  title: string;
  category: string;
  published?: string;
  summary?: string;
  image?: string;
  imageAlt?: string;
  author?: string;
  sections?: unknown;
  audience?: string;
};

export type GoldenImportResult = {
  goldenRoot: string;
  clinicSlug: string;
  pageCount: number;
  collections: Record<string, number>;
  /** Always 0 unless runtime copy was explicitly enabled. */
  runtimeFilesCopied: number;
  /** Count of golden runtime files that would be eligible to copy when opt-in is used. */
  runtimeFilesAvailable: number;
  runtimeCopyEnabled: boolean;
  dryRun: boolean;
};

export type GoldenImportOptions = {
  clinicSlug?: string;
  dryRun?: boolean;
  /**
   * When true (and IMPORT_ALLOW_RUNTIME_COPY=true), copy golden runtime assets into apps/web/public.
   * Default false — production / ordinary imports are DB-only and must not mutate the release tree.
   */
  allowRuntimeCopy?: boolean;
  /** Absolute or relative golden HTML root; defaults to GOLDEN_HTML_ROOT / old-html. */
  goldenRoot?: string | null;
};

function readOwnership(root: string): OwnershipFile {
  return JSON.parse(fs.readFileSync(path.join(root, "navigation-ownership.json"), "utf8")) as OwnershipFile;
}

function readPracticeUpdates(root: string): PracticeUpdateSource[] {
  const source = fs.readFileSync(path.join(root, "updates-data.js"), "utf8");
  const sandbox: { window: { PRACTICE_UPDATES?: PracticeUpdateSource[] } } = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: "updates-data.js" });
  return sandbox.window.PRACTICE_UPDATES ?? [];
}

export async function importGoldenHtml(options: GoldenImportOptions = {}): Promise<GoldenImportResult> {
  const clinicSlug = options.clinicSlug || process.env.DEFAULT_CLINIC_SLUG || "woolloongabba";
  const dryRun = Boolean(options.dryRun);
  const allowRuntimeCopy = Boolean(options.allowRuntimeCopy);
  // Fail closed on ambiguous runtime-copy configuration before any DB work.
  const runtimePolicy = resolveRuntimeCopyPolicy(allowRuntimeCopy);
  const clinic = await prisma.clinic.findUnique({ where: { slug: clinicSlug } });
  if (!clinic) {
    throw new Error(
      `Clinic "${clinicSlug}" is missing. Run npm run db:seed before importing pages, or pass --clinic=<slug> for an existing tenant.`,
    );
  }

  // Prefer CLI → Clinic.goldenHtmlRoot → GOLDEN_HTML_ROOT / old-html.
  const clinicRoot = (clinic as { goldenHtmlRoot?: string | null }).goldenHtmlRoot;
  const root = goldenHtmlRoot(options.goldenRoot || clinicRoot);
  const ownership = readOwnership(root);
  const updates = readPracticeUpdates(root);
  const updatesById = new Map(updates.map((item) => [item.id, item]));
  const htmlFiles = listHtmlFiles(root);
  const counts: Record<string, number> = {};
  const runtimeFilesAvailable = listRuntimeFiles(root).length;

  if (dryRun) {
    for (const relativePath of htmlFiles) {
      const classified = classifyPage(relativePath);
      const key = classified.collection ?? classified.template;
      counts[key] = (counts[key] || 0) + 1;
    }
    return {
      goldenRoot: root,
      clinicSlug: clinic.slug,
      pageCount: htmlFiles.length,
      collections: counts,
      runtimeFilesCopied: 0,
      runtimeFilesAvailable,
      runtimeCopyEnabled: runtimePolicy.enabled,
      dryRun: true,
    };
  }

  const runtimeFiles = maybeCopyRuntimeFiles(root, allowRuntimeCopy);

  for (const [index, section] of ownership.sections.entries()) {
    await prisma.navigationItem.upsert({
      where: { clinicId_sectionKey: { clinicId: clinic.id, sectionKey: section.key } },
      update: { label: section.label, href: section.hub, sortOrder: index + 1 },
      create: {
        clinicId: clinic.id,
        sectionKey: section.key,
        label: section.label,
        href: section.hub,
        sortOrder: index + 1,
      },
    });
  }

  for (const relativePath of htmlFiles) {
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
        data: {
          pageId: page.id,
          html,
          body,
          contentSha256,
          immutable: true,
        },
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

    await upsertCollection(clinic.id, page.id, relativePath, html, parsed.title, parsed.description, updatesById);
    const key = classified.collection ?? classified.template;
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return {
    goldenRoot: root,
    clinicSlug: clinic.slug,
    pageCount: htmlFiles.length,
    collections: counts,
    runtimeFilesCopied: runtimeFiles.length,
    runtimeFilesAvailable,
    runtimeCopyEnabled: runtimePolicy.enabled,
    dryRun: false,
  };
}

async function upsertCollection(
  clinicId: string,
  pageId: string,
  relativePath: string,
  html: string,
  title: string,
  description: string,
  updatesById: Map<string, PracticeUpdateSource>,
) {
  const classified = classifyPage(relativePath);
  const slug = relativePath.replace(/\.html$/, "").split("/").pop() ?? relativePath;

  if (classified.collection === "practitioner") {
    const name = textBetween(html, /<h1>([\s\S]*?)<\/h1>/i) || title;
    const role = textBetween(html, /<p class="doctor-role">([\s\S]*?)<\/p>/i);
    const bookingUrl = html.match(/data-hotdoc-widget="lightbox" href="([^"]+)"/)?.[1] ?? null;
    const portraitPath = html.match(/\bsrc="(\.\.\/assets\/team\/[^"]+)"/)?.[1] ?? null;
    await prisma.practitioner.upsert({
      where: { clinicId_slug: { clinicId, slug } },
      create: {
        clinicId,
        pageId,
        slug,
        name,
        role,
        bookingUrl,
        portraitPath,
        status: "published",
      },
      update: { pageId, name, role, bookingUrl, portraitPath, status: "published" },
    });
    return;
  }

  if (classified.collection === "service" && relativePath.startsWith("services/")) {
    const serviceTitle = textBetween(html, /<h1>([\s\S]*?)<\/h1>/i) || title;
    await prisma.service.upsert({
      where: { clinicId_slug: { clinicId, slug } },
      create: { clinicId, pageId, slug, title: serviceTitle, summary: description, status: "published" },
      update: { pageId, title: serviceTitle, summary: description, status: "published" },
    });
    return;
  }

  if (classified.collection === "knowledge_topic") {
    const topicTitle = textBetween(html, /<h1>([\s\S]*?)<\/h1>/i) || title;
    await prisma.knowledgeTopic.upsert({
      where: { clinicId_slug: { clinicId, slug } },
      create: { clinicId, pageId, slug, title: topicTitle, summary: description, status: "published" },
      update: { pageId, title: topicTitle, summary: description, status: "published" },
    });
    return;
  }

  if (classified.collection === "knowledge_article") {
    const articleTitle = textBetween(html, /<h1>([\s\S]*?)<\/h1>/i) || title;
    await prisma.knowledgeArticle.upsert({
      where: { clinicId_slug: { clinicId, slug } },
      create: {
        clinicId,
        pageId,
        slug,
        title: articleTitle,
        summary: description,
        articlePath: relativePath,
        status: "published",
      },
      update: { pageId, title: articleTitle, summary: description, articlePath: relativePath, status: "published" },
    });
    return;
  }

  if (classified.collection === "update" && relativePath !== "updates/index.html" && relativePath !== "updates/article.html") {
    const source = updatesById.get(slug);
    const category = toUpdateCategory(source?.category ?? "");
    if (!source || !category) return;
    await prisma.practiceUpdate.upsert({
      where: { clinicId_slug: { clinicId, slug } },
      create: {
        clinicId,
        pageId,
        slug,
        title: source.title,
        category,
        summary: source.summary ?? description,
        imagePath: source.image ?? null,
        imageAlt: source.imageAlt ?? null,
        author: source.author ?? null,
        sections: (source.sections ?? null) as Prisma.InputJsonValue,
        audience: source.audience ?? null,
        status: "published",
        publishedAt: source.published ? new Date(source.published) : null,
      },
      update: {
        pageId,
        title: source.title,
        category,
        summary: source.summary ?? description,
        imagePath: source.image ?? null,
        imageAlt: source.imageAlt ?? null,
        author: source.author ?? null,
        sections: (source.sections ?? null) as Prisma.InputJsonValue,
        status: "published",
      },
    });
    return;
  }

  if (classified.collection === "practice_information" || classified.collection === "faq" || classified.collection === "network_location") {
    const pageTitle = textBetween(html, /<h1>([\s\S]*?)<\/h1>/i) || title;
    await prisma.practicePage.upsert({
      where: { clinicId_slug: { clinicId, slug } },
      create: { clinicId, pageId, slug, title: pageTitle, summary: description, status: "published" },
      update: { pageId, title: pageTitle, summary: description, status: "published" },
    });
  }
}

export function goldenFile(relativePath: string): string {
  return path.join(goldenHtmlRoot(), relativePath);
}
