/**
 * Remove Dr Gemunu Suresh Ranawake from golden HTML, search indexes, assets, and CMS DB.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webRoot = path.join(repoRoot, "apps", "web");
const require = createRequire(path.join(webRoot, "package.json"));
const { PrismaClient } = require("@prisma/client");

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv(path.join(webRoot, ".env"));
const SLUG = "dr-gemunu-suresh-ranawake";
const PROFILE_PATH = `doctors/${SLUG}.html`;
const NAME = "Dr Gemunu Suresh Ranawake";
const NAME_SHORT = "Gemunu Suresh Ranawake";
const TOKEN = /ranawake|gemunu/i;

const report = {
  deletedFiles: [],
  updatedFiles: [],
  skippedFiles: [],
  db: null,
  remainingHits: [],
};

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", ".next", ".next-uat", "dist"].includes(entry.name)) continue;
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

function removeHomepageArticle(html) {
  return html.replace(
    /<article class="practitioner practitioner-dr-gemunu-suresh-ranawake">[\s\S]*?<\/article>\s*/g,
    "",
  );
}

function removeGpDiscoveryCard(html) {
  // Remove <li>…</li> that contains the profile href
  return html.replace(
    /<li class="team-authority-person gp-discovery-card">[\s\S]*?dr-gemunu-suresh-ranawake\.html[\s\S]*?<\/li>/g,
    "",
  );
}

function removeTeamAuthorityBlocks(html) {
  // team.html may use different card markup — strip any list item containing the profile
  let next = html.replace(
    /<li[^>]*>[\s\S]*?dr-gemunu-suresh-ranawake\.html[\s\S]*?<\/li>/g,
    "",
  );
  // Anchors / cards without li wrapper
  next = next.replace(
    /<a[^>]*href="[^"]*dr-gemunu-suresh-ranawake\.html"[^>]*>[\s\S]*?<\/a>/g,
    "",
  );
  // Schema.org Physician entries mentioning him (best-effort)
  next = next.replace(
    /\{"@type":"Physician"[^}]*Ranawake[^}]*\},?/g,
    "",
  );
  next = next.replace(/,\s*]/g, "}");
  next = next.replace(/\[\s*,/g, "[");
  next = next.replace(/,\s*\]/g, "]");
  return next;
}

function scrubHtmlGeneric(html) {
  let next = html;
  next = removeHomepageArticle(next);
  next = removeGpDiscoveryCard(next);
  next = removeTeamAuthorityBlocks(next);
  // Related-practitioner / doctor links in services & knowledge
  next = next.replace(
    /<(?:li|div|article|p)[^>]*>[\s\S]*?dr-gemunu-suresh-ranawake\.html[\s\S]*?<\/(?:li|div|article|p)>/g,
    "",
  );
  next = next.replace(
    /<a[^>]*href="[^"]*dr-gemunu-suresh-ranawake\.html"[^>]*>[\s\S]*?<\/a>\s*/g,
    "",
  );
  // Plain-text mentions in FAQs that solely reference him are left if structural; strip common related-doctor chips
  next = next.replace(/\s*,\s*Dr Gemunu Suresh Ranawake/g, "");
  next = next.replace(/Dr Gemunu Suresh Ranawake\s*,\s*/g, "");
  return next;
}

function scrubJsonValue(value) {
  if (Array.isArray(value)) {
    return value
      .map(scrubJsonValue)
      .filter((item) => {
        if (item == null) return false;
        if (typeof item === "string") return !TOKEN.test(item) && !item.includes(PROFILE_PATH);
        if (typeof item === "object") {
          const blob = JSON.stringify(item);
          if (blob.includes(PROFILE_PATH) || TOKEN.test(blob)) {
            // Drop doctor records / peer entries that are about him
            if (
              item.url === PROFILE_PATH ||
              item.path === PROFILE_PATH ||
              item.href === PROFILE_PATH ||
              item.slug === SLUG ||
              item.name === NAME ||
              item.title === NAME ||
              item.h1 === NAME
            ) {
              return false;
            }
          }
        }
        return true;
      });
  }
  if (value && typeof value === "object") {
    // practitioner-peers keyed object
    if (value[PROFILE_PATH]) {
      delete value[PROFILE_PATH];
    }
    if (value.practitioners && typeof value.practitioners === "object" && !Array.isArray(value.practitioners)) {
      delete value.practitioners[PROFILE_PATH];
      for (const [key, row] of Object.entries(value.practitioners)) {
        if (row && Array.isArray(row.peers)) {
          row.peers = row.peers.filter(
            (peer) => peer?.url !== PROFILE_PATH && peer?.name !== NAME,
          );
        }
        value.practitioners[key] = scrubJsonValue(row);
      }
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (TOKEN.test(k) || k.includes(SLUG)) continue;
      out[k] = scrubJsonValue(v);
    }
    // Filter related practitioners arrays of strings
    for (const key of Object.keys(out)) {
      if (Array.isArray(out[key]) && out[key].every((x) => typeof x === "string")) {
        out[key] = out[key].filter((s) => !TOKEN.test(s) && !s.includes(PROFILE_PATH));
      }
    }
    return out;
  }
  if (typeof value === "string") {
    if (value === PROFILE_PATH || value === NAME || value === NAME_SHORT) return null;
    return value;
  }
  return value;
}

function scrubJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  if (!TOKEN.test(raw) && !raw.includes(PROFILE_PATH)) return false;
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    report.skippedFiles.push(`${filePath} (invalid json)`);
    return false;
  }
  const next = scrubJsonValue(data);
  const text = `${JSON.stringify(next, null, 2)}\n`;
  if (text === raw) return false;
  fs.writeFileSync(filePath, text);
  report.updatedFiles.push(filePath);
  return true;
}

function scrubJsEmbeddedJson(filePath) {
  let raw = fs.readFileSync(filePath, "utf8");
  if (!TOKEN.test(raw) && !raw.includes(PROFILE_PATH)) return false;
  // Remove peer/object entries that include the profile path as a key
  const before = raw;
  raw = raw.replace(
    new RegExp(`"${PROFILE_PATH.replace(/\./g, "\\.")}"\\s*:\\s*\\{[\\s\\S]*?\\}(?=,|\\})`, "g"),
    "",
  );
  // Remove array objects whose url/title references him
  raw = raw.replace(
    /\{\s*"url"\s*:\s*"doctors\/dr-gemunu-suresh-ranawake\.html"[\s\S]*?\}\s*,?/g,
    "",
  );
  raw = raw.replace(
    /\{\s*"title"\s*:\s*"Dr Gemunu Suresh Ranawake"[\s\S]*?\}\s*,?/g,
    "",
  );
  raw = raw.replace(
    /\{\s*"name"\s*:\s*"Dr Gemunu Suresh Ranawake"[\s\S]*?\}\s*,?/g,
    "",
  );
  // peer objects referencing him
  raw = raw.replace(
    /\{\s*"url"\s*:\s*"doctors\/dr-gemunu-suresh-ranawake\.html"[\s\S]*?\}\s*,?/g,
    "",
  );
  raw = raw.replace(/,\s*,/g, ",");
  raw = raw.replace(/\{\s*,/g, "{");
  raw = raw.replace(/,\s*\}/g, "}");
  raw = raw.replace(/\[\s*,/g, "[");
  raw = raw.replace(/,\s*\]/g, "]");
  // Strip remaining string mentions of the path inside arrays
  raw = raw.replace(/,?\s*"doctors\/dr-gemunu-suresh-ranawake\.html"/g, "");
  raw = raw.replace(/"doctors\/dr-gemunu-suresh-ranawake\.html"\s*,?/g, "");
  if (raw === before) {
    report.skippedFiles.push(`${filePath} (js pattern miss)`);
    return false;
  }
  fs.writeFileSync(filePath, raw);
  report.updatedFiles.push(filePath);
  return true;
}

function scrubHtmlFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  if (!TOKEN.test(raw) && !raw.includes(PROFILE_PATH)) return false;
  const next = scrubHtmlGeneric(raw);
  if (next === raw) {
    // Force-remove any remaining hrefs even if structure is unusual
    const forced = raw
      .replace(/<a[^>]*dr-gemunu-suresh-ranawake\.html[^>]*>[\s\S]*?<\/a>/gi, "")
      .replace(/practitioner-dr-gemunu-suresh-ranawake/gi, "practitioner-removed");
    if (forced === raw) {
      report.skippedFiles.push(`${filePath} (html unchanged)`);
      return false;
    }
    fs.writeFileSync(filePath, forced);
    report.updatedFiles.push(filePath);
    return true;
  }
  fs.writeFileSync(filePath, next);
  report.updatedFiles.push(filePath);
  return true;
}

function deleteIfExists(filePath) {
  if (!fs.existsSync(filePath)) return;
  fs.unlinkSync(filePath);
  report.deletedFiles.push(filePath);
}

async function archiveInCms() {
  const prisma = new PrismaClient();
  try {
    const pages = await prisma.page.findMany({
      where: { path: { contains: "ranawake" } },
      select: { id: true, path: true, status: true, publishedRevisionId: true },
    });
    const practitioners = await prisma.practitioner.findMany({
      where: {
        OR: [
          { slug: { contains: "ranawake" } },
          { name: { contains: "Ranawake" } },
          { name: { contains: "Gemunu" } },
        ],
      },
      select: { id: true, name: true, status: true, pageId: true, slug: true },
    });

    for (const page of pages) {
      await prisma.page.update({
        where: { id: page.id },
        data: {
          status: "archived",
          publishedRevisionId: null,
          indexable: false,
          robots: "noindex,nofollow",
        },
      });
    }

    for (const row of practitioners) {
      await prisma.practitioner.update({
        where: { id: row.id },
        data: {
          status: "on_hold",
          publishedPayload: null,
          bookingUrl: null,
        },
      });
    }

    // Scrub published HTML on every other page that still links to him
    const revisions = await prisma.pageRevision.findMany({
      where: {
        OR: [
          { html: { contains: "ranawake" } },
          { html: { contains: "Ranawake" } },
          { html: { contains: "Gemunu" } },
          { html: { contains: PROFILE_PATH } },
        ],
      },
      select: { id: true, pageId: true, html: true },
    });
    let scrubbedRevisions = 0;
    for (const rev of revisions) {
      const page = await prisma.page.findUnique({
        where: { id: rev.pageId },
        select: { path: true },
      });
      if (page?.path?.includes("ranawake")) continue;
      const next = scrubHtmlGeneric(rev.html);
      if (next === rev.html) continue;
      await prisma.pageRevision.update({
        where: { id: rev.id },
        data: { html: next },
      });
      scrubbedRevisions += 1;
    }

    const searchDocs = await prisma.searchDocument.deleteMany({
      where: { OR: [{ path: PROFILE_PATH }, { path: { contains: "ranawake" } }] },
    });

    report.db = {
      archivedPages: pages.map((p) => p.path),
      practitionersOnHold: practitioners.map((p) => p.name),
      searchDocsRemoved: searchDocs.count,
      scrubbedRevisions,
    };
  } finally {
    await prisma.$disconnect();
  }
}

function mainStatic() {
  // Delete profile + photos
  deleteIfExists(path.join(repoRoot, "old-html", "doctors", `${SLUG}.html`));
  for (const root of [
    path.join(repoRoot, "old-html", "assets", "team"),
    path.join(repoRoot, "apps", "web", "public", "assets", "team"),
  ]) {
    deleteIfExists(path.join(root, `${SLUG}.webp`));
    deleteIfExists(path.join(root, `${SLUG}-640.webp`));
  }

  const roots = [
    path.join(repoRoot, "old-html"),
    path.join(repoRoot, "apps", "web", "public"),
  ];

  for (const root of roots) {
    for (const file of walk(root)) {
      const rel = path.relative(repoRoot, file);
      // Skip bulky reports / qa archives except operational indexes
      if (rel.includes(`${path.sep}qa${path.sep}`) && !rel.endsWith("PRACTITIONER-HOTDOC-ROUTES.json")) {
        continue;
      }
      if (rel.includes(`${path.sep}reports${path.sep}`)) continue;
      if (rel.includes(`${path.sep}cms${path.sep}`) && file.endsWith(".json")) {
        // Still scrub governance/cms json that may list him
      }

      const ext = path.extname(file).toLowerCase();
      if (ext === ".html") scrubHtmlFile(file);
      else if (ext === ".json") scrubJsonFile(file);
      else if (file.endsWith("site.js") || file.endsWith("digital-reception.js") || file.endsWith("digital-reception-index.js")) {
        scrubJsEmbeddedJson(file);
      }
    }
  }

  // Explicit high-priority mirrors
  for (const rel of [
    "old-html/index.html",
    "apps/web/public/index.html",
    "old-html/team.html",
    "old-html/team-general-practitioners.html",
    "old-html/navigation-ownership.json",
    "old-html/search-index/doctors.json",
    "apps/web/public/search-index/doctors.json",
    "old-html/search-index/practitioner-peers.json",
    "apps/web/public/search-index/practitioner-peers.json",
    "old-html/assets/team/MANIFEST.json",
    "apps/web/public/assets/team/MANIFEST.json",
  ]) {
    const full = path.join(repoRoot, rel);
    if (!fs.existsSync(full)) continue;
    if (rel.endsWith(".html")) scrubHtmlFile(full);
    if (rel.endsWith(".json")) scrubJsonFile(full);
  }
}

function verifyRemaining() {
  const checkRoots = [
    path.join(repoRoot, "old-html"),
    path.join(repoRoot, "apps", "web", "public"),
  ];
  for (const root of checkRoots) {
    for (const file of walk(root)) {
      if (!/\.(html|json|js)$/i.test(file)) continue;
      if (file.includes(`${path.sep}reports${path.sep}`)) continue;
      if (file.includes(`${path.sep}qa${path.sep}`)) continue;
      const raw = fs.readFileSync(file, "utf8");
      if (TOKEN.test(raw) || raw.includes(PROFILE_PATH)) {
        report.remainingHits.push(path.relative(repoRoot, file));
      }
    }
  }
}

mainStatic();
await archiveInCms();
verifyRemaining();
console.log(JSON.stringify(report, null, 2));
