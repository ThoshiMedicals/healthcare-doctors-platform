import fs from "fs";
for (const file of [
  "doctors/dr-tanya-goodwill.html",
  "doctors/dr-mary-abadir.html",
  "doctors/dr-kooshyar-karimi.html",
]) {
  const t = fs.readFileSync("C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html/" + file, "utf8");
  const needles = ["Cosmetic injectables", "High-risk and low-risk obstetrics", "Emergency medicine"];
  for (const n of needles) {
    let at = 0;
    while ((at = t.indexOf(n, at)) >= 0) {
      const start = t.lastIndexOf("<li>", at);
      const end = t.indexOf("</li>", at) + 5;
      console.log(file, JSON.stringify(t.slice(start, end)));
      at += n.length;
    }
  }
}
