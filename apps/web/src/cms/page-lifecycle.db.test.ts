/**
 * Disposable-DB integration for page unpublish → 404 → restore → 200.
 * Skips unless WMC_P0_TEST_DATABASE_URL is set (never uses staging/production).
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, before, describe, it } from "node:test";

const databaseUrl = process.env.WMC_P0_TEST_DATABASE_URL?.trim();

describe("page lifecycle DB integration", { skip: !databaseUrl }, () => {
  let prisma: import("@prisma/client").PrismaClient;
  let clinicId = "";
  let pageId = "";
  let actorId = "";

  before(async () => {
    process.env.DATABASE_URL = databaseUrl;
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
    const network = await prisma.network.create({
      data: {
        name: `p0-net-${Date.now()}`,
        positioning: "Disposable P0 test network",
      },
    });
    const clinic = await prisma.clinic.create({
      data: {
        networkId: network.id,
        slug: `p0-clinic-${Date.now()}`,
        practiceName: "P0 Test Clinic",
        status: "draft",
      },
    });
    clinicId = clinic.id;
    const user = await prisma.user.create({
      data: { email: `p0-${Date.now()}@example.test`, name: "P0 Publisher" },
    });
    actorId = user.id;
    const page = await prisma.page.create({
      data: {
        clinicId,
        path: "p0-lifecycle.html",
        template: "practice_page",
        title: "P0 Lifecycle",
        description: "Disposable page for unpublish restore tests.",
        canonicalPath: "p0-lifecycle.html",
        status: "published",
        indexable: true,
      },
    });
    pageId = page.id;
    const html = "<html><head><title>P0</title></head><body><h1>P0</h1></body></html>";
    const revision = await prisma.pageRevision.create({
      data: {
        pageId,
        html,
        body: { source: "p0-test" },
        contentSha256: createHash("sha256").update(html).digest("hex"),
        immutable: true,
        authorId: actorId,
      },
    });
    await prisma.page.update({
      where: { id: pageId },
      data: { publishedRevisionId: revision.id },
    });
  });

  after(async () => {
    if (!prisma) return;
    await prisma.pageRevision.deleteMany({ where: { pageId } }).catch(() => undefined);
    await prisma.page.deleteMany({ where: { id: pageId } }).catch(() => undefined);
    await prisma.auditLog.deleteMany({ where: { clinicId } }).catch(() => undefined);
    await prisma.user.deleteMany({ where: { id: actorId } }).catch(() => undefined);
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (clinic) {
      await prisma.clinic.delete({ where: { id: clinicId } }).catch(() => undefined);
      await prisma.network.delete({ where: { id: clinic.networkId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  it("unpublishes to stop public serve then restores through publish gate", async () => {
    const { getPublishedDocument } = await import("@/documents/render-published-document");
    const { unpublishPage, restorePublishedPage } = await import("@/cms/page-lifecycle");
    const { listIndexableUrls } = await import("@/seo/sitemap");

    const live = await getPublishedDocument(clinicId, "p0-lifecycle.html");
    assert.ok(live);
    assert.match(live.html, /P0 Lifecycle|P0/);

    const unpublished = await unpublishPage({ clinicId, pageId, actorId });
    assert.equal(unpublished.ok, true);
    assert.equal(await getPublishedDocument(clinicId, "p0-lifecycle.html"), null);
    const urlsAfter = await listIndexableUrls(clinicId, "https://example.test");
    assert.equal(urlsAfter.some((url) => url.includes("p0-lifecycle.html")), false);

    const restored = await restorePublishedPage({ clinicId, pageId, actorId });
    assert.equal(restored.ok, true);
    const again = await getPublishedDocument(clinicId, "p0-lifecycle.html");
    assert.ok(again);
    assert.match(again.html, /<title>P0 Lifecycle<\/title>/);
  });
});
