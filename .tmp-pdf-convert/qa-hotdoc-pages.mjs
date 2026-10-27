import fs from "fs";
import path from "path";

const ROOT = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html";
const files = [
  "identifying-hotdoc-scam-messages.html",
  "recalls-and-reminders.html",
  "assignment-of-benefit.html",
];

for (const file of files) {
  const html = fs.readFileSync(path.join(ROOT, file), "utf8");
  const title = html.match(/<title>([^<]+)/)?.[1];
  const desc = html.match(/name="description" content="([^"]+)"/)?.[1];
  const imgs = [...html.matchAll(/src="([^"]+patient-information[^"]+)"/g)].map((m) => m[1]);
  const missingImgs = imgs.filter((src) => !fs.existsSync(path.join(ROOT, src)));
  console.log("\n==", file);
  console.log("title:", title, `(${title?.length})`);
  console.log("desc:", desc, `(${desc?.length})`);
  console.log("imgs:", imgs);
  console.log("missing imgs:", missingImgs);
  console.log("faq:", (html.match(/<details>/g) || []).length);
  console.log("disclaimer:", html.includes("knowledge-disclaimer"));
  console.log("schema FAQ:", html.includes('"@type":"FAQPage"') || html.includes('"@type": "FAQPage"'));
}

// hub list
const hub = fs.readFileSync(path.join(ROOT, "patient-information.html"), "utf8");
for (const f of files) {
  console.log("hub has", f, hub.includes(`href="${f}"`));
}

// copy assets to public
const pub = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/apps/web/public/assets/patient-information";
fs.mkdirSync(pub, { recursive: true });
const srcDir = path.join(ROOT, "assets/patient-information");
for (const name of fs.readdirSync(srcDir)) {
  fs.copyFileSync(path.join(srcDir, name), path.join(pub, name));
}
console.log("copied assets to public", fs.readdirSync(pub).length);
