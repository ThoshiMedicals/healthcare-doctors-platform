import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const importerDir = path.dirname(fileURLToPath(import.meta.url));

/** Frozen approved website. The importer reads it and does not write to it. */
export function goldenHtmlRoot(): string {
  const configured = process.env.GOLDEN_HTML_ROOT;
  const root = configured ? path.resolve(configured) : path.resolve(importerDir, "../../../../old-html");
  if (!fs.existsSync(path.join(root, "index.html"))) {
    throw new Error(`Golden master index.html was not found at ${root}`);
  }
  return root;
}

export function webRoot(): string {
  return path.resolve(importerDir, "../..");
}

export const RUNTIME_COPY_DIRECTORIES = ["assets", "search-index"] as const;

export const RUNTIME_ROOT_EXTENSIONS = new Set([".css", ".js", ".txt", ".xml"]);

export function listHtmlFiles(root: string): string[] {
  const files: string[] = [];
  walk(root, root, files);
  return files.filter((file) => file.endsWith(".html")).sort();
}

function walk(dir: string, root: string, files: string[]) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (dir === root && (entry.name === "tools" || entry.name === "qa" || entry.name === "cms")) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(absolute, root, files);
      continue;
    }
    files.push(path.relative(root, absolute).split(path.sep).join("/"));
  }
}

export function listRuntimeFiles(root: string): string[] {
  const files: string[] = [];
  walk(root, root, files);
  return files.filter((file) => {
    if (file.endsWith(".html") || file.endsWith(".md") || file.endsWith(".py")) return false;
    const top = file.split("/")[0];
    if (RUNTIME_COPY_DIRECTORIES.includes(top as (typeof RUNTIME_COPY_DIRECTORIES)[number])) return true;
    if (!file.includes("/")) return RUNTIME_ROOT_EXTENSIONS.has(path.extname(file).toLowerCase());
    return false;
  });
}
