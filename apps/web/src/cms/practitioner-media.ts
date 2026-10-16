import fs from "node:fs";
import path from "node:path";
import { goldenHtmlRoot, listHtmlFiles, webRoot } from "@/importer/golden-root";

const PORTRAIT_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/;

let verifiedNames: string[] | null = null;

export function portraitBasename(value: string | null | undefined): string {
  if (!value) return "";
  const base = value.split(/[/\\]/).pop()?.toLowerCase() ?? "";
  return isPortraitName(base) ? base : "";
}

export function isPortraitName(value: string): boolean {
  return PORTRAIT_NAME.test(value) && !value.endsWith("-640.webp");
}

export function readPractitionerPortraitFile(html: string): string {
  const tag = html.match(/<img\b[^>]*data-practitioner-image="true"[^>]*>/i)?.[0] ?? "";
  return portraitBasename(tag.match(/\bsrc="([^"]+)"/i)?.[1] ?? "");
}

export function readPractitionerBookingUrl(html: string): string {
  const tag = html.match(/<a\b[^>]*data-hotdoc-widget="lightbox"[^>]*>/i)?.[0] ?? "";
  return tag.match(/\bhref="([^"]+)"/i)?.[1] ?? "";
}

export function verifiedPortraitNames(): string[] {
  if (verifiedNames) return verifiedNames;
  const names = new Set<string>();
  for (const file of listHtmlFiles(goldenHtmlRoot())) {
    const html = fs.readFileSync(path.join(goldenHtmlRoot(), file), "utf8");
    for (const tag of html.matchAll(/<img\b[^>]*data-practitioner-image="true"[^>]*>/gi)) {
      const name = portraitBasename(tag[0].match(/\bsrc="([^"]+)"/i)?.[1] ?? "");
      if (name) names.add(name);
    }
  }
  verifiedNames = [...names].sort();
  return verifiedNames;
}

export function compatiblePortraits(sourceFile: string): string[] {
  return verifiedPortraitNames().filter((name) => portraitProblems(sourceFile, name).length === 0);
}

export function portraitProblems(sourceFile: string, nextFile: string): string[] {
  if (!nextFile || nextFile === sourceFile) return [];
  if (!isPortraitName(sourceFile) || !isPortraitName(nextFile)) {
    return ["Photo must be an approved WebP practitioner image."];
  }
  if (!verifiedPortraitNames().includes(nextFile)) {
    return ["Photo must be a verified practitioner image."];
  }
  const source = readPair(sourceFile);
  const next = readPair(nextFile);
  if (!source || !next) return ["Photo must be an approved WebP practitioner image."];
  if (!sameSize(source.full, next.full) || !sameSize(source.thumb, next.thumb)) {
    return ["Photo dimensions must match the current portrait so the profile and card layout stay the same."];
  }
  return [];
}

export function bookingUrlProblems(url: string): string[] {
  if (!url) return ["HotDoc URL is required so the existing booking link stays in place."];
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return ["HotDoc URL must be a full https://www.hotdoc.com.au booking link."];
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== "www.hotdoc.com.au") {
    return ["HotDoc URL must stay on https://www.hotdoc.com.au so the booking workflow is unchanged."];
  }
  if (parsed.searchParams.get("wp") !== "w_lightbox") {
    return ["HotDoc URL must keep wp=w_lightbox so the existing booking lightbox still opens."];
  }
  if (/[\s"<>]/.test(url)) return ["HotDoc URL cannot change the page structure."];
  return [];
}

/** Accepts an upload only when the bytes are an approved, verified portrait of the same size. */
export function matchVerifiedUpload(bytes: Buffer, sourceFile: string): { file: string | null; problems: string[] } {
  if (!isWebp(bytes)) {
    return { file: null, problems: ["Only an approved WebP practitioner image can be used."] };
  }
  const uploaded = webpSize(bytes);
  const source = readPair(sourceFile);
  if (!uploaded || !source || !sameSize(uploaded, webpSize(source.full))) {
    return {
      file: null,
      problems: ["This image does not match the current portrait dimensions, so the profile and card were left unchanged."],
    };
  }
  for (const name of compatiblePortraits(sourceFile)) {
    const existing = readTeamFile(name);
    if (existing && existing.equals(bytes)) return { file: name, problems: [] };
  }
  return {
    file: null,
    problems: ["This file is not a verified practitioner image. The profile and card were left unchanged."],
  };
}

export function applyPractitionerMedia(
  html: string,
  content: { portraitFile?: string; sourcePortraitFile?: string; bookingUrl?: string; sourceBookingUrl?: string },
): { html: string; errors: string[] } {
  const errors: string[] = [];
  let next = html;
  const sourcePortrait = content.sourcePortraitFile ?? "";
  const portrait = content.portraitFile ?? "";
  if (portrait && sourcePortrait && portrait !== sourcePortrait) {
    const problems = portraitProblems(sourcePortrait, portrait);
    if (problems.length > 0) errors.push(...problems);
    else next = replacePortraitFile(next, sourcePortrait, portrait);
  }
  const sourceBooking = content.sourceBookingUrl ?? "";
  const booking = content.bookingUrl ?? "";
  if (booking && sourceBooking && booking !== sourceBooking) {
    const problems = bookingUrlProblems(booking);
    if (problems.length > 0) errors.push(...problems);
    else next = replaceBookingUrl(next, sourceBooking, booking);
  }
  if (imgFrames(html) !== imgFrames(next) || bookingFrames(html) !== bookingFrames(next)) {
    errors.push("The photo or booking link would change the page layout.");
    return { html, errors };
  }
  return { html: errors.length > 0 ? html : next, errors };
}

function replacePortraitFile(html: string, sourceFile: string, nextFile: string): string {
  const sourceStem = sourceFile.replace(/\.webp$/i, "");
  const nextStem = nextFile.replace(/\.webp$/i, "");
  return html.split(`${sourceStem}-640.webp`).join(`${nextStem}-640.webp`).split(`${sourceStem}.webp`).join(`${nextStem}.webp`);
}

function replaceBookingUrl(html: string, sourceUrl: string, nextUrl: string): string {
  return html.replace(/<a\b[^>]*>/gi, (tag) => {
    if (!/data-hotdoc-widget="lightbox"/i.test(tag) || !tag.includes(`href="${sourceUrl}"`)) return tag;
    return tag.replace(`href="${sourceUrl}"`, `href="${nextUrl}"`);
  });
}

function imgFrames(html: string): string {
  return [...html.matchAll(/<img\b[^>]*>/gi)]
    .map((match) => match[0].replace(/\s(?:src|srcset|data-local-team-src)="[^"]*"/gi, ""))
    .join("\n");
}

function bookingFrames(html: string): string {
  return [...html.matchAll(/<a\b[^>]*data-hotdoc-widget="lightbox"[^>]*>/gi)]
    .map((match) => match[0].replace(/\shref="[^"]*"/i, ""))
    .join("\n");
}

function readPair(fileName: string): { full: Buffer; thumb: Buffer } | null {
  const full = readTeamFile(fileName);
  const thumb = readTeamFile(fileName.replace(/\.webp$/i, "-640.webp"));
  if (!full || !thumb || !isWebp(full) || !isWebp(thumb)) return null;
  return { full, thumb };
}

function readTeamFile(fileName: string): Buffer | null {
  if (!PORTRAIT_NAME.test(fileName) && !/^[a-z0-9-]+-640\.webp$/.test(fileName)) return null;
  const absolute = path.join(webRoot(), "public", "assets", "team", fileName);
  if (!absolute.startsWith(path.join(webRoot(), "public", "assets", "team"))) return null;
  return fs.existsSync(absolute) ? fs.readFileSync(absolute) : null;
}

function sameSize(left: Buffer | { width: number; height: number } | null, right: Buffer | { width: number; height: number } | null): boolean {
  const a = Buffer.isBuffer(left) ? webpSize(left) : left;
  const b = Buffer.isBuffer(right) ? webpSize(right) : right;
  return a != null && b != null && a.width === b.width && a.height === b.height;
}

function isWebp(buffer: Buffer): boolean {
  return buffer.length > 16 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
}

function webpSize(buffer: Buffer): { width: number; height: number } | null {
  if (!isWebp(buffer)) return null;
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8X" && buffer.length >= 30) {
    return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  }
  if (chunk === "VP8 " && buffer.length >= 30) {
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === "VP8L" && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}
