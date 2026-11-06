import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import { getRecruitmentPackage } from "@/gp-pipeline/recruitment-ops";
import { careersReadinessStorageRoot } from "@/gp-pipeline/readiness-package";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".doc") return "application/msword";
  if (ext === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "application/octet-stream";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; key: string }> },
) {
  const { clinic } = await requireAction("edit");
  const { id, key } = await context.params;
  const readinessPackage = await getRecruitmentPackage(clinic.id, id);
  if (!readinessPackage) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const docs = Array.isArray(readinessPackage.documentsJson)
    ? (readinessPackage.documentsJson as Array<Record<string, unknown>>)
    : [];
  const doc = docs.find((row) => String(row.key || "") === key);
  if (!doc?.storagePath) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const storagePath = String(doc.storagePath);
  const absolute = path.isAbsolute(storagePath)
    ? storagePath
    : path.join(careersReadinessStorageRoot(), storagePath);
  if (!existsSync(absolute)) {
    return NextResponse.json({ error: "File missing on disk" }, { status: 404 });
  }

  const bytes = await readFile(absolute);
  const fileName = String(doc.fileName || path.basename(absolute));
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": contentTypeFor(absolute),
      "Content-Disposition": `attachment; filename="${fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=120",
    },
  });
}
