import fs from "fs";
const p = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html/doctors/dr-tanya-goodwill.html";
const t = fs.readFileSync(p, "utf8");
const n = "Weight management";
let at = 0;
let i = 0;
while ((at = t.indexOf(n, at)) >= 0) {
  const start = Math.max(0, at - 120);
  console.log("\n#" + i, JSON.stringify(t.slice(start, at + n.length + 160)));
  at += n.length;
  i++;
}
