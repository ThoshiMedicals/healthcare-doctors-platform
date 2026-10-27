/**
 * Remove the white clinic branding overlay from the HotDoc day–night phone screen
 * and restore the original app UI from the pre-cover day-phone crop.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const phonePath = path.join(ROOT, ".tmp-pdf-convert/crops/day-phone.png");
const targets = [
  path.join(ROOT, "old-html/assets/patient-information/hotdoc-online-booking-day-night.png"),
  path.join(ROOT, "apps/web/public/assets/patient-information/hotdoc-online-booking-day-night.png"),
];

// crop-hotdoc.mjs took day-phone from the banner at (1500, 60).
// deploy-hotdoc.mjs covered the screen at (1590, 150, 700, 1080).
const PHONE_ORIGIN = { left: 1500, top: 60 };
const COVER = { left: 1590, top: 150, width: 700, height: 1080 };
const extract = {
  left: COVER.left - PHONE_ORIGIN.left,
  top: COVER.top - PHONE_ORIGIN.top,
  width: COVER.width,
  height: COVER.height,
};

const restoredScreen = await sharp(phonePath).extract(extract).png().toBuffer();

for (const target of targets) {
  if (!fs.existsSync(target)) {
    console.log("skip missing", target);
    continue;
  }
  const outPng = await sharp(target)
    .composite([{ input: restoredScreen, left: COVER.left, top: COVER.top }])
    .png()
    .toBuffer();
  fs.writeFileSync(target, outPng);

  const webpPath = target.replace(/\.png$/i, ".webp");
  await sharp(outPng).webp({ quality: 82 }).toFile(webpPath);
  console.log("restored", path.relative(ROOT, target), outPng.length);
  console.log("restored", path.relative(ROOT, webpPath));
}

const uatPng = path.join(
  ROOT,
  "apps/web/.next-uat/standalone/apps/web/public/assets/patient-information/hotdoc-online-booking-day-night.png",
);
if (fs.existsSync(path.dirname(uatPng))) {
  fs.copyFileSync(targets[1], uatPng);
  const uatWebp = uatPng.replace(/\.png$/i, ".webp");
  fs.copyFileSync(targets[1].replace(/\.png$/i, ".webp"), uatWebp);
  console.log("synced UAT standalone assets");
}

console.log("RESTORE_DAYNIGHT_PHONE_OK");
