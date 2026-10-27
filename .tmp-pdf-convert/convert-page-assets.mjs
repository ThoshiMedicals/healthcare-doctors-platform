import sharp from "sharp";
import fs from "fs";
import path from "path";

const dir =
  "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html/assets/patient-information";
const pub =
  "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/apps/web/public/assets/patient-information";
fs.mkdirSync(pub, { recursive: true });

const files = [
  "zero-tolerance-conduct.png",
  "new-patients-welcome-hero.png",
  "new-patients-welcome-supporting.png",
  "new-patients-welcome-illustrated.png",
  "hotdoc-online-booking-day-night.png",
  "hotdoc-online-booking-screens.png",
];

for (const f of files) {
  const src = path.join(dir, f);
  if (!fs.existsSync(src)) {
    console.log("missing", f);
    continue;
  }
  const dest = path.join(dir, f.replace(/\.png$/i, ".webp"));
  await sharp(src).webp({ quality: 82 }).toFile(dest);
  fs.copyFileSync(dest, path.join(pub, path.basename(dest)));
  fs.copyFileSync(src, path.join(pub, f));
  console.log(f, fs.statSync(src).size, "->", fs.statSync(dest).size);
}
