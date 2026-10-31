import fs from "node:fs";
import path from "node:path";
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

const HIT = /cosmetic|anti-wrinkle|injectable|dermal\s*filler|\bbotox\b|platelet-rich|society of cosmetic/gi;

const urls = [
  "http://127.0.0.1:3100/",
  "http://127.0.0.1:3100/team-general-practitioners.html",
  "http://127.0.0.1:3100/doctors/dr-kooshyar-karimi.html",
  "http://127.0.0.1:3100/doctors/dr-tanya-goodwill.html",
  "http://127.0.0.1:3100/doctors/dr-wasantha-hettiarchchi.html",
  "http://127.0.0.1:3100/services/skin-checks.html",
  "http://127.0.0.1:3100/digital-reception.js",
  "http://127.0.0.1:3100/search-index/doctors.json",
  "http://127.0.0.1:3100/services/implanon-insertion-removal.html",
];

const results = [];
for (const url of urls) {
  const res = await fetch(url);
  const text = await res.text();
  const matches = [...text.matchAll(HIT)].map((m) => m[0]);
  results.push({
    url,
    status: res.status,
    hit: matches.length > 0,
    samples: [...new Set(matches)].slice(0, 8),
  });
}

const prisma = new PrismaClient();
const pract = await prisma.practitioner.findMany({
  select: {
    name: true,
    biography: true,
    areasOfCare: true,
    professionalInterests: true,
    relatedServices: true,
    publishedPayload: true,
  },
});
const practHits = pract
  .map((p) => ({ name: p.name, blob: JSON.stringify(p) }))
  .filter((p) => HIT.test(p.blob))
  .map((p) => p.name);

const revCount = await prisma.pageRevision.count({
  where: {
    OR: [
      { html: { contains: "cosmetic", mode: "insensitive" } },
      { html: { contains: "Anti-wrinkle" } },
      { html: { contains: "injectable", mode: "insensitive" } },
      { html: { contains: "Platelet-rich" } },
      { html: { contains: "Society of Cosmetic" } },
    ],
  },
});

await prisma.$disconnect();
console.log(JSON.stringify({ results, practHits, revCount }, null, 2));
