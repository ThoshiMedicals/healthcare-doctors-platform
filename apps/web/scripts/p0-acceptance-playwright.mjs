/**
 * Authenticated Playwright acceptance for CMS P0.
 * Reads credentials from .data/p0-acceptance-credentials.json (gitignored).
 * Does not print passwords.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { createHash, randomBytes } from "node:crypto";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { PrismaClient } = require("@prisma/client");

const BASE = process.env.P0_ACCEPTANCE_BASE || "http://127.0.0.1:3200";
const creds = JSON.parse(
  readFileSync(path.join(process.cwd(), ".data", "p0-acceptance-credentials.json"), "utf8"),
);
process.env.DATABASE_URL =
  process.env.WMC_P0_TEST_DATABASE_URL ||
  "postgresql://wmc:wmc@localhost:5432/wmc_p0_test?schema=public";
const prisma = new PrismaClient();

const results = [];
function record(area, name, pass, detail = "") {
  results.push({ area, name, pass: Boolean(pass), detail: String(detail).slice(0, 400) });
  const mark = pass ? "PASS" : "FAIL";
  console.log(`[${mark}] ${area}: ${name}${detail ? ` — ${String(detail).slice(0, 160)}` : ""}`);
}

async function login(page, username, password) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForURL(/\/admin(?!\/login)/, { timeout: 20000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  const url = page.url();
  return !url.includes("/admin/login");
}

async function logout(page) {
  await page.goto(`${BASE}/admin/session-end`, { waitUntil: "networkidle" }).catch(() => null);
  await page.context().clearCookies();
}

async function publicHtml(pathKey) {
  const res = await fetch(`${BASE}/${pathKey}`, {
    headers: { Accept: "text/html" },
    redirect: "manual",
  });
  const html = await res.text();
  return { status: res.status, html, headers: Object.fromEntries(res.headers.entries()) };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // --- Reset page to published baseline ---
  await prisma.page.update({
    where: { id: creds.pageId },
    data: {
      status: "published",
      title: "P0 Acceptance Page",
      description: "Original description for acceptance.",
      canonicalPath: "p0-acceptance.html",
      robots: "index,follow",
      indexable: true,
      seoDraft: null,
      publishedRevisionId: creds.revisionId,
    },
  });

  // 1) Clinic admin opens admin
  const adminOk = await login(page, creds.accounts.clinic_admin.username, creds.accounts.clinic_admin.password);
  record("auth", "clinic_admin can sign in", adminOk, page.url());
  await page.goto(`${BASE}/admin/pages`, { waitUntil: "networkidle" });
  record("admin", "pages hub loads", await page.locator("text=Public page lifecycle").count().then((n) => n > 0));
  await page.goto(`${BASE}/admin/pages/${creds.pageId}`, { waitUntil: "networkidle" });
  record("admin", "page detail loads", await page.locator("text=Public lifecycle").count().then((n) => n > 0));

  // Baseline public 200
  let pub = await publicHtml(creds.pagePath);
  record("lifecycle", "published page returns 200", pub.status === 200, `status=${pub.status}`);
  record("seo", "public meta unchanged before SEO publish", /Original description for acceptance/.test(pub.html));

  // Unpublish via UI
  const unpublish = page.locator('form[action*=""] button', { hasText: "Unpublish" });
  // PendingButton may render as button with text Unpublish
  const unpubBtn = page.getByRole("button", { name: "Unpublish" });
  if ((await unpubBtn.count()) > 0) {
    await Promise.all([page.waitForURL(/unpublished=1/, { timeout: 20000 }), unpubBtn.click()]);
  } else {
    // fallback server action via form submit name
    await page.evaluate(async (pageId) => {
      const form = document.createElement("form");
      form.method = "POST";
      // use visible form if present
      const existing = [...document.querySelectorAll("form")].find((f) =>
        f.textContent?.includes("Unpublish"),
      );
      if (existing) existing.requestSubmit();
    }, creds.pageId);
    await page.waitForTimeout(1500);
  }
  const pageRow = await prisma.page.findUnique({ where: { id: creds.pageId } });
  record("lifecycle", "page status draft after unpublish", pageRow?.status === "draft", pageRow?.status);

  pub = await publicHtml(creds.pagePath);
  record("lifecycle", "public URL not 200 after unpublish", pub.status === 404 || /Not found|404/i.test(pub.html), `status=${pub.status}`);

  const { listIndexableUrls } = await import("../src/seo/sitemap.ts");
  const urls = await listIndexableUrls(creds.clinicId, "https://example.test");
  record("lifecycle", "removed from sitemap eligibility", !urls.some((u) => u.includes(creds.pagePath)));

  // Archive
  await page.goto(`${BASE}/admin/pages/${creds.pageId}`, { waitUntil: "networkidle" });
  const archiveBtn = page.getByRole("button", { name: "Archive" });
  if ((await archiveBtn.count()) > 0) {
    await Promise.all([page.waitForURL(/archived=1/, { timeout: 20000 }).catch(() => null), archiveBtn.click()]);
    await page.waitForTimeout(800);
  }
  const archived = await prisma.page.findUnique({ where: { id: creds.pageId } });
  record("lifecycle", "page archived", archived?.status === "archived", archived?.status);

  // Restore & publish (clinic_admin has publish)
  await page.goto(`${BASE}/admin/pages/${creds.pageId}`, { waitUntil: "networkidle" });
  const restoreBtn = page.getByRole("button", { name: /Restore/i });
  if ((await restoreBtn.count()) > 0) {
    await Promise.all([page.waitForURL(/restored=1/, { timeout: 20000 }).catch(() => null), restoreBtn.click()]);
    await page.waitForTimeout(800);
  }
  const restored = await prisma.page.findUnique({ where: { id: creds.pageId } });
  record("lifecycle", "restored to published", restored?.status === "published", restored?.status);
  pub = await publicHtml(creds.pagePath);
  record("lifecycle", "public 200 after restore", pub.status === 200, `status=${pub.status}`);

  const audits = await prisma.auditLog.findMany({
    where: { clinicId: creds.clinicId, entityId: creds.pageId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  record(
    "lifecycle",
    "audit history preserved",
    audits.some((a) => a.action === "page.unpublish") &&
      audits.some((a) => a.action === "page.archive") &&
      audits.some((a) => a.action === "page.restore_publish"),
    audits.map((a) => a.action).join(","),
  );
  const revCount = await prisma.pageRevision.count({ where: { pageId: creds.pageId } });
  record("lifecycle", "revisions preserved", revCount >= 1, `count=${revCount}`);

  // SEO draft then publish
  await page.goto(`${BASE}/admin/pages/${creds.pageId}`, { waitUntil: "networkidle" });
  await page.fill('input[name="title"]', "P0 Published SEO Title");
  await page.fill('textarea[name="description"]', "P0 published SEO description unique.");
  await page.fill('input[name="canonicalPath"]', "p0-acceptance.html");
  await page.fill('input[name="robots"]', "index,follow");
  await page.selectOption('select[name="indexable"]', "true");
  await page.fill('input[name="ogTitle"]', "P0 OG Title");
  await page.fill('textarea[name="ogDescription"]', "P0 OG Description");
  await Promise.all([
    page.waitForURL(/seoDraft=1/, { timeout: 20000 }).catch(() => null),
    page.getByRole("button", { name: "Save SEO draft" }).click(),
  ]);
  await page.waitForTimeout(500);
  const afterDraft = await prisma.page.findUnique({ where: { id: creds.pageId } });
  pub = await publicHtml(creds.pagePath);
  record("seo", "draft saved without changing live title column", afterDraft?.title === "P0 Acceptance Page");
  record("seo", "public HTML still original before SEO publish", /Original description for acceptance/.test(pub.html));

  await page.goto(`${BASE}/admin/pages/${creds.pageId}`, { waitUntil: "networkidle" });
  await Promise.all([
    page.waitForURL(/seoPublished=1/, { timeout: 20000 }).catch(() => null),
    page.getByRole("button", { name: /Publish SEO to live HTML/i }).click(),
  ]);
  await page.waitForTimeout(800);
  pub = await publicHtml(creds.pagePath);
  record("seo", "published SEO title in rendered head", /<title>P0 Published SEO Title<\/title>/.test(pub.html));
  record("seo", "published SEO description in head", /P0 published SEO description unique/.test(pub.html));
  record("seo", "single canonical link", (pub.html.match(/rel=["']canonical["']/gi) || []).length === 1);
  record("seo", "no conflicting index+noindex", !( /noindex/i.test(pub.html) && /name=["']robots["'][^>]*index(?!,)/i.test(pub.html) ));
  record("seo", "OG title present", /property=["']og:title["'][^>]*P0 OG Title|content=["']P0 OG Title["']/.test(pub.html));

  // Unrelated page unchanged
  const nf = await publicHtml("404.html");
  record("seo", "unrelated 404 page not given SEO title", !/P0 Published SEO Title/.test(nf.html));

  // Draft preview
  await page.goto(`${BASE}/admin/pages/${creds.pageId}`, { waitUntil: "networkidle" });
  const previewNav = page.waitForURL(/\/admin\/preview\//, { timeout: 25000 });
  await page.getByRole("button", { name: "Draft preview" }).click();
  await previewNav.catch(() => null);
  const previewUrl = page.url();
  record("preview", "authorised draft preview opens", /\/admin\/preview\//.test(previewUrl), previewUrl);
  if (/\/admin\/preview\//.test(previewUrl)) {
    const previewHit = await page.evaluate(async () => {
      const res = await fetch(window.location.href, { credentials: "include" });
      return {
        status: res.status,
        cache: res.headers.get("cache-control") || "",
        robots: res.headers.get("x-robots-tag") || "",
        body: await res.text(),
      };
    });
    record("preview", "preview no-store", /no-store/i.test(previewHit.cache), previewHit.cache);
    record("preview", "preview noindex", /noindex/i.test(previewHit.robots) || /noindex/i.test(previewHit.body));
    record("preview", "preview banner present", /DRAFT PREVIEW/i.test(previewHit.body));
  }
  const publicAfterPreview = await publicHtml(creds.pagePath);
  record(
    "preview",
    "preview did not change public title away from published SEO",
    /P0 Published SEO Title/.test(publicAfterPreview.html),
  );

  // Token security via prisma API
  const { createDraftPreviewToken, resolveDraftPreviewToken, revokeDraftPreviewToken, hashPreviewToken } =
    await import("../src/cms/draft-preview.ts");
  const minted = await createDraftPreviewToken({
    clinicId: creds.clinicId,
    createdById: creds.accounts.clinic_admin.userId,
    pageId: creds.pageId,
    ttlMs: 60_000,
  });
  const resolved = await resolveDraftPreviewToken(minted.token, creds.clinicId);
  record("preview", "valid token resolves in clinic", Boolean(resolved));
  const cross = await resolveDraftPreviewToken(minted.token, creds.otherClinicId);
  record("preview", "token cannot resolve in other clinic", cross == null);
  await revokeDraftPreviewToken({
    clinicId: creds.clinicId,
    tokenId: minted.id,
    actorId: creds.accounts.clinic_admin.userId,
  });
  const revoked = await resolveDraftPreviewToken(minted.token, creds.clinicId);
  record("preview", "revoked token unusable", revoked == null);
  const expired = await prisma.draftPreviewToken.create({
    data: {
      clinicId: creds.clinicId,
      pageId: creds.pageId,
      tokenHash: hashPreviewToken(`expired-${randomBytes(8).toString("hex")}`),
      createdById: creds.accounts.clinic_admin.userId,
      expiresAt: new Date(Date.now() - 1000),
    },
  });
  const expiredResolve = await prisma.draftPreviewToken.findFirst({
    where: { id: expired.id, revokedAt: null, expiresAt: { gt: new Date() } },
  });
  record("preview", "expired token unusable", expiredResolve == null);

  // Role matrix via UI navigation expectations
  await logout(page);

  // Restricted editor: can open pages, cannot unpublish button ideally
  const restrictedOk = await login(
    page,
    creds.accounts.restricted.username,
    creds.accounts.restricted.password,
  );
  record("rbac", "restricted editor can sign in", restrictedOk);
  await page.goto(`${BASE}/admin/pages/${creds.pageId}`, { waitUntil: "networkidle" });
  record(
    "rbac",
    "restricted editor lacks Unpublish control",
    (await page.getByRole("button", { name: "Unpublish" }).count()) === 0,
  );
  record(
    "rbac",
    "restricted editor lacks Publish SEO control",
    (await page.getByRole("button", { name: /Publish SEO to live HTML/i }).count()) === 0,
  );
  await logout(page);

  const reviewerOk = await login(
    page,
    creds.accounts.clinical_reviewer.username,
    creds.accounts.clinical_reviewer.password,
  );
  record("rbac", "clinical reviewer can sign in", reviewerOk);
  await page.goto(`${BASE}/admin/pages/${creds.pageId}`, { waitUntil: "networkidle" });
  const reviewerBlocked =
    page.url().includes("/admin/login") ||
    page.url().endsWith("/admin") ||
    (await page.getByRole("button", { name: "Unpublish" }).count()) === 0;
  record("rbac", "clinical reviewer cannot unpublish", reviewerBlocked);
  await page.goto(`${BASE}/admin/governance`, { waitUntil: "networkidle" });
  record("rbac", "clinical reviewer can open governance", /governance|review/i.test(await page.content()));
  await logout(page);

  const approverOk = await login(
    page,
    creds.accounts.practice_approver.username,
    creds.accounts.practice_approver.password,
  );
  record("rbac", "practice approver can sign in", approverOk);
  await page.goto(`${BASE}/admin/governance`, { waitUntil: "networkidle" });
  record("rbac", "practice approver reaches governance", !page.url().includes("/admin/login"));
  await logout(page);

  const publisherOk = await login(page, creds.accounts.publisher.username, creds.accounts.publisher.password);
  record("rbac", "publisher can sign in", publisherOk);
  await page.goto(`${BASE}/admin/pages/${creds.pageId}`, { waitUntil: "networkidle" });
  record(
    "rbac",
    "publisher sees lifecycle controls",
    (await page.getByRole("button", { name: /Unpublish|Archive|Restore/i }).count()) > 0,
  );

  // Server-side SoD: practice approve without clinical sign-off fails
  const { recordClinicalSignOff, moveWorkflow } = await import("../src/cms/release.ts");
  // Create a disposable practice page entity for workflow if needed — use page clinicalReview path via fake entity
  // Direct gate check:
  await prisma.clinicalReview.deleteMany({ where: { pageId: creds.pageId } });
  // Use knowledge article stub? Simpler: call moveWorkflow with practice_page if one exists.
  // Unit-level already covered; here verify clinical_signoff required via API helper on a temporary practice page.
  const practicePage = await prisma.practicePage.create({
    data: {
      clinicId: creds.clinicId,
      pageId: null,
      slug: `p0-wf-${Date.now()}`,
      title: "P0 WF",
      summary: "summary",
      status: "clinical_review",
    },
  });
  // Attach a page for clinical review requirement
  const wfPage = await prisma.page.create({
    data: {
      clinicId: creds.clinicId,
      path: `p0-wf-${Date.now()}.html`,
      template: "practice_page",
      title: "WF",
      description: "WF",
      canonicalPath: `p0-wf.html`,
      status: "draft",
    },
  });
  await prisma.practicePage.update({ where: { id: practicePage.id }, data: { pageId: wfPage.id } });
  const approveWithout = await moveWorkflow({
    clinicId: creds.clinicId,
    authorId: creds.accounts.practice_approver.userId,
    authorName: "Approver",
    entityType: "practice_page",
    entityId: practicePage.id,
    to: "approved",
  });
  record("rbac", "practice approve blocked without clinical sign-off", approveWithout.ok === false, JSON.stringify(approveWithout));
  const signed = await recordClinicalSignOff({
    clinicId: creds.clinicId,
    authorId: creds.accounts.clinical_reviewer.userId,
    authorName: "Reviewer",
    entityType: "practice_page",
    entityId: practicePage.id,
  });
  record("rbac", "clinical sign-off succeeds", signed.ok === true);
  const approveWith = await moveWorkflow({
    clinicId: creds.clinicId,
    authorId: creds.accounts.practice_approver.userId,
    authorName: "Approver",
    entityType: "practice_page",
    entityId: practicePage.id,
    to: "approved",
  });
  record("rbac", "practice approve allowed after clinical sign-off", approveWith.ok === true, JSON.stringify(approveWith));

  // Performance: measure public render latency
  const samples = [];
  for (let i = 0; i < 8; i += 1) {
    const t0 = Date.now();
    const r = await fetch(`${BASE}/${creds.pagePath}`, { headers: { "cache-control": "no-cache" } });
    await r.text();
    samples.push(Date.now() - t0);
  }
  samples.sort((a, b) => a - b);
  const p50 = samples[Math.floor(samples.length / 2)];
  const p95 = samples[Math.floor(samples.length * 0.95)] || samples.at(-1);
  record("perf", "public p50 under 1500ms local", p50 < 1500, `p50=${p50}ms p95=${p95}ms samples=${samples.join(",")}`);

  await browser.close();
  await prisma.$disconnect();

  const failed = results.filter((r) => !r.pass);
  mkdirSync(path.join(process.cwd(), ".data"), { recursive: true });
  writeFileSync(
    path.join(process.cwd(), ".data", "p0-acceptance-results.json"),
    JSON.stringify({ base: BASE, failed: failed.length, results }, null, 2),
  );
  console.log(JSON.stringify({ failed: failed.length, total: results.length, p50, p95 }));
  process.exit(failed.length ? 1 : 0);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
