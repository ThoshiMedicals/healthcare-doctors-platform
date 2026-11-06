/** Controlled vocabularies — GP Attraction Asset Library */

export const ASSET_SCENES = [
  "consulting_room",
  "waiting",
  "reception",
  "treatment",
  "doctor_consulting",
  "nursing_collab",
  "team_discussion",
  "community_exterior",
  "atmosphere",
  "abstract",
  "quote_card",
] as const;

export const ASSET_SURFACES = [
  "practice_experience",
  "gp_opportunities",
  "join_our_team",
  "opportunity_pack",
  "registrar_pathway",
  "social_og",
  "internal_only",
] as const;

export const ASSET_MODULES = [
  "typical_day",
  "nursing",
  "reception",
  "team_interactions",
  "community",
  "continuity",
  "flexible_sessions",
  "doctor_voices",
] as const;

export const ASSET_PERSONAS = [
  "early_career",
  "established",
  "returning",
  "part_time",
  "special_interest",
] as const;

export const ASSET_AI_POLICIES = ["photo_only", "ai_assist", "ai_ok", "ai_ban"] as const;

export type AssetScene = (typeof ASSET_SCENES)[number];
export type AssetSurface = (typeof ASSET_SURFACES)[number];
export type AssetModule = (typeof ASSET_MODULES)[number];

export function taxonomyTag(kind: string, value: string): string {
  return `${kind}:${value}`;
}

export function parseTaxonomyTags(tags: string[]): {
  scenes: string[];
  surfaces: string[];
  modules: string[];
  personas: string[];
  aiPolicies: string[];
} {
  const bucket = {
    scenes: [] as string[],
    surfaces: [] as string[],
    modules: [] as string[],
    personas: [] as string[],
    aiPolicies: [] as string[],
  };
  for (const tag of tags) {
    const [k, v] = tag.split(":");
    if (!v) continue;
    if (k === "scene") bucket.scenes.push(v);
    if (k === "surface") bucket.surfaces.push(v);
    if (k === "module") bucket.modules.push(v);
    if (k === "persona") bucket.personas.push(v);
    if (k === "ai") bucket.aiPolicies.push(v);
  }
  return bucket;
}
