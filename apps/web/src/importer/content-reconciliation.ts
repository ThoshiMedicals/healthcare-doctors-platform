import fs from "node:fs";
import path from "node:path";
import { fingerprintContent } from "@/governance/fingerprint";
import { classifyPage } from "@/importer/classify-page";
import {
  APPROVED_PUBLIC_PATHS,
  CLASS_B_NON_GOLDEN_PATHS,
  EXPECTED_APPROVED_PATH_COUNT,
  EXPECTED_CLASS_B_COUNT,
  isClassBPath,
} from "@/importer/approved-path-inventory";
import { goldenHtmlRoot, listHtmlFiles } from "@/importer/golden-root";
import { recruitmentHoldForPath } from "@/importer/recruitment-hold";

export type ContentParityClass = "A" | "B" | "C" | "D" | "E" | "unknown";

export type PathParityRow = {
  path: string;
  inGolden: boolean;
  inApprovedInventory: boolean;
  parityClass: ContentParityClass;
  goldenSha256: string | null;
  /** Published SHA from optional operator fixture — never fetched live in B1A. */
  approvedPublishedSha256: string | null;
  shaMatch: "match" | "mismatch" | "golden_only" | "approved_sha_unknown" | "missing_both";
  collection: string | null;
  template: string | null;
  recruitmentHold: ReturnType<typeof recruitmentHoldForPath> | null;
  requiresOperatorApproval: boolean;
  notes: string[];
};

export type CollectionParity = {
  key: string;
  goldenCount: number;
};

export type ContentReconciliationReport = {
  generatedAt: string;
  goldenRoot: string;
  goldenPageCount: number;
  approvedInventoryCount: number;
  classBCount: number;
  counts: {
    classA: number;
    classB: number;
    classC: number;
    classD: number;
    classE: number;
    shaMismatch: number;
    shaUnknownOnSharedPaths: number;
    requiresOperatorApproval: number;
  };
  collectionsFromGolden: CollectionParity[];
  expectedCollections: {
    practitionersGoldenPlusClassB: string;
    servicesExpected: number;
  };
  paths: PathParityRow[];
  inventoryIntegrity: {
    approvedListLengthOk: boolean;
    classBListLengthOk: boolean;
    classBSubsetOfApproved: boolean;
    everyApprovedClassified: boolean;
  };
  operatorApprovalRequired: boolean;
};

export type PublishedShaFixture = {
  /** Map path -> content SHA of the approved published revision. */
  publishedShaByPath?: Record<string, string>;
  source?: string;
  note?: string;
};

function classifyParityPath(pathName: string, inGolden: boolean, inApproved: boolean): ContentParityClass {
  if (inGolden && inApproved) {
    if (pathName === "join-our-team.html" || pathName.startsWith("join-our-team/")) return "D";
    return "A";
  }
  if (!inGolden && inApproved && isClassBPath(pathName)) {
    if (pathName.startsWith("join-our-team/")) return "D";
    if (
      pathName.startsWith("doctors/dr-golnar") ||
      pathName.startsWith("doctors/dr-james") ||
      pathName.startsWith("doctors/dr-yamesha") ||
      pathName.startsWith("updates/welcome-dr-")
    ) {
      return "E";
    }
    return "B";
  }
  if (!inGolden && inApproved) return "C";
  if (inGolden && !inApproved) return "C";
  return "unknown";
}

/**
 * Read-only reconciliation of golden files vs approved inventory (+ optional SHA fixture).
 * Does not connect to Supabase and does not export private content.
 */
export function buildContentReconciliationReport(options?: {
  goldenRoot?: string | null;
  publishedShaFixture?: PublishedShaFixture | null;
}): ContentReconciliationReport {
  const root = goldenHtmlRoot(options?.goldenRoot);
  const goldenPaths = listHtmlFiles(root);
  const goldenSet = new Set(goldenPaths);
  const approvedSet = new Set(APPROVED_PUBLIC_PATHS);
  const union = [...new Set([...goldenPaths, ...APPROVED_PUBLIC_PATHS])].sort();
  const fixture = options?.publishedShaFixture?.publishedShaByPath ?? {};

  const collections: Record<string, number> = {};
  const paths: PathParityRow[] = [];

  for (const pagePath of union) {
    const inGolden = goldenSet.has(pagePath);
    const inApproved = approvedSet.has(pagePath);
    const classified = classifyPage(pagePath);
    if (inGolden) {
      const key = classified.collection ?? classified.template;
      collections[key] = (collections[key] ?? 0) + 1;
    }

    let goldenSha256: string | null = null;
    if (inGolden) {
      const html = fs.readFileSync(path.join(root, pagePath), "utf8");
      goldenSha256 = fingerprintContent(html);
    }
    const approvedPublishedSha256 = fixture[pagePath] ?? null;

    let shaMatch: PathParityRow["shaMatch"] = "missing_both";
    if (goldenSha256 && approvedPublishedSha256) {
      shaMatch = goldenSha256 === approvedPublishedSha256 ? "match" : "mismatch";
    } else if (goldenSha256 && !approvedPublishedSha256) {
      shaMatch = inApproved ? "approved_sha_unknown" : "golden_only";
    } else if (!goldenSha256 && approvedPublishedSha256) {
      shaMatch = "mismatch";
    } else if (!goldenSha256 && inApproved) {
      shaMatch = "approved_sha_unknown";
    }

    const parityClass = classifyParityPath(pagePath, inGolden, inApproved);
    const recruitmentHold = recruitmentHoldForPath(pagePath);
    const notes: string[] = [];
    if (shaMatch === "mismatch") {
      notes.push("Golden SHA differs from approved published SHA — operator must choose authority before prod import.");
    }
    if (shaMatch === "approved_sha_unknown" && inApproved) {
      notes.push("Approved published SHA not supplied in fixture — required before production import.");
    }
    if (parityClass === "B" || parityClass === "E") {
      notes.push("Non-golden approved path — import only from operator-approved published revision artifact.");
    }
    if (parityClass === "D") {
      notes.push("Recruitment HOLD — page may exist in DB under HOLD rules; workflows/indexing gated.");
    }

    const requiresOperatorApproval =
      parityClass === "B" ||
      parityClass === "E" ||
      parityClass === "D" ||
      shaMatch === "mismatch" ||
      (shaMatch === "approved_sha_unknown" && inApproved);

    paths.push({
      path: pagePath,
      inGolden,
      inApprovedInventory: inApproved,
      parityClass,
      goldenSha256,
      approvedPublishedSha256,
      shaMatch,
      collection: classified.collection,
      template: classified.template,
      recruitmentHold,
      requiresOperatorApproval,
      notes,
    });
  }

  const classBSubsetOfApproved = CLASS_B_NON_GOLDEN_PATHS.every((p) => approvedSet.has(p));
  const everyApprovedClassified = APPROVED_PUBLIC_PATHS.every((p) => paths.some((row) => row.path === p));

  const counts = {
    classA: paths.filter((p) => p.parityClass === "A").length,
    classB: paths.filter((p) => p.parityClass === "B").length,
    classC: paths.filter((p) => p.parityClass === "C").length,
    classD: paths.filter((p) => p.parityClass === "D").length,
    classE: paths.filter((p) => p.parityClass === "E").length,
    shaMismatch: paths.filter((p) => p.shaMatch === "mismatch").length,
    shaUnknownOnSharedPaths: paths.filter((p) => p.inGolden && p.inApprovedInventory && p.shaMatch === "approved_sha_unknown")
      .length,
    requiresOperatorApproval: paths.filter((p) => p.requiresOperatorApproval).length,
  };

  return {
    generatedAt: new Date().toISOString(),
    goldenRoot: root,
    goldenPageCount: goldenPaths.length,
    approvedInventoryCount: APPROVED_PUBLIC_PATHS.length,
    classBCount: CLASS_B_NON_GOLDEN_PATHS.length,
    counts,
    collectionsFromGolden: Object.entries(collections)
      .map(([key, goldenCount]) => ({ key, goldenCount }))
      .sort((a, b) => a.key.localeCompare(b.key)),
    expectedCollections: {
      practitionersGoldenPlusClassB: "12 golden doctor pages + 3 Class B/E doctors (golnar, james, yamesha) => 15",
      servicesExpected: 29,
    },
    paths,
    inventoryIntegrity: {
      approvedListLengthOk: APPROVED_PUBLIC_PATHS.length === EXPECTED_APPROVED_PATH_COUNT,
      classBListLengthOk: CLASS_B_NON_GOLDEN_PATHS.length === EXPECTED_CLASS_B_COUNT,
      classBSubsetOfApproved,
      everyApprovedClassified,
    },
    operatorApprovalRequired: counts.requiresOperatorApproval > 0 || !classBSubsetOfApproved,
  };
}

export function loadPublishedShaFixture(filePath: string): PublishedShaFixture {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as PublishedShaFixture;
  return raw;
}
