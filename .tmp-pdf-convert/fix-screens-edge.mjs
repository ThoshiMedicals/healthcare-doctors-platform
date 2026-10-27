import sharp from "sharp";
import fs from "fs";

const roots = [
  "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/apps/web/public/assets/patient-information/hotdoc-online-booking-screens",
  "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html/assets/patient-information/hotdoc-online-booking-screens",
];
const strip = await sharp({
  create: { width: 180, height: 1440, channels: 3, background: { r: 34, g: 161, b: 96 } },
}).png().toBuffer();
const png = await sharp(roots[0] + ".png")
  .composite([{ input: strip, left: 1160, top: 0 }])
  .png()
  .toBuffer();
const webp = await sharp(png).webp({ quality: 82 }).toBuffer();
for (const base of roots) {
  fs.writeFileSync(base + ".png", png);
  fs.writeFileSync(base + ".webp", webp);
}
await sharp(png)
  .resize({ width: 1100 })
  .png()
  .toFile("C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/.tmp-pdf-convert/crops/screens-final.png");
console.log("edge covered");
