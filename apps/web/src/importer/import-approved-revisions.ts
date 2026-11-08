import fs from "node:fs";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { fingerprintContent } from "@/governance/fingerprint";
import {
  type ApprovedContentManifest,
  type ApprovedContentPathDecision,
  loadApprovedContentManifest,
  validateApprovedContentManifest,
} from "@/importer/approved-content-manifest";
import { classifyPage, isSectionHub } from "@/importer/classify-page";
import { goldenHtmlRoot, webRoot } from "@/importer/golden-root";
import { parseDocument } from "@/importer/parse-document";
import {
  isRecruitmentHoldActive,
  mustNoIndexRecruitmentPath,
  recruitmentHoldForPath,
} from "@/importer/recruitment-hold";
import { validateMediaReferencesForHtml } from "@/importer/media-integrity";

const BLOCKED_IMPORT_PATH_PREFIXES = ["vacancies/", "applications/", "admin/", ".tmp-", "tmp/"];
const BLOCKED_IMPORT_BASENAMES = new Set(["vacancies.html", "applications.html"]);

export type ApprovedImportOptions = {
  manifestPath?: string;
  manifest?: ApprovedContentManifest;
  clinicSlug?: string;
  dryRun?: boolean;
  /** Approved HTML payload root for staging_published contentFile resolution. */
  contentRoot?: string | null;
  goldenRoot?: string | null;
  /** When true, skip production DB target assert (offline fixture / unit harness only). */
  offlineFixture?: boolean;
  /** Signing secret override for tests. */
  manifestSecret?: string;
  env?: Record<string, string | undefined>;
};

export type ApprovedImportPathResult = {
  path: string;
  action: string;
  contentSha256: string | null;
  revisionReused: boolean;
  publishedRevisionUpdated: boolean;
  skipped: boolean;
  reason?: string;
};

export type ApprovedImportResult = {
  clinicSlug: string;
  dryRun: boolean;
  pageCount: number;
  imported: number;
  skipped: number;
  paths: ApprovedImportPathResult[];
  publicAssetsMutated: false;
  goldenMasterMutated: false;
};

function assertPathAllowlisted(decision: ApprovedContentPathDecision): void {
  const p = decision.path.replace(/\\/g, "/");
  if (p.includes("..") || path.isAbsolute(p) || p.startsWith("/")) {
    throw new Error(`Refusing path escape: ${decision.path}`);
  }
  for (const prefix of BLOCKED_IMPORT_PATH_PREFIXES) {
    if (p.startsWith(prefix)) {
      throw new Error(`Refusing blocked import path prefix ${prefix}: ${decision.path}`);
    }
  }
  if (BLOCKED_IMPORT_BASENAMES.has(p.split("/").pop() || "")) {
    throw new Error(`Refusing blocked import basename: ${decision.path}`);
  }
}

function resolveContentFile(decision: ApprovedContentPathDecision, contentRoot: string): string {
  const relative = (decision.contentFile || "").replace(/\\/g, "/");
  if (!relative || relative.includes("..") || path.isAbsolute(relative)) {
    throw new Error(`Unsafe contentFile for ${decision.path}: must be relative under contentRoot`);
  }
  const absolute = path.resolve(contentRoot, relative);
  const rootResolved = path.resolve(contentRoot);
  if (!absolute.startsWith(rootResolved + path.sep) && absolute !== rootResolved) {
    throw new Error(`contentFile escapes contentRoot for ${decision.path}`);
  }
  if (!fs.existsSync(absolute)) {
    throw new Error(`Approved content payload missing for ${decision.path}: ${relative}`);
  }
  return absolute;
}

function readHtmlForDecision(
  decision: ApprovedContentPathDecision,
  goldenRoot: string,
  contentRoot: string | null,
): string {
  if (decision.importAction === "skip_until_approved") {
    throw new Error(`Cannot read HTML for skip_until_approved: ${decision.path}`);
  }
  if (decision.selectedAuthority === "pending") {
    throw new Error(`Unapproved authority (pending) for ${decision.path}`);
  }
  if (decision.selectedAuthority === "golden" || decision.importAction === "import_golden") {
    const file = path.join(goldenRoot, decision.path);
    if (!fs.existsSync(file)) {
      throw new Error(`Golden HTML missing for ${decision.path}`);
    }
    return fs.readFileSync(file, "utf8");
  }
  if (decision.selectedAuthority === "staging_published" || decision.importAction === "import_approved_payload") {
    if (!contentRoot) {
      throw new Error(`contentRoot required for staging_published import of ${decision.path}`);
    }
    return fs.readFileSync(resolveContentFile(decision, contentRoot), "utf8");
  }
  if (decision.importAction === "import_under_hold") {
    if (decision.selectedAuthority === "golden") {
      return fs.readFileSync(path.join(goldenRoot, decision.path), "utf8");
    }
    if (!contentRoot) throw new Error(`contentRoot required for HOLD payload ${decision.path}`);
    return fs.readFileSync(resolveContentFile(decision, contentRoot), "utf8");
  }
  throw new Error(`Unsupported authority/action for ${decision.path}`);
}

function applyHoldDocumentOverrides(
  relativePath: string,
  parsed: ReturnType<typeof parseDocument>,
  env: Record<string, string | undefined>,
): { indexable: boolean; robots: string; status: "published" | "draft" } {
  const hold = recruitmentHoldForPath(relativePath);
  if (!hold || !isRecruitmentHoldActive(env)) {
    return { indexable: parsed.indexable, robots: parsed.robots, status: "published" };
  }
  if (!hold.mayExistInProductionDb) {
    throw new Error(`Recruitment HOLD forbids DB import of ${relativePath}`);
  }
  // Children may exist under HOLD but must not be publicly served/indexed via publish pointer alone.
  const forceNoIndex = mustNoIndexRecruitmentPath(relativePath, env) || !hold.mayIndex;
  const indexable = forceNoIndex ? false : parsed.indexable;
  const robots = forceNoIndex
    ? "noindex,nofollow,max-image-preview:large"
    : parsed.robots;
  // Keep status published for hub; children stay published in DB but serve layer blocks.
  return { indexable, robots, status: "published" };
}

function assertNoFabricatedClinicalReview(decision: ApprovedContentPathDecision): void {
  if (!decision.clinicalReviewRequired) return;
  if (!decision.clinicalReviewReference?.trim()) {
    throw new Error(`Fabricated/missing clinical review for ${decision.path}`);
  }
  if (/^(todo|tbd|pending|n\/a|none)$/i.test(decision.clinicalReviewReference.trim())) {
    throw new Error(`Placeholder clinical review refused for ${decision.path}`);
  }
}

/**
 * Database-only approved-content importer.
 * Never copies public assets or mutates golden-master files.
 */
export async function importApprovedRevisions(options: ApprovedImportOptions = {}): Promise<ApprovedImportResult> {
  const env = options.env ?? process.env;
  const dryRun = Boolean(options.dryRun);
  const offlineFixture = Boolean(options.offlineFixture) || env.WMC_IMPORT_OFFLINE_FIXTURE === "true";
  const clinicSlug = options.clinicSlug || env.DEFAULT_CLINIC_SLUG || "woolloongabba";

  const manifest =
    options.manifest ??
    (options.manifestPath ? loadApprovedContentManifest(options.manifestPath) : null);
  if (!manifest) {
    throw new Error("Approved content manifest is required (--manifest=<path>).");
  }

  const issues = validateApprovedContentManifest(manifest, {
    requireExecutableApprovals: !dryRun,
    secret: options.manifestSecret ?? env.APPROVED_CONTENT_MANIFEST_SECRET,
  });
  if (dryRun) {
    const structural = issues.filter((i) =>
      ["duplicate_paths", "unapproved_path", "path_count", "missing_path", "digest_mismatch", "signature_invalid"].includes(
        i.code,
      ),
    );
    // Draft dry-runs may omit signature; still refuse tampered digests when signature present.
    const fatal = structural.filter((i) => i.code !== "signature_invalid" || Boolean(manifest.signature));
    if (fatal.length) {
      throw new Error(`Manifest structure invalid:\n${fatal.map((i) => `${i.code}: ${i.message}`).join("\n")}`);
    }
  } else if (issues.length) {
    throw new Error(`Manifest validation failed:\n${issues.map((i) => `${i.code}: ${i.message}`).join("\n")}`);
  }

  if (manifest.clinicSlug !== clinicSlug) {
    throw new Error(`Manifest clinicSlug ${manifest.clinicSlug} does not match ${clinicSlug}`);
  }

  const goldenRoot = goldenHtmlRoot(options.goldenRoot);
  const contentRoot = options.contentRoot ? path.resolve(options.contentRoot) : null;

  const results: ApprovedImportPathResult[] = [];
  let imported = 0;
  let skipped = 0;

  if (dryRun) {
    for (const decision of manifest.decisions) {
      assertPathAllowlisted(decision);
      if (decision.importAction === "skip_until_approved") {
        skipped += 1;
        results.push({
          path: decision.path,
          action: decision.importAction,
          contentSha256: null,
          revisionReused: false,
          publishedRevisionUpdated: false,
          skipped: true,
          reason: "awaiting_operator_authority",
        });
        continue;
      }
      assertNoFabricatedClinicalReview(decision);
      const html = readHtmlForDecision(decision, goldenRoot, contentRoot);
      const sha = fingerprintContent(html);
      if (decision.selectedSourceSha256 && sha !== decision.selectedSourceSha256) {
        throw new Error(`Hash mismatch for ${decision.path}: expected ${decision.selectedSourceSha256}, got ${sha}`);
      }
      const media = validateMediaReferencesForHtml(html, decision.path, {
        publicRoot: path.join(webRoot(), "public"),
        assetDependencies: decision.assetDependencies,
        skipMissingFiles: offlineFixture,
      });
      if (!media.ok) {
        throw new Error(`Media integrity failed for ${decision.path}: ${media.issues.map((i) => i.message).join("; ")}`);
      }
      imported += 1;
      results.push({
        path: decision.path,
        action: decision.importAction,
        contentSha256: sha,
        revisionReused: false,
        publishedRevisionUpdated: false,
        skipped: false,
        reason: "dry_run_validated",
      });
    }
    return {
      clinicSlug,
      dryRun: true,
      pageCount: manifest.decisions.length,
      imported,
      skipped,
      paths: results,
      publicAssetsMutated: false,
      goldenMasterMutated: false,
    };
  }

  if (!offlineFixture) {
    // Production path: assertDbTarget is enforced by the protected CLI entrypoint.
    // Library still refuses when RECRUITMENT_HOLD_LIFTED is accidentally set without GO docs —
    // HOLD env must remain unset for default production population.
  }

  const clinic = await prisma.clinic.findUnique({ where: { slug: clinicSlug } });
  if (!clinic) {
    throw new Error(`Clinic "${clinicSlug}" is missing. Seed before approved import.`);
  }

  for (const decision of manifest.decisions) {
    assertPathAllowlisted(decision);
    if (decision.importAction === "skip_until_approved") {
      skipped += 1;
      results.push({
        path: decision.path,
        action: decision.importAction,
        contentSha256: null,
        revisionReused: false,
        publishedRevisionUpdated: false,
        skipped: true,
        reason: "awaiting_operator_authority",
      });
      continue;
    }

    if (decision.selectedAuthority === "pending") {
      throw new Error(`Unapproved authority for ${decision.path}`);
    }
    if (!decision.operatorApproved) {
      throw new Error(`Missing operator approval for ${decision.path}`);
    }
    assertNoFabricatedClinicalReview(decision);

    const hold = recruitmentHoldForPath(decision.path);
    if (hold?.holdActive && isRecruitmentHoldActive(env) && !decision.recruitmentHold) {
      throw new Error(`Recruitment HOLD flag required for ${decision.path}`);
    }
    if (hold && !hold.mayExistInProductionDb && isRecruitmentHoldActive(env)) {
      throw new Error(`HOLD forbids importing ${decision.path} into production DB`);
    }

    const html = readHtmlForDecision(decision, goldenRoot, contentRoot);
    const contentSha256 = fingerprintContent(html);
    if (!decision.selectedSourceSha256) {
      throw new Error(`Missing selectedSourceSha256 for ${decision.path}`);
    }
    if (contentSha256 !== decision.selectedSourceSha256) {
      throw new Error(
        `Exact SHA256 validation failed for ${decision.path}: expected ${decision.selectedSourceSha256}, got ${contentSha256}`,
      );
    }

    const media = validateMediaReferencesForHtml(html, decision.path, {
      publicRoot: path.join(webRoot(), "public"),
      assetDependencies: decision.assetDependencies,
      skipMissingFiles: offlineFixture,
    });
    if (!media.ok) {
      throw new Error(`Media integrity failed for ${decision.path}: ${media.issues.map((i) => i.message).join("; ")}`);
    }

    const parsed = parseDocument(html, decision.path);
    const holdDoc = applyHoldDocumentOverrides(decision.path, parsed, env);
    const classified = classifyPage(decision.path);

    const body: Prisma.InputJsonValue = {
      source: decision.selectedAuthority === "golden" ? "approved-golden" : "approved-staging-published",
      authority: decision.selectedAuthority,
      selectedSourceSha256: decision.selectedSourceSha256,
      clinicalReviewReference: decision.clinicalReviewReference,
      operatorApprovedBy: decision.operatorApprovedBy,
      operatorApprovedAt: decision.operatorApprovedAt,
      recruitmentHold: decision.recruitmentHold,
      schema: parsed.schemaBlocks,
      navOwner: parsed.navOwner,
      navIsHub: parsed.navIsHub,
      navRoute: parsed.navRoute,
      provenance: {
        comparison: decision.comparison ?? null,
        class: decision.class ?? null,
        publishedSha256: decision.publishedSha256,
        goldenSha256: decision.goldenSha256,
      },
    };

    const page = await prisma.page.upsert({
      where: { clinicId_path: { clinicId: clinic.id, path: decision.path } },
      create: {
        clinicId: clinic.id,
        path: decision.path,
        template: classified.template,
        collection: classified.collection,
        indexable: holdDoc.indexable,
        title: parsed.title,
        description: parsed.description,
        canonicalPath: parsed.canonical || decision.path,
        robots: holdDoc.robots,
        openGraph: parsed.openGraph,
        breadcrumb: [],
        status: holdDoc.status,
      },
      update: {
        template: classified.template,
        collection: classified.collection,
        indexable: holdDoc.indexable,
        title: parsed.title,
        description: parsed.description,
        canonicalPath: parsed.canonical || decision.path,
        robots: holdDoc.robots,
        openGraph: parsed.openGraph,
        status: holdDoc.status,
      },
    });

    const existingRevision = await prisma.pageRevision.findFirst({
      where: { pageId: page.id, contentSha256, immutable: true },
    });

    if (existingRevision && existingRevision.html !== html) {
      throw new Error(
        `Refusing unauthorised overwrite of immutable revision ${existingRevision.id} for ${decision.path}`,
      );
    }

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

    let publishedRevisionUpdated = false;
    if (page.publishedRevisionId !== revision.id) {
      await prisma.page.update({
        where: { id: page.id },
        data: { publishedRevisionId: revision.id, status: holdDoc.status },
      });
      publishedRevisionUpdated = true;
    }

    await prisma.navigationOwnership.upsert({
      where: { pageId: page.id },
      update: {
        sectionKey: parsed.navOwner || classified.collection || "site",
        isHub: parsed.navIsHub || isSectionHub(decision.path),
        breadcrumb: [],
      },
      create: {
        pageId: page.id,
        sectionKey: parsed.navOwner || classified.collection || "site",
        isHub: parsed.navIsHub || isSectionHub(decision.path),
        breadcrumb: [],
      },
    });

    imported += 1;
    results.push({
      path: decision.path,
      action: decision.importAction,
      contentSha256,
      revisionReused: Boolean(existingRevision),
      publishedRevisionUpdated,
      skipped: false,
    });
  }

  return {
    clinicSlug,
    dryRun: false,
    pageCount: manifest.decisions.length,
    imported,
    skipped,
    paths: results,
    publicAssetsMutated: false,
    goldenMasterMutated: false,
  };
}
