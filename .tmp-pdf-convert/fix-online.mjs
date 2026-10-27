import sharp from "sharp";
import fs from "fs";

const roots = [
  "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/apps/web/public/assets/patient-information/hotdoc-online-booking-screens",
  "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html/assets/patient-information/hotdoc-online-booking-screens",
];
const wipe = await sharp({
  create: { width: 1480, height: 560, channels: 3, background: { r: 34, g: 161, b: 96 } },
}).png().toBuffer();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="480">
  <text x="8" y="110" font-family="Arial, sans-serif" font-size="92" font-weight="700" fill="#ffffff">Book your next</text>
  <text x="8" y="240" font-family="Arial, sans-serif" font-size="92" font-weight="700" fill="#ffffff">appointment online</text>
  <text x="8" y="370" font-family="Arial, sans-serif" font-size="92" font-weight="700" fill="#ffffff">using HotDoc</text>
</svg>`;
let line = await sharp(Buffer.from(svg), { density: 72 }).png().toBuffer();
const meta = await sharp(line).metadata();
if (meta.width !== 1400 || meta.height !== 480) {
  line = await sharp(line).resize(1400, 480, { fit: "fill" }).png().toBuffer();
}
const png = await sharp(roots[0] + ".png")
  .composite([
    { input: wipe, left: 36, top: 250 },
    { input: line, left: 56, top: 270 },
  ])
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
console.log("headline block reset");
