import { cookies } from "next/headers";
import {
  INSIGHTS_FILTERS_COOKIE,
  mergeInsightsFilters,
  parseInsightsFilters,
  parseInsightsFiltersCookie,
  type InsightsFilters,
} from "./insights-filters";

/** Merge URL search params with the persistent Insights cookie (URL wins). */
export async function resolveInsightsFilters(params: {
  range?: string;
  practitioner?: string;
  service?: string;
  queue?: string;
  focus?: string;
  data?: string;
  tier?: string;
  health?: string;
  intent?: string;
  from?: string;
  focusAs?: "practitioner" | "service";
}): Promise<InsightsFilters> {
  const jar = await cookies();
  const fromCookie = parseInsightsFiltersCookie(jar.get(INSIGHTS_FILTERS_COOKIE)?.value);
  const fromUrl = parseInsightsFilters(params);
  return mergeInsightsFilters(fromCookie, fromUrl);
}
