/**
 * Remove cosmetic injections / cosmetic care details from golden HTML,
 * search indexes, Digital Reception, and CMS published revisions.
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

const COSMETIC_HIT =
  /cosmetic|anti-wrinkle|injectable|dermal\s*filler|\bbotox\b|platelet-rich|society of cosmetic/i;

const report = {
  updatedFiles: [],
  skippedFiles: [],
  db: null,
  remainingHits: [],
  samples: {},
};

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", ".next", ".next-uat", "dist", "qa"].includes(entry.name)) continue;
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

/** List items that are purely cosmetic care claims (plain text or linked). */
function stripCosmeticListItems(html) {
  let next = html;
  // Any <li>…</li> whose visible text is a cosmetic care claim
  next = next.replace(
    /<li[^>]*>\s*(?:<a[^>]*>\s*)?(?:Cosmetic(?:\s+(?:and\s+procedural\s+)?(?:medicine|procedures|injectables))?|Anti-wrinkle\s+injectables?|Platelet-rich\s+plasma\s+injections?|Skin\s+and\s+cosmetic\s+medicine)(?:\s*<\/a>)?\s*<\/li>\s*/gi,
    "",
  );
  // Broader: any list item that only exists to advertise cosmetic injectables / PRP / anti-wrinkle
  next = next.replace(
    /<li[^>]*>[\s\S]*?(?:Anti-wrinkle\s+injectables?|Platelet-rich\s+plasma\s+injections?|Cosmetic\s+injectables?|Cosmetic\s+procedures?|Cosmetic\s+medicine|Cosmetic\s+and\s+procedural\s+medicine)[\s\S]*?<\/li>\s*/gi,
    "",
  );
  return next;
}

/** Replace "Skin and cosmetic medicine" with "Skin medicine" where it is not a full list item. */
function rewriteSkinAndCosmetic(text) {
  return text
    .replace(/Skin\s+and\s+cosmetic\s+medicine/gi, "Skin medicine")
    .replace(/skin\s+and\s+cosmetic\s+medicine/gi, "skin medicine")
    .replace(/Skin\s*&amp;\s*cosmetic\s+medicine/gi, "Skin medicine")
    .replace(/Skin\s*&\s*cosmetic\s+medicine/gi, "Skin medicine");
}

/** Remove membership clause mentioning Australian Society of Cosmetic Medicine. */
function stripCosmeticSociety(html) {
  let next = html;
  // "... and the Australian Society of Cosmetic Medicine"
  next = next.replace(
    /\s+and\s+the\s+Australian\s+Society\s+of\s+Cosmetic\s+Medicine/gi,
    "",
  );
  next = next.replace(
    /,\s*the\s+Australian\s+Society\s+of\s+Cosmetic\s+Medicine/gi,
    "",
  );
  next = next.replace(
    /Australian\s+Society\s+of\s+Cosmetic\s+Medicine/gi,
    "",
  );
  // tidy double spaces / dangling "and"
  next = next.replace(/\s{2,}/g, " ");
  next = next.replace(/\band\s+\./g, ".");
  next = next.replace(/\band\s+<\/p>/gi, "</p>");
  return next;
}

/** Scrub JSON-LD / inline JSON string arrays that mention cosmetic care. */
function tidyProseLists(text) {
  let next = text;
  // Collapse leftover list punctuation after phrase deletion
  next = next.replace(/,\s*,+/g, ",");
  next = next.replace(/,\s+and\s+,/gi, ", ");
  next = next.replace(/,\s+and\s+\./g, ".");
  next = next.replace(/\band\s+,/gi, "");
  next = next.replace(/:\s*,/g, ": ");
  next = next.replace(/\(\s*,/g, "(");
  next = next.replace(/,\s*\)/g, ")");
  next = next.replace(/\s{2,}/g, " ");
  next = next.replace(/\s+([.,;:])/g, "$1");
  // "A, B, and ." / "A, and B" already mostly handled
  next = next.replace(/,\s+and\s+([A-Z])/g, " and $1");
  return next;
}

function scrubJsonLikeStrings(text) {
  let next = text;
  const phrases = [
    "Cosmetic and procedural medicine",
    "Cosmetic procedures",
    "Cosmetic injectables",
    "Cosmetic medicine",
    "Anti-wrinkle injectables",
    "Platelet-rich plasma injections",
    "Skin and cosmetic medicine",
    "Australian Society of Cosmetic Medicine",
  ];
  for (const phrase of phrases) {
    // JSON array elements: "Phrase", or ,"Phrase"
    const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    next = next.replace(new RegExp(`,?\\s*"${esc}"`, "gi"), "");
    next = next.replace(new RegExp(`"${esc}"\\s*,?`, "gi"), "");
    // plain text remnants (including leading ", and Phrase" / ", Phrase")
    next = next.replace(new RegExp(`,\\s*and\\s+${esc}`, "gi"), "");
    next = next.replace(new RegExp(`\\band\\s+${esc}`, "gi"), "");
    next = next.replace(new RegExp(`,\\s*${esc}`, "gi"), "");
    next = next.replace(new RegExp(esc, "gi"), "");
  }
  next = next.replace(/\[\s*,/g, "[");
  next = next.replace(/,\s*\]/g, "]");
  next = next.replace(/,\s*,/g, ",");
  next = rewriteSkinAndCosmetic(next);
  next = tidyProseLists(next);
  return next;
}

function scrubHtml(html) {
  let next = stripCosmeticListItems(html);
  next = stripCosmeticSociety(next);
  next = rewriteSkinAndCosmetic(next);
  next = scrubJsonLikeStrings(next);
  // catch leftover list-like fragments in schema medicalSpecialty / knowsAbout
  next = next.replace(
    /<li[^>]*>[^<]*\b(?:cosmetic|anti-wrinkle|injectable|platelet-rich)[^<]*<\/li>\s*/gi,
    "",
  );
  // FAQ answers that only mention cosmetic injectables as a service claim — leave general FAQs
  return next;
}

function scrubDigitalReception(js) {
  // Remove cosmetic lead objects from PRACTITIONERS leads arrays
  return js.replace(
    /,?\s*\{tag:'cosmetic'[^}]*\}/g,
    "",
  ).replace(
    /,\s*\]/g,
    "]",
  );
}

function scrubDoctorsSearchJson(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return scrubJsonLikeStrings(raw);
  }
  const scrubValue = (v) => {
    if (typeof v === "string") {
      let s = scrubJsonLikeStrings(v);
      s = s.replace(/\s{2,}/g, " ").replace(/\s+([.,;:])/g, "$1").trim();
      // drop empty tokens left in prose
      s = s.replace(/\b(?:and|,)\s+(?=Book with)/gi, "");
      return s;
    }
    if (Array.isArray(v)) {
      return v
        .map(scrubValue)
        .filter((item) => {
          if (typeof item === "string") return item && !COSMETIC_HIT.test(item);
          return item != null;
        });
    }
    if (v && typeof v === "object") {
      for (const k of Object.keys(v)) v[k] = scrubValue(v[k]);
      return v;
    }
    return v;
  };
  return JSON.stringify(scrubValue(data), null, 2) + "\n";
}

function scrubFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (![".html", ".js", ".json", ".xml", ".css", ".md", ".txt"].includes(ext)) return false;
  // Skip historical QA archives
  if (filePath.includes(`${path.sep}qa${path.sep}`)) return false;
  const before = fs.readFileSync(filePath, "utf8");
  if (!COSMETIC_HIT.test(before)) return false;

  let after = before;
  const base = path.basename(filePath);
  if (base === "digital-reception.js") {
    after = scrubDigitalReception(after);
    after = scrubJsonLikeStrings(after);
  } else if (base === "doctors.json" || filePath.includes(`${path.sep}search-index${path.sep}`)) {
    after = scrubDoctorsSearchJson(after);
  } else if (ext === ".html") {
    after = scrubHtml(after);
  } else if (ext === ".js" || ext === ".json") {
    after = scrubJsonLikeStrings(after);
    if (ext === ".json") {
      try {
        after = JSON.stringify(JSON.parse(after), null, 2) + "\n";
      } catch {
        /* keep string scrub */
      }
    }
  } else {
    after = scrubJsonLikeStrings(after);
  }

  if (after === before) {
    report.skippedFiles.push(filePath);
    report.samples[filePath] = [...before.matchAll(COSMETIC_HIT)].slice(0, 5).map((m) => m[0]);
    return false;
  }
  let written = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      fs.writeFileSync(filePath, after);
      written = true;
      break;
    } catch (err) {
      const wait = 250 * (attempt + 1);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, wait);
      if (attempt === 4) {
        report.skippedFiles.push(`${filePath} (write failed: ${err.message})`);
        return false;
      }
    }
  }
  if (written) report.updatedFiles.push(filePath);
  return written;
}

async function scrubCms() {
  const prisma = new PrismaClient();
  const db = {
    pagesTouched: [],
    revisionsScrubbed: 0,
    practitionersUpdated: [],
  };
  try {
    const pages = await prisma.page.findMany({
      where: {
        OR: [
          { path: { contains: "dr-kooshyar-karimi" } },
          { path: { contains: "dr-tanya-goodwill" } },
          { path: { contains: "dr-wasantha-hettiarchchi" } },
          { path: { contains: "skin-checks" } },
          { path: { contains: "team-general-practitioners" } },
          { title: { contains: "Cosmetic", mode: "insensitive" } },
        ],
      },
      select: { id: true, path: true, status: true },
    });

    for (const page of pages) {
      db.pagesTouched.push(page.path);
      const revisions = await prisma.pageRevision.findMany({
        where: { pageId: page.id },
        select: { id: true, html: true },
      });
      for (const rev of revisions) {
        if (!rev.html || !COSMETIC_HIT.test(rev.html)) continue;
        const scrubbed = scrubHtml(rev.html);
        if (scrubbed !== rev.html) {
          await prisma.pageRevision.update({
            where: { id: rev.id },
            data: { html: scrubbed },
          });
          db.revisionsScrubbed += 1;
        }
      }
    }

    // Also scrub any revision containing cosmetic across pages (catch homepage/team/services)
    const extra = await prisma.pageRevision.findMany({
      where: {
        OR: [
          { html: { contains: "cosmetic", mode: "insensitive" } },
          { html: { contains: "Anti-wrinkle" } },
          { html: { contains: "anti-wrinkle" } },
          { html: { contains: "injectable", mode: "insensitive" } },
          { html: { contains: "Platelet-rich" } },
          { html: { contains: "Society of Cosmetic" } },
        ],
      },
      select: { id: true, pageId: true, html: true },
      take: 800,
    });
    const seen = new Set();
    for (const rev of extra) {
      if (seen.has(rev.id)) continue;
      seen.add(rev.id);
      if (!rev.html || !COSMETIC_HIT.test(rev.html)) continue;
      const scrubbed = scrubHtml(rev.html);
      if (scrubbed !== rev.html) {
        await prisma.pageRevision.update({
          where: { id: rev.id },
          data: { html: scrubbed },
        });
        db.revisionsScrubbed += 1;
      }
    }

    const practitioners = await prisma.practitioner.findMany({
      select: {
        id: true,
        name: true,
        biography: true,
        areasOfCare: true,
        professionalInterests: true,
        relatedServices: true,
        publishedPayload: true,
      },
    });

    for (const p of practitioners) {
      const patch = {};
      if (typeof p.biography === "string" && COSMETIC_HIT.test(p.biography)) {
        patch.biography = scrubHtml(p.biography);
      }
      for (const field of ["areasOfCare", "professionalInterests", "relatedServices"]) {
        const val = p[field];
        if (!Array.isArray(val)) continue;
        const next = val
          .map((item) => (typeof item === "string" ? rewriteSkinAndCosmetic(item) : item))
          .filter((item) => !(typeof item === "string" && COSMETIC_HIT.test(item)));
        if (JSON.stringify(next) !== JSON.stringify(val)) patch[field] = next;
      }
      if (p.publishedPayload != null) {
        const raw = JSON.stringify(p.publishedPayload);
        if (COSMETIC_HIT.test(raw)) {
          try {
            patch.publishedPayload = JSON.parse(scrubDoctorsSearchJson(raw));
          } catch {
            /* leave payload */
          }
        }
      }
      if (Object.keys(patch).length) {
        await prisma.practitioner.update({ where: { id: p.id }, data: patch });
        db.practitionersUpdated.push(p.name || p.id);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
  return db;
}

async function main() {
  const roots = [
    path.join(repoRoot, "old-html"),
    path.join(repoRoot, "apps", "web", "public"),
  ];
  for (const root of roots) {
    for (const file of walk(root)) scrubFile(file);
  }

  // Mirror key doctor/team pages into public if they exist as copies
  const mirrorPairs = [
    ["old-html/doctors/dr-kooshyar-karimi.html", "apps/web/public/doctors/dr-kooshyar-karimi.html"],
    ["old-html/doctors/dr-tanya-goodwill.html", "apps/web/public/doctors/dr-tanya-goodwill.html"],
    ["old-html/doctors/dr-wasantha-hettiarchchi.html", "apps/web/public/doctors/dr-wasantha-hettiarchchi.html"],
    ["old-html/team-general-practitioners.html", "apps/web/public/team-general-practitioners.html"],
    ["old-html/services/skin-checks.html", "apps/web/public/services/skin-checks.html"],
  ];
  for (const [src, dest] of mirrorPairs) {
    const srcPath = path.join(repoRoot, src);
    const destPath = path.join(repoRoot, dest);
    if (fs.existsSync(srcPath) && fs.existsSync(path.dirname(destPath))) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  }

  try {
    report.db = await scrubCms();
  } catch (err) {
    report.db = { error: String(err?.message || err) };
  }

  // Remaining inventory (excl qa)
  for (const root of roots) {
    for (const file of walk(root)) {
      if (!/\.(html|js|json|xml)$/i.test(file)) continue;
      const t = fs.readFileSync(file, "utf8");
      if (COSMETIC_HIT.test(t)) report.remainingHits.push(path.relative(repoRoot, file));
    }
  }

  const out = path.join(repoRoot, ".tmp-pdf-convert", "remove-cosmetic-report.json");
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    updated: report.updatedFiles.length,
    skipped: report.skippedFiles.length,
    remaining: report.remainingHits,
    db: report.db,
    samples: report.samples,
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
