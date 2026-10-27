import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/db/prisma";
import {
  buildPublicGovernanceBundle,
  renderGovernancePublishedJs,
} from "@/governance/publish-registry";

/**
 * Rebuild governance-published.js from approved/published ClinicalReview rows.
 * Safe to call after every governance save — empty when nothing is public-ready.
 */
export async function writePublishedGovernanceRegistry(clinicId: string): Promise<{
  included: number;
  omitted: number;
  paths: string[];
}> {
  const rows = await prisma.clinicalReview.findMany({
    where: { clinicId, status: { in: ["approved", "published"] } },
    include: { page: { select: { path: true } } },
  });
  const { bundle, included, omitted } = buildPublicGovernanceBundle(rows);
  const js = renderGovernancePublishedJs(bundle);

  const targets = [
    path.join(process.cwd(), "public/governance-published.js"),
    path.resolve(process.cwd(), "../../old-html/governance-published.js"),
  ];

  for (const target of targets) {
    if (!fs.existsSync(path.dirname(target))) continue;
    fs.writeFileSync(target, js, "utf8");
  }

  return { included, omitted, paths: Object.keys(bundle).sort() };
}
