import fs from "fs";
import path from "path";

const ROOT = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project";

function loadDr(file) {
  const raw = fs.readFileSync(file, "utf8");
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]") + 1;
  return JSON.parse(raw.slice(start, end));
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const html = fs.readFileSync(path.join(ROOT, "old-html/telehealth.html"), "utf8");
const title = (html.match(/<title>([^<]+)<\/title>/) || [, ""])[1].replace(
  / \| Woolloongabba Medical Centre$/,
  ""
);
const h1 = (html.match(/<h1>([^<]+)<\/h1>/) || [, title])[1];
const description = (html.match(/content="([^"]+)" name="description"/) || [, ""])[1];
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

const entry = {
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

for (const idx of [
  "old-html/digital-reception-index.js",
  "apps/web/public/digital-reception-index.js",
]) {
  const file = path.join(ROOT, idx);
  const arr = loadDr(file);
  const i = arr.findIndex((e) => e.url === "telehealth.html");
  if (i >= 0) arr[i] = entry;
  else arr.push(entry);
  fs.writeFileSync(file, "window.WMC_DIGITAL_RECEPTION_INDEX = " + JSON.stringify(arr) + ";\n");
  console.log("dr", idx, entry.headings[0]);
}

const man = JSON.parse(fs.readFileSync(path.join(ROOT, "old-html/search-index/manifest.json"), "utf8"));
const apptUrls = Object.entries(man.routes)
  .filter(([, s]) => s === "appointments")
  .map(([u]) => u);
const arr = loadDr(path.join(ROOT, "old-html/digital-reception-index.js"));
const byUrl = Object.fromEntries(arr.map((e) => [e.url, e]));
byUrl["telehealth.html"] = entry;
const shard = apptUrls.map((u) => byUrl[u]).filter(Boolean).sort((a, b) => a.url.localeCompare(b.url));
console.log("appointments count", shard.length);

for (const dir of ["old-html/search-index", "apps/web/public/search-index"]) {
  fs.writeFileSync(path.join(ROOT, dir, "appointments.json"), JSON.stringify(shard) + "\n");
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, dir, "manifest.json"), "utf8"));
  const ci = m.catalog.findIndex((e) => e.url === "telehealth.html");
  const cat = {
    url: entry.url,
    title: entry.title,
    h1: entry.h1,
    category: entry.category,
    description: entry.description,
    related: entry.related,
  };
  if (ci >= 0) m.catalog[ci] = cat;
  else m.catalog.push(cat);
  m.routes["telehealth.html"] = "appointments";
  fs.writeFileSync(path.join(ROOT, dir, "manifest.json"), JSON.stringify(m) + "\n");
}

// validate parse
JSON.parse(fs.readFileSync(path.join(ROOT, "old-html/search-index/appointments.json"), "utf8"));
console.log("appointments.json valid");
