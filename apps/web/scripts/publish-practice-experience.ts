/**
 * Publish Practice Experience Hub as an immutable PageRevision (no old-html write).
 *
 * Usage (from apps/web):
 *   npx tsx scripts/publish-practice-experience.ts
 *   npx tsx scripts/publish-practice-experience.ts --clinic=woolloongabba
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../src/db/prisma";
import { fingerprintContent } from "../src/governance/fingerprint";
import { PRACTICE_EXPERIENCE_HUB_CONTENT } from "../src/practice-experience/hub-content";
import { renderPracticeExperienceHubHtml } from "../src/practice-experience/render-hub-html";
import { assertPracticeExperienceSchema } from "../src/practice-experience/schema-guards";
import { PRACTICE_EXPERIENCE_PATH } from "../src/practice-experience/types";

async function main() {
  const clinicArg = process.argv.find((a) => a.startsWith("--clinic="));
  const clinicSlug = clinicArg?.slice("--clinic=".length) || "woolloongabba";

  const clinic = await prisma.clinic.findUnique({ where: { slug: clinicSlug } });
  if (!clinic) {
    throw new Error(`Clinic "${clinicSlug}" not found. Run db:seed / import:golden first.`);
  }

  const html = renderPracticeExperienceHubHtml(PRACTICE_EXPERIENCE_HUB_CONTENT);
  const schemaViolations = assertPracticeExperienceSchema(html);
  if (schemaViolations.length) {
    throw new Error(`Schema gate failed:\n${schemaViolations.join("\n")}`);
  }

  const contentSha256 = fingerprintContent(html);
  const body: Prisma.InputJsonValue = {
    source: "practice-experience-hub",
    version: PRACTICE_EXPERIENCE_HUB_CONTENT.version,
    modules: PRACTICE_EXPERIENCE_HUB_CONTENT.modules.map((m) => m.id),
    content: PRACTICE_EXPERIENCE_HUB_CONTENT as unknown as Prisma.InputJsonValue,
  };

  const page = await prisma.page.upsert({
    where: { clinicId_path: { clinicId: clinic.id, path: PRACTICE_EXPERIENCE_PATH } },
    create: {
      clinicId: clinic.id,
      path: PRACTICE_EXPERIENCE_PATH,
      template: "practice_page",
      collection: "practice_information",
      indexable: true,
      title: PRACTICE_EXPERIENCE_HUB_CONTENT.title,
      description: PRACTICE_EXPERIENCE_HUB_CONTENT.metaDescription,
      canonicalPath: PRACTICE_EXPERIENCE_PATH,
      robots: "index,follow,max-image-preview:large",
      breadcrumb: ["Home", "About Us", "Practice Experience"],
      status: "published",
    },
    update: {
      title: PRACTICE_EXPERIENCE_HUB_CONTENT.title,
      description: PRACTICE_EXPERIENCE_HUB_CONTENT.metaDescription,
      canonicalPath: PRACTICE_EXPERIENCE_PATH,
      status: "published",
    },
  });

  const existing = await prisma.pageRevision.findFirst({
    where: { pageId: page.id, contentSha256, immutable: true },
  });
  const revision =
    existing ??
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
    create: {
      pageId: page.id,
      sectionKey: "about",
      isHub: false,
      breadcrumb: ["Home", "About Us", "Practice Experience"],
    },
    update: {
      sectionKey: "about",
      isHub: false,
      breadcrumb: ["Home", "About Us", "Practice Experience"],
    },
  });

  const slug = "practice-experience";
  await prisma.practicePage.upsert({
    where: { clinicId_slug: { clinicId: clinic.id, slug } },
    create: {
      clinicId: clinic.id,
      pageId: page.id,
      slug,
      title: "Practice Experience",
      summary: PRACTICE_EXPERIENCE_HUB_CONTENT.lede,
      sections: PRACTICE_EXPERIENCE_HUB_CONTENT as unknown as Prisma.InputJsonValue,
      publishedPayload: PRACTICE_EXPERIENCE_HUB_CONTENT as unknown as Prisma.InputJsonValue,
      status: "published",
      contentOwner: "practice-experience-hub",
      relatedPages: ["about-us.html", "join-our-team.html", "philosophy-of-care.html"],
    },
    update: {
      pageId: page.id,
      title: "Practice Experience",
      summary: PRACTICE_EXPERIENCE_HUB_CONTENT.lede,
      sections: PRACTICE_EXPERIENCE_HUB_CONTENT as unknown as Prisma.InputJsonValue,
      publishedPayload: PRACTICE_EXPERIENCE_HUB_CONTENT as unknown as Prisma.InputJsonValue,
      status: "published",
    },
  });

  console.log(
    JSON.stringify(
      {
        clinic: clinicSlug,
        path: PRACTICE_EXPERIENCE_PATH,
        pageId: page.id,
        revisionId: revision.id,
        contentSha256,
        modules: PRACTICE_EXPERIENCE_HUB_CONTENT.modules.length,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
