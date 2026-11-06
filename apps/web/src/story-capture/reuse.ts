import type { GpStoryReuseChannel, Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { ALL_REUSE_CHANNELS, isHardBlockedChannel } from "./channels";

/** Seed every channel as allowed=false (default deny). */
export async function seedDefaultDenyPolicies(
  storyId: string,
  createdByUserId?: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
) {
  await tx.gpStoryReusePolicy.createMany({
    data: ALL_REUSE_CHANNELS.map((channel) => ({
      storyId,
      channel,
      allowed: false,
      clinicScope: "flagship_only",
      notes: "Default deny — explicit consent required",
      createdByUserId: createdByUserId ?? null,
    })),
    skipDuplicates: true,
  });
}

export async function syncReusePoliciesFromConsent(input: {
  storyId: string;
  channelsAllowed: GpStoryReuseChannel[];
  channelsDenied: string[];
  createdByUserId?: string;
}) {
  const allowedSet = new Set(input.channelsAllowed);
  for (const denied of input.channelsDenied) {
    if (isHardBlockedChannel(denied)) continue; // already never allowed
  }

  await prisma.$transaction(async (tx) => {
    await seedDefaultDenyPolicies(input.storyId, input.createdByUserId, tx);
    for (const channel of ALL_REUSE_CHANNELS) {
      const allowed = allowedSet.has(channel);
      await tx.gpStoryReusePolicy.upsert({
        where: { storyId_channel: { storyId: input.storyId, channel } },
        create: {
          storyId: input.storyId,
          channel,
          allowed,
          clinicScope: "flagship_only",
          notes: allowed ? "Allowed via signed consent" : "Default deny",
          createdByUserId: input.createdByUserId,
        },
        update: {
          allowed,
          notes: allowed ? "Allowed via signed consent" : "Denied / not in consent allow-list",
          effectiveFrom: new Date(),
        },
      });
    }
  });
}

export async function assertChannelReusable(storyId: string, channel: GpStoryReuseChannel) {
  if (isHardBlockedChannel(channel)) {
    throw new Error(`Channel ${channel} is hard-blocked without a new consent instrument`);
  }
  const policy = await prisma.gpStoryReusePolicy.findUnique({
    where: { storyId_channel: { storyId, channel } },
  });
  if (!policy || !policy.allowed) {
    throw new Error(`Reuse denied for channel ${channel} (default deny)`);
  }
  if (policy.effectiveUntil && policy.effectiveUntil < new Date()) {
    throw new Error(`Reuse policy expired for channel ${channel}`);
  }
  const signed = await prisma.gpStoryConsent.findFirst({
    where: { storyId, status: "signed" },
    orderBy: { createdAt: "desc" },
  });
  if (!signed) {
    throw new Error("Signed consent required before reuse");
  }
  const allowed = (signed.channelsAllowedJson as string[]) ?? [];
  if (!allowed.includes(channel)) {
    throw new Error(`Signed consent does not allow channel ${channel}`);
  }
  return { policy, consent: signed };
}
