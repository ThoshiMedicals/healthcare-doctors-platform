import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { Readable } from "node:stream";
import { requireAction } from "@/cms/context";
import { resumeAbsolutePath } from "@/cms/careers-applications";
import { prisma } from "@/db/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic } = await requireAction("edit");
  const { id } = await context.params;
  const application = await prisma.careerApplication.findFirst({
    where: { id, clinicId: clinic.id },
    select: {
      resumeStoragePath: true,
      resumeFileName: true,
      resumeMimeType: true,
    },
  });
  if (!application?.resumeStoragePath || !application.resumeFileName) {
    return new Response("Resume not found.", { status: 404 });
  }

  const absolute = resumeAbsolutePath(application.resumeStoragePath);
  try {
    await access(absolute);
  } catch {
    return new Response("Resume file missing on disk.", { status: 404 });
  }

  const stream = Readable.toWeb(createReadStream(absolute)) as ReadableStream;
  const headers = new Headers({
    "Content-Type": application.resumeMimeType || "application/octet-stream",
    "Content-Disposition": `attachment; filename="${application.resumeFileName.replace(/"/g, "")}"`,
    "Cache-Control": "private, no-store",
  });
  return new Response(stream, { status: 200, headers });
}
