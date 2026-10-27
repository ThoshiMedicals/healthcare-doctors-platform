import fs from "fs";
import path from "path";
const dir = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html/doctors";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".html"));
const needles = ["male", "female", "telehealth", "bulk", "restriction", "cannot", "only"];
for (const f of files) {
  const html = fs.readFileSync(path.join(dir, f), "utf8");
  const text = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const hits = [];
  for (const n of ["male patients", "female patients", "telehealth only", "does not bulk", "bulk bill", "insurance", "restriction", "cannot book", "strictly"]) {
    if (text.toLowerCase().includes(n)) hits.push(n);
  }
  console.log(f, hits.join(", ") || "no restriction language");
}
