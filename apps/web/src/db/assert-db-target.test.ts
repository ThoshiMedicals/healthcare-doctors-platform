import assert from "node:assert/strict";
import test from "node:test";
import { assertDbTarget, resolveAdminDatabaseUrl } from "@/db/assert-db-target";

const PROD_REF = "abcdefghijabcdefghij";

function baseEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    WMC_PRODUCTION_DB_APPROVED: "yes",
    WMC_PRODUCTION_PROJECT_REF: PROD_REF,
    DIRECT_URL: `postgresql://prisma.${PROD_REF}:secret@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres`,
    DATABASE_URL: `postgresql://prisma.${PROD_REF}:secret@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true`,
    ...overrides,
  };
}

test("assertDbTarget passes for approved production session URL", () => {
  const result = assertDbTarget({ operation: "migrate", env: baseEnv() });
  assert.equal(result.ok, true);
  assert.equal(result.projectRef, PROD_REF);
  assert.equal(result.port, "5432");
  assert.equal(result.usesTransactionPooler, false);
});

test("assertDbTarget refuses missing approval", () => {
  assert.throws(
    () => assertDbTarget({ operation: "import", env: baseEnv({ WMC_PRODUCTION_DB_APPROVED: undefined }) }),
    /WMC_PRODUCTION_DB_APPROVED/,
  );
});

test("assertDbTarget refuses staging project ref", () => {
  assert.throws(
    () =>
      assertDbTarget({
        operation: "seed",
        env: baseEnv({
          WMC_PRODUCTION_PROJECT_REF: "thwcxuhrzgkufvdrvzzt",
          DIRECT_URL:
            "postgresql://prisma.thwcxuhrzgkufvdrvzzt:secret@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres",
          DATABASE_URL:
            "postgresql://prisma.thwcxuhrzgkufvdrvzzt:secret@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres",
        }),
      }),
    /staging/,
  );
});

test("assertDbTarget refuses localhost", () => {
  assert.throws(
    () =>
      assertDbTarget({
        operation: "migrate",
        env: baseEnv({
          DIRECT_URL: "postgresql://postgres:postgres@127.0.0.1:5432/wmc",
          DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5432/wmc",
        }),
      }),
    /blocked host/,
  );
});

test("assertDbTarget refuses transaction pooler for migrate", () => {
  assert.throws(
    () =>
      assertDbTarget({
        operation: "migrate",
        env: baseEnv({
          DIRECT_URL: `postgresql://prisma.${PROD_REF}:secret@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres`,
        }),
      }),
    /6543/,
  );
});

test("assertDbTarget refuses DATABASE_URL still on staging", () => {
  assert.throws(
    () =>
      assertDbTarget({
        operation: "import",
        env: baseEnv({
          DATABASE_URL:
            "postgresql://prisma.thwcxuhrzgkufvdrvzzt:secret@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres",
        }),
      }),
    /staging project/,
  );
});

test("resolveAdminDatabaseUrl prefers DIRECT_URL", () => {
  const url = resolveAdminDatabaseUrl({
    DIRECT_URL: "postgresql://a:b@host:5432/db",
    DATABASE_URL: "postgresql://c:d@host:6543/db",
  });
  assert.match(url, /:5432/);
});

test("assertDbTarget refuses missing DIRECT_URL/ADMIN when only absent", () => {
  assert.throws(
    () =>
      assertDbTarget({
        operation: "migrate",
        env: {
          WMC_PRODUCTION_DB_APPROVED: "yes",
          WMC_PRODUCTION_PROJECT_REF: PROD_REF,
        },
      }),
    /No administrative database URL/,
  );
});

test("assertDbTarget refuses wrong project identity in connection user", () => {
  const other = "zzzzzzzzzzzzzzzzzzzz";
  assert.throws(
    () =>
      assertDbTarget({
        operation: "import",
        env: baseEnv({
          DIRECT_URL: `postgresql://prisma.${other}:secret@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres`,
          DATABASE_URL: `postgresql://prisma.${other}:secret@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres`,
        }),
      }),
    /does not match/,
  );
});

test("resolveAdminDatabaseUrl refuses empty URLs", () => {
  assert.throws(() => resolveAdminDatabaseUrl({}), /No administrative database URL/);
});
