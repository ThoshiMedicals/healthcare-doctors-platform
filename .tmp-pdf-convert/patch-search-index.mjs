import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project";
try {
  execSync("git checkout -- old-html/search-index apps/web/public/search-index", {
    cwd: ROOT,
    stdio: "inherit",
  });
} catch (e) {
  console.warn("git checkout search-index failed (may be untracked changes elsewhere)", e.message);
}

const NEW = [
  {
    file: "identifying-hotdoc-scam-messages.html",
    shard: "appointments",
    keywords: [
      "hotdoc",
      "scam",
      "phishing",
      "sms",
      "email",
      "htd.io",
      "message safety",
      "appointment reminder",
      "consent",
      "legitimate message",
    ],
  },
  {
    file: "recalls-and-reminders.html",
    shard: "appointments",
    keywords: [
      "recall",
      "reminder",
      "follow up",
      "test results",
      "correspondence",
      "preventive care",
      "hotdoc",
      "contact details",
    ],
  },
  {
    file: "assignment-of-benefit.html",
    shard: "billing",
    keywords: [
      "assignment of benefit",
      "aob",
      "bulk billing consent",
      "medicare consent",
      "hotdoc",
      "bulk bill",
      "medicare claim",
    ],
  },
];

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEntry(file, keywords) {
  const html = fs.readFileSync(path.join(ROOT, "old-html", file), "utf8");
  const title = (html.match(/<title>([^<]+)<\/title>/) || [, ""])[1].replace(
    / \| Woolloongabba Medical Centre$/,
    ""
  );
  const h1 = (html.match(/<h1>([^<]+)<\/h1>/) || [, title])[1];
  const description = (
    html.match(/name="description" content="([^"]+)"/) ||
    html.match(/content="([^"]+)" name="description"/) || [, ""]
  )[1];
  const headings = [...html.matchAll(/<h2>([^<]+)<\/h2>/g)].map((m) =>
    m[1].replace(/&amp;/g, "&")
  );
  const main = (html.match(/<main[\s\S]*?<\/main>/) || [""])[0]
    .replace(/<aside[\s\S]*?<\/aside>/g, " ")
    .replace(/<nav[\s\S]*?<\/nav>/g, " ");
  const related = [...html.matchAll(/class="resource-link"[^>]*href="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((u) => !u.startsWith("http") && !u.startsWith("tel:"))
    .slice(0, 5);
  return {
    title,
    h1,
    category: "Patient Information",
    description,
    headings,
    keywords: ["patient information", "appointment guidance", "patient help", ...keywords],
    related,
    text: stripTags(main).slice(0, 5000),
    url: file,
  };
}

function patchSearch(dir) {
  const manPath = path.join(dir, "manifest.json");
  const man = JSON.parse(fs.readFileSync(manPath, "utf8"));
  for (const page of NEW) {
    const entry = extractEntry(page.file, page.keywords);
    const shardPath = path.join(dir, page.shard + ".json");
    const shard = JSON.parse(fs.readFileSync(shardPath, "utf8"));
    const i = shard.findIndex((e) => e.url === page.file);
    if (i >= 0) shard[i] = entry;
    else shard.push(entry);
    shard.sort((a, b) => a.url.localeCompare(b.url));
    fs.writeFileSync(shardPath, JSON.stringify(shard) + "\n");
    man.routes[page.file] = page.shard;
    const cat = {
      url: entry.url,
      title: entry.title,
      h1: entry.h1,
      category: entry.category,
      description: entry.description,
      related: entry.related,
    };
    const ci = man.catalog.findIndex((e) => e.url === page.file);
    if (ci >= 0) man.catalog[ci] = cat;
    else man.catalog.push(cat);
    const bit = 1 << man.shards.indexOf(page.shard);
    const text = [entry.title, entry.h1, entry.description, ...entry.headings, ...entry.keywords]
      .join(" ")
      .toLowerCase();
    for (const term of new Set(text.match(/[a-z0-9]+/g) || [])) {
      if (term.length < 2) continue;
      man.strong[term] = (man.strong[term] || 0) | bit;
    }
  }
  man.count = Object.keys(man.routes).length;
  man.catalog.sort((a, b) => a.url.localeCompare(b.url));
  fs.writeFileSync(manPath, JSON.stringify(man) + "\n");
  console.log(dir, "count", man.count);
}

patchSearch(path.join(ROOT, "old-html/search-index"));
patchSearch(path.join(ROOT, "apps/web/public/search-index"));
