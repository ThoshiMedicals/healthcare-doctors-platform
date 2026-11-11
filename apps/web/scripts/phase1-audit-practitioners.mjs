import fs from "node:fs";
import path from "node:path";

const doctorsDir = path.resolve("old-html/doctors");
const files = fs
  .readdirSync(doctorsDir)
  .filter((f) => f.endsWith(".html") && (f.startsWith("dr-") || f.startsWith("mr-")));

function strip(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parsePerson(html) {
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  for (const m of scripts) {
    try {
      const data = JSON.parse(m[1]);
      const nodes = Array.isArray(data["@graph"]) ? data["@graph"] : [data];
      const person = nodes.find((n) => {
        const t = n["@type"];
        return t === "Person" || (Array.isArray(t) && t.includes("Person"));
      });
      if (person) return person;
    } catch {
      /* continue */
    }
  }
  return null;
}

const rows = [];
for (const file of files) {
  const html = fs.readFileSync(path.join(doctorsDir, file), "utf8");
  const person = parsePerson(html);
  const name = person?.name || strip((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || ["", file])[1]);
  const credentials = (person?.hasCredential || [])
    .map((c) => (typeof c === "string" ? c : c?.name))
    .filter(Boolean);
  const knowsAbout = person?.knowsAbout || [];
  const languages = person?.knowsLanguage || [];
  const highlightBlock = html.match(/practitioner-care-highlights[\s\S]*?<\/ul>/i)?.[0] || "";
  const highlights = [...highlightBlock.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((m) => strip(m[1])).filter(Boolean);
  const interestsBlock = html.match(/id="professional-interests"[\s\S]*?<\/section>/i)?.[0] || "";
  const interestsVisible = [...interestsBlock.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) => strip(m[1]))
    .filter(Boolean);
  const qualsVisible = strip(
    (html.match(/id="credentials"[\s\S]*?<h2>Qualifications<\/h2>\s*<p>([\s\S]*?)<\/p>/i) || ["", ""])[1],
  );
  const langsVisible = strip(
    (html.match(/id="credentials"[\s\S]*?<h2>Languages<\/h2>\s*<p>([\s\S]*?)<\/p>/i) || ["", ""])[1],
  );
  const bio = strip(
    (html.match(/id="biography"[\s\S]*?<h2>[^<]*<\/h2>([\s\S]*?)<\/section>/i) || ["", ""])[1],
  );
  const portrait = (html.match(/assets\/team\/[^"'\\\s]+\.(?:webp|jpg|jpeg|png)/i) || [null])[0];
  const hotdoc = /hotdoc\.com\.au/i.test(html);
  const phoneCta = /href="tel:/i.test(html);
  const insuranceNotice = /does not bulk bill for insurance/i.test(html);
  const schemaPerson = Boolean(person);
  const sameAsWp = JSON.stringify(person?.sameAs || "").includes("/doctor/");
  const serviceLinks = [...new Set([...html.matchAll(/href="(\.\.\/services\/[^"#]+\.html)"/gi)].map((m) => m[1]))];
  const knowledgeLinks = [...new Set([...html.matchAll(/href="(\.\.\/knowledge\/[^"#]+\.html)"/gi)].map((m) => m[1]))];
  rows.push({
    source: "golden",
    file,
    slug: file.replace(/\.html$/, ""),
    name,
    role: person?.jobTitle || strip((html.match(/class="doctor-role"[^>]*>([\s\S]*?)</i) || ["", ""])[1]),
    fracgp: /FRACGP/i.test(html),
    franzcog: /FRANZCOG/i.test(html),
    credentials,
    qualsVisible,
    knowsAbout,
    highlights,
    interestsVisible,
    languages,
    langsVisible,
    bioLen: bio.length,
    bioPreview: bio.slice(0, 160),
    portrait,
    bookCta: hotdoc ? "HOTDOC" : phoneCta ? "PHONE" : "OTHER",
    insuranceNotice,
    schemaPerson,
    sameAsWpLegacy: sameAsWp,
    serviceLinks,
    knowledgeLinks,
  });
}

const out = path.resolve("apps/web/.tmp-phase1-golden-doctors.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(rows, null, 2));
console.log(`wrote ${rows.length} golden practitioners -> ${out}`);
