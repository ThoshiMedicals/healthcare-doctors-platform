/**
 * Seeds disposable wmc_p0_test with clinic, published page, and five role accounts.
 * Credentials written only to gitignored .data/p0-acceptance-credentials.json
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const databaseUrl =
  process.env.WMC_P0_TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://wmc:wmc@localhost:5432/wmc_p0_test?schema=public";

if (/supabase|thwcxuhrzgkufvdrvzzt|hostinger/i.test(databaseUrl)) {
  console.error("Refusing to seed against staging/production.");
  process.exit(1);
}

process.env.DATABASE_URL = databaseUrl;
const prisma = new PrismaClient();

function mintPassword() {
  return `P0-${randomBytes(18).toString("base64url")}!aA1`;
}

async function upsertUser(username, name, password) {
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.upsert({
    where: { username },
    update: { name, passwordHash, disabledAt: null },
    create: {
      username,
      name,
      email: `${username}@p0.local.test`,
      passwordHash,
    },
  });
}

async function ensureMembership(userId, clinicId, role) {
  const existing = await prisma.clinicMembership.findFirst({ where: { userId, clinicId } });
  if (existing) {
    return prisma.clinicMembership.update({ where: { id: existing.id }, data: { role } });
  }
  return prisma.clinicMembership.create({ data: { userId, clinicId, role } });
}

async function main() {
  const network = await prisma.network.upsert({
    where: { id: "p0_acceptance_network" },
    update: { name: "P0 Acceptance Network", positioning: "Disposable acceptance network" },
    create: {
      id: "p0_acceptance_network",
      name: "P0 Acceptance Network",
      positioning: "Disposable acceptance network",
    },
  });

  const clinic = await prisma.clinic.upsert({
    where: { slug: "woolloongabba" },
    update: {
      practiceName: "Woolloongabba Medical Centre",
      status: "live",
      networkId: network.id,
      publicCacheEpoch: 0,
    },
    create: {
      networkId: network.id,
      slug: "woolloongabba",
      practiceName: "Woolloongabba Medical Centre",
      status: "live",
    },
  });

  await prisma.clinicProfile.upsert({
    where: { clinicId: clinic.id },
    update: {},
    create: {
      clinicId: clinic.id,
      phoneDisplay: "(07) 3217 3344",
      phoneTel: "+61732173344",
      email: "reception@example.test",
      streetAddress: "1 Test St",
      suburb: "Woolloongabba",
      state: "QLD",
      postcode: "4102",
      canonicalBaseUrl: "https://gabbamedicalcentre.com.au",
    },
  });

  const html =
    `<!doctype html><html lang="en"><head>` +
    `<title>P0 Acceptance Page</title>` +
    `<meta name="description" content="Original description for acceptance.">` +
    `<link rel="canonical" href="/p0-acceptance.html">` +
    `<meta name="robots" content="index,follow">` +
    `</head><body><main><h1>P0 Acceptance Page</h1><p>Body content.</p></main></body></html>`;

  const page = await prisma.page.upsert({
    where: { clinicId_path: { clinicId: clinic.id, path: "p0-acceptance.html" } },
    update: {
      title: "P0 Acceptance Page",
      description: "Original description for acceptance.",
      canonicalPath: "p0-acceptance.html",
      robots: "index,follow",
      indexable: true,
      status: "published",
      seoDraft: null,
      template: "practice_page",
    },
    create: {
      clinicId: clinic.id,
      path: "p0-acceptance.html",
      template: "practice_page",
      title: "P0 Acceptance Page",
      description: "Original description for acceptance.",
      canonicalPath: "p0-acceptance.html",
      robots: "index,follow",
      indexable: true,
      status: "published",
    },
  });

  let revision = await prisma.pageRevision.findFirst({
    where: { pageId: page.id, immutable: true },
    orderBy: { createdAt: "desc" },
  });
  if (!revision) {
    revision = await prisma.pageRevision.create({
      data: {
        pageId: page.id,
        html,
        body: { source: "p0-acceptance" },
        contentSha256: createHash("sha256").update(html).digest("hex"),
        immutable: true,
      },
    });
  } else {
    revision = await prisma.pageRevision.update({
      where: { id: revision.id },
      data: { html, immutable: true },
    });
  }
  await prisma.page.update({
    where: { id: page.id },
    data: { publishedRevisionId: revision.id, status: "published" },
  });

  const notFoundHtml =
    `<!doctype html><html><head><title>Not found</title></head><body><h1>Not found</h1></body></html>`;
  const nf = await prisma.page.upsert({
    where: { clinicId_path: { clinicId: clinic.id, path: "404.html" } },
    update: { status: "published", title: "Not found", description: "Not found", canonicalPath: "404.html" },
    create: {
      clinicId: clinic.id,
      path: "404.html",
      template: "not_found",
      title: "Not found",
      description: "Not found",
      canonicalPath: "404.html",
      status: "published",
      indexable: false,
      robots: "noindex,follow",
    },
  });
  let nfRev = await prisma.pageRevision.findFirst({ where: { pageId: nf.id, immutable: true } });
  if (!nfRev) {
    nfRev = await prisma.pageRevision.create({
      data: {
        pageId: nf.id,
        html: notFoundHtml,
        body: { source: "p0-404" },
        contentSha256: createHash("sha256").update(notFoundHtml).digest("hex"),
        immutable: true,
      },
    });
  }
  await prisma.page.update({ where: { id: nf.id }, data: { publishedRevisionId: nfRev.id, status: "published" } });

  // Second clinic for cross-tenant preview denial
  const otherClinic = await prisma.clinic.upsert({
    where: { slug: "p0-other-clinic" },
    update: { practiceName: "P0 Other Clinic", status: "draft", networkId: network.id },
    create: {
      networkId: network.id,
      slug: "p0-other-clinic",
      practiceName: "P0 Other Clinic",
      status: "draft",
    },
  });
  const otherPage = await prisma.page.upsert({
    where: { clinicId_path: { clinicId: otherClinic.id, path: "other-secret.html" } },
    update: { title: "Other clinic secret", status: "published" },
    create: {
      clinicId: otherClinic.id,
      path: "other-secret.html",
      template: "practice_page",
      title: "Other clinic secret",
      description: "Should not leak",
      canonicalPath: "other-secret.html",
      status: "published",
    },
  });

  const roles = [
    { key: "clinic_admin", username: "p0_clinic_admin", role: "clinic_admin", name: "P0 Clinic Admin" },
    { key: "clinical_reviewer", username: "p0_clinical_reviewer", role: "clinical_reviewer", name: "P0 Clinical Reviewer" },
    { key: "practice_approver", username: "p0_practice_approver", role: "practice_approver", name: "P0 Practice Approver" },
    { key: "publisher", username: "p0_publisher", role: "publisher", name: "P0 Publisher" },
    { key: "restricted", username: "p0_restricted", role: "content_editor", name: "P0 Restricted Editor" },
  ];

  const accounts = {};
  for (const row of roles) {
    const password = mintPassword();
    const user = await upsertUser(row.username, row.name, password);
    await ensureMembership(user.id, clinic.id, row.role);
    accounts[row.key] = { username: row.username, password, userId: user.id, role: row.role };
  }

  const outDir = path.join(process.cwd(), ".data");
  mkdirSync(outDir, { recursive: true });
  const credPath = path.join(outDir, "p0-acceptance-credentials.json");
  writeFileSync(
    credPath,
    JSON.stringify(
      {
        databaseUrlHint: "wmc_p0_test",
        clinicId: clinic.id,
        clinicSlug: clinic.slug,
        pageId: page.id,
        pagePath: page.path,
        revisionId: revision.id,
        otherClinicId: otherClinic.id,
        otherPageId: otherPage.id,
        accounts,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );

  console.log(
    JSON.stringify({
      ok: true,
      clinicId: clinic.id,
      pageId: page.id,
      pagePath: page.path,
      accounts: Object.keys(accounts),
      credentialsFile: ".data/p0-acceptance-credentials.json",
    }),
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
