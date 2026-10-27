import fs from "fs";
import path from "path";
const dir = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html/doctors";
for (const f of fs.readdirSync(dir).filter(x => x.endsWith(".html"))) {
  let html = fs.readFileSync(path.join(dir, f), "utf8");
  html = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  html = html.replace(/<aside[\s\S]*?<\/aside>/gi, " ");
  html = html.replace(/<footer[\s\S]*?<\/footer>/gi, " ");
  html = html.replace(/<nav[\s\S]*?<\/nav>/gi, " ");
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const i = text.toLowerCase().indexOf("bulk");
  const j = text.toLowerCase().indexOf("male patient");
  const k = text.toLowerCase().indexOf("female patient");
  const clip = (n) => n < 0 ? "" : text.slice(Math.max(0, n - 80), n + 140);
  console.log("\n" + f);
  if (i >= 0) console.log(" BULK:", clip(i));
  else console.log(" BULK: none in body");
  if (j >= 0) console.log(" MALE:", clip(j));
  if (k >= 0) console.log(" FEMALE:", clip(k));
}
