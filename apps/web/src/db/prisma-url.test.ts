import assert from "node:assert/strict";
import test from "node:test";
import { buildPrismaDatasourceUrl } from "./prisma-url";

test("defaults connection_limit and pool_timeout for session pooler URLs", () => {
  const url = buildPrismaDatasourceUrl(
    "postgresql://u:p@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres",
    { connectionLimit: "5", poolTimeoutSeconds: "20" },
  );
  assert.ok(url);
  const parsed = new URL(url!);
  assert.equal(parsed.searchParams.get("connection_limit"), "5");
  assert.equal(parsed.searchParams.get("pool_timeout"), "20");
});

test("adds pgbouncer=true for transaction pooler port 6543", () => {
  const url = buildPrismaDatasourceUrl(
    "postgresql://u:p@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres",
    { connectionLimit: "5" },
  );
  assert.ok(url);
  const parsed = new URL(url!);
  assert.equal(parsed.searchParams.get("pgbouncer"), "true");
  assert.equal(parsed.searchParams.get("connection_limit"), "5");
});

test("respects explicit connection_limit already on the URL", () => {
  const url = buildPrismaDatasourceUrl(
    "postgresql://u:p@host:5432/db?connection_limit=2",
    { connectionLimit: "5" },
  );
  assert.ok(url);
  assert.equal(new URL(url!).searchParams.get("connection_limit"), "2");
});
