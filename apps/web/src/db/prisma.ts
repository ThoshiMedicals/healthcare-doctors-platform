import { PrismaClient } from "@prisma/client";
import { buildPrismaDatasourceUrl } from "@/db/prisma-url";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const url = buildPrismaDatasourceUrl(process.env.DATABASE_URL);
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(url ? { datasources: { db: { url } } } : {}),
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Always reuse the singleton — including production — so Hostinger does not open
// a fresh pool per module graph / isolate under load.
globalForPrisma.prisma = prisma;
