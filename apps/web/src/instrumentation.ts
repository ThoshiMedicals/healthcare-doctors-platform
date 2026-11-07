/**
 * Node boot hook: open Prisma early and prepare critical public HTML snapshots.
 * Runs only in the Node.js runtime (not Edge middleware).
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { warmPublicDelivery } = await import("@/documents/warm-public-delivery");
    // Await connect + critical warm so the first external request can HIT.
    // Failures must not crash the process — public routes still render on demand.
    const result = await warmPublicDelivery();
    console.info(
      `[wmc-warm] connected=${result.connected} warmed=${result.warmed} clinic=${result.clinicId ?? "none"}`,
    );
  } catch (error) {
    console.error("[wmc-warm] boot warm failed", error instanceof Error ? error.message : error);
  }
}
