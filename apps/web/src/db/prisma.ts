import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Cap Prisma's internal pool for shared poolers (Supabase session mode is often
 * limited to ~15 clients). Without a low connection_limit, concurrent public
 * renders fan out Promise.all queries and exhaust the pooler (EMAXCONNSESSION → HTTP 500).
 */
function datasourceUrl(): string | undefined {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return undefined;
  const limit = process.env.PRISMA_CONNECTION_LIMIT?.trim() || "1";
  try {
    const url = new URL(raw);
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", limit);
    }
    // Supabase transaction pooler (6543) requires pgbouncer=true for Prisma.
    if (url.port === "6543" && !url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

function createPrismaClient(): PrismaClient {
  const url = datasourceUrl();
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(url ? { datasources: { db: { url } } } : {}),
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Always reuse the singleton — including production — so Hostinger does not open
// a fresh pool per module graph / isolate under load.
globalForPrisma.prisma = prisma;
