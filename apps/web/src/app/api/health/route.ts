import { prisma } from "@/db/prisma";
import { PLATFORM_PHASE } from "@/platform";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, phase: PLATFORM_PHASE, database: "up" });
  } catch {
    return Response.json({ ok: false, phase: PLATFORM_PHASE, database: "down" }, { status: 503 });
  }
}
