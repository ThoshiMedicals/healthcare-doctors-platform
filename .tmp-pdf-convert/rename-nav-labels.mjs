import fs from "fs";
import path from "path";

const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project";

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === ".pgdata" || ent.name === ".next") continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, acc);
    else if (ent.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

const files = [...walk(path.join(root, "old-html")), path.join(root, "apps/web/public/index.html")];
let changed = 0;
const counts = { nav: 0, title: 0, aria: 0, aside: 0, hotdoc: 0 };

for (const file of files) {
  let text = fs.readFileSync(file, "utf8");
  const original = text;
  text = text.replaceAll(">Knowledge Centre</a>", () => {
    counts.nav += 1;
    return ">Health Advice</a>";
  });
  text = text.replaceAll(">Knowledge Centre</div>", () => {
    counts.title += 1;
    return ">Health Advice</div>";
  });
  text = text.replaceAll(' aria-label="Healthcare Knowledge Centre"', () => {
    counts.aria += 1;
    return ' aria-label="Health Advice"';
  });
  text = text.replaceAll('aria-label="Healthcare Knowledge Centre categories"', () => {
    counts.aside += 1;
    return 'aria-label="Health Advice categories"';
  });
  text = text.replaceAll(">HotDoc Message Safety</a>", () => {
    counts.hotdoc += 1;
    return ">HotDoc Messages</a>";
  });
  if (text !== original) {
    fs.writeFileSync(file, text);
    changed += 1;
  }
}

console.log(JSON.stringify({ files: files.length, changed, counts }, null, 2));
