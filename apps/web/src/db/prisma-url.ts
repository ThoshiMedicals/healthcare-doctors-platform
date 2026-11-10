/**
 * Build the Prisma datasource URL with Hostinger-safe pool settings.
 *
 * History: `connection_limit=1` stopped Supabase session-pooler exhaustion on
 * public pages, but it starves admin routes that use Promise.all (pool timeout
 * → Next.js “Application error” digests). Default to a small shared pool.
 */
export function buildPrismaDatasourceUrl(
  raw: string | undefined,
  options: { connectionLimit?: string; poolTimeoutSeconds?: string } = {},
): string | undefined {
  if (!raw?.trim()) return undefined;
  const limit = options.connectionLimit?.trim() || process.env.PRISMA_CONNECTION_LIMIT?.trim() || "5";
  const poolTimeout =
    options.poolTimeoutSeconds?.trim() || process.env.PRISMA_POOL_TIMEOUT?.trim() || "20";
  try {
    const url = new URL(raw.trim());
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", limit);
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", poolTimeout);
    }
    // Supabase transaction pooler (6543) requires pgbouncer=true for Prisma.
    if (url.port === "6543" && !url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }
    return url.toString();
  } catch {
    return raw.trim();
  }
}
