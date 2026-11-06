import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import {
  getGpOpportunitiesQuotes,
  getOpportunityPackQuotes,
  getPracticeExperienceQuotes,
} from "@/story-capture/integration";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { clinic } = await requireAction("edit");
  const surface = new URL(request.url).searchParams.get("surface") || "all";

  if (surface === "practice_experience") {
    return NextResponse.json({
      surface,
      quotes: await getPracticeExperienceQuotes(clinic.id),
    });
  }
  if (surface === "gp_opportunities") {
    return NextResponse.json({
      surface,
      quotes: await getGpOpportunitiesQuotes(clinic.id),
    });
  }
  if (surface === "opportunity_pack") {
    return NextResponse.json({
      surface,
      quotes: await getOpportunityPackQuotes(clinic.id),
    });
  }

  const [practiceExperience, gpOpportunities, opportunityPack] = await Promise.all([
    getPracticeExperienceQuotes(clinic.id),
    getGpOpportunitiesQuotes(clinic.id),
    getOpportunityPackQuotes(clinic.id),
  ]);

  return NextResponse.json({
    surface: "all",
    practiceExperience,
    gpOpportunities,
    opportunityPack,
  });
}
