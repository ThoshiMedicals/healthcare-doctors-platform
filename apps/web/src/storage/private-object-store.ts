import { randomBytes } from "node:crypto";
import { prisma } from "@/db/prisma";

export type PrivateObjectPurpose = "career_resume" | "gp_readiness";

/**
 * PRIVATE_OBJECT_STORE=postgres — durable blobs in private_objects (survives Hostinger redeploy).
 * Default / unset — filesystem under CAREER_RESUME_DIR / GP_READINESS_STORAGE_DIR.
 */
export function privateObjectStoreMode(): "postgres" | "filesystem" {
  return process.env.PRIVATE_OBJECT_STORE?.trim().toLowerCase() === "postgres"
    ? "postgres"
    : "filesystem";
}

function unpredictableObjectKey(purpose: string, fileName: string): string {
  const safe = fileName.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 80) || "file";
  return `${purpose}/${randomBytes(24).toString("hex")}/${safe}`;
}

/** Storage path prefix used by admin retrieve routes. */
export function postgresStoragePath(objectKey: string): string {
  return `pg:${objectKey}`;
}

export function parsePostgresStoragePath(storagePath: string): string | null {
  if (!storagePath.startsWith("pg:")) return null;
  const key = storagePath.slice(3).trim();
  return key || null;
}

export async function putPrivateObject(input: {
  clinicId: string;
  purpose: PrivateObjectPurpose;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}): Promise<{ storagePath: string; fileName: string; mimeType: string; sizeBytes: number }> {
  if (input.bytes.length <= 0) throw new Error("File is empty.");
  const objectKey = unpredictableObjectKey(input.purpose, input.fileName);
  // Prisma Bytes accepts Uint8Array; Buffer typing under Node 22+ is stricter than Prisma's input type.
  const payload = new Uint8Array(input.bytes);
  await prisma.privateObject.create({
    data: {
      clinicId: input.clinicId,
      purpose: input.purpose,
      objectKey,
      fileName: input.fileName,
      mimeType: input.mimeType || "application/octet-stream",
      sizeBytes: payload.byteLength,
      bytes: payload,
    },
  });
  return {
    storagePath: postgresStoragePath(objectKey),
    fileName: input.fileName,
    mimeType: input.mimeType || "application/octet-stream",
    sizeBytes: payload.byteLength,
  };
}

export async function getPrivateObjectBytes(input: {
  storagePath: string;
  clinicId?: string;
}): Promise<Buffer> {
  const objectKey = parsePostgresStoragePath(input.storagePath);
  if (!objectKey) throw new Error("Not a postgres private object path.");
  const row = await prisma.privateObject.findFirst({
    where: {
      objectKey,
      ...(input.clinicId ? { clinicId: input.clinicId } : {}),
    },
    select: { bytes: true },
  });
  if (!row) throw new Error("Private object not found.");
  return Buffer.from(row.bytes);
}

export async function deletePrivateObject(input: {
  storagePath: string;
  clinicId?: string;
}): Promise<boolean> {
  const objectKey = parsePostgresStoragePath(input.storagePath);
  if (!objectKey) return false;
  const result = await prisma.privateObject.deleteMany({
    where: {
      objectKey,
      ...(input.clinicId ? { clinicId: input.clinicId } : {}),
    },
  });
  return result.count > 0;
}
