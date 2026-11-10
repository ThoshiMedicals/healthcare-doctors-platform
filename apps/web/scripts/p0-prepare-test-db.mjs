/**
 * Creates disposable local DB `wmc_p0_test` and applies migrations.
 * Never targets staging/production Supabase.
 */
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const adminUrl = process.env.WMC_P0_ADMIN_DATABASE_URL || "postgresql://wmc:wmc@localhost:5432/postgres";
const testUrl = process.env.WMC_P0_TEST_DATABASE_URL || "postgresql://wmc:wmc@localhost:5432/wmc_p0_test?schema=public";

if (/supabase|thwcxuhrzgkufvdrvzzt|hostinger/i.test(adminUrl + testUrl)) {
  console.error("Refusing to prepare P0 test DB against staging/production host.");
  process.exit(1);
}

const admin = new PrismaClient({ datasources: { db: { url: adminUrl } } });
try {
  await admin.$executeRawUnsafe(`CREATE DATABASE wmc_p0_test`);
  console.log("created wmc_p0_test");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!/already exists/i.test(message)) {
    // Prisma may not allow CREATE DATABASE via this driver on all setups — try again via note.
    console.warn("create database note:", message.split("\n")[0]);
  } else {
    console.log("wmc_p0_test already exists");
  }
} finally {
  await admin.$disconnect();
}

process.env.DATABASE_URL = testUrl;
const migrated = spawnSync(
  process.execPath,
  ["./node_modules/prisma/build/index.js", "migrate", "deploy"],
  { cwd: process.cwd(), env: process.env, stdio: "inherit" },
);
if (migrated.status !== 0) process.exit(migrated.status ?? 1);
console.log("P0_TEST_DATABASE_URL=" + testUrl);
