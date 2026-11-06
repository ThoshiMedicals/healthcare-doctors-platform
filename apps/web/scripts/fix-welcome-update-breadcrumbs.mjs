/**
 * Fix welcome doctor update breadcrumbs that still show the template
 * "New patients are welcome" label. Does not touch old-html/.
 */
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UPDATES = [
  {
    path: "updates/welcome-dr-golnar-mortezaei.html",
    title: "Welcome Dr Golnar Mortezaei to Woolloongabba Medical Centre",
  },
  {
    path: "updates/welcome-dr-james-chanaka.html",
    title: "Welcome Dr James Chanaka to Woolloongabba Medical Centre",
  },
];

function fingerprint(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function fixHtmlBreadcrumb(html, title, pagePath) {
  let next = html;
  // Visible breadcrumb current page label.
  next = next.replace(
    /(<li><span aria-current="page">)([^<]*)(<\/span><\/li>)/i,
    `$1${title}$3`,
  );
  // Any leftover template crumb text.
  next = next.replace(/New patients are welcome/g, title);
  // Schema breadcrumb last item name if present.
  next = next.replace(
    /("itemListElement"\s*:\s*\[[\s\S]*?"position"\s*:\s*3\s*,\s*"name"\s*:\s*")([^"]*)(")/i,
    `$1${title}$3`,
  );
  // Governance / canonical path hints that still point at new-patients shell.
  next = next.replace(
    /data-governance-page="updates\/new-patients-welcome\.html"/i,
    `data-governance-page="${pagePath}"`,
  );
  return next;
}

async function main() {
  const clinic =
    (await prisma.clinic.findFirst({ where: { slug: "woolloongabba" } })) ||
    (await prisma.clinic.findFirst());
  if (!clinic) throw new Error("No clinic");

  const results = [];
  for (const update of UPDATES) {
    const page = await prisma.page.findUnique({
      where: { clinicId_path: { clinicId: clinic.id, path: update.path } },
      include: { publishedRevision: true },
    });
    if (!page?.publishedRevision) {
      results.push({ path: update.path, ok: false, reason: "missing" });
      continue;
    }

    const breadcrumb = [
      { label: "Home", path: "index.html" },
      { label: "Updates", path: "updates/index.html" },
      { label: update.title, path: update.path },
    ];
    const nextHtml = fixHtmlBreadcrumb(page.publishedRevision.html, update.title, update.path);
    const contentSha256 = fingerprint(nextHtml);
    const revision = await prisma.pageRevision.create({
      data: {
        pageId: page.id,
        html: nextHtml,
        body: {
          ...(page.publishedRevision.body &&
          typeof page.publishedRevision.body === "object" &&
          !Array.isArray(page.publishedRevision.body)
            ? page.publishedRevision.body
            : {}),
          breadcrumbFixedAt: new Date().toISOString(),
        },
        contentSha256,
        immutable: true,
      },
    });
    await prisma.page.update({
      where: { id: page.id },
      data: {
        publishedRevisionId: revision.id,
        breadcrumb,
        status: "published",
      },
    });
    await prisma.navigationOwnership.upsert({
      where: { pageId: page.id },
      update: {
        sectionKey: "updates",
        isHub: false,
        breadcrumb: [
          { label: "Home", path: "/" },
          { label: "Updates", path: "updates/index.html" },
          { label: update.title, path: update.path },
        ],
      },
      create: {
        pageId: page.id,
        sectionKey: "updates",
        isHub: false,
        breadcrumb: [
          { label: "Home", path: "/" },
          { label: "Updates", path: "updates/index.html" },
          { label: update.title, path: update.path },
        ],
      },
    });
    results.push({
      path: update.path,
      ok: true,
      changed: nextHtml !== page.publishedRevision.html,
      revisionId: revision.id,
    });
  }

  console.log(JSON.stringify({ ok: true, results }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
