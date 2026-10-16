import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import EmbeddedPostgres from "embedded-postgres";

const databaseDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.pgdata");
fs.mkdirSync(databaseDir, { recursive: true });

const server = new EmbeddedPostgres({
  databaseDir,
  user: "wmc",
  password: "wmc",
  port: 5432,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

async function main() {
  const alreadyInitialised = fs.existsSync(path.join(databaseDir, "PG_VERSION"));
  if (!alreadyInitialised) await server.initialise();
  await server.start();
  await server.createDatabase("wmc").catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already exists/i.test(message)) throw error;
  });

  console.log("PostgreSQL ready on localhost:5432 database wmc");
  await new Promise(() => undefined);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
