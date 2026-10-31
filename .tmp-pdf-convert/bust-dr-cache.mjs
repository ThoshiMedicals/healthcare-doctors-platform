import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

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

const drPath = path.join(repoRoot, "old-html", "digital-reception.js");
const hash = crypto.createHash("sha256").update(fs.readFileSync(drPath)).digest("hex").slice(0, 12);
const ver = `v=${hash}`;
console.log("cache bust", ver);

function bustHtml(html) {
  return html
    .replace(/src="((?:\.\.\/)?digital-reception\.js)(?:\?[^"]*)?"/g, `src="$1?${ver}"`)
    .replace(/src='((?:\.\.\/)?digital-reception\.js)(?:\?[^']*)?'/g, `src='$1?${ver}'`);
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "qa", ".next", ".next-uat"].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith(".html")) out.push(p);
  }
  return out;
}

let filesUpdated = 0;
for (const root of [path.join(repoRoot, "old-html"), path.join(repoRoot, "apps", "web", "public")]) {
  for (const file of walk(root)) {
    const before = fs.readFileSync(file, "utf8");
    if (!before.includes("digital-reception.js")) continue;
    const after = bustHtml(before);
    if (after !== before) {
      fs.writeFileSync(file, after);
      filesUpdated += 1;
    }
  }
}
console.log("html files updated", filesUpdated);

const join = fs.readFileSync(path.join(repoRoot, "old-html", "join-our-team.html"), "utf8");
console.log("join-our-team sample", join.match(/digital-reception\.js[^"']*/)?.[0]);

const prisma = new PrismaClient();
let revUpdated = 0;
try {
  const revs = await prisma.pageRevision.findMany({
    where: { html: { contains: "digital-reception.js" } },
    select: { id: true, html: true },
  });
  for (const rev of revs) {
    const after = bustHtml(rev.html);
    if (after !== rev.html) {
      await prisma.pageRevision.update({ where: { id: rev.id }, data: { html: after } });
      revUpdated += 1;
    }
  }
  console.log("cms revisions updated", revUpdated, "of", revs.length);
} finally {
  await prisma.$disconnect();
}
