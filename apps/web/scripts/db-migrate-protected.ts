/**
 * Protected prisma migrate deploy wrapper.
 * Uses DIRECT_URL / ADMIN_DATABASE_URL as DATABASE_URL for the migrate process only.
 * Does not add directUrl to schema.prisma (avoids breaking Hostinger staging builds).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget, formatDbTargetSummary, resolveAdminDatabaseUrl } from "../src/db/assert-db-target";
import { loadEnvFileSafe } from "../src/db/safe-env";

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function main() {
  loadEnvFileSafe(path.join(webDir, ".env"), { allowProtectedKeys: false });
  const target = assertDbTarget({ operation: "migrate" });
  console.log(JSON.stringify({ dbTarget: formatDbTargetSummary(target) }));

  const adminUrl = resolveAdminDatabaseUrl();
  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    cwd: webDir,
    env: { ...process.env, DATABASE_URL: adminUrl },
    stdio: "inherit",
    shell: true,
  });
  process.exit(result.status ?? 1);
}

try {
  main();
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
