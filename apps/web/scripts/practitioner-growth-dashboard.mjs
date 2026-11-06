import "dotenv/config";
import { writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const NEW_DAYS = 60;

function activeNew(iso) {
  if (!iso) return false;
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return false;
  return Date.now() < start.getTime() + NEW_DAYS * 86400000;
}

function completeness(row, payload) {
  const bio = String(payload?.biography || row.biography || "");
  const quals = payload?.qualifications?.length ? payload.qualifications : row.qualifications;
  const langs = payload?.languages?.length ? payload.languages : row.languages;
  const areas = payload?.areasOfCare?.length ? payload.areasOfCare : row.areasOfCare;
  const checks = {
    biography: bio.length >= 120,
    qualifications: (quals || []).length > 0,
    languages: (langs || []).length > 0,
    areasOfCare: (areas || []).length > 0,
    portrait: Boolean(row.portraitPath || payload?.portraitFile),
    bookingPath: Boolean(row.bookingUrl || payload?.bookingUrl) || true, // phone fallback counts
    relatedServices: (row.relatedServices || []).length > 0 || (payload?.relatedServices || []).length > 0,
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { score, max: Object.keys(checks).length, checks };
}

try {
  const rows = await prisma.practitioner.findMany({
    where: { status: "published", page: { is: { path: { startsWith: "doctors/" } } } },
    include: { page: { select: { path: true } } },
    orderBy: { name: "asc" },
  });

  const report = {
    generatedAt: new Date().toISOString(),
    note: "Most viewed / most booked require analytics wiring — placeholders only.",
    acceptingNewPatients: [],
    activeNewBadges: [],
    lowestCompleteness: [],
    missingSeoAssets: [],
    mostViewedPractitioners: [],
    mostBookedPractitioners: [],
    practitioners: [],
  };

  for (const row of rows) {
    const payload =
      row.publishedPayload && typeof row.publishedPayload === "object" && !Array.isArray(row.publishedPayload)
        ? row.publishedPayload
        : {};
    const growthNewAt = payload.newToPracticeAt || row.newToPracticeAt?.toISOString() || null;
    const accepting =
      typeof payload.acceptingNewPatients === "boolean" ? payload.acceptingNewPatients : row.acceptingNewPatients;
    const availability = payload.availabilityStatus || row.availabilityStatus;
    const complete = completeness(row, payload);
    const entry = {
      name: row.name,
      slug: row.slug,
      path: row.page?.path,
      acceptingNewPatients: accepting,
      availabilityStatus: availability,
      newBadgeActive: activeNew(growthNewAt),
      completeness: complete,
    };
    report.practitioners.push(entry);
    if (accepting) report.acceptingNewPatients.push(row.name);
    if (entry.newBadgeActive) report.activeNewBadges.push(row.name);
    if (complete.score <= 4) report.lowestCompleteness.push({ name: row.name, score: complete.score });
    const missing = Object.entries(complete.checks)
      .filter(([, ok]) => !ok)
      .map(([k]) => k);
    if (missing.length) report.missingSeoAssets.push({ name: row.name, missing });
  }

  report.lowestCompleteness.sort((a, b) => a.score - b.score);
  report.mostViewedPractitioners = [
    { name: "(future)", note: "Join attraction-analytics / GA4 practitioner profile events" },
  ];
  report.mostBookedPractitioners = [
    { name: "(future)", note: "HotDoc booking analytics not connected yet" },
  ];

  const out = new URL("../../../docs/WMC-PRACTITIONER-GROWTH-DASHBOARD.json", import.meta.url);
  writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ok: true, practitioners: report.practitioners.length, out: out.pathname }, null, 2));
} finally {
  await prisma.$disconnect();
}
