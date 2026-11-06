const base = "http://127.0.0.1:3100";
const paths = [
  "/doctors/dr-tanya-goodwill.html",
  "/doctors/dr-golnar-mortezaei.html",
  "/doctors/dr-james.html",
  "/services/womens-health.html",
  "/knowledge/index.html",
  "/knowledge/",
  "/updates/",
  "/updates/index.html",
];

for (const p of paths) {
  const res = await fetch(base + p, { redirect: "manual" });
  const html = res.status === 200 ? await res.text() : "";
  console.log("\n====", p, res.status);
  if (!html) continue;
  const related = html.match(/id="related-services"[\s\S]{0,1800}/);
  if (related) console.log("RELATED:", related[0].replace(/\s+/g, " ").slice(0, 900));
  const guides = html.match(/id="patient-guides"[\s\S]{0,900}/);
  if (guides) {
    const hrefs = [...guides[0].matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    console.log("GUIDES hrefs:", hrefs.slice(0, 12));
  }
  if (p.includes("updates")) {
    const hrefs = [...html.matchAll(/href="(\/updates\/[^"]+\.html)"/g)].map((m) => m[1]);
    const hits = hrefs.filter((h) => /golnar|james|mortezaei|chanaka|welcome/i.test(h + html));
    console.log("update links sample", hrefs.slice(0, 15));
    console.log("name-ish links", [...new Set(hits)].slice(0, 20));
    // brute: find articles mentioning names
  }
}

// Find Golnar/James updates by scanning update links
const idxPaths = ["/updates/index.html", "/updates/"];
let updateLinks = [];
for (const p of idxPaths) {
  const res = await fetch(base + p, { redirect: "manual" });
  if (res.status !== 200) continue;
  const html = await res.text();
  updateLinks = [...new Set([...html.matchAll(/href="([^"]*updates\/[^"]+\.html)"/g)].map((m) => m[1]))];
  console.log("\nUpdates index", p, "count", updateLinks.length);
  break;
}

const found = { golnar: [], james: [], yamesha: [] };
for (const link of updateLinks) {
  const abs = link.startsWith("http") ? link : new URL(link, base).pathname;
  const res = await fetch(base + abs);
  if (res.status !== 200) continue;
  const html = await res.text();
  const title = (html.match(/<title>([^<]+)/i) || [])[1] || abs;
  if (/Golnar|Mortezaei/i.test(html)) found.golnar.push({ abs, title });
  if (/James Chanaka/i.test(html) || (/Dr James/i.test(title) && /welcome|join|new/i.test(title + html))) {
    found.james.push({ abs, title });
  }
  if (/Yamesha/i.test(html)) found.yamesha.push({ abs, title });
}
console.log("\nFOUND UPDATES", JSON.stringify(found, null, 2));
