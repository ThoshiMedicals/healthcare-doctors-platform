import fs from "fs";
import path from "path";

const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html";
const files = process.argv.slice(2);

function links(html) {
  const out = [];
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1];
    const href = (attrs.match(/href="([^"]+)"/) || [, ""])[1];
    if (!href || href.startsWith("#") || href.startsWith("tel:") || href.startsWith("http")) continue;
    const cls = (attrs.match(/class="([^"]+)"/) || [, ""])[1];
    const text = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!text) continue;
    out.push({ href, cls, text: text.slice(0, 90) });
  }
  return out;
}

for (const file of files) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  const main = (html.match(/<main[\s\S]*?<\/main>/) || [html])[0];
  const body = main.replace(/<aside[\s\S]*?<\/aside>/g, " ").replace(/<header[\s\S]*?<\/header>/g, " ");
  console.log("\n## " + file);
  const interesting = links(body).filter((l) =>
    /resource-link|knowledge-article|practitioner|topic-wayfinding|doctor/.test(l.cls) ||
    /doctor|pregnancy|cervical|skin|weight|back|pathology|form|prescrib|telehealth|pain/.test(l.href + " " + l.text)
  );
  for (const l of interesting) console.log(" -", l.cls || "(no class)", "|", l.text, "|", l.href);
}
