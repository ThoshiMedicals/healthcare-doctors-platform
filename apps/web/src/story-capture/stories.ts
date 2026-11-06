import type { GpStoryCategory, GpStoryStatus } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { CURRENT_CONSENT_VERSION } from "./channels";
import { seedDefaultDenyPolicies } from "./reuse";

export type CreateStoryInput = {
  clinicId: string;
  workingTitle: string;
  subjectDisplayName: string;
  subjectEmail?: string;
  primaryCategory: GpStoryCategory;
  secondaryCategories?: GpStoryCategory[];
  specialInterestLabel?: string;
  practitionerId?: string;
  careerApplicationId?: string;
  createdByUserId?: string;
  internalNotes?: string;
};

export async function listStories(clinicId: string, status?: GpStoryStatus) {
  return prisma.gpStory.findMany({
    where: { clinicId, ...(status ? { status } : {}) },
    orderBy: [{ updatedAt: "desc" }],
    include: {
      categories: true,
      consents: { orderBy: { createdAt: "desc" }, take: 1 },
      reusePolicies: true,
      placements: { where: { live: true } },
      _count: { select: { versions: true, reviews: true, placements: true } },
    },
  });
}

export async function getStory(clinicId: string, storyId: string) {
  return prisma.gpStory.findFirst({
    where: { id: storyId, clinicId },
    include: {
      categories: true,
      versions: { orderBy: [{ versionNumber: "desc" }, { format: "asc" }] },
      consents: { orderBy: { createdAt: "desc" } },
      reusePolicies: { orderBy: { channel: "asc" } },
      placements: { orderBy: { createdAt: "desc" }, include: { version: true } },
      reviews: { orderBy: { createdAt: "desc" }, take: 30 },
      sourceAssets: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function createStory(input: CreateStoryInput) {
  if (
    input.primaryCategory === "special_interest" &&
    !input.specialInterestLabel?.trim()
  ) {
    throw new Error("specialInterestLabel required for special_interest category");
  }

  return prisma.$transaction(async (tx) => {
    const story = await tx.gpStory.create({
      data: {
        clinicId: input.clinicId,
        workingTitle: input.workingTitle,
        subjectDisplayName: input.subjectDisplayName,
        subjectEmail: input.subjectEmail,
        primaryCategory: input.primaryCategory,
        specialInterestLabel: input.specialInterestLabel,
        practitionerId: input.practitionerId,
        careerApplicationId: input.careerApplicationId,
        createdByUserId: input.createdByUserId,
        internalNotes: input.internalNotes,
        status: "invited",
        categories: {
          create: [
            { category: input.primaryCategory, isPrimary: true, assignedBy: input.createdByUserId },
            ...(input.secondaryCategories ?? [])
              .filter((c) => c !== input.primaryCategory)
              .map((category) => ({
                category,
                isPrimary: false,
                assignedBy: input.createdByUserId,
              })),
          ],
        },
        consents: {
          create: {
            consentVersion: CURRENT_CONSENT_VERSION,
            status: "not_started",
            channelsAllowedJson: [],
            channelsDeniedJson: [
              "job_boards",
              "recruitment_agencies",
              "paid_testimonial_networks",
              "third_clinic_sites",
            ],
          },
        },
      },
    });

    await seedDefaultDenyPolicies(story.id, input.createdByUserId, tx);
    return story;
  });
}

export async function updateStoryFields(
  clinicId: string,
  storyId: string,
  data: Partial<{
    workingTitle: string;
    subjectDisplayName: string;
    subjectEmail: string | null;
    specialInterestLabel: string | null;
    honestyCueEnabled: boolean;
    compositeExampleFlag: boolean;
    internalNotes: string | null;
    interviewScheduledAt: Date | null;
    interviewedAt: Date | null;
  }>,
) {
  const existing = await prisma.gpStory.findFirst({ where: { id: storyId, clinicId } });
  if (!existing) throw new Error("Story not found");
  return prisma.gpStory.update({ where: { id: storyId }, data });
}
