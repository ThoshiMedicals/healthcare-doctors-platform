import sharp from "sharp";
import fs from "fs";
import path from "path";

const pub =
  "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/apps/web/public/assets/patient-information";
const golden =
  "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html/assets/patient-information";
const file = "hotdoc-online-booking-screens.png";

const { data } = await sharp(path.join(pub, file))
  .extract({ left: 80, top: 200, width: 1, height: 1 })
  .raw()
  .toBuffer({ resolveWithObject: true });
const [r, g, b] = data;
console.log("green", r, g, b);

const W = 2560;
const H = 1440;
const panelW = 1320;
const panel = await sharp({
  create: {
    width: panelW,
    height: H,
    channels: 3,
    background: { r, g, b },
  },
})
  .png()
  .toBuffer();

const cardW = 760;
const cardH = 980;
const card = `<svg xmlns="http://www.w3.org/2000/svg" width="${cardW}" height="${cardH}" viewBox="0 0 ${cardW} ${cardH}">
  <rect width="${cardW}" height="${cardH}" rx="36" fill="#ffffff"/>
  <text x="${cardW / 2}" y="360" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="700" fill="#173044">Woolloongabba</text>
  <text x="${cardW / 2}" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" fill="#173044">Medical Centre</text>
  <text x="${cardW / 2}" y="530" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" fill="#173044">(07) 3217 3344</text>
  <text x="${cardW / 2}" y="620" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#173044">Book in the HotDoc app</text>
</svg>`;
let cardBuf = await sharp(Buffer.from(card), { density: 72 }).png().toBuffer();
const meta = await sharp(cardBuf).metadata();
if (meta.width !== cardW || meta.height !== cardH) {
  cardBuf = await sharp(cardBuf).resize(cardW, cardH, { fit: "fill" }).png().toBuffer();
}

const pngBuf = await sharp(path.join(pub, file))
  .composite([
    { input: panel, left: W - panelW, top: 0 },
    { input: cardBuf, left: W - panelW + Math.round((panelW - cardW) / 2), top: Math.round((H - cardH) / 2) },
  ])
  .png()
  .toBuffer();
const webpBuf = await sharp(pngBuf).webp({ quality: 82 }).toBuffer();
for (const root of [pub, golden]) {
  fs.writeFileSync(path.join(root, file), pngBuf);
  fs.writeFileSync(path.join(root, file.replace(/\.png$/, ".webp")), webpBuf);
}
await sharp(pngBuf)
  .resize({ width: 1100 })
  .png()
  .toFile("C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/.tmp-pdf-convert/crops/screens-final.png");
console.log("screens replaced");
