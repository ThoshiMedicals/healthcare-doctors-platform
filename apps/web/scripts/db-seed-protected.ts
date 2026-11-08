import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget, formatDbTargetSummary, resolveAdminDatabaseUrl } from "../src/db/assert-db-target";
import { loadEnvFileSafe } from "../src/db/safe-env";

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function main() {
  loadEnvFileSafe(path.join(webDir, ".env"), { allowProtectedKeys: false });
  const target = assertDbTarget({ operation: "seed" });
  console.log(JSON.stringify({ dbTarget: formatDbTargetSummary(target) }));

  const adminUrl = resolveAdminDatabaseUrl();
  const result = spawnSync("npx", ["tsx", "prisma/seed.ts"], {
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
