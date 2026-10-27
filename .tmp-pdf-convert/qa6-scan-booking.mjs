import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const old = path.join(repoRoot, "old-html");
const publicRoot = path.join(repoRoot, "apps/web/public");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function scanFile(full, label) {
  const html = fs.readFileSync(full, "utf8");
  const books = (html.match(/wmc-book-appointment/g) || []).length;
  const hotdoc = (html.match(/data-hotdoc-button|hotdoc\.com\.au/g) || []).length;
  const call = (html.match(/tel:\+61732173344/g) || []).length;
  const dock = /persistent-care-actions|has-persistent-care-actions/.test(html);
  const resilience = /booking-resilience\.js/.test(html);
  const siteJs = /site\.js/.test(html);
  const conversion = /conversion-band|critical-action|Ready to book|Book this service|knowledge-final-cta/i.test(html);
  const trustNearCta = /agpal|bulk.?billing|Accredited|Open 7|opening hours/i.test(html);
  const phoneBook = /Call reception to book|phone-only|Call to book/i.test(html);
  return {
    label,
    file: path.relative(repoRoot, full).replace(/\\/g, "/"),
    books,
    hotdoc,
    call,
    dock,
    resilience,
    siteJs,
    conversion,
    trustNearCta,
    phoneBook,
  };
}

const doctors = walk(path.join(old, "doctors")).map((f) => scanFile(f, "doctor"));
const services = walk(path.join(old, "services")).map((f) => scanFile(f, "service"));
const home = scanFile(path.join(publicRoot, "index.html"), "home");

const phoneOnlyDoctors = doctors.filter((d) => d.phoneBook || !d.hotdoc);
const noBookDoctors = doctors.filter((d) => d.books === 0);
const noBookServices = services.filter((d) => d.books === 0);
const noCallServices = services.filter((d) => d.call === 0);
const noDock = [...doctors, ...services].filter((d) => !d.dock);

console.log(
  JSON.stringify(
    {
      home,
      doctors: {
        count: doctors.length,
        allBook: doctors.every((d) => d.books > 0),
        allCall: doctors.every((d) => d.call > 0),
        allDock: doctors.every((d) => d.dock),
        allResilience: doctors.every((d) => d.resilience),
        phoneBookHints: phoneOnlyDoctors.map((d) => d.file),
        noBook: noBookDoctors.map((d) => d.file),
      },
      services: {
        count: services.length,
        allBook: services.every((d) => d.books > 0),
        allCall: services.every((d) => d.call > 0),
        allDock: services.every((d) => d.dock),
        staticConversion: services.filter((d) => d.conversion).length,
        noBook: noBookServices.map((d) => d.file),
        noCall: noCallServices.map((d) => d.file),
      },
      missingDock: noDock.map((d) => d.file),
    },
    null,
    2,
  ),
);
