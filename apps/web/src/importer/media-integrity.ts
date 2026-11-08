import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { imageUsesFromHtml, normalizeAssetPath } from "@/cms/image-governance";
import { webRoot } from "@/importer/golden-root";

export type MediaIntegrityIssue = {
  code: string;
  path?: string;
  asset?: string;
  message: string;
};

export type MediaIntegrityOptions = {
  publicRoot?: string;
  assetDependencies?: string[];
  /** Offline unit tests may skip filesystem existence when fixtures have no assets. */
  skipMissingFiles?: boolean;
  /** Approved Phase 5C asset checksums that must remain unchanged when present. */
  frozenAssetSha256?: Record<string, string>;
};

const APPROVED_ASSET_PREFIXES = ["assets/", "images/", "wmc-cache/", "brand/", "team/", "favicon", "apple-touch"];

function isLocalAsset(assetPath: string): boolean {
  if (!assetPath || /^https?:\/\//i.test(assetPath)) return false;
  if (assetPath.startsWith("data:") || assetPath.startsWith("mailto:")) return false;
  return true;
}

function assertNoPathEscape(assetPath: string): MediaIntegrityIssue | null {
  const raw = assetPath.trim();
  if (raw.includes("..") || raw.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(raw)) {
    return {
      code: "path_escape",
      asset: assetPath,
      message: "Asset path escapes approved relative directories.",
    };
  }
  const normalised = normalizeAssetPath(assetPath);
  if (!normalised) return { code: "empty_asset", asset: assetPath, message: "Empty or unusable asset path." };
  if (normalised.includes("..") || path.isAbsolute(normalised) || normalised.startsWith("/")) {
    return {
      code: "path_escape",
      asset: assetPath,
      message: "Asset path escapes approved relative directories.",
    };
  }
  return null;
}

/**
 * Validate media references for an approved page HTML payload.
 * Does not modify image files.
 */
export function validateMediaReferencesForHtml(
  html: string,
  pagePath: string,
  options: MediaIntegrityOptions = {},
): { ok: boolean; issues: MediaIntegrityIssue[]; referenced: string[] } {
  const publicRoot = options.publicRoot ?? path.join(webRoot(), "public");
  const issues: MediaIntegrityIssue[] = [];
  // Raw src values (before normalize collapses "..") — catch path escapes fail-closed.
  for (const match of html.matchAll(/\b(?:src|href|content)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const raw = (match[1] ?? match[2] ?? "").trim();
    if (!raw || /^https?:\/\//i.test(raw) || raw.startsWith("data:") || raw.startsWith("mailto:") || raw.startsWith("tel:")) {
      continue;
    }
    const escapeRaw = assertNoPathEscape(raw);
    if (escapeRaw) issues.push({ ...escapeRaw, path: pagePath });
  }

  const uses = imageUsesFromHtml(html, pagePath);
  const referenced = [...new Set(uses.map((u) => normalizeAssetPath(u.assetPath)).filter(Boolean))];

  for (const asset of referenced) {
    if (!isLocalAsset(asset)) continue;
    const escape = assertNoPathEscape(asset);
    if (escape) {
      issues.push({ ...escape, path: pagePath });
      continue;
    }

    const allowedPrefix = APPROVED_ASSET_PREFIXES.some(
      (prefix) => asset === prefix || asset.startsWith(prefix) || asset.includes(`/${prefix}`),
    );
    // Relative assets like ../assets/team/... normalize to assets/team/...
    if (!allowedPrefix && !asset.startsWith("assets/") && !asset.startsWith("images/")) {
      // Soft: still check existence; flag unusual roots
      if (!asset.includes(".")) {
        issues.push({
          code: "unexpected_asset_root",
          path: pagePath,
          asset,
          message: "Local asset is outside the usual approved media roots.",
        });
      }
    }

    if (!options.skipMissingFiles) {
      const absolute = path.join(publicRoot, asset.replace(/^\.\//, ""));
      const rootResolved = path.resolve(publicRoot);
      const absResolved = path.resolve(absolute);
      if (!absResolved.startsWith(rootResolved + path.sep) && absResolved !== rootResolved) {
        issues.push({
          code: "path_escape",
          path: pagePath,
          asset,
          message: "Resolved asset escapes public root.",
        });
      } else if (!fs.existsSync(absResolved)) {
        issues.push({
          code: "missing_file",
          path: pagePath,
          asset,
          message: "Referenced media file does not exist under public root.",
        });
      }
    }

    // Practitioner portrait naming heuristic: doctors/dr-foo.html → prefer assets/team containing slug tokens
    if (pagePath.startsWith("doctors/") && asset.includes("/team/")) {
      const slug = pagePath.replace(/^doctors\//, "").replace(/\.html$/, "");
      const tokens = slug.replace(/^dr-/, "").split("-").filter((t) => t.length > 2);
      const file = asset.toLowerCase();
      const matched = tokens.some((t) => file.includes(t));
      if (tokens.length && !matched) {
        issues.push({
          code: "practitioner_image_mismatch",
          path: pagePath,
          asset,
          message: "Team portrait filename does not appear to match the practitioner page slug.",
        });
      }
    }
  }

  if (options.assetDependencies?.length) {
    for (const dep of options.assetDependencies) {
      const escape = assertNoPathEscape(dep);
      if (escape) {
        issues.push({ ...escape, path: pagePath });
        continue;
      }
      if (!referenced.includes(normalizeAssetPath(dep)) && !options.skipMissingFiles) {
        // Declared dependency should appear in HTML or still exist on disk for CSS/background use
        const absolute = path.join(publicRoot, dep);
        if (!fs.existsSync(absolute)) {
          issues.push({
            code: "declared_dependency_missing",
            path: pagePath,
            asset: dep,
            message: "Manifest asset dependency is missing from disk.",
          });
        }
      }
    }
  }

  if (options.frozenAssetSha256) {
    for (const [rel, expectedSha] of Object.entries(options.frozenAssetSha256)) {
      const absolute = path.join(publicRoot, rel);
      if (!fs.existsSync(absolute)) continue;
      const actual = crypto.createHash("sha256").update(fs.readFileSync(absolute)).digest("hex");
      if (actual !== expectedSha) {
        issues.push({
          code: "frozen_asset_changed",
          asset: rel,
          message: "Approved Phase 5C / frozen asset checksum changed — do not modify image files in this phase.",
        });
      }
    }
  }

  return { ok: issues.length === 0, issues, referenced };
}

/** Account for media approval metadata fields without inventing approvals. */
export function mediaApprovalMetadataPresent(row: {
  approvedAt?: Date | string | null;
  contentSha256?: string | null;
  evidenceReference?: string | null;
}): { accounted: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!row.approvedAt) missing.push("approvedAt");
  if (!row.contentSha256) missing.push("contentSha256");
  if (!row.evidenceReference) missing.push("evidenceReference");
  return { accounted: missing.length === 0, missing };
}
