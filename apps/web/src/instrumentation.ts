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

  const { prisma } = await import("@/db/prisma");
  const started = Date.now();
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await prisma.$connect();
      console.info(`[wmc-warm] prisma connected in ${Date.now() - started}ms (attempt ${attempt})`);
      return;
    } catch (error) {
      lastError = error;
      console.error(
        `[wmc-warm] prisma connect failed (attempt ${attempt}/3)`,
        error instanceof Error ? error.message : error,
      );
      await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  console.error(
    "[wmc-warm] prisma connect abandoned after retries",
    lastError instanceof Error ? lastError.message : lastError,
  );
}
