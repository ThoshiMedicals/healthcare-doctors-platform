import { prisma } from "@/db/prisma";

/**
 * Withdrawal workflow (proposal SLA: 10 business days for live take-down).
 * 1. acknowledge_withdrawal ReviewEvent
 * 2. Story + consent → withdrawn
 * 3. All placements live=false
 */
export async function withdrawStory(input: {
  clinicId: string;
  storyId: string;
  reviewerId: string;
  reviewerName: string;
  reason: string;
  consentId?: string;
}) {
  if (!input.reason.trim()) throw new Error("Withdrawal reason required");

  const story = await prisma.gpStory.findFirst({
    where: { id: input.storyId, clinicId: input.clinicId },
    include: { placements: true, consents: true },
  });
  if (!story) throw new Error("Story not found");

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    await tx.gpStoryReviewEvent.create({
      data: {
        storyId: story.id,
        fromStatus: story.status,
        toStatus: "withdrawn",
        decision: "acknowledge_withdrawal",
        reviewerRole: "subject_gp",
        reviewerId: input.reviewerId,
        reviewerName: input.reviewerName,
        rationale: input.reason.trim(),
      },
    });

    const updated = await tx.gpStory.update({
      where: { id: story.id },
      data: {
        status: "withdrawn",
        withdrawnAt: now,
      },
    });

    // Versioned consent withdrawal
    if (input.consentId) {
      await tx.gpStoryConsent.updateMany({
        where: { id: input.consentId, storyId: story.id },
        data: {
          status: "withdrawn",
          withdrawnAt: now,
          withdrawalReason: input.reason.trim(),
        },
      });
    } else {
      await tx.gpStoryConsent.updateMany({
        where: { storyId: story.id, status: { in: ["signed", "draft_linked", "summary_shared"] } },
        data: {
          status: "withdrawn",
          withdrawnAt: now,
          withdrawalReason: input.reason.trim(),
        },
      });
    }

    // Take down all live placements
    await tx.gpStoryPlacement.updateMany({
      where: { storyId: story.id, live: true },
      data: {
        live: false,
        takenDownAt: now,
        takeDownReason: `Withdrawal: ${input.reason.trim()}`,
      },
    });

    // Default-deny all reuse again
    await tx.gpStoryReusePolicy.updateMany({
      where: { storyId: story.id },
      data: {
        allowed: false,
        notes: "Revoked on withdrawal",
        effectiveUntil: now,
      },
    });

    const liveRemaining = await tx.gpStoryPlacement.count({
      where: { storyId: story.id, live: true },
    });

    return {
      story: updated,
      livePlacementsRemaining: liveRemaining,
      withdrawalSlaBusinessDays: 10,
      message:
        "Withdrawal recorded. Live placements taken down. Confirm public HTML/cache purge within 10 business days.",
    };
  });
}
