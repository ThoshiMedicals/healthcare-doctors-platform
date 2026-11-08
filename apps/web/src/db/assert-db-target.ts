/**
 * Fail-closed database target guard for migrate / seed / import / dump wrappers.
 * Never logs connection strings or passwords.
 */

export type DbWriteOperation = "migrate" | "seed" | "import" | "dump" | "admin";

export type DbTargetEnv = Record<string, string | undefined>;

export type AssertDbTargetOptions = {
  operation: DbWriteOperation;
  /** Expected production project ref once provisioned (e.g. abcdefghijklmnop). */
  expectedProjectRef?: string | null;
  /** When true, require WMC_PRODUCTION_DB_APPROVED=yes. Default true for write ops. */
  requireApproval?: boolean;
  env?: DbTargetEnv;
};

export type AssertDbTargetResult = {
  ok: true;
  operation: DbWriteOperation;
  projectRef: string;
  databaseHost: string;
  port: string;
  usesTransactionPooler: boolean;
  connectionUser: string;
};

const STAGING_PROJECT_REF = "thwcxuhrzgkufvdrvzzt";

const BLOCKED_HOST_FRAGMENTS = [
  "localhost",
  "127.0.0.1",
  "[::1]",
  "host.docker.internal",
  STAGING_PROJECT_REF,
];

function redactMessage(message: string): string {
  return message.replace(/:[^:@/]+@/g, ":***@").replace(/password=[^&\s]+/gi, "password=***");
}

function parseDatabaseUrl(raw: string): URL {
  try {
    return new URL(raw);
  } catch {
    throw new Error("DATABASE_URL / DIRECT_URL is not a valid URL.");
  }
}

function projectRefFromUrl(url: URL): string | null {
  const user = decodeURIComponent(url.username || "");
  // pooler: postgres.<ref> or prisma.<ref>
  const userMatch = user.match(/^[^.]+\.([a-z0-9]{20})$/i);
  if (userMatch) return userMatch[1].toLowerCase();
  // direct: db.<ref>.supabase.co
  const hostMatch = url.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
  if (hostMatch) return hostMatch[1].toLowerCase();
  const poolerMatch = url.hostname.match(/\.pooler\.supabase\.com$/i);
  if (poolerMatch && user.includes(".")) {
    const parts = user.split(".");
    const maybe = parts[parts.length - 1];
    if (/^[a-z0-9]{20}$/i.test(maybe)) return maybe.toLowerCase();
  }
  return null;
}

function assertNotBlockedHost(url: URL): void {
  const host = url.hostname.toLowerCase();
  const full = url.toString().toLowerCase();
  for (const fragment of BLOCKED_HOST_FRAGMENTS) {
    if (host === fragment || host.includes(fragment) || full.includes(fragment)) {
      throw new Error(
        `Refusing database write: connection target matches blocked host/ref "${fragment}" (staging/localhost).`,
      );
    }
  }
}

/**
 * Resolve the administrative connection URL for migrate/seed/import/dump.
 * Prefer DIRECT_URL; never invent a fallback from staging .env when approval is required.
 */
export function resolveAdminDatabaseUrl(env: DbTargetEnv = process.env): string {
  const direct = env.DIRECT_URL?.trim();
  const admin = env.ADMIN_DATABASE_URL?.trim();
  const databaseUrl = env.DATABASE_URL?.trim();
  const chosen = direct || admin || databaseUrl;
  if (!chosen) {
    throw new Error(
      "No administrative database URL set. Provide DIRECT_URL (preferred) or ADMIN_DATABASE_URL for migrate/seed/import/dump.",
    );
  }
  return chosen;
}

export function assertDbTarget(options: AssertDbTargetOptions): AssertDbTargetResult {
  const env = options.env ?? process.env;
  const requireApproval = options.requireApproval !== false;

  if (requireApproval && env.WMC_PRODUCTION_DB_APPROVED !== "yes") {
    throw new Error(
      `Refusing ${options.operation}: set WMC_PRODUCTION_DB_APPROVED=yes only after explicit operator approval for the production target.`,
    );
  }

  const expected =
    (options.expectedProjectRef || env.WMC_PRODUCTION_PROJECT_REF || "").trim().toLowerCase() || null;
  if (!expected) {
    throw new Error(
      `Refusing ${options.operation}: WMC_PRODUCTION_PROJECT_REF (or expectedProjectRef) must identify the production Supabase project.`,
    );
  }
  if (expected === STAGING_PROJECT_REF) {
    throw new Error(`Refusing ${options.operation}: expected project ref must not be the staging project.`);
  }

  const adminUrlRaw = resolveAdminDatabaseUrl(env);
  const adminUrl = parseDatabaseUrl(adminUrlRaw);
  assertNotBlockedHost(adminUrl);

  const projectRef = projectRefFromUrl(adminUrl);
  if (!projectRef) {
    throw new Error(
      `Refusing ${options.operation}: could not derive Supabase project ref from administrative connection identity.`,
    );
  }
  if (projectRef !== expected) {
    throw new Error(
      `Refusing ${options.operation}: connection project ref does not match WMC_PRODUCTION_PROJECT_REF.`,
    );
  }
  if (projectRef === STAGING_PROJECT_REF) {
    throw new Error(`Refusing ${options.operation}: staging project ref is never a valid production write target.`);
  }

  const port = adminUrl.port || (adminUrl.protocol.startsWith("postgres") ? "5432" : "");
  const usesTransactionPooler = port === "6543";

  if (
    (options.operation === "migrate" ||
      options.operation === "seed" ||
      options.operation === "import" ||
      options.operation === "dump") &&
    usesTransactionPooler
  ) {
    throw new Error(
      `Refusing ${options.operation}: transaction pooler port 6543 is not suitable. Use DIRECT_URL / session or direct port 5432.`,
    );
  }

  // Runtime DATABASE_URL (if present) must not silently point at staging while admin points at prod.
  const runtimeRaw = env.DATABASE_URL?.trim();
  if (runtimeRaw) {
    try {
      const runtimeUrl = parseDatabaseUrl(runtimeRaw);
      const runtimeRef = projectRefFromUrl(runtimeUrl);
      if (runtimeRef === STAGING_PROJECT_REF) {
        throw new Error(
          `Refusing ${options.operation}: DATABASE_URL still targets the staging project. Clear or retarget before production writes.`,
        );
      }
      if (runtimeRef && runtimeRef !== expected && options.operation !== "dump") {
        throw new Error(
          `Refusing ${options.operation}: DATABASE_URL project ref does not match the approved production project.`,
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Refusing")) throw error;
      throw new Error(redactMessage(`Refusing ${options.operation}: DATABASE_URL is invalid.`));
    }
  }

  return {
    ok: true,
    operation: options.operation,
    projectRef,
    databaseHost: adminUrl.hostname,
    port,
    usesTransactionPooler,
    connectionUser: (adminUrl.username || "").split(".")[0] || "(unknown)",
  };
}

/** Safe summary for logs — never includes passwords or full URLs. */
export function formatDbTargetSummary(result: AssertDbTargetResult): string {
  return [
    `operation=${result.operation}`,
    `projectRef=${result.projectRef}`,
    `host=${result.databaseHost}`,
    `port=${result.port}`,
    `user=${result.connectionUser}`,
    `transactionPooler=${result.usesTransactionPooler}`,
  ].join(" ");
}
