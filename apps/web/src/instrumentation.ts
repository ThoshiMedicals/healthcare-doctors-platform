/**
 * Node boot hook: open Prisma early so the first request does not pay
 * connection + TLS setup inside the document render path.
 *
 * Full HTML warm runs on demand and persists via durable disk snapshots;
 * do not import the render pipeline here — Next webpack would pull node:
 * builtins into an unsupported bundle graph.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { prisma } = await import("@/db/prisma");
    const started = Date.now();
    await prisma.$connect();
    console.info(`[wmc-warm] prisma connected in ${Date.now() - started}ms`);
  } catch (error) {
    console.error(
      "[wmc-warm] prisma connect failed",
      error instanceof Error ? error.message : error,
    );
  }
}
