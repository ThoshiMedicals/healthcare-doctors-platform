import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import { buildDoctorProfileExport, getDoctorProfile } from "@/gp-pipeline/doctor-profile";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic } = await requireAction("edit");
  const { id } = await context.params;
  const url = new URL(request.url);
  const kindRaw = url.searchParams.get("kind") || "website";
  const format = url.searchParams.get("format") || "markdown";
  const kind =
    kindRaw === "booking" || kindRaw === "announcement" || kindRaw === "website"
      ? kindRaw
      : null;
  if (!kind) {
    return NextResponse.json({ error: "kind must be website|booking|announcement" }, { status: 400 });
  }

  const profile = await getDoctorProfile(clinic.id, id);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pack = buildDoctorProfileExport(profile, kind);
  if (format === "json") {
    return NextResponse.json(pack.json, {
      headers: {
        "Content-Disposition": `attachment; filename="${pack.filename.replace(/\.md$/, ".json")}"`,
      },
    });
  }

  return new NextResponse(pack.markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${pack.filename}"`,
    },
  });
}
