import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export class ImageArchiveError extends Error {
  constructor() {
    super("The earlier image file is not in the archive, so the current file was left unchanged.");
    this.name = "ImageArchiveError";
  }
}

export function appRoot(): string {
  return process.cwd();
}

export function imageStoreRoot(): string {
  const configured = process.env.IMAGE_STORE_DIR;
  return configured ? path.resolve(configured) : path.join(appRoot(), "storage", "images");
}

export function publicAssetPath(relative: string): string {
  const root = process.env.PUBLIC_ASSET_ROOT ? path.resolve(process.env.PUBLIC_ASSET_ROOT) : path.join(appRoot(), "public");
  return contained(root, relative);
}

function contained(root: string, relative: string): string {
  const absolute = path.resolve(root, relative);
  const base = path.resolve(root);
  if (absolute !== base && !absolute.startsWith(base + path.sep)) {
    throw new ImageArchiveError();
  }
  return absolute;
}

export function sha256(bytes: Buffer): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

export function archiveBytes(bytes: Buffer): string {
  const sha = sha256(bytes);
  const dest = contained(imageStoreRoot(), path.join("archive", sha));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (!fs.existsSync(dest)) fs.writeFileSync(dest, bytes);
  return sha;
}

export function readArchive(sha: string): Buffer | null {
  if (!/^[a-f0-9]{64}$/.test(sha)) return null;
  const file = contained(imageStoreRoot(), path.join("archive", sha));
  return fs.existsSync(file) ? fs.readFileSync(file) : null;
}

export function readServedBytes(relative: string): Buffer {
  const live = contained(imageStoreRoot(), path.join("live", relative));
  if (fs.existsSync(live)) return fs.readFileSync(live);
  return fs.readFileSync(publicAssetPath(relative));
}

export function servedSha(relative: string): string {
  return sha256(readServedBytes(relative));
}

export function writeLive(relative: string, bytes: Buffer): string {
  archiveBytes(readServedBytes(relative));
  const sha = archiveBytes(bytes);
  const dest = contained(imageStoreRoot(), path.join("live", relative));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const temporary = `${dest}.tmp`;
  fs.writeFileSync(temporary, bytes);
  fs.renameSync(temporary, dest);
  return sha;
}

export function restoreServed(relative: string, sha: string): void {
  const original = fs.readFileSync(publicAssetPath(relative));
  archiveBytes(original);
  const live = contained(imageStoreRoot(), path.join("live", relative));
  if (sha === sha256(original)) {
    if (fs.existsSync(live)) fs.rmSync(live);
    return;
  }
  const bytes = readArchive(sha);
  if (!bytes) throw new ImageArchiveError();
  fs.mkdirSync(path.dirname(live), { recursive: true });
  const temporary = `${live}.tmp`;
  fs.writeFileSync(temporary, bytes);
  fs.renameSync(temporary, live);
}

function pendingDirectory(assetId: string): string {
  if (!/^[a-z0-9]+$/i.test(assetId)) throw new ImageArchiveError();
  return contained(imageStoreRoot(), path.join("pending", assetId));
}

export function writePending(assetId: string, full: Buffer, thumb: Buffer | null): { fullSha: string; thumbSha: string | null } {
  const directory = pendingDirectory(assetId);
  fs.rmSync(directory, { recursive: true, force: true });
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "full"), full);
  const fullSha = archiveBytes(full);
  if (!thumb) return { fullSha, thumbSha: null };
  fs.writeFileSync(path.join(directory, "thumb"), thumb);
  return { fullSha, thumbSha: archiveBytes(thumb) };
}

export function readPending(assetId: string, part: "full" | "thumb"): Buffer | null {
  const file = path.join(pendingDirectory(assetId), part);
  return fs.existsSync(file) ? fs.readFileSync(file) : null;
}

export function clearPending(assetId: string): void {
  fs.rmSync(pendingDirectory(assetId), { recursive: true, force: true });
}

export function pendingSha(assetId: string, part: "full" | "thumb"): string | null {
  const bytes = readPending(assetId, part);
  return bytes ? sha256(bytes) : null;
}
