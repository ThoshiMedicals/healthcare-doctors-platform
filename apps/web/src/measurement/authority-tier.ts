export const AUTHORITY_TIERS = ["Hub", "Developing", "Thin"] as const;
export type AuthorityTier = (typeof AUTHORITY_TIERS)[number];

/** Management language for authority tiers (website link strength, not clinical quality). */
export const AUTHORITY_TIER_FRIENDLY: Record<AuthorityTier, string> = {
  Hub: "Well connected",
  Developing: "Building links",
  Thin: "Needs more links",
};

export const AUTHORITY_TIER_SCORE_BAND: Record<AuthorityTier, string> = {
  Hub: "Authority score 40 or higher",
  Developing: "Authority score 14–39",
  Thin: "Authority score under 14",
};

export function isAuthorityTier(value: string | null | undefined): value is AuthorityTier {
  return !!value && (AUTHORITY_TIERS as readonly string[]).includes(value);
}
