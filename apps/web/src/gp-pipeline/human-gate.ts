/** Human-only gates — mirrors onboarding / attraction CMS rules. */

const FORBIDDEN = new Set(["system", "auto", "bot", "automation", "ci", "n/a", "na"]);

export function assertHumanReviewerId(reviewerId: string) {
  const normalized = reviewerId.trim().toLowerCase();
  if (!normalized || FORBIDDEN.has(normalized)) {
    throw new Error("Human review only — reviewerId cannot be system/auto");
  }
}
