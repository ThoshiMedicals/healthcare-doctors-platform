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
const re = /<ul class="service-care-list">([\s\S]*?)<\/ul>/g;
const item = /<li>([\s\S]*?)<\/li>/g;
for (const file of walk(root)) {
  const text = fs.readFileSync(file, "utf8");
  let list;
  while ((list = re.exec(text))) {
    let li;
    const body = list[1];
    item.lastIndex = 0;
    while ((li = item.exec(body))) {
      if (!li[1].includes("service-title-link") && li[1].includes("<a")) {
        console.log(path.relative(root, file) + " :: " + li[1].replace(/\s+/g, " ").slice(0, 220));
      }
    }
  }
}
