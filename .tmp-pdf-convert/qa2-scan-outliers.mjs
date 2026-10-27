import fs from "node:fs";
import path from "node:path";

const dir = path.resolve("old-html/doctors");
const files = [
  "dr-mary-abadir.html",
  "dr-nirupa-sivathasan.html",
  "mr-samuel-stafford.html",
  "dr-steven-chang.html",
  "dr-tanya-goodwill.html",
];

for (const f of files) {
  const html = fs.readFileSync(path.join(dir, f), "utf8");
  const books = [...html.matchAll(/href="(https:\/\/www\.hotdoc[^"]+|tel:[^"]+)"/g)].map((m) => m[1]);
  const bookLabels = [...html.matchAll(/<(?:a)[^>]*class="[^"]*wmc-book-appointment[^"]*"[^>]*>([^<]*)</g)].map(
    (m) => m[1].trim(),
  );
  const callToBook = /Call reception to book|telephone only|Online booking is not available/i.test(html);
  const photo =
    /doctor-profile-photo|data-practitioner-image|data-photo-fallback/.test(html) ||
    /assets\/team\//.test(html);
  const role = (html.match(/class="doctor-role"[^>]*>([^<]+)</) || [])[1] || null;
  const quals = (html.match(/Qualifications[\s\S]{0,200}?<p[^>]*>([^<]+)</) || [])[1] || null;
  const svc = (html.match(/href="\.\.\/services\/[^"]+\.html"/g) || []).length;
  const knowledge = (html.match(/href="\.\.\/knowledge\/articles\/[^"]+\.html"/g) || []).length;
  console.log(
    JSON.stringify(
      {
        f,
        role,
        quals,
        callToBook,
        photo,
        bookLabels: [...new Set(bookLabels)].slice(0, 4),
        bookHrefs: [...new Set(books)].slice(0, 4),
        svc,
        knowledge,
        siteJs: /site\.js/.test(html),
      },
      null,
      2,
    ),
  );
}
