const base = "http://127.0.0.1:3100";
const services = [
  "/services/womens-health.html",
  "/services/mens-health.html",
  "/services/family-health.html",
  "/services/skin-checks.html",
  "/services/vaccinations.html",
  "/services/mental-health.html",
  "/services/chronic-disease-care.html",
  "/services/childrens-health.html",
  "/services/preventive-healthcare.html",
];

function absPath(href, pagePath) {
  if (!href) return "";
  if (href.startsWith("http")) {
    try {
      return new URL(href).pathname;
    } catch {
      return href;
    }
  }
  if (href.startsWith("/")) return href;
  return new URL(href, base + pagePath).pathname;
}

for (const p of services) {
  const html = await (await fetch(base + p)).text();
  const block = html.match(/id="related-practitioners"[\s\S]{0,2200}/);
  const hrefs = block
    ? [...block[0].matchAll(/href="([^"]+)"/g)].map((m) => absPath(m[1], p))
    : [];
  const allDoc = [...html.matchAll(/href="([^"]*doctors\/[^"]+)"/g)].map((m) => absPath(m[1], p));
  console.log(
    JSON.stringify({
      p,
      hasSection: Boolean(block),
      sectionHrefs: [...new Set(hrefs)],
      allDoctorHrefs: [...new Set(allDoc)],
      heading: block ? (block[0].match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) || [])[1]?.replace(/<[^>]+>/g, "") : null,
    }),
  );
}

// Doctor relative service links
for (const p of [
  "/doctors/dr-tanya-goodwill.html",
  "/doctors/dr-golnar-mortezaei.html",
  "/doctors/dr-james.html",
  "/doctors/dr-yamesha-ranatunga.html",
]) {
  const html = await (await fetch(base + p)).text();
  const block = html.match(/id="related-services"[\s\S]{0,1800}/);
  const hrefs = block
    ? [...block[0].matchAll(/href="([^"]+)"/g)].map((m) => absPath(m[1], p))
    : [];
  console.log(JSON.stringify({ doctor: p, relatedServices: [...new Set(hrefs)] }));
}

// Find welcome updates via sitemap or listing cards
const updatesHtml = await (await fetch(base + "/updates/index.html")).text();
const cardHrefs = [
  ...new Set(
    [...updatesHtml.matchAll(/href="([^"]+)"/g)]
      .map((m) => absPath(m[1], "/updates/index.html"))
      .filter((h) => h.includes("/updates/") && h.endsWith(".html") && !h.endsWith("/updates/index.html")),
  ),
];
console.log("update card count", cardHrefs.length, cardHrefs.slice(0, 20));
const nameHits = [];
for (const h of cardHrefs.slice(0, 100)) {
  const html = await (await fetch(base + h)).text();
  const title = (html.match(/<title>([^<]+)/i) || [])[1] || h;
  if (/Golnar|Mortezaei|James Chanaka|Yamesha|welcome/i.test(title + html.slice(0, 2500))) {
    nameHits.push({
      h,
      title,
      doctorLinks: [...html.matchAll(/href="([^"]*doctors\/[^"]+)"/g)].map((m) => absPath(m[1], h)),
      serviceLinks: [...html.matchAll(/href="([^"]*services\/[^"]+)"/g)].map((m) => absPath(m[1], h)),
    });
  }
}
console.log("nameHits", JSON.stringify(nameHits, null, 2));
