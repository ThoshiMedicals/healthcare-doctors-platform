/**
 * Build an unsigned/signed draft content-decision manifest from a B1C reconciliation JSON.
 * Does not perform database writes. Operator must complete DIFFERENT / NON_GOLDEN authorities
 * and sign an executable manifest before import:approved (non-dry-run).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDraftDecisionsFromReconciliation,
  digestDecisions,
  signDecisionsDigest,
  type ApprovedContentManifest,
} from "../src/importer/approved-content-manifest";

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv: string[]) {
  let input = path.join(webDir, ".tmp-b1c-reconciliation", "b1c-226-reconciliation.json");
  let output = path.join(webDir, ".tmp-b1d-approved-manifest", "approved-content-draft.json");
  let sign = false;
  for (const arg of argv) {
    if (arg.startsWith("--input=")) input = path.resolve(arg.slice("--input=".length));
    else if (arg.startsWith("--output=")) output = path.resolve(arg.slice("--output=".length));
    else if (arg === "--sign") sign = true;
  }
  return { input, output, sign };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(args.input)) {
    console.error(`B1C reconciliation JSON not found: ${args.input}`);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(args.input, "utf8")) as unknown;
  const rows = Array.isArray(raw)
    ? raw
    : ((raw as { rows?: unknown; pages?: unknown }).rows ??
      (raw as { pages?: unknown }).pages ??
      []) as Array<{
        path: string;
        class: string;
        comparison: string;
        goldenSha256: string | null;
        publishedSha256: string | null;
      }>;

  const decisions = buildDraftDecisionsFromReconciliation(rows);
  const decisionsDigest = digestDecisions(decisions);
  const secret = process.env.APPROVED_CONTENT_MANIFEST_SECRET;
  const signature =
    args.sign && secret ? signDecisionsDigest(decisionsDigest, secret) : "UNSIGNED_DRAFT";

  const manifest: ApprovedContentManifest = {
    version: 1,
    clinicSlug: "woolloongabba",
    decisionsDigest,
    signature,
    createdAt: new Date().toISOString(),
    createdBy: "build-approved-content-draft",
    notes:
      "DRAFT — MATCH paths pre-select golden; DIFFERENT/NON_GOLDEN remain skip_until_approved until operator authority + approval. Not production-executable until fully signed and approvals complete.",
    decisions,
  };

  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, JSON.stringify(manifest, null, 2), "utf8");

  const match = decisions.filter((d) => d.comparison === "MATCH").length;
  const different = decisions.filter((d) => d.comparison === "DIFFERENT").length;
  const nonGolden = decisions.filter((d) => d.comparison === "NON_GOLDEN").length;
  const hub = decisions.find((d) => d.path === "join-our-team.html");

  console.log(
    JSON.stringify(
      {
        output: args.output,
        total: decisions.length,
        match,
        matchOrdinary: match - (hub?.comparison === "MATCH" ? 1 : 0),
        recruitmentHubMatch: hub?.comparison === "MATCH",
        different,
        nonGolden,
        sum: match + different + nonGolden,
        signed: args.sign && Boolean(secret),
        executable: false,
      },
      null,
      2,
    ),
  );
}

main();
