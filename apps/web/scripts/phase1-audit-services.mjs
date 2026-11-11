import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// Compiled TS not available; duplicate thin map read via dynamic import of source is hard.
// Reimplement matching against the same rules by reading the TS source regexes is fragile —
// instead parse golden rails and cross-check CMS published practitioners from DB dump if present.

const servicesDir = path.resolve("old-html/services");
const files = fs.readdirSync(servicesDir).filter((f) => f.endsWith(".html"));

function strip(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const rows = [];
for (const file of files) {
  const html = fs.readFileSync(path.join(servicesDir, file), "utf8");
  const title = strip((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || ["", file])[1]);
  const rail = html.match(/id="related-practitioners"[\s\S]*?<\/section>/i)?.[0] || "";
  const practitioners = [...rail.matchAll(/href="(?:\.\.\/)?doctors\/([^"#]+\.html)"[^>]*>[\s\S]*?<strong>([\s\S]*?)<\/strong>/gi)].map(
    (m) => ({ slug: m[1], name: strip(m[2]) }),
  );
  // fallback simpler links
  const simple =
    practitioners.length > 0
      ? practitioners
      : [...rail.matchAll(/href="(?:\.\.\/)?doctors\/([^"#]+\.html)"/gi)].map((m) => ({
          slug: m[1],
          name: m[1],
        }));
  const hasBook = /hotdoc\.com\.au|book.?online|Book an appointment/i.test(html);
  const hasTeamLink = /team-general-practitioners\.html|team-specialists\.html/i.test(html);
  rows.push({
    file,
    path: `services/${file}`,
    title,
    hasRelatedRail: Boolean(rail),
    practitionerCount: simple.length,
    practitioners: simple,
    hasBook,
    hasTeamLink,
  });
}

const out = path.resolve("apps/web/.tmp-phase1-golden-services.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(rows, null, 2));
console.log(`wrote ${rows.length} services -> ${out}`);
