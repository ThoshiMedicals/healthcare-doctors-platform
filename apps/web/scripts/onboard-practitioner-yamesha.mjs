/**
 * Onboard Dr Yamesha Ranatunga into Practitioner + Overlay + GpDoctorProfileDraft.
 * Source: HotDoc profile only. No welcome/news content. Does NOT write old-html/.
 */
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const templatePath = path.join(webRoot, "..", "..", "old-html", "doctors", "dr-debra-larkins.html");
const prisma = new PrismaClient();

const PHONE_DISPLAY = "(07) 3217 3344";
const HOTDOC_URL =
  "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors/dr-yamesha-ranatunga-2?wp=w_lightbox";
const SOURCE_PROFILE =
  "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors/dr-yamesha-ranatunga-2";

const DOCTOR = {
  slug: "dr-yamesha-ranatunga",
  name: "Dr Yamesha Ranatunga",
  role: "General Practitioner",
  credentials: ["MBBS", "FRACGP", "BSc"],
  qualifications: [
    "MBBS (University of Queensland, 2017)",
    "FRACGP (2024)",
    "BSc Nutritional Science (University of British Columbia, 2013)",
  ],
  languages: ["English"],
  areasOfCare: [
    "Women's health",
    "Adolescent and youth health",
    "Chronic disease management",
    "General practice",
  ],
  professionalInterests: [
    "Women's health",
    "Adolescent and youth health",
    "Chronic disease management",
    "All aspects of general practice",
  ],
  relatedServices: [
    { href: "../services/womens-health.html", label: "Women's Health" },
    { href: "../services/family-health.html", label: "Family Health" },
    { href: "../services/chronic-disease-care.html", label: "Chronic Disease Care" },
    { href: "../services/preventive-healthcare.html", label: "Preventive Healthcare" },
  ],
  biography:
    "Dr Yamesha Ranatunga obtained her Bachelor of Medicine / Bachelor of Surgery (MBBS) from the University of Queensland in 2017, and her Fellowship of the Royal Australian College of General Practitioners (FRACGP) in 2024. Prior to this she completed a Bachelor of Science (BSc, major in Nutritional Science) from the University of British Columbia, Canada in 2013. Dr Ranatunga is interested in all aspects of general practice, particularly women’s health, adolescent and youth health, and chronic disease management. She has experience working in hospital and general practice settings throughout Queensland including the Sunshine Coast, Townsville, Cairns, and Mount Isa.",
  shortIntroduction:
    "GP (MBBS, FRACGP) with interests in women’s health, adolescent health and chronic disease management.",
  yearsPractising: null,
  // Explicitly stated on HotDoc professional statement (FRACGP fellowship).
  memberships: ["Fellow of the Royal Australian College of General Practitioners (FRACGP)"],
  bookingUrl: HOTDOC_URL,
  portraitFile: null,
  sourceImageUrl: null,
  sourceProfileUrl: SOURCE_PROFILE,
  description:
    "Meet Dr Yamesha Ranatunga at Woolloongabba Medical Centre. Explore women’s health, adolescent health, chronic disease care, qualifications, languages and booking options.",
  missingFlags: [
    "profileImage (HotDoc shows placeholder only — no downloadable portrait)",
    "yearsPractising (not stated on HotDoc)",
  ],
};

function fingerprintContent(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function scoreCompleteness(input) {
  const checks = {
    biography: wordCount(String(input.biography || "")) >= 80,
    qualifications: (input.qualifications || []).length > 0,
    photo: Boolean(input.headshotPath),
    languages: (input.languages || []).length > 0,
    specialInterests: (input.specialInterests || []).length > 0,
    memberships: (input.memberships || []).length > 0,
    shortIntroduction: String(input.shortIntroduction || "").trim().length >= 40,
    preferredPublishedName: String(input.preferredPublishedName || "").trim().length >= 3,
  };
  const weights = [
    ["biography", 25],
    ["qualifications", 15],
    ["photo", 20],
    ["languages", 10],
    ["specialInterests", 10],
    ["memberships", 10],
    ["shortIntroduction", 5],
    ["preferredPublishedName", 5],
  ];
  let score = 0;
  const missing = [];
  for (const [key, weight] of weights) {
    if (checks[key]) score += weight;
    else missing.push(key);
  }
  return { score, missing, checks };
}

function listItems(items, asLinks) {
  if (asLinks) {
    return items
      .map((label) => {
        const href = /women|adolescent|youth/i.test(label)
          ? "../services/womens-health.html"
          : /chronic|diabetes/i.test(label)
            ? "../services/chronic-disease-care.html"
            : "../services/family-health.html";
        return `<li><a class="service-title-link" href="${href}">${escapeHtml(label)}</a></li>`;
      })
      .join("");
  }
  return items.map((label) => `<li>${escapeHtml(label)}</li>`).join("");
}

function relatedServicesHtml(services) {
  return services
    .map(
      (s) =>
        `<a class="resource-link" href="${s.href}"><span>${escapeHtml(s.label)}</span><span aria-hidden="true">→</span></a>`,
    )
    .join("");
}

function buildDoctorHtml(template, doctor) {
  const pathRel = `doctors/${doctor.slug}.html`;
  const quals = doctor.qualifications.join(", ");
  const langs = doctor.languages.join(", ");
  const careHighlights = listItems(doctor.areasOfCare.slice(0, 3), false);
  const careList = listItems(doctor.areasOfCare, true);
  const interestList = listItems(doctor.professionalInterests, true);
  const bookingUrl = doctor.bookingUrl;

  let html = template;
  html = html.split("Dr Debra Larkins").join(doctor.name);
  html = html.split("dr-debra-larkins").join(doctor.slug);
  html = html.split("Dr Debra Larkins’s").join(`${doctor.name}’s`);
  html = html.split("Dr Debra Larkins'").join(`${doctor.name}'`);

  html = html.replace(
    /href="https:\/\/www\.hotdoc\.com\.au[^"]*"/gi,
    `href="${bookingUrl}"`,
  );

  html = html.replace(/<p class="practitioner-booking-notice">[\s\S]*?<\/p>/gi, "");
  html = html.replace(/shared antenatal care/gi, doctor.areasOfCare[0] || "general practice");
  html = html.replace(/General practice and Shared antenatal care/gi, doctor.areasOfCare.join(", "));
  html = html.replace(/Broad general practice and Shared antenatal care/gi, doctor.professionalInterests.join(", "));
  html = html.replace(/"MBBS"/g, `"${doctor.qualifications[0] || "MBBS"}"`);
  html = html.replace(/\bMBBS and FRACGP\b/g, "MBBS and FRACGP");
  html = html.replace(/\bMBBS, FRACGP\b/g, quals);
  html = html.replace(/"knowsLanguage":\["English"\]/g, `"knowsLanguage":${JSON.stringify(doctor.languages)}`);
  html = html.replace(/"knowsAbout":\[[^\]]*\]/g, `"knowsAbout":${JSON.stringify(doctor.areasOfCare)}`);
  html = html.replace(
    /"urlTemplate":"https:\/\/www\.hotdoc\.com\.au[^"]*"/g,
    `"urlTemplate":"${bookingUrl}"`,
  );
  html = html.replace(
    /Explore general practice, shared antenatal care, background and booking options\./gi,
    doctor.description.replace(/^Meet .+?\. /, "").replace(/^Explore /, "Explore ") || doctor.description,
  );
  html = html.replace(
    /Meet [^"]+ at Woolloongabba Medical Centre\. Explore general practice, shared antenatal care, background and booking options\./g,
    doctor.description,
  );
  html = html.replace(
    /Dr Debra Larkins does not bulk bill for insurance patients\./g,
    `Book online with ${doctor.name} through HotDoc, or call reception on ${PHONE_DISPLAY}.`,
  );
  html = html.replace(
    /Dr Golnar Mortezaei does not bulk bill for insurance patients\./g,
    `Book online with ${doctor.name} through HotDoc, or call reception on ${PHONE_DISPLAY}.`,
  );

  // No approved portrait on HotDoc — use unavailable photo shell (same pattern as unpublished portraits).
  html = html.replace(
    /<div class="doctor-profile-photo"[^>]*>[\s\S]*?<\/div>/i,
    `<div class="doctor-profile-photo team-authority-photo-unavailable" data-photo-fallback="${escapeHtml(doctor.name)} photo temporarily unavailable" role="img" aria-label="Portrait for ${escapeHtml(doctor.name)} is not currently published"><span>Photo to be published</span></div>`,
  );

  html = html.replace(
    /<ul class="practitioner-care-highlights">[\s\S]*?<\/ul>/i,
    `<ul class="practitioner-care-highlights">${careHighlights}</ul>`,
  );
  html = html.replace(
    /(<section\b[^>]*\bid="biography"[^>]*>[\s\S]*?<h2>[\s\S]*?<\/h2>\s*<p>)([\s\S]*?)(<\/p>)/i,
    `$1${escapeHtml(doctor.biography)}$3`,
  );
  html = html.replace(/(<h2>Qualifications<\/h2>\s*<p>)([\s\S]*?)(<\/p>)/i, `$1${escapeHtml(quals)}$3`);
  html = html.replace(/(<h2>Languages<\/h2>\s*<p>)([\s\S]*?)(<\/p>)/i, `$1${escapeHtml(langs)}$3`);
  html = html.replace(
    /(<section\b[^>]*\bid="areas-of-care"[^>]*>[\s\S]*?<ul class="service-care-list">)([\s\S]*?)(<\/ul>)/i,
    `$1${careList}$3`,
  );
  html = html.replace(
    /(<section\b[^>]*\bid="professional-interests"[^>]*>[\s\S]*?<ul class="service-care-list">)([\s\S]*?)(<\/ul>)/i,
    `$1${interestList}$3`,
  );
  html = html.replace(
    /(<section\b[^>]*\bid="related-services"[^>]*>[\s\S]*?<div class="resource-links">)([\s\S]*?)(<\/div>)/i,
    `$1${relatedServicesHtml(doctor.relatedServices)}$3`,
  );

  const guideLinks = [
    ["../knowledge/articles/why-regular-check-ups-matter.html", "Why Regular Check-Ups Matter"],
    ["../knowledge/articles/what-is-preventive-healthcare.html", "What Is Preventive Healthcare?"],
    ["../knowledge/articles/how-telehealth-works.html", "How Telehealth Works"],
    ["../services/womens-health.html", "Women's Health"],
    ["../services/chronic-disease-care.html", "Chronic Disease Care"],
    ["../services/family-health.html", "Family Health"],
  ];
  html = html.replace(
    /(<section\b[^>]*\bid="patient-guides"[^>]*>[\s\S]*?<div class="resource-links">)([\s\S]*?)(<\/div>)/i,
    `$1${guideLinks
      .map(
        ([href, label]) =>
          `<a class="resource-link" href="${href}"><span>${escapeHtml(label)}</span><span aria-hidden="true">→</span></a>`,
      )
      .join("")}$3`,
  );

  html = html.replace(
    /(<section\b[^>]*\bid="book"[^>]*>[\s\S]*?<h2>)([\s\S]*?)(<\/h2>\s*<p>)([\s\S]*?)(<\/p>)/i,
    `$1Book with ${escapeHtml(doctor.name)}.$3Use the Book Appointment button to open ${escapeHtml(doctor.name)}’s current online booking destination, or call Woolloongabba Medical Centre on ${PHONE_DISPLAY} if you need help choosing an appointment type.$5`,
  );
  html = html.replace(
    /(<details><summary>What are [^<]+ qualifications\?<\/summary><p>)([\s\S]*?)(<\/p><\/details>)/i,
    `$1${escapeHtml(quals)}$3`,
  );
  html = html.replace(
    /(<details><summary>What languages does [^<]+ speak\?<\/summary><p>)([\s\S]*?)(<\/p><\/details>)/i,
    `$1${escapeHtml(langs)}$3`,
  );
  html = html.replace(
    /(<details><summary>What areas of care are listed for [^<]+\?<\/summary><p>)([\s\S]*?)(<\/p><\/details>)/i,
    `$1${escapeHtml(doctor.areasOfCare.join(", "))}$3`,
  );
  html = html.replace(
    /(<details><summary>What are [^<]+ professional interests\?<\/summary><p>)([\s\S]*?)(<\/p><\/details>)/i,
    `$1${escapeHtml(doctor.professionalInterests.join(", "))}$3`,
  );
  html = html.replace(
    /(<details><summary>How do I book an appointment with [^<]+\?<\/summary><p>)([\s\S]*?)(<\/p><\/details>)/i,
    `$1Use the Book Appointment button to open ${escapeHtml(doctor.name)}’s HotDoc booking page, or call reception on ${PHONE_DISPLAY} if you need help choosing an appointment type.$3`,
  );

  html = html.replace(
    /<meta content="Meet Dr Debra Larkins[\s\S]*?" name="description"\/>/i,
    `<meta content="${escapeHtml(doctor.description)}" name="description"/>`,
  );
  html = html.replace(
    /property="og:description" content="[^"]*"/i,
    `property="og:description" content="${escapeHtml(doctor.description)}"`,
  );
  html = html.replace(
    /content="Meet Dr Debra Larkins[\s\S]*?" property="og:description"/i,
    `content="${escapeHtml(doctor.description)}" property="og:description"`,
  );
  html = html.replace(
    /<!-- Practitioner profile verification sources[\s\S]*?-->/i,
    `<!-- Practitioner profile verification sources (imported 2026-11-06): ${doctor.sourceProfileUrl} -->`,
  );
  html = html.replace(/data-governance-page="doctors\/[^"]+"/i, `data-governance-page="${pathRel}"`);
  html = html.replace(
    /data-photo-fallback="[^"]+"/i,
    `data-photo-fallback="${escapeHtml(doctor.name)} photo temporarily unavailable"`,
  );

  return html;
}

async function upsertPractitionerPage(clinicId, doctor, html) {
  const pagePath = `doctors/${doctor.slug}.html`;
  const contentSha256 = fingerprintContent(html);
  const body = {
    source: "practitioner_import",
    importedFrom: doctor.sourceProfileUrl,
    importedAt: new Date().toISOString(),
  };

  const page = await prisma.page.upsert({
    where: { clinicId_path: { clinicId, path: pagePath } },
    create: {
      clinicId,
      path: pagePath,
      template: "practitioner",
      collection: "practitioner",
      indexable: true,
      title: `${doctor.name}, ${doctor.role} | Woolloongabba Medical Centre`,
      description: doctor.description,
      canonicalPath: pagePath,
      robots: "index,follow,max-image-preview:large",
      openGraph: {
        title: `${doctor.name}, ${doctor.role} | Woolloongabba Medical Centre`,
        description: doctor.description,
        type: "profile",
      },
      breadcrumb: [
        { label: "Home", path: "index.html" },
        { label: "Meet Our Team", path: "team.html" },
        { label: doctor.name, path: pagePath },
      ],
      status: "published",
    },
    update: {
      title: `${doctor.name}, ${doctor.role} | Woolloongabba Medical Centre`,
      description: doctor.description,
      status: "published",
      breadcrumb: [
        { label: "Home", path: "index.html" },
        { label: "Meet Our Team", path: "team.html" },
        { label: doctor.name, path: pagePath },
      ],
      openGraph: {
        title: `${doctor.name}, ${doctor.role} | Woolloongabba Medical Centre`,
        description: doctor.description,
        type: "profile",
      },
    },
  });

  let revision = await prisma.pageRevision.findFirst({
    where: { pageId: page.id, contentSha256, immutable: true },
  });
  if (!revision) {
    revision = await prisma.pageRevision.create({
      data: { pageId: page.id, html, body, contentSha256, immutable: true },
    });
  }
  if (page.publishedRevisionId !== revision.id) {
    await prisma.page.update({
      where: { id: page.id },
      data: { publishedRevisionId: revision.id, status: "published" },
    });
  }

  await prisma.navigationOwnership.upsert({
    where: { pageId: page.id },
    update: {
      sectionKey: "team",
      isHub: false,
      breadcrumb: [
        { label: "Home", path: "/" },
        { label: "Meet Our Team", path: "team.html" },
        { label: doctor.name, path: pagePath },
      ],
    },
    create: {
      pageId: page.id,
      sectionKey: "team",
      isHub: false,
      breadcrumb: [
        { label: "Home", path: "/" },
        { label: "Meet Our Team", path: "team.html" },
        { label: doctor.name, path: pagePath },
      ],
    },
  });

  const bookingUrl = doctor.bookingUrl;
  const publishedPayload = {
    name: doctor.name,
    sourceName: doctor.name,
    biography: doctor.biography,
    areasOfCare: doctor.areasOfCare,
    professionalInterests: doctor.professionalInterests,
    qualifications: doctor.qualifications,
    languages: doctor.languages,
    portraitFile: doctor.portraitFile,
    sourcePortraitFile: doctor.portraitFile,
    bookingUrl,
    sourceBookingUrl: bookingUrl,
    profileText: doctor.shortIntroduction,
  };

  const practitioner = await prisma.practitioner.upsert({
    where: { clinicId_slug: { clinicId, slug: doctor.slug } },
    create: {
      clinicId,
      pageId: page.id,
      slug: doctor.slug,
      name: doctor.name,
      role: doctor.role,
      biography: doctor.biography,
      qualifications: doctor.qualifications,
      languages: doctor.languages,
      areasOfCare: doctor.areasOfCare,
      professionalInterests: doctor.professionalInterests,
      relatedServices: doctor.relatedServices.map((s) => s.href.replace("../", "")),
      bookingUrl,
      portraitPath: null,
      publishedPayload,
      status: "published",
    },
    update: {
      pageId: page.id,
      name: doctor.name,
      role: doctor.role,
      biography: doctor.biography,
      qualifications: doctor.qualifications,
      languages: doctor.languages,
      areasOfCare: doctor.areasOfCare,
      professionalInterests: doctor.professionalInterests,
      relatedServices: doctor.relatedServices.map((s) => s.href.replace("../", "")),
      bookingUrl,
      portraitPath: null,
      publishedPayload,
      status: "published",
    },
  });

  return { page, revision, practitioner, pagePath };
}

async function upsertImportDraft(clinicId, doctor, practitioner) {
  const completeness = scoreCompleteness({
    biography: doctor.biography,
    shortIntroduction: doctor.shortIntroduction,
    preferredPublishedName: doctor.name,
    qualifications: doctor.qualifications,
    specialInterests: doctor.professionalInterests,
    languages: doctor.languages,
    memberships: doctor.memberships,
    headshotPath: doctor.portraitFile,
  });

  const existing = await prisma.gpDoctorProfileDraft.findFirst({
    where: {
      clinicId,
      OR: [
        { practitionerId: practitioner.id },
        {
          preferredPublishedName: { in: [doctor.name] },
          source: { in: ["manual_seed", "practitioner_import"] },
        },
      ],
    },
    orderBy: { updatedAt: "desc" },
  });

  const data = {
    clinicId,
    practitionerId: practitioner.id,
    source: "practitioner_import",
    status: "draft",
    title: "Dr",
    preferredPublishedName: doctor.name,
    credentials: doctor.credentials,
    biography: doctor.biography,
    shortIntroduction: doctor.shortIntroduction,
    qualifications: doctor.qualifications,
    specialInterests: doctor.professionalInterests,
    languages: doctor.languages,
    yearsPractising: doctor.yearsPractising,
    memberships: doctor.memberships,
    headshotPath: doctor.portraitFile,
    headshotMetaJson: {
      sourceProfileUrl: doctor.sourceProfileUrl,
      portraitAvailable: false,
      note: "HotDoc profile uses a placeholder avatar; no downloadable portrait published.",
      importedAt: new Date().toISOString(),
    },
    completenessScore: completeness.score,
    reviewNotes: `Imported from HotDoc ${doctor.sourceProfileUrl}. HotDoc booking URL assigned. Portrait pending clinic supply.`,
  };

  let draft;
  if (existing) {
    draft = await prisma.gpDoctorProfileDraft.update({ where: { id: existing.id }, data });
    await prisma.gpDoctorProfileStatusAudit.create({
      data: {
        profileId: draft.id,
        fromStatus: existing.status,
        toStatus: "draft",
        actorName: "practitioner_import",
        note: `Re-imported HotDoc profile for ${doctor.slug}`,
      },
    });
  } else {
    draft = await prisma.gpDoctorProfileDraft.create({ data });
    await prisma.gpDoctorProfileStatusAudit.create({
      data: {
        profileId: draft.id,
        fromStatus: null,
        toStatus: "draft",
        actorName: "practitioner_import",
        note: `Imported from practitioner ${doctor.slug}`,
      },
    });
  }

  return { draft, completeness };
}

async function main() {
  const clinic = await prisma.clinic.findFirst({ where: { slug: "woolloongabba" } });
  if (!clinic) throw new Error("woolloongabba clinic missing");

  const template = await readFile(templatePath, "utf8");
  const html = buildDoctorHtml(template, DOCTOR);
  const { practitioner, pagePath } = await upsertPractitionerPage(clinic.id, DOCTOR, html);
  const { draft, completeness } = await upsertImportDraft(clinic.id, DOCTOR, practitioner);

  const report = {
    name: DOCTOR.name,
    slug: DOCTOR.slug,
    pagePath,
    practitionerId: practitioner.id,
    draftId: draft.id,
    completeness,
    bookingUrl: DOCTOR.bookingUrl,
    importedFields: [
      "name",
      "credentials",
      "biography",
      "qualifications",
      "specialInterests",
      "languages",
      "memberships",
      "professionalSummary",
      "hotdocBookingUrl",
    ],
    missing: [...completeness.missing, ...DOCTOR.missingFlags],
    urls: {
      local: `http://127.0.0.1:3100/${pagePath}`,
      next: `https://next.gabbamedicalcentre.com.au/${pagePath}`,
      source: DOCTOR.sourceProfileUrl,
    },
  };

  await writeFile(
    path.join(webRoot, "scripts", "_onboard-yamesha-report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
