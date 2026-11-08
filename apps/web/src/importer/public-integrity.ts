import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { webRoot } from "@/importer/golden-root";

export type PublicIntegrityEntry = {
  relativePath: string;
  sha256: string;
  bytes: number;
};

export type PublicIntegrityManifest = {
  root: string;
  generatedAt: string;
  files: PublicIntegrityEntry[];
};

const SKIP_DIR_NAMES = new Set([".git", "node_modules"]);

function walkFiles(dir: string, root: string, out: string[]) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR_NAMES.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(absolute, root, out);
      continue;
    }
    out.push(path.relative(root, absolute).split(path.sep).join("/"));
  }
}

export function buildPublicIntegrityManifest(publicDir?: string): PublicIntegrityManifest {
  const root = publicDir ? path.resolve(publicDir) : path.join(webRoot(), "public");
  const relativePaths: string[] = [];
  walkFiles(root, root, relativePaths);
  relativePaths.sort();
  const files: PublicIntegrityEntry[] = relativePaths.map((relativePath) => {
    const bytes = fs.readFileSync(path.join(root, relativePath));
    return {
      relativePath,
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.length,
    };
  });
  return { root, generatedAt: new Date().toISOString(), files };
}

export function diffPublicIntegrity(
  before: PublicIntegrityManifest,
  after: PublicIntegrityManifest,
): { unchanged: boolean; added: string[]; removed: string[]; changed: string[] } {
  const beforeMap = new Map(before.files.map((f) => [f.relativePath, f.sha256]));
  const afterMap = new Map(after.files.map((f) => [f.relativePath, f.sha256]));
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  for (const [rel, sha] of afterMap) {
    if (!beforeMap.has(rel)) added.push(rel);
    else if (beforeMap.get(rel) !== sha) changed.push(rel);
  }
  for (const rel of beforeMap.keys()) {
    if (!afterMap.has(rel)) removed.push(rel);
  }
  return {
    unchanged: added.length === 0 && removed.length === 0 && changed.length === 0,
    added,
    removed,
    changed,
  };
}
