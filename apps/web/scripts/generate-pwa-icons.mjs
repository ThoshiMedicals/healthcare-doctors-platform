/**
 * PWA installability icons from the owner-supplied Healthcare Doctors lockup
 * (™ + "Caring for you"). Left brand block only, contain-fit on square canvases.
 * Maskable sizes keep the artwork inside the Android adaptive safe zone.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  composeSquareIcon,
  extractBrandLockupCrop,
  iconsRoot,
} from "./brand-icon-source.mjs";

const { png: lockup, crop } = await extractBrandLockupCrop();

const [icon96, icon192, icon512, maskable192, maskable512] = await Promise.all([
  composeSquareIcon(lockup, 96, { opaque: true, markFraction: 0.86 }),
  composeSquareIcon(lockup, 192, { opaque: true, markFraction: 0.86 }),
  composeSquareIcon(lockup, 512, { opaque: true, markFraction: 0.86 }),
  // Safe-zone: keep lockup within ~58% so circular/squircle masks do not clip type.
  composeSquareIcon(lockup, 192, { opaque: true, markFraction: 0.58 }),
  composeSquareIcon(lockup, 512, { opaque: true, markFraction: 0.58 }),
]);

await mkdir(iconsRoot, { recursive: true });
await Promise.all([
  writeFile(path.join(iconsRoot, "icon-96.png"), icon96),
  writeFile(path.join(iconsRoot, "icon-192.png"), icon192),
  writeFile(path.join(iconsRoot, "icon-512.png"), icon512),
  writeFile(path.join(iconsRoot, "maskable-192.png"), maskable192),
  writeFile(path.join(iconsRoot, "maskable-512.png"), maskable512),
]);

console.log(
  "WMC PWA icons generated from Healthcare Doctors lockup (any + maskable), white canvas.",
);
console.log("Brand crop:", JSON.stringify(crop));
