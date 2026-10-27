import fs from "fs";
import path from "path";

const ROOT = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project";

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEntry() {
  const html = fs.readFileSync(path.join(ROOT, "old-html/telehealth.html"), "utf8");
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
    keywords: [
      "patient information",
      "appointment guidance",
      "patient help",
      "telehealth",
      "video consult",
      "phone consult",
      "remote appointment",
      "follow up",
      "medication review",
      "hotdoc",
    ],
    related,
    text: stripTags(main).slice(0, 5000),
    url: "telehealth.html",
  };
}

const entry = extractEntry();

for (const idx of [
  "old-html/digital-reception-index.js",
  "apps/web/public/digital-reception-index.js",
]) {
  const file = path.join(ROOT, idx);
  let raw = fs.readFileSync(file, "utf8");
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]") + 1;
  const arr = JSON.parse(raw.slice(start, end));
  const i = arr.findIndex((e) => e.url === "telehealth.html");
  if (i >= 0) arr[i] = entry;
  else arr.push(entry);
  fs.writeFileSync(file, "window.WMC_DIGITAL_RECEPTION_INDEX = " + JSON.stringify(arr) + ";\n");
}

for (const dir of ["old-html/search-index", "apps/web/public/search-index"]) {
  const shardPath = path.join(ROOT, dir, "appointments.json");
  if (!fs.existsSync(shardPath)) continue;
  const shard = JSON.parse(fs.readFileSync(shardPath, "utf8"));
  const i = shard.findIndex((e) => e.url === "telehealth.html");
  if (i >= 0) shard[i] = entry;
  else shard.push(entry);
  fs.writeFileSync(shardPath, JSON.stringify(shard) + "\n");
  const manPath = path.join(ROOT, dir, "manifest.json");
  const man = JSON.parse(fs.readFileSync(manPath, "utf8"));
  const ci = man.catalog.findIndex((e) => e.url === "telehealth.html");
  const cat = {
    url: entry.url,
    title: entry.title,
    h1: entry.h1,
    category: entry.category,
    description: entry.description,
    related: entry.related,
  };
  if (ci >= 0) man.catalog[ci] = cat;
  else man.catalog.push(cat);
  man.routes["telehealth.html"] = "appointments";
  fs.writeFileSync(manPath, JSON.stringify(man) + "\n");
}

console.log("telehealth index refreshed", entry.title, entry.headings.length);
