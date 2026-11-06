const base = "http://127.0.0.1:3100";

function pathsFrom(html, pagePath) {
  return [...html.matchAll(/href="([^"]+)"/g)].map((m) => {
    const href = m[1];
    if (href.startsWith("http")) {
      try {
        return new URL(href).pathname;
      } catch {
        return href;
      }
    }
    if (href.startsWith("/")) return href;
    if (href.startsWith("tel:") || href.startsWith("#") || href.startsWith("mailto:")) return href;
    return new URL(href, base + pagePath).pathname;
  });
}

for (const p of [
  "/updates/welcome-dr-golnar-mortezaei.html",
  "/updates/welcome-dr-james-chanaka.html",
  "/updates/index.html",
]) {
  const res = await fetch(base + p, { redirect: "manual" });
  console.log("\n====", p, res.status);
  if (res.status !== 200) continue;
  const h = await res.text();
  const all = pathsFrom(h, p);
  console.log({
    title: (h.match(/<title>([^<]+)/i) || [])[1],
    doctors: [...new Set(all.filter((x) => x.includes("/doctors/")))],
    services: [...new Set(all.filter((x) => x.includes("/services/")))],
    book: [...new Set(all.filter((x) => /hotdoc|book-appointment|tel:/i.test(x)))].slice(0, 6),
    listsWelcomeGolnar: h.includes("welcome-dr-golnar"),
    listsWelcomeJames: h.includes("welcome-dr-james"),
    cardClass: /featured-update|health-update|update-card/i.test(h),
  });
  if (p.endsWith("index.html")) {
    const grid = h.match(/class="[^"]*(?:update|news)[^"]*"[\s\S]{0,200}/i);
    console.log("grid hint", grid && grid[0].slice(0, 180));
    const articles = [...h.matchAll(/<article[\s\S]*?<\/article>/gi)];
    console.log("article cards", articles.length);
    if (articles[0]) console.log("sample card", articles[0][0].replace(/\s+/g, " ").slice(0, 500));
  }
}
