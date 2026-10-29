import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const png = [
  ["favicon-16x16.png", 16],
  ["favicon-32x32.png", 32],
  ["apple-touch-icon.png", 180],
];
for (const [file, size] of png) {
  const data = await readFile(path.join(root, file));
  const info = await sharp(data).metadata();
  assert.equal(info.format, "png", file);
  assert.equal(info.width, size, file);
  assert.equal(info.height, size, file);
  assert.equal(info.hasAlpha, true, file);
  const sample = await sharp(data).ensureAlpha().raw().toBuffer();
  assert.equal(sample[3], 0, "Top-left must be transparent: " + file);
  assert.equal(sample[(size * size - 1) * 4 + 3], 0, "Bottom-right must be transparent: " + file);
}
const ico = await readFile(path.join(root, "favicon.ico"));
assert.equal(ico.readUInt16LE(0), 0);
assert.equal(ico.readUInt16LE(2), 1);
assert.equal(ico.readUInt16LE(4), 2);
for (let i = 0; i < 2; i++) {
  const offset = 6 + i * 16;
  const size = ico.readUInt8(offset);
  assert.equal(size, i === 0 ? 16 : 32);
  const length = ico.readUInt32LE(offset + 8);
  const start = ico.readUInt32LE(offset + 12);
  assert.ok(start + length <= ico.length, "Valid ICO frame bounds");
  assert.equal(ico.subarray(start, start + 8).toString("hex"), "89504e470d0a1a0a");
}
console.log("Favicon files verified: ICO (16/32), PNG (16/32), Apple touch (180), transparent.");
