/**
 * Publish fail-closed public governance strips from ClinicalReview approvals.
 *
 * Usage:
 *   npx tsx scripts/publish-governance-registry.ts
 *   npx tsx scripts/publish-governance-registry.ts --dry-run
 *   npx tsx scripts/publish-governance-registry.ts --clinic woolloongabba
 *
 * Writes apps/web/public/governance-published.js and mirrors to old-html/
 * when that tree is present. Never embeds private evidence fields.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "@/db/prisma";
import {
  buildPublicGovernanceBundle,
  renderGovernancePublishedJs,
} from "@/governance/publish-registry";

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, "..");
const repoRoot = path.resolve(webRoot, "../..");
const publicOut = path.join(webRoot, "public/governance-published.js");
const goldenOut = path.join(repoRoot, "old-html/governance-published.js");

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const clinicFlag = process.argv.indexOf("--clinic");
  const clinicSlug =
    clinicFlag >= 0 && process.argv[clinicFlag + 1] ? process.argv[clinicFlag + 1] : "woolloongabba";

  const clinic = await prisma.clinic.findUnique({ where: { slug: clinicSlug }, select: { id: true } });
  if (!clinic) throw new Error(`Clinic not found: ${clinicSlug}`);

  const rows = await prisma.clinicalReview.findMany({
    where: { clinicId: clinic.id, status: { in: ["approved", "published"] } },
    include: { page: { select: { path: true } } },
  });

  const { bundle, included, omitted } = buildPublicGovernanceBundle(rows);
  const js = renderGovernancePublishedJs(bundle);

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          clinic: clinicSlug,
          candidates: rows.length,
          included,
          omitted,
          paths: Object.keys(bundle).sort(),
        },
        null,
        2,
      ),
    );
    return;
  }

  fs.writeFileSync(publicOut, js, "utf8");
  const written = [publicOut];
  if (fs.existsSync(path.dirname(goldenOut))) {
    fs.writeFileSync(goldenOut, js, "utf8");
    written.push(goldenOut);
  }

  console.log(
    JSON.stringify(
      {
        clinic: clinicSlug,
        candidates: rows.length,
        included,
        omitted,
        paths: Object.keys(bundle).sort(),
        written,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
