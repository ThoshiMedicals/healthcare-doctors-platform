import fs from "fs";
const t = fs.readFileSync("C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html/doctors/dr-tanya-goodwill.html", "utf8");
const m = t.match(/<body[^>]*>/);
console.log(m && m[0]);
