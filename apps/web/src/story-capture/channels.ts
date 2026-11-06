import type { GpStoryReuseChannel } from "@prisma/client";

/** All placable channels — seeded as allowed=false (default deny). */
export const ALL_REUSE_CHANNELS: readonly GpStoryReuseChannel[] = [
  "practice_experience_web",
  "gp_opportunities_rail",
  "join_our_team_quiet_quote",
  "owned_social_og",
  "internal_proposal_pack",
  "video_embed",
] as const;

/** Suggested allow-list when GP signs (still opt-in via consent JSON). */
export const DEFAULT_SIGN_ALLOW: readonly GpStoryReuseChannel[] = [
  "practice_experience_web",
  "gp_opportunities_rail",
] as const;

/** Hard-blocked third-party reuse — never stored as GpStoryReuseChannel allow. */
export const HARD_BLOCK_CHANNELS = [
  "job_boards",
  "recruitment_agencies",
  "paid_testimonial_networks",
  "third_clinic_sites",
] as const;

export const CURRENT_CONSENT_VERSION = "wmc-gp-story-consent-2026-11";

export const CHANNEL_SURFACE: Record<
  GpStoryReuseChannel,
  { surfacePath: string; moduleKey: string; product: string }
> = {
  practice_experience_web: {
    surfacePath: "about-us/practice-experience.html",
    moduleKey: "practice-experience",
    product: "Practice Experience Hub",
  },
  gp_opportunities_rail: {
    surfacePath: "join-our-team.html#gp-opportunities",
    moduleKey: "gp-opportunities",
    product: "GP Opportunities",
  },
  join_our_team_quiet_quote: {
    surfacePath: "join-our-team.html#gp-voices",
    moduleKey: "join-our-team-quiet-quote",
    product: "Join Our Team",
  },
  owned_social_og: {
    surfacePath: "social:og",
    moduleKey: "owned-social-og",
    product: "Owned social / OG",
  },
  internal_proposal_pack: {
    surfacePath: "opportunity-pack:internal",
    moduleKey: "opportunity-pack",
    product: "Opportunity Pack",
  },
  video_embed: {
    surfacePath: "video:embed",
    moduleKey: "video-embed",
    product: "Video embed",
  },
};

export function isHardBlockedChannel(channel: string): boolean {
  return (HARD_BLOCK_CHANNELS as readonly string[]).includes(channel);
}
