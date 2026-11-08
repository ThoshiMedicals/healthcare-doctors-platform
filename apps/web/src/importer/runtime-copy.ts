import fs from "node:fs";
import path from "node:path";
import { listRuntimeFiles, webRoot } from "@/importer/golden-root";

/**
 * Production and ordinary golden imports are DB-only.
 * Runtime copies into apps/web/public require BOTH CLI/opt-in AND env.
 */
export type RuntimeCopyPolicy = {
  allowRuntimeCopy: boolean;
  envOptIn: boolean;
  enabled: boolean;
};

export function resolveRuntimeCopyPolicy(allowRuntimeCopy: boolean): RuntimeCopyPolicy {
  const envOptIn = process.env.IMPORT_ALLOW_RUNTIME_COPY === "true";
  if (allowRuntimeCopy && !envOptIn) {
    throw new Error(
      "Runtime-file copy was requested (--allow-runtime-copy) but IMPORT_ALLOW_RUNTIME_COPY is not exactly \"true\". Refusing unsafe copy into apps/web/public.",
    );
  }
  if (!allowRuntimeCopy && envOptIn) {
    throw new Error(
      "IMPORT_ALLOW_RUNTIME_COPY=true is set but --allow-runtime-copy was not passed. Refusing ambiguous runtime-copy configuration.",
    );
  }
  return {
    allowRuntimeCopy,
    envOptIn,
    enabled: allowRuntimeCopy && envOptIn,
  };
}

/** Copy golden runtime assets into apps/web/public. Call only when policy.enabled. */
export function copyRuntimeFiles(root: string): string[] {
  const publicDir = path.join(webRoot(), "public");
  const files = listRuntimeFiles(root);
  for (const relativePath of files) {
    const target = path.join(publicDir, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const source = path.join(root, relativePath);
    try {
      fs.copyFileSync(source, target);
    } catch (error) {
      const sourceBytes = fs.readFileSync(source);
      const currentBytes = fs.existsSync(target) ? fs.readFileSync(target) : Buffer.alloc(0);
      if (!sourceBytes.equals(currentBytes)) throw error;
    }
  }
  return files;
}

/** DB-only default: never touch public unless policy.enabled. */
export function maybeCopyRuntimeFiles(root: string, allowRuntimeCopy: boolean): string[] {
  const policy = resolveRuntimeCopyPolicy(allowRuntimeCopy);
  if (!policy.enabled) return [];
  return copyRuntimeFiles(root);
}
