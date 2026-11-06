import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GpReadinessPackageStatus, Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { upsertDoctorProfileFromPackage } from "./doctor-profile";
import { notifyRoles } from "./notifications";
import { GP_READINESS_STATUS_LABEL as STATUS_LABELS } from "./recruitment-ops";

export const GP_READINESS_STATUS_LABEL = STATUS_LABELS;

export type SpousalOutcome = "likely_eligible" | "further_review_required";

export type ReadinessPackagePayload = {
  personal?: {
    firstName?: string;
    lastName?: string;
    mobile?: string;
    email?: string;
    preferredContactMethod?: string;
    bestContactTime?: string;
  };
  registration?: Record<string, unknown>;
  professional?: Record<string, unknown>;
  websiteProfile?: {
    title?: string;
    preferredPublishedName?: string;
    credentials?: string[] | string;
    biography?: string;
    shortIntroduction?: string;
    qualifications?: string[] | string;
    specialInterests?: string[] | string;
    languagesSpoken?: string[] | string;
    languages?: string[] | string;
    yearsPractising?: string;
    memberships?: string[] | string;
    careerHighlights?: string;
    headshotMeta?: Record<string, unknown>;
  };
  availability?: Record<string, unknown>;
  providerReadiness?: Record<string, unknown>;
  section19ab?: Record<string, unknown>;
  spousal?: Record<string, unknown>;
  providerGuidance?: { situation?: "initial" | "additional" | string };
  documentsMeta?: Array<{ key: string; fileName: string }>;
};

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const ALLOWED_DOC = new Set([".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp"]);

/** Prefer GP_READINESS_STORAGE_DIR outside the Hostinger release tree; default keeps local behaviour. */
export function careersReadinessStorageRoot(): string {
  const configured = process.env.GP_READINESS_STORAGE_DIR?.trim();
  return configured ? path.resolve(configured) : path.join(process.cwd(), "storage", "gp-readiness-packages");
}

function safeFileName(original: string): string {
  const base = path.basename(original).replace(/[^\w.\-()+ ]+/g, "_").trim() || "upload";
  return base.slice(0, 120);
}

function extensionOf(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}

export function assessSpousalEligibility(spousal: Record<string, unknown> | undefined): {
  outcome: SpousalOutcome;
  rationale: string;
} {
  if (!spousal || typeof spousal !== "object") {
    return {
      outcome: "further_review_required",
      rationale: "Spousal details were not provided for preliminary assessment.",
    };
  }

  const relationship = String(spousal.relationshipStatus || "").toLowerCase();
  const partnerType = String(spousal.partnerType || "").toLowerCase();
  const evidence = Array.isArray(spousal.evidenceTypes) ? spousal.evidenceTypes : [];
  const hasEvidence = evidence.length > 0;

  const isPartnered = relationship === "married" || relationship === "de_facto" || relationship === "de facto";

  if (!isPartnered) {
    return {
      outcome: "further_review_required",
      rationale: "Preliminary guidance applies where a married or de facto relationship is indicated.",
    };
  }

  if (partnerType === "medical_practitioner" || partnerType === "medical practitioner") {
    const unrestricted = String(spousal.partnerUnrestricted19ab || "").toLowerCase() === "yes";
    const medicareAccess = String(spousal.partnerMedicareAccess || "").toLowerCase() === "yes";
    if (unrestricted && medicareAccess && hasEvidence) {
      return {
        outcome: "likely_eligible",
        rationale:
          "Partner appears unrestricted under 19AB with ongoing Medicare access, and relationship evidence was indicated.",
      };
    }
    return {
      outcome: "further_review_required",
      rationale:
        "Medical-practitioner partner pathway needs confirmation of unrestricted 19AB status, Medicare access, and supporting evidence.",
    };
  }

  if (partnerType === "skilled_migrant" || partnerType === "skilled migrant professional") {
    const skilledVisa = String(spousal.skilledMigrationVisa || "").toLowerCase() === "yes";
    const assessed = String(spousal.occupationAssessed || "").toLowerCase() === "yes";
    const employed = String(spousal.currentlyEmployedInOccupation || "").toLowerCase() === "yes";
    const within10 = String(spousal.migratedWithin10Years || "").toLowerCase() === "yes";
    if (skilledVisa && assessed && employed && within10 && hasEvidence) {
      return {
        outcome: "likely_eligible",
        rationale:
          "Skilled-migrant partner indicators and relationship evidence suggest a preliminary pathway worth formal review.",
      };
    }
    return {
      outcome: "further_review_required",
      rationale:
        "Skilled-migrant partner pathway needs visa, occupation assessment, employment, migration timing, and evidence confirmation.",
    };
  }

  return {
    outcome: "further_review_required",
    rationale: "Partner type or supporting details need human review against Department of Health criteria.",
  };
}

export async function storeReadinessUpload(input: {
  clinicId: string;
  packageId: string;
  key: string;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
  kind: "headshot" | "document";
}): Promise<{ key: string; storagePath: string; fileName: string; mimeType: string; sizeBytes: number }> {
  const fileName = safeFileName(input.fileName);
  const ext = extensionOf(fileName);
  if (input.bytes.length <= 0) throw new Error(`${input.key} file is empty.`);
  if (input.bytes.length > MAX_FILE_BYTES) throw new Error(`${input.key} must be 8 MB or smaller.`);
  if (input.kind === "headshot" && !ALLOWED_IMAGE.has(ext)) {
    throw new Error("Professional headshot must be JPG, PNG, or WEBP.");
  }
  if (input.kind === "document" && !ALLOWED_DOC.has(ext)) {
    throw new Error("Supporting documents must be PDF, Word, JPG, PNG, or WEBP.");
  }

  const { putPrivateObject, privateObjectStoreMode } = await import("@/storage/private-object-store");
  if (privateObjectStoreMode() === "postgres") {
    const stored = await putPrivateObject({
      clinicId: input.clinicId,
      purpose: "gp_readiness",
      fileName: `${input.key}-${fileName}`,
      mimeType: input.mimeType || "application/octet-stream",
      bytes: input.bytes,
    });
    return {
      key: input.key,
      storagePath: stored.storagePath,
      fileName,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
    };
  }

  const relativeDir = path.join(input.clinicId, input.packageId);
  const absoluteDir = path.join(careersReadinessStorageRoot(), relativeDir);
  await mkdir(absoluteDir, { recursive: true });
  const storedName = `${input.key}-${fileName}`;
  const absoluteFile = path.join(absoluteDir, storedName);
  await writeFile(absoluteFile, input.bytes);
  return {
    key: input.key,
    storagePath: path.join(relativeDir, storedName).replaceAll("\\", "/"),
    fileName,
    mimeType: input.mimeType || "application/octet-stream",
    sizeBytes: input.bytes.length,
  };
}

export async function submitGpReadinessPackage(input: {
  clinicId: string;
  payload: ReadinessPackagePayload;
  documents?: Array<{
    key: string;
    fileName: string;
    mimeType: string;
    bytes: Buffer;
    kind: "headshot" | "document";
  }>;
  source?: string;
  status?: GpReadinessPackageStatus;
}): Promise<{
  id: string;
  status: GpReadinessPackageStatus;
  spousalOutcome: SpousalOutcome;
}> {
  const personal = input.payload.personal || {};
  const firstName = String(personal.firstName || "").trim();
  const lastName = String(personal.lastName || "").trim();
  const email = String(personal.email || "").trim().toLowerCase();
  if (!firstName || !lastName || !email) {
    throw new Error("firstName, lastName and email are required.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("A valid email is required.");
  }

  const spousalAssessment = assessSpousalEligibility(input.payload.spousal);
  const providerPath =
    input.payload.providerGuidance?.situation === "additional"
      ? "additional"
      : input.payload.providerGuidance?.situation === "initial"
        ? "initial"
        : null;

  const preferredStartRaw = input.payload.availability?.preferredStartDate;
  const preferredStartDate =
    typeof preferredStartRaw === "string" && preferredStartRaw.trim()
      ? new Date(preferredStartRaw)
      : null;

  const created = await prisma.gpReadinessPackage.create({
    data: {
      clinicId: input.clinicId,
      status: input.status ?? "new_lead",
      statusChangedAt: new Date(),
      firstName,
      lastName,
      email,
      mobile: personal.mobile ? String(personal.mobile).trim() : null,
      preferredContactMethod: personal.preferredContactMethod
        ? String(personal.preferredContactMethod).trim()
        : null,
      preferredStartDate:
        preferredStartDate && !Number.isNaN(preferredStartDate.getTime()) ? preferredStartDate : null,
      payloadJson: input.payload as Prisma.InputJsonValue,
      documentsJson: [],
      providerReadinessJson: (input.payload.providerReadiness || null) as Prisma.InputJsonValue,
      section19abJson: (input.payload.section19ab || null) as Prisma.InputJsonValue,
      spousalAssessmentJson: {
        ...(input.payload.spousal || {}),
        preliminaryOutcome: spousalAssessment.outcome,
        preliminaryRationale: spousalAssessment.rationale,
        disclaimer:
          "Preliminary guidance only. Formal eligibility must be determined by the Department of Health.",
      } as Prisma.InputJsonValue,
      spousalOutcome: spousalAssessment.outcome,
      providerNumberPath: providerPath,
      source: input.source ?? "join_our_team_readiness_portal",
    },
  });

  const storedDocs: Array<Record<string, unknown>> = [];
  for (const doc of input.documents || []) {
    const stored = await storeReadinessUpload({
      clinicId: input.clinicId,
      packageId: created.id,
      key: doc.key,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      bytes: doc.bytes,
      kind: doc.kind,
    });
    storedDocs.push(stored);
  }

  if (storedDocs.length) {
    await prisma.gpReadinessPackage.update({
      where: { id: created.id },
      data: { documentsJson: storedDocs as Prisma.InputJsonValue },
    });
  }

  const headshot = storedDocs.find((doc) => doc.key === "headshot");
  await upsertDoctorProfileFromPackage({
    clinicId: input.clinicId,
    readinessPackageId: created.id,
    payload: input.payload,
    headshotPath: headshot?.storagePath ? String(headshot.storagePath) : null,
  });

  await prisma.gpReadinessPackageStatusAudit.create({
    data: {
      packageId: created.id,
      fromStatus: null,
      toStatus: created.status,
      actorName: "portal",
      note: "Submitted via GP Readiness & Onboarding Portal",
    },
  });

  await notifyRoles({
    clinicId: input.clinicId,
    eventId: "enquiry_received",
    roles: ["practice_manager"],
    enquiryId: null,
    payload: {
      readinessPackageId: created.id,
      kind: "gp_readiness_package",
      email,
      name: `${firstName} ${lastName}`,
      spousalOutcome: spousalAssessment.outcome,
    },
  });

  return {
    id: created.id,
    status: created.status,
    spousalOutcome: spousalAssessment.outcome,
  };
}
