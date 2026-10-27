import sharp from "sharp";

const dir =
  "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/apps/web/public/assets/patient-information/";
const out =
  "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/.tmp-pdf-convert/crops/";

async function sample(file, x, y) {
  const { data, info } = await sharp(dir + file)
    .extract({ left: x, top: y, width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  console.log(file, x, y, [...data].slice(0, info.channels).join(","));
}

await sample("telehealth-consultations-poster.png", 40, 40);
await sample("telehealth-consultations-poster.png", 200, 400);
await sample("telehealth-consultations-poster.png", 40, 860);
await sample("hotdoc-online-booking-day-night.png", 40, 40);
await sample("hotdoc-appointment-reminders.png", 80, 200);

const box = (x, y, w, h) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="red" fill-opacity="0.45"/>`;

async function patch(w, h) {
  const buf = await sharp({
    create: { width: w, height: h, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 0.45 } },
  })
    .png()
    .toBuffer();
  const m = await sharp(buf).metadata();
  if (m.width !== w || m.height !== h) console.log("patch mismatch", w, h, m.width, m.height);
  return buf;
}

async function mark(file, rects, dest, previewWidth) {
  const meta = await sharp(dir + file).metadata();
  console.log(file, meta.width, meta.height);
  const layers = [];
  for (const [left, top, w, h] of rects) {
    layers.push({ input: await patch(w, h), left, top });
  }
  await sharp(dir + file)
    .composite(layers)
    .resize({ width: previewWidth })
    .png()
    .toFile(out + dest);
  console.log("wrote", dest);
}

await mark(
  "hotdoc-online-booking-day-night.png",
  [
    [1760, 155, 560, 80],
    [1660, 330, 740, 180],
  ],
  "day-boxes.png",
  1100
);
await mark(
  "hotdoc-online-booking-screens.png",
  [
    [1240, 70, 620, 500],
    [1240, 560, 620, 500],
    [1780, 200, 640, 500],
    [1780, 700, 640, 500],
  ],
  "screens-boxes.png",
  1100
);
await mark(
  "hotdoc-appointment-reminders.png",
  [[1500, 700, 780, 160]],
  "remind-boxes.png",
  1000
);

console.log("previews written");
