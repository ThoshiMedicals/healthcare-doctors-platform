import sharp from "sharp";
import fs from "fs";
import path from "path";

const pub =
  "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/apps/web/public/assets/patient-information";
const golden =
  "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html/assets/patient-information";
const src = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/.tmp-pdf-convert/sources";
const preview =
  "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/.tmp-pdf-convert/crops";

async function svgPng(svg, width, height) {
  let buf = await sharp(Buffer.from(svg), { density: 72 }).png().toBuffer();
  let meta = await sharp(buf).metadata();
  if (meta.width !== width || meta.height !== height) {
    buf = await sharp(buf).resize(width, height, { fit: "fill" }).png().toBuffer();
    meta = await sharp(buf).metadata();
  }
  if (meta.width !== width || meta.height !== height) {
    throw new Error(`svg size ${meta.width}x${meta.height} wanted ${width}x${height}`);
  }
  return buf;
}

function cardSvg(w, h, lines) {
  const title = lines[0];
  const rest = lines.slice(1);
  const titleSize = Math.round(w / 16);
  const bodySize = Math.round(w / 18);
  const start = Math.round(h * 0.28);
  const gap = Math.round(bodySize * 1.45);
  const body = rest
    .map(
      (line, i) =>
        `<text x="${w / 2}" y="${start + titleSize + 28 + i * gap}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${bodySize}" fill="#173044">${escapeXml(line)}</text>`
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" rx="28" fill="#ffffff"/>
    <text x="${w / 2}" y="${start}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${titleSize}" font-weight="700" fill="#173044">${escapeXml(title)}</text>
    ${body}
  </svg>`;
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function writePair(baseName, image) {
  const pngBuf = await image.png().toBuffer();
  const webpBuf = await sharp(pngBuf).webp({ quality: 82 }).toBuffer();
  for (const root of [pub, golden]) {
    fs.writeFileSync(path.join(root, baseName + ".png"), pngBuf);
    fs.writeFileSync(path.join(root, baseName + ".webp"), webpBuf);
  }
  console.log("published", baseName, pngBuf.length);
}

async function fromFile(file) {
  return sharp(path.join(src, file)).rotate();
}

const clinicCard = [
  "Woolloongabba",
  "Medical Centre",
  "(07) 3217 3344",
  "Book in the HotDoc app",
];

async function cover(baseFile, rects) {
  const layers = [];
  for (const [left, top, w, h] of rects) {
    layers.push({
      input: await svgPng(cardSvg(w, h, clinicCard), w, h),
      left,
      top,
    });
  }
  const image = sharp(path.join(pub, baseFile + ".png")).composite(layers);
  await writePair(baseFile, image);
  await sharp(path.join(pub, baseFile + ".png"))
    .resize({ width: 1100 })
    .png()
    .toFile(path.join(preview, baseFile + "-patched.png"));
}

await cover("hotdoc-online-booking-day-night", [[1590, 150, 700, 1080]]);
await cover("hotdoc-online-booking-screens", [
  [1210, 90, 560, 1120],
  [1860, 180, 560, 1040],
]);

const remindW = 2560;
const remindH = 1440;
const remindSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${remindW}" height="${remindH}" viewBox="0 0 ${remindW} ${remindH}">
  <rect width="${remindW}" height="${remindH}" fill="#f7faf8"/>
  <rect y="${remindH - 18}" width="${remindW}" height="18" fill="#1f8a4c"/>
  <text x="120" y="280" font-family="Arial, sans-serif" font-size="92" font-weight="700" fill="#173044">Using the HotDoc app?</text>
  <text x="120" y="420" font-family="Arial, sans-serif" font-size="48" fill="#173044">Appointment reminders can arrive as a push notification.</text>
  <text x="120" y="620" font-family="Arial, sans-serif" font-size="64" font-weight="700" fill="#173044">Woolloongabba Medical Centre</text>
  <text x="120" y="720" font-family="Arial, sans-serif" font-size="56" fill="#173044">(07) 3217 3344</text>
  <text x="120" y="860" font-family="Arial, sans-serif" font-size="40" fill="#596b78">Messages name this clinic. Confirm details before you act.</text>
</svg>`;
await writePair("hotdoc-appointment-reminders", sharp(await svgPng(remindSvg, remindW, remindH)));

const telePath = path.join(pub, "telehealth-consultations-poster.png");
const teleCard = `<svg xmlns="http://www.w3.org/2000/svg" width="470" height="560" viewBox="0 0 470 560">
  <rect width="470" height="560" fill="#222d3f"/>
  <text x="36" y="90" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff">Woolloongabba</text>
  <text x="36" y="128" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff">Medical Centre</text>
  <text x="36" y="250" font-family="Arial, sans-serif" font-size="48" font-weight="700" fill="#ffffff">Telehealth</text>
  <text x="36" y="312" font-family="Arial, sans-serif" font-size="48" font-weight="700" fill="#ffffff">consultations</text>
  <text x="36" y="420" font-family="Arial, sans-serif" font-size="32" fill="#ffffff">(07) 3217 3344</text>
</svg>`;
const tele = sharp(telePath).composite([
  { input: await svgPng(teleCard, 470, 560), left: 28, top: 48 },
]);
await writePair("telehealth-consultations-poster", tele);

console.log("done");
