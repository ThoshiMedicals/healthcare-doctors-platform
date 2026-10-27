import fs from "fs";
import path from "path";

const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html";
function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, acc);
    else if (ent.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}
const needle = "Cosmetic injectables";
for (const file of walk(root)) {
  const text = fs.readFileSync(file, "utf8");
  let at = 0;
  while ((at = text.indexOf(needle, at)) >= 0) {
    const slice = text.slice(Math.max(0, at - 280), at + needle.length + 80);
    console.log("\n" + path.relative(root, file));
    console.log(slice.replace(/\s+/g, " "));
    at += needle.length;
  }
}
