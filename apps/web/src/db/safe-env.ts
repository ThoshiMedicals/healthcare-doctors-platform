import fs from "node:fs";

/** Keys that must never be filled silently from apps/web/.env for production write commands. */
export const PROTECTED_DB_ENV_KEYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "ADMIN_DATABASE_URL",
  "WMC_PRODUCTION_PROJECT_REF",
  "WMC_PRODUCTION_DB_APPROVED",
  "IMPORT_ALLOW_RUNTIME_COPY",
  "SEED_ADMIN_PASSWORD",
  "SEED_ADMIN_EMAIL",
  "SEED_ADMIN_USERNAME",
] as const;

/**
 * Load .env into process.env for non-protected keys only when writing to a DB.
 * Protected keys must already be present in the process environment (operator-supplied).
 */
export function loadEnvFileSafe(
  file: string,
  options?: { allowProtectedKeys?: boolean; env?: Record<string, string | undefined> },
): { loaded: string[]; skippedProtected: string[] } {
  const env = options?.env ?? (process.env as Record<string, string | undefined>);
  const loaded: string[] = [];
  const skippedProtected: string[] = [];
  if (!fs.existsSync(file)) return { loaded, skippedProtected };

  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    if (env[key]) continue;
    const protectedKey = (PROTECTED_DB_ENV_KEYS as readonly string[]).includes(key);
    if (protectedKey && !options?.allowProtectedKeys) {
      skippedProtected.push(key);
      continue;
    }
    env[key] = match[2].replace(/^["']|["']$/g, "");
    loaded.push(key);
  }
  return { loaded, skippedProtected };
}
