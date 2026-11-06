import type { GpStoryReuseChannel } from "@prisma/client";
import { CHANNEL_SURFACE } from "./channels";
import { listLivePlacementsForSurface } from "./placements";

export type StorySurfaceQuote = {
  storyId: string;
  placementId: string;
  channel: GpStoryReuseChannel;
  surfacePath: string;
  moduleKey: string | null;
  product: string;
  pullQuote: string | null;
  bodyText: string;
  publicByline: string | null;
  honestyCueEnabled: boolean;
  compositeExampleFlag: boolean;
  category: string;
};

/**
 * Read-model for Practice Experience / GP Opportunities / Opportunity Pack.
 * Does not mutate public HTML in this phase — consumers can render when wired.
 */
export async function getQuotesForIntegration(
  clinicId: string,
  channel: GpStoryReuseChannel,
): Promise<StorySurfaceQuote[]> {
  const rows = await listLivePlacementsForSurface(clinicId, channel);
  const meta = CHANNEL_SURFACE[channel];
  return rows.map((row) => ({
    storyId: row.storyId,
    placementId: row.id,
    channel: row.channel,
    surfacePath: row.surfacePath,
    moduleKey: row.moduleKey,
    product: meta.product,
    pullQuote: row.version.pullQuoteText,
    bodyText: row.version.bodyText,
    publicByline: row.version.publicByline,
    honestyCueEnabled: row.story.honestyCueEnabled,
    compositeExampleFlag: row.story.compositeExampleFlag,
    category: row.story.primaryCategory,
  }));
}

export async function getPracticeExperienceQuotes(clinicId: string) {
  return getQuotesForIntegration(clinicId, "practice_experience_web");
}

export async function getGpOpportunitiesQuotes(clinicId: string) {
  return getQuotesForIntegration(clinicId, "gp_opportunities_rail");
}

export async function getOpportunityPackQuotes(clinicId: string) {
  return getQuotesForIntegration(clinicId, "internal_proposal_pack");
}
