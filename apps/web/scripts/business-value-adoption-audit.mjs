/**
 * Read-only adoption / inventory counts for business-value audit.
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function safeCount(label, fn) {
  try {
    return { label, count: await fn(), ok: true };
  } catch (error) {
    return { label, count: null, ok: false, error: String(error?.message || error) };
  }
}

try {
  const clinic = await prisma.clinic.findFirst({
    where: { slug: "woolloongabba" },
    select: { id: true, slug: true, practiceName: true, status: true },
  });
  const clinicId = clinic?.id;

  const counts = {};
  const add = async (key, fn) => {
    counts[key] = await safeCount(key, fn);
  };

  await add("practitioners_all", () =>
    prisma.practitioner.count({ where: clinicId ? { clinicId } : undefined }),
  );
  await add("practitioners_published", () =>
    prisma.practitioner.count({ where: { ...(clinicId ? { clinicId } : {}), status: "published" } }),
  );
  await add("practitioners_drafting", () =>
    prisma.practitioner.count({
      where: { ...(clinicId ? { clinicId } : {}), status: { in: ["drafting", "planned", "clinical_review", "approved"] } },
    }),
  );
  await add("pages_published", () =>
    prisma.page.count({ where: { ...(clinicId ? { clinicId } : {}), status: "published" } }),
  );
  await add("knowledge_articles", () =>
    prisma.knowledgeArticle.count({ where: clinicId ? { clinicId } : undefined }),
  );
  await add("knowledge_published", () =>
    prisma.knowledgeArticle.count({
      where: { ...(clinicId ? { clinicId } : {}), status: "published" },
    }),
  );
  await add("practice_updates", () =>
    prisma.practiceUpdate.count({ where: clinicId ? { clinicId } : undefined }),
  );
  await add("practice_updates_published", () =>
    prisma.practiceUpdate.count({
      where: { ...(clinicId ? { clinicId } : {}), status: "published" },
    }),
  );
  await add("services", () => prisma.service.count({ where: clinicId ? { clinicId } : undefined }));
  await add("services_published", () =>
    prisma.service.count({ where: { ...(clinicId ? { clinicId } : {}), status: "published" } }),
  );
  await add("vacancies", () => prisma.vacancy.count({ where: clinicId ? { clinicId } : undefined }));
  await add("vacancies_active", () =>
    prisma.vacancy.count({ where: { ...(clinicId ? { clinicId } : {}), active: true } }),
  );
  await add("career_applications", () =>
    prisma.careerApplication.count({ where: clinicId ? { clinicId } : undefined }),
  );
  await add("form_requests", () =>
    prisma.formRequest.count({ where: clinicId ? { clinicId } : undefined }),
  );
  await add("media_assets", () =>
    prisma.mediaAsset.count({ where: clinicId ? { clinicId } : undefined }),
  );
  await add("clinics", () => prisma.clinic.count());
  await add("clinics_live", () => prisma.clinic.count({ where: { status: "live" } }));
  await add("clinics_draft", () => prisma.clinic.count({ where: { status: "draft" } }));

  // GP pipeline / readiness — table names may vary
  for (const [key, model] of [
    ["gp_doctor_profile_drafts", "gpDoctorProfileDraft"],
    ["gp_stories", "gpStory"],
    ["gp_readiness_packages", "gpReadinessPackage"],
    ["gp_pipeline_candidates", "gpPipelineCandidate"],
    ["gp_eoi", "gpExpressionOfInterest"],
    ["attraction_documents", "attractionDocument"],
    ["clinical_reviews", "clinicalReview"],
    ["cms_revisions", "contentRevision"],
    ["search_demand_signals", "searchDemandSignal"],
  ]) {
    if (prisma[model]) {
      await add(key, () =>
        prisma[model].count(
          clinicId && model !== "clinic"
            ? { where: Object.keys(prisma[model].fields || {}).includes("clinicId") ? { clinicId } : undefined }
            : undefined,
        ).catch(async () => {
          try {
            return await prisma[model].count();
          } catch {
            return 0;
          }
        }),
      );
    } else {
      counts[key] = { label: key, count: null, ok: false, error: "model missing" };
    }
  }

  // Direct queries with known models from schema
  const extras = {};
  try {
    extras.gpDoctorProfileDrafts = await prisma.gpDoctorProfileDraft.count(
      clinicId ? { where: { clinicId } } : undefined,
    );
  } catch (e) {
    extras.gpDoctorProfileDrafts = `err:${e.message}`;
  }
  try {
    extras.gpStories = await prisma.gpStory.count(clinicId ? { where: { clinicId } } : undefined);
  } catch (e) {
    extras.gpStories = `err:${e.message}`;
  }
  try {
    extras.gpReadinessPackages = await prisma.gpReadinessPackage.count(
      clinicId ? { where: { clinicId } } : undefined,
    );
  } catch (e) {
    extras.gpReadinessPackages = `err:${e.message}`;
  }
  try {
    extras.attractionDocuments = await prisma.attractionDocument.count(
      clinicId ? { where: { clinicId } } : undefined,
    );
  } catch (e) {
    try {
      extras.attractionDocuments = await prisma.attractionDocument.count();
    } catch (e2) {
      extras.attractionDocuments = `err:${e2.message}`;
    }
  }
  try {
    extras.clinicalReviews = await prisma.clinicalReview.count();
  } catch (e) {
    extras.clinicalReviews = `err:${e.message}`;
  }
  try {
    extras.searchDemandSignals = await prisma.searchDemandSignal.count(
      clinicId ? { where: { clinicId } } : undefined,
    );
  } catch (e) {
    extras.searchDemandSignals = `err:${e.message}`;
  }
  try {
    extras.contentRevisions = await prisma.contentRevision.count(
      clinicId ? { where: { clinicId } } : undefined,
    );
  } catch (e) {
    extras.contentRevisions = `err:${e.message}`;
  }

  // Sample practitioner statuses
  const practitioners = clinicId
    ? await prisma.practitioner.findMany({
        where: { clinicId },
        select: { name: true, slug: true, status: true, acceptingNewPatients: true, updatedAt: true },
        orderBy: { name: "asc" },
      })
    : [];

  const updates = clinicId
    ? await prisma.practiceUpdate.findMany({
        where: { clinicId },
        select: { title: true, status: true, slug: true, publishedAt: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 20,
      })
    : [];

  const vacancies = clinicId
    ? await prisma.vacancy.findMany({
        where: { clinicId },
        select: { title: true, active: true, status: true, updatedAt: true },
        take: 20,
      })
    : [];

  let applications = [];
  try {
    applications = await prisma.careerApplication.findMany({
      where: clinicId ? { clinicId } : undefined,
      select: { id: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch {
    applications = [];
  }

  let drafts = [];
  try {
    drafts = await prisma.gpDoctorProfileDraft.findMany({
      where: clinicId ? { clinicId } : undefined,
      select: { id: true, status: true, updatedAt: true },
      take: 50,
    });
  } catch {
    drafts = [];
  }

  const report = {
    generatedAt: new Date().toISOString(),
    clinic,
    counts,
    extras,
    practitioners,
    updates,
    vacancies,
    applicationCount: applications.length,
    applicationsByStatus: applications.reduce((acc, row) => {
      const k = row.status || "unknown";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {}),
    draftCount: drafts.length,
    draftsByStatus: drafts.reduce((acc, row) => {
      const k = row.status || "unknown";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {}),
  };

  const out = new URL("../../../docs/WMC-BUSINESS-VALUE-ADOPTION-EVIDENCE.json", import.meta.url);
  writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ok: true, out: out.pathname, clinic: clinic?.slug, extras }, null, 2));
} finally {
  await prisma.$disconnect();
}
