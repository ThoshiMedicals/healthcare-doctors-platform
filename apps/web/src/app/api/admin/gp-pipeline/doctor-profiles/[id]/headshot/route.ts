import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import { getDoctorProfile } from "@/gp-pipeline/doctor-profile";
import { careersReadinessStorageRoot } from "@/gp-pipeline/readiness-package";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic } = await requireAction("edit");
  const { id } = await context.params;
  const profile = await getDoctorProfile(clinic.id, id);
  if (!profile?.headshotPath) {
    return NextResponse.json({ error: "No headshot" }, { status: 404 });
  }

  const absolute = path.isAbsolute(profile.headshotPath)
    ? profile.headshotPath
    : path.join(careersReadinessStorageRoot(), profile.headshotPath);

  // Also allow portrait paths under public team assets when imported from Practitioner.
  const publicCandidate = path.join(process.cwd(), "public", profile.headshotPath.replace(/^\/+/, ""));
  const assetsCandidate = path.join(
    process.cwd(),
    "public",
    "assets",
    "team",
    path.basename(profile.headshotPath),
  );
  const filePath = existsSync(absolute)
    ? absolute
    : existsSync(publicCandidate)
      ? publicCandidate
      : existsSync(assetsCandidate)
        ? assetsCandidate
        : null;
  if (!filePath) {
    return NextResponse.json({ error: "Headshot file missing" }, { status: 404 });
  }

  const bytes = await readFile(filePath);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": contentTypeFor(filePath),
      "Cache-Control": "private, max-age=300",
    },
  });
}
