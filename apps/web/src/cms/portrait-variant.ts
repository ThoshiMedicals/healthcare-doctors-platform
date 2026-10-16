import { webpSize } from "@/cms/image-replacement";

export async function renderPortraitThumb(full: Buffer, width: number, height: number): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const bytes = await sharp(full, { failOn: "error" }).resize(width, height, { fit: "fill" }).webp({ quality: 82 }).toBuffer();
  const size = webpSize(bytes);
  if (!size || size.width !== width || size.height !== height) {
    throw new Error("The smaller portrait did not match the current card size.");
  }
  return bytes;
}
