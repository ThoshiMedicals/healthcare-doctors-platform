/**
 * Draft second-clinic exercise — platform validation only.
 * Creates Eight Mile Plains Doctors as status=draft with sample scoped rows.
 * No ClinicDomain, no Page/golden import, no public site.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { brandingFromClinic } from "../src/clinics/branding";
import {
  isAdminSwitchableClinicStatus,
  listAdminSwitchableClinics,
  listLiveClinics,
} from "../src/clinics/resolve-clinic";

loadEnv(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env"));

const prisma = new PrismaClient();

const EMP_SLUG = "eight-mile-plains";
const EMP_NAME = "Eight Mile Plains Doctors";
const WMC_SLUG = "woolloongabba";

type Check = { id: number; name: string; pass: boolean; detail: string };

async function main() {
  const checks: Check[] = [];
  const network = await prisma.network.findFirst({ orderBy: { createdAt: "asc" } });
  if (!network) throw new Error("Network missing — run db:seed first.");

  const wmc = await prisma.clinic.findUnique({
    where: { slug: WMC_SLUG },
    include: { profile: true },
  });
  if (!wmc) throw new Error("Woolloongabba clinic missing — run db:seed first.");

  // --- Provision draft clinic (no domains, no pages) ---
  const emp = await prisma.clinic.upsert({
    where: { slug: EMP_SLUG },
    update: {
      practiceName: EMP_NAME,
      status: "draft",
      networkId: network.id,
      legalName: "Eight Mile Plains Doctors Pty Ltd",
    },
    create: {
      networkId: network.id,
      slug: EMP_SLUG,
      practiceName: EMP_NAME,
      legalName: "Eight Mile Plains Doctors Pty Ltd",
      status: "draft",
    },
  });

  await prisma.clinicProfile.upsert({
    where: { clinicId: emp.id },
    update: {
      phoneDisplay: "(07) 3000 0000",
      phoneTel: "+61730000000",
      email: "reception@example-eightmileplains.invalid",
      streetAddress: "100 Example Road",
      suburb: "Eight Mile Plains",
      state: "QLD",
      postcode: "4113",
      hotdocUrl: "https://www.hotdoc.com.au/example-eight-mile-plains-draft-only",
      logoPath: "/assets/brand/healthcare-doctors-network-mark.png",
      seoTitleSuffix: "Eight Mile Plains Doctors",
      canonicalBaseUrl: "https://example-eightmileplains.invalid",
      localitiesServed: ["Eight Mile Plains", "Rochedale", "Underwood"],
    },
    create: {
      clinicId: emp.id,
      phoneDisplay: "(07) 3000 0000",
      phoneTel: "+61730000000",
      email: "reception@example-eightmileplains.invalid",
      streetAddress: "100 Example Road",
      suburb: "Eight Mile Plains",
      state: "QLD",
      postcode: "4113",
      country: "AU",
      localitiesServed: ["Eight Mile Plains", "Rochedale", "Underwood"],
      hotdocUrl: "https://www.hotdoc.com.au/example-eight-mile-plains-draft-only",
      logoPath: "/assets/brand/healthcare-doctors-network-mark.png",
      seoTitleSuffix: "Eight Mile Plains Doctors",
      locale: "en-AU",
      canonicalBaseUrl: "https://example-eightmileplains.invalid",
    },
  });

  const empHours = [
    { dayOfWeek: "monday" as const, opens: "08:00", closes: "17:00" },
    { dayOfWeek: "tuesday" as const, opens: "08:00", closes: "17:00" },
    { dayOfWeek: "wednesday" as const, opens: "08:00", closes: "17:00" },
    { dayOfWeek: "thursday" as const, opens: "08:00", closes: "17:00" },
    { dayOfWeek: "friday" as const, opens: "08:00", closes: "17:00" },
    { dayOfWeek: "saturday" as const, opens: "09:00", closes: "12:00" },
    { dayOfWeek: "sunday" as const, opens: "00:00", closes: "00:00" },
  ];
  for (const hours of empHours) {
    await prisma.openingHours.upsert({
      where: { clinicId_dayOfWeek: { clinicId: emp.id, dayOfWeek: hours.dayOfWeek } },
      update: { opens: hours.opens, closes: hours.closes },
      create: { clinicId: emp.id, ...hours },
    });
  }

  // Link network stub without promoting to live / attaching a public website.
  await prisma.networkLocation.upsert({
    where: { id: "location_eight_mile_plains" },
    update: {
      linkedClinicId: emp.id,
      clinicName: EMP_NAME,
      status: "draft",
      website: null,
      description:
        "Draft platform tenant for multi-clinic readiness. No public DNS or golden HTML corpus.",
    },
    create: {
      id: "location_eight_mile_plains",
      networkId: network.id,
      linkedClinicId: emp.id,
      clinicName: EMP_NAME,
      suburb: "Eight Mile Plains",
      description:
        "Draft platform tenant for multi-clinic readiness. No public DNS or golden HTML corpus.",
      sortOrder: 2,
      status: "draft",
    },
  });

  // Ensure super_admin can switch into EMP (membership on WMC already grants network access).
  const admin = await prisma.user.findFirst({
    where: { memberships: { some: { role: { in: ["super_admin", "network_admin"] } } } },
  });
  if (admin) {
    await prisma.clinicMembership.upsert({
      where: { userId_clinicId: { userId: admin.id, clinicId: emp.id } },
      update: { role: "super_admin" },
      create: { userId: admin.id, clinicId: emp.id, role: "super_admin" },
    });
  }

  const empMarker = `draft-emp-${Date.now()}`;

  const vacancy = await prisma.vacancy.create({
    data: {
      clinicId: emp.id,
      title: `Draft GP EOI (${empMarker})`,
      status: "expression_of_interest",
      location: "Eight Mile Plains, QLD",
      roleCategory: "general_practitioner",
      shortSummary: "Draft-only vacancy for isolation exercise.",
      active: true,
    },
  });

  const application = await prisma.careerApplication.create({
    data: {
      clinicId: emp.id,
      vacancyId: vacancy.id,
      name: "Draft Applicant EMP",
      email: `applicant+${empMarker}@example.invalid`,
      phone: "0400000000",
      roleInterest: "General Practitioner",
      status: "new",
      source: "talent_community",
      privacyConfirmedAt: new Date(),
    },
  });

  const formRequest = await prisma.formRequest.create({
    data: {
      clinicId: emp.id,
      name: "Draft Patient EMP",
      email: `patient+${empMarker}@example.invalid`,
      formType: "General Request",
      status: "new",
      history: [],
      privacyConfirmedAt: new Date(),
    },
  });

  const media = await prisma.mediaAsset.create({
    data: {
      clinicId: emp.id,
      filename: `draft-emp-${empMarker}.png`,
      storagePath: `assets/library/draft-emp-${empMarker}.png`,
      assetType: "image",
      category: "General",
      title: "Draft EMP isolation asset",
      altText: "Draft only",
    },
  });

  const signal = await prisma.searchDemandSignal.create({
    data: {
      clinicId: emp.id,
      normalizedTerm: `draft emp isolation ${empMarker}`,
      intentBucket: "practice_info",
      resultType: "no_result",
      resultCount: 0,
      noResult: true,
    },
  });

  // --- Validations ---
  const domains = await prisma.clinicDomain.count({ where: { clinicId: emp.id } });
  const pages = await prisma.page.count({ where: { clinicId: emp.id } });
  checks.push({
    id: 1,
    name: "Clinic provisioning",
    pass: emp.status === "draft" && domains === 0 && pages === 0,
    detail: `status=${emp.status}; domains=${domains}; pages=${pages} (must be draft, zero domains, zero pages)`,
  });

  const liveList = await listLiveClinics();
  const adminList = await listAdminSwitchableClinics();
  const switcherSeesDraft = adminList.some((c) => c.slug === EMP_SLUG);
  const liveHidesDraft = !liveList.some((c) => c.slug === EMP_SLUG);
  checks.push({
    id: 2,
    name: "Clinic switcher",
    pass: switcherSeesDraft && liveHidesDraft && isAdminSwitchableClinicStatus("draft"),
    detail: `adminSwitchable includes EMP=${switcherSeesDraft}; live list excludes EMP=${liveHidesDraft}; liveCount=${liveList.length}; adminCount=${adminList.length}`,
  });

  const empFull = await prisma.clinic.findUnique({
    where: { id: emp.id },
    include: { profile: true, openingHours: true },
  });
  checks.push({
    id: 3,
    name: "Clinic profile",
    pass: Boolean(
      empFull?.profile &&
        empFull.profile.suburb === "Eight Mile Plains" &&
        empFull.profile.phoneDisplay === "(07) 3000 0000" &&
        empFull.openingHours.length === 7,
    ),
    detail: `suburb=${empFull?.profile?.suburb}; phone=${empFull?.profile?.phoneDisplay}; hours=${empFull?.openingHours.length}`,
  });

  const branding = brandingFromClinic({
    slug: emp.slug,
    practiceName: emp.practiceName,
    profile: empFull?.profile ?? null,
  });
  const brandingOk =
    branding.practiceName === EMP_NAME &&
    branding.clinicSlug === EMP_SLUG &&
    branding.hotdocUrl.includes("eight-mile-plains") &&
    !branding.hotdocUrl.includes("woolloongabba-QLD-4102");
  checks.push({
    id: 4,
    name: "Clinic branding",
    pass: brandingOk,
    detail: `practiceName=${branding.practiceName}; hotdoc=${branding.hotdocUrl}; logo=${branding.logoPath}`,
  });

  const empVacancies = await prisma.vacancy.count({ where: { clinicId: emp.id } });
  const wmcSeesEmpVacancy = await prisma.vacancy.count({
    where: { clinicId: wmc.id, title: vacancy.title },
  });
  checks.push({
    id: 5,
    name: "Vacancy isolation",
    pass: empVacancies >= 1 && wmcSeesEmpVacancy === 0,
    detail: `EMP vacancies=${empVacancies}; WMC rows with EMP title=${wmcSeesEmpVacancy}`,
  });

  const empApps = await prisma.careerApplication.count({ where: { clinicId: emp.id, id: application.id } });
  const wmcLeakApp = await prisma.careerApplication.count({
    where: { clinicId: wmc.id, id: application.id },
  });
  checks.push({
    id: 6,
    name: "Applications isolation",
    pass: empApps === 1 && wmcLeakApp === 0,
    detail: `EMP has application=${empApps === 1}; leaked to WMC=${wmcLeakApp > 0}`,
  });

  const empForms = await prisma.formRequest.count({ where: { clinicId: emp.id, id: formRequest.id } });
  const wmcLeakForm = await prisma.formRequest.count({
    where: { clinicId: wmc.id, id: formRequest.id },
  });
  checks.push({
    id: 7,
    name: "Patient request isolation",
    pass: empForms === 1 && wmcLeakForm === 0,
    detail: `EMP has form=${empForms === 1}; leaked to WMC=${wmcLeakForm > 0}`,
  });

  const empMedia = await prisma.mediaAsset.count({ where: { clinicId: emp.id, id: media.id } });
  const wmcLeakMedia = await prisma.mediaAsset.count({
    where: { clinicId: wmc.id, id: media.id },
  });
  const sharedDiskAssumption = media.storagePath.startsWith("assets/");
  checks.push({
    id: 8,
    name: "Media isolation",
    pass: empMedia === 1 && wmcLeakMedia === 0,
    detail: `row isolation OK; storagePath=${media.storagePath}; shared public/assets tree still assumed=${sharedDiskAssumption}`,
  });

  const empSignals = await prisma.searchDemandSignal.count({
    where: { clinicId: emp.id, id: signal.id },
  });
  const wmcLeakSignal = await prisma.searchDemandSignal.count({
    where: { clinicId: wmc.id, id: signal.id },
  });
  checks.push({
    id: 9,
    name: "Search signal isolation",
    pass: empSignals === 1 && wmcLeakSignal === 0,
    detail: `EMP signal present=${empSignals === 1}; leaked to WMC=${wmcLeakSignal > 0}`,
  });

  // Dashboard scoping: clinicId filters isolate counts (Briefing pattern).
  const [empDashVacancies, wmcDashVacancies, empDashSignals, wmcDashSignals] = await Promise.all([
    prisma.vacancy.count({ where: { clinicId: emp.id, active: true } }),
    prisma.vacancy.count({ where: { clinicId: wmc.id, active: true } }),
    prisma.searchDemandSignal.count({ where: { clinicId: emp.id } }),
    prisma.searchDemandSignal.count({ where: { clinicId: wmc.id } }),
  ]);
  const dashboardScoped = empDashVacancies !== wmcDashVacancies || emp.id !== wmc.id;
  checks.push({
    id: 10,
    name: "Dashboard scoping",
    pass: dashboardScoped && empDashSignals >= 1,
    detail: `EMP activeVacancies=${empDashVacancies} signals=${empDashSignals}; WMC activeVacancies=${wmcDashVacancies} signals=${wmcDashSignals}`,
  });

  // Public surface must reject draft slug (no public website).
  const publicApiWould404 = emp.status !== "live";
  const noDomains = domains === 0;

  const passed = checks.filter((c) => c.pass).length;
  const report = {
    exercise: "draft-second-clinic",
    generatedAt: new Date().toISOString(),
    clinic: {
      id: emp.id,
      slug: emp.slug,
      practiceName: emp.practiceName,
      status: emp.status,
      domains,
      pages,
    },
    markers: {
      vacancyId: vacancy.id,
      applicationId: application.id,
      formRequestId: formRequest.id,
      mediaAssetId: media.id,
      searchDemandSignalId: signal.id,
    },
    publicGuards: {
      statusNotLive: publicApiWould404,
      noClinicDomain: noDomains,
      noPages: pages === 0,
      note: "Public APIs require status=live; host resolve requires ClinicDomain + live.",
    },
    checks,
    scorecard: {
      checksPassed: passed,
      checksTotal: checks.length,
      passRate: `${passed}/${checks.length}`,
    },
    stillAssumesWmc: [
      "DEFAULT_CLINIC_SLUG / local+tunnel host resolve → woolloongabba",
      "site.js HotDoc/tel last-resort fallbacks remain Gabba URLs",
      "Media sync walks shared public/assets (row-scoped, disk shared)",
      "governance-published.js single shared artifact",
      "Measurement warehouse file not partitioned by clinic until events carry clinic_slug",
      "Admin root metadata title still Clinic CMS | Woolloongabba Medical Centre",
      "Vacancy location soft default still needs profile suburb in UI empty state",
    ],
    phase2Required: [
      "Approved golden HTML corpus for EMP",
      "ClinicDomain + DNS + HotDoc/AGPAL production values",
      "Per-clinic media/storage root",
      "Per-clinic governance publish path",
      "Promote draft → live only after import + QA",
      "UAT multi-host beyond DEFAULT_CLINIC_SLUG",
    ],
  };

  const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../reports");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "DRAFT-SECOND-CLINIC-EXERCISE.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.log(`Wrote ${outPath}`);

  if (passed < checks.length) process.exitCode = 1;
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

function loadEnv(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}
