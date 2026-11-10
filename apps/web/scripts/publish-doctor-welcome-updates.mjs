/**
 * Publish featured Practice Updates welcoming Dr Golnar and Dr James.
 * Creates native PracticeUpdate + Page revision shells (DB only — no old-html/*.html pages).
 * Content/cards/homepage come from updates-data.js (already updated).
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import vm from "node:vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "..", "..");
const templatePath = path.join(repoRoot, "old-html", "updates", "new-patients-welcome.html");
const updatesDataPath = path.join(webRoot, "public", "updates-data.js");
const prisma = new PrismaClient();

const UPDATES = [
  {
    id: "welcome-dr-golnar-mortezaei",
    metaTitle: "Welcome Dr Golnar Mortezaei | Woolloongabba Medical Centre",
    // S1-R1: Golnar is phone-only — do not seed online-booking claims.
    metaDescription:
      "Now welcoming new patients. Learn more about Dr Golnar Mortezaei and contact reception to arrange an appointment at Woolloongabba Medical Centre.",
  },
  {
    id: "welcome-dr-james-chanaka",
    metaTitle: "Welcome Dr James Chanaka | Woolloongabba Medical Centre",
    metaDescription:
      "Now welcoming new patients. Learn more about Dr James Chanaka and book an appointment online with Woolloongabba Medical Centre.",
  },
];

function fingerprintContent(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadPracticeUpdates() {
  const source = readFileSync(updatesDataPath, "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: "updates-data.js" });
  return sandbox.window.PRACTICE_UPDATES || [];
}

function categoryEnum(label) {
  const map = {
    "Practice Updates": "practice_updates",
    "Patient Education": "patient_education",
    "Service Information": "service_information",
    "Clinical Governance": "clinical_governance",
    "Community Health Information": "community_health_information",
  };
  return map[label] || "practice_updates";
}

function buildUpdateShell(template, update, seo) {
  const pagePath = `updates/${update.id}.html`;
  let html = template;
  html = html.replace(/data-update-id="[^"]*"/i, `data-update-id="${update.id}"`);
  html = html.replace(
    /data-nav-route="updates\/[^"]*"/i,
    `data-nav-route="${pagePath}"`,
  );
  html = html.replace(
    /data-governance-page="updates\/[^"]*"/i,
    `data-governance-page="${pagePath}"`,
  );
  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(seo.metaTitle)}</title>`,
  );
  html = html.replace(
    /<meta content="[^"]*" name="description"\/>/i,
    `<meta content="${escapeHtml(seo.metaDescription)}" name="description"/>`,
  );
  html = html.replace(
    /property="og:title" content="[^"]*"/i,
    `property="og:title" content="${escapeHtml(seo.metaTitle)}"`,
  );
  html = html.replace(
    /content="[^"]*" property="og:title"/i,
    `content="${escapeHtml(seo.metaTitle)}" property="og:title"`,
  );
  html = html.replace(
    /property="og:description" content="[^"]*"/i,
    `property="og:description" content="${escapeHtml(seo.metaDescription)}"`,
  );
  html = html.replace(
    /content="[^"]*" property="og:description"/i,
    `content="${escapeHtml(seo.metaDescription)}" property="og:description"`,
  );
  html = html.replace(
    /href="https:\/\/gabbamedicalcentre\.com\.au\/updates\/[^"]+"/gi,
    `href="https://gabbamedicalcentre.com.au/${pagePath}"`,
  );
  html = html.replace(
    /content="https:\/\/gabbamedicalcentre\.com\.au\/updates\/[^"]+"/gi,
    `content="https://gabbamedicalcentre.com.au/${pagePath}"`,
  );
  // Point hero image at welcome artwork (not practitioner portrait).
  const imageWeb = `../assets/updates/${update.image}.webp`;
  html = html.replace(
    /<figure class="update-article-image"><img[^>]*><\/figure>/i,
    `<figure class="update-article-image"><img alt="${escapeHtml(update.imageAlt || update.title)}" decoding="async" loading="eager" src="${imageWeb}"/></figure>`,
  );
  html = html.replace(
    /<h1>[\s\S]*?<\/h1>/i,
    `<h1>${escapeHtml(update.title)}</h1>`,
  );
  html = html.replace(
    /(<li><span aria-current="page">)([^<]*)(<\/span><\/li>)/i,
    `$1${escapeHtml(update.title)}$3`,
  );
  html = html.replace(
    /<p class="update-article-summary">[\s\S]*?<\/p>/i,
    `<p class="update-article-summary">${escapeHtml(update.summary)}</p>`,
  );
  html = html.replace(
    /<div class="health-update-meta"><span>[\s\S]*?<\/span><time[^>]*>[\s\S]*?<\/time><\/div>/i,
    `<div class="health-update-meta"><span>${escapeHtml(update.category)}</span><time datetime="${escapeHtml(update.published)}">${escapeHtml(update.dateLabel)}</time></div>`,
  );
  // Minimal body placeholder — updates-ui.js hydrates full sections from PRACTICE_UPDATES.
  html = html.replace(
    /<div class="update-article-body">[\s\S]*?<\/div>/i,
    `<div class="update-article-body"><section class="update-article-section"><h2>Practice update</h2><p>${escapeHtml(update.summary)}</p></section></div>`,
  );
  return html;
}

async function upsertUpdate(clinicId, update, seo, template) {
  const pagePath = `updates/${update.id}.html`;
  const html = buildUpdateShell(template, update, seo);
  const contentSha256 = fingerprintContent(html);
  const body = {
    source: "practice_update_publish",
    updateId: update.id,
    featured: Boolean(update.featured),
    tags: update.tags || [],
    publishedAt: update.published,
  };

  const page = await prisma.page.upsert({
    where: { clinicId_path: { clinicId, path: pagePath } },
    create: {
      clinicId,
      path: pagePath,
      template: "update",
      collection: "update",
      indexable: true,
      title: seo.metaTitle,
      description: seo.metaDescription,
      canonicalPath: pagePath,
      robots: "index,follow,max-image-preview:large",
      openGraph: {
        title: seo.metaTitle,
        description: seo.metaDescription,
        type: "article",
        image: `assets/updates/${update.image}.webp`,
      },
      breadcrumb: [
        { label: "Home", path: "index.html" },
        { label: "Updates", path: "updates/index.html" },
        { label: update.title, path: pagePath },
      ],
      status: "published",
    },
    update: {
      title: seo.metaTitle,
      description: seo.metaDescription,
      status: "published",
      breadcrumb: [
        { label: "Home", path: "index.html" },
        { label: "Updates", path: "updates/index.html" },
        { label: update.title, path: pagePath },
      ],
      openGraph: {
        title: seo.metaTitle,
        description: seo.metaDescription,
        type: "article",
        image: `assets/updates/${update.image}.webp`,
      },
    },
  });

  let revision = await prisma.pageRevision.findFirst({
    where: { pageId: page.id, contentSha256, immutable: true },
  });
  if (!revision) {
    revision = await prisma.pageRevision.create({
      data: { pageId: page.id, html, body, contentSha256, immutable: true },
    });
  }
  if (page.publishedRevisionId !== revision.id) {
    await prisma.page.update({
      where: { id: page.id },
      data: { publishedRevisionId: revision.id, status: "published" },
    });
  }

  await prisma.navigationOwnership.upsert({
    where: { pageId: page.id },
    update: {
      sectionKey: "updates",
      isHub: false,
      breadcrumb: [
        { label: "Home", path: "/" },
        { label: "Updates", path: "updates/index.html" },
        { label: update.title, path: pagePath },
      ],
    },
    create: {
      pageId: page.id,
      sectionKey: "updates",
      isHub: false,
      breadcrumb: [
        { label: "Home", path: "/" },
        { label: "Updates", path: "updates/index.html" },
        { label: update.title, path: pagePath },
      ],
    },
  });

  const publishedPayload = {
    title: update.title,
    summary: update.summary,
    author: update.author || "Practice Team",
    sourceAuthor: "Practice Team",
    featured: true,
    tags: update.tags || [],
    metaTitle: seo.metaTitle,
    metaDescription: seo.metaDescription,
    imagePath: update.image,
    imageAlt: update.imageAlt,
    category: update.category,
  };

  const row = await prisma.practiceUpdate.upsert({
    where: { clinicId_slug: { clinicId, slug: update.id } },
    create: {
      clinicId,
      pageId: page.id,
      slug: update.id,
      title: update.title,
      category: categoryEnum(update.category),
      summary: update.summary,
      imagePath: update.image,
      imageAlt: update.imageAlt,
      author: update.author || "Practice Team",
      sections: update.sections,
      audience: "patients",
      publishedPayload,
      status: "published",
      reviewStatus: "approved",
      publishedAt: new Date(update.published),
    },
    update: {
      pageId: page.id,
      title: update.title,
      category: categoryEnum(update.category),
      summary: update.summary,
      imagePath: update.image,
      imageAlt: update.imageAlt,
      author: update.author || "Practice Team",
      sections: update.sections,
      audience: "patients",
      publishedPayload,
      status: "published",
      reviewStatus: "approved",
      publishedAt: new Date(update.published),
    },
  });

  return { pagePath, updateId: row.id, featured: true };
}

async function main() {
  const clinic = await prisma.clinic.findFirst({ where: { slug: "woolloongabba" } });
  if (!clinic) throw new Error("woolloongabba clinic missing");
  const template = await readFile(templatePath, "utf8");
  const practiceUpdates = loadPracticeUpdates();
  const report = [];

  for (const seo of UPDATES) {
    const update = practiceUpdates.find((item) => item.id === seo.id);
    if (!update) throw new Error(`Missing updates-data entry for ${seo.id}`);
    const result = await upsertUpdate(clinic.id, update, seo, template);
    report.push({
      ...result,
      title: update.title,
      tags: update.tags,
      image: `assets/updates/${update.image}.webp`,
      urls: {
        local: `http://127.0.0.1:3000/${result.pagePath}`,
        next: `https://next.gabbamedicalcentre.com.au/${result.pagePath}`,
      },
    });
    console.log(`Published ${update.title} → ${result.pagePath}`);
  }

  await writeFile(
    path.join(webRoot, "scripts", "_doctor-welcome-updates-report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
