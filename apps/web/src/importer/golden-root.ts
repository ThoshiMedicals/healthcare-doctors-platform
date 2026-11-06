import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const importerDir = path.dirname(fileURLToPath(import.meta.url));

/** Frozen approved website. The importer reads it and does not write to it. */
export function goldenHtmlRoot(override?: string | null): string {
  const configured = override || process.env.GOLDEN_HTML_ROOT;
  const root = configured ? path.resolve(configured) : path.resolve(importerDir, "../../../../old-html");
  if (!fs.existsSync(path.join(root, "index.html"))) {
    throw new Error(`Golden master index.html was not found at ${root}`);
  }
  return root;
}

/** Parse CLI flags shared by import:golden / validate:golden. */
export function parseImporterCliArgs(argv: string[] = process.argv.slice(2)): {
  clinicSlug: string;
  dryRun: boolean;
  goldenRoot?: string;
} {
  let clinicSlug = process.env.DEFAULT_CLINIC_SLUG || "woolloongabba";
  let dryRun = false;
  let goldenRoot: string | undefined;
  for (const arg of argv) {
    if (arg === "--dry-run" || arg === "--dryRun") {
      dryRun = true;
      continue;
    }
    const clinicMatch = arg.match(/^--clinic(?:=(.*))?$/);
    if (clinicMatch) {
      clinicSlug = (clinicMatch[1] || "").trim() || clinicSlug;
      continue;
    }
    const rootMatch = arg.match(/^--golden-root(?:=(.*))?$/);
    if (rootMatch) {
      goldenRoot = (rootMatch[1] || "").trim() || undefined;
    }
  }
  // Support `--clinic slug` / `--golden-root path` two-token forms.
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--clinic" && argv[i + 1] && !argv[i + 1].startsWith("--")) {
      clinicSlug = argv[i + 1].trim();
    }
    if (argv[i] === "--golden-root" && argv[i + 1] && !argv[i + 1].startsWith("--")) {
      goldenRoot = argv[i + 1].trim();
    }
  }
  return { clinicSlug, dryRun, goldenRoot };
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
