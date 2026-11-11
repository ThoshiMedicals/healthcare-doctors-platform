/**
 * Onboard Dr Golnar Mortezaei and Dr James into Practitioner + Overlay + GpDoctorProfileDraft.
 * Does NOT write to old-html/. Creates DB page revisions + public/assets/team portraits only.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const teamDir = path.join(webRoot, "public", "assets", "team");
const templatePath = path.join(webRoot, "..", "..", "old-html", "doctors", "dr-debra-larkins.html");
const prisma = new PrismaClient();

const PHONE_TEL = "tel:+61732173344";
const PHONE_DISPLAY = "(07) 3217 3344";
/** Owner-authorised Golnar practitioner HotDoc (ONLINE — not phone-only). */
const GOLNAR_HOTDOC_URL =
  "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors/dr-golnar-mortezaei-5?wp=w_lightbox";
const JAMES_HOTDOC_URL =
  "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors/dr-james-chanaka-1?wp=w_lightbox";

/** @type {const} */
const DOCTORS = [
  {
    slug: "dr-golnar-mortezaei",
    name: "Dr Golnar Mortezaei",
    role: "General Practitioner",
    credentials: ["MD", "FRACGP"],
    qualifications: ["MD", "FRACGP"],
    languages: ["English", "Persian"],
    areasOfCare: [
      "Veterans' health",
      "Chronic disease management",
      "Diabetes",
      "Heart disease",
      "COPD",
      "Osteoarthritis",
    ],
    professionalInterests: [
      "Veterans' health",
      "Chronic disease management and prevention",
      "Diabetes",
      "Heart disease",
      "COPD",
      "Osteoarthritis and osteoporosis",
    ],
    relatedServices: [
      { href: "../services/family-health.html", label: "Family Health" },
      { href: "../services/chronic-disease-care.html", label: "Chronic Disease Care" },
      { href: "../services/preventive-healthcare.html", label: "Preventive Healthcare" },
      { href: "../services/mental-health.html", label: "Mental Health" },
    ],
    biography:
      "Dr Golnar Mortezaei (MD, FRACGP) is a General Practitioner at Woolloongabba Medical Centre. She is an experienced General Practitioner with over 25 years of medical experience. She holds an MD and is a Fellow of the Royal Australian College of General Practitioners (FRACGP). Her special interests include veterans' health, chronic disease management and prevention, particularly diabetes, heart disease, COPD, osteoarthritis and osteoporosis. She is dedicated to providing personalised, compassionate healthcare through a collaborative, patient-centred approach. Dr Golnar speaks English and Persian (Farsi).",
    shortIntroduction:
      "Experienced GP (MD, FRACGP) with interests in veterans' health and chronic disease management.",
    yearsPractising: "25+",
    memberships: [],
    bookingUrl: GOLNAR_HOTDOC_URL,
    portraitFile: "dr-golnar-mortezaei.webp",
    sourceImageUrl: "https://gabbamedicalcentre.com.au/wp-content/uploads/2026/11/dr-golnar-wordpress.webp",
    sourceProfileUrl: "https://gabbamedicalcentre.com.au/doctor/dr-golnar-mortezaei-gp-fracgp/",
    description:
      "Meet Dr Golnar Mortezaei at Woolloongabba Medical Centre. Explore veterans' health, chronic disease care, qualifications, languages and booking options.",
  },
  {
    slug: "dr-james",
    name: "Dr James Chanaka",
    role: "General Practitioner",
    credentials: ["Bachelor of Medicine", "FRACGP"],
    qualifications: ["Bachelor of Medicine (University of Zimbabwe)", "FRACGP"],
    languages: ["English", "Shona"],
    areasOfCare: ["Children's health", "Mental health", "Family medicine"],
    professionalInterests: ["Children's health", "Mental health", "Family medicine"],
    relatedServices: [
      { href: "../services/family-health.html", label: "Family Health" },
      { href: "../services/childrens-health.html", label: "Children's Health" },
      { href: "../services/mental-health.html", label: "Mental Health" },
      { href: "../services/preventive-healthcare.html", label: "Preventive Healthcare" },
    ],
    biography:
      "Dr James is an experienced General Practitioner who holds a Bachelor of Medicine from the University of Zimbabwe and is a Fellow of the Royal Australian College of General Practitioners (FRACGP). He has a special interest in children's health and mental health, with a focus on providing comprehensive, compassionate and patient-centred medical care. Dr James is dedicated to supporting the health and wellbeing of individuals and families through personalised healthcare and ongoing medical support. Fluent in English and Shona, he is committed to providing accessible and culturally sensitive healthcare to patients from diverse backgrounds.",
    shortIntroduction:
      "GP (FRACGP) with special interests in children's health and mental health. Speaks English and Shona.",
    yearsPractising: null,
    memberships: [],
    bookingUrl: JAMES_HOTDOC_URL,
    portraitFile: "dr-james.webp",
    sourceImageUrl: "https://gabbamedicalcentre.com.au/wp-content/uploads/2026/11/dr-james-wordpress.webp",
    sourceProfileUrl: "https://gabbamedicalcentre.com.au/doctor/dr-james-general-practitioner/",
    description:
      "Meet Dr James Chanaka at Woolloongabba Medical Centre. Explore children's health, mental health, qualifications, languages and booking options.",
  },
];

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

async function downloadToBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function writePortrait(portraitFile, sourceUrl) {
  await mkdir(teamDir, { recursive: true });
  const bytes = await downloadToBuffer(sourceUrl);
  const fullPath = path.join(teamDir, portraitFile);
  const thumbName = portraitFile.replace(/\.webp$/i, "-640.webp");
  const thumbPath = path.join(teamDir, thumbName);
  const full = await sharp(bytes)
    .rotate()
    .resize(800, 1000, { fit: "cover", position: "attention" })
    .webp({ quality: 86, effort: 4 })
    .toBuffer();
  const thumb = await sharp(bytes)
    .rotate()
    .resize(640, 800, { fit: "cover", position: "attention" })
    .webp({ quality: 84, effort: 4 })
    .toBuffer();
  await writeFile(fullPath, full);
  await writeFile(thumbPath, thumb);
  return { fullPath, thumbPath, portraitFile, thumbName };
}

function listItems(items, asLinks) {
  if (asLinks) {
    return items
      .map((label) => {
        const href =
          /child/i.test(label)
            ? "../services/childrens-health.html"
            : /mental/i.test(label)
              ? "../services/mental-health.html"
              : /veteran|chronic|diabetes|heart|copd|osteo/i.test(label)
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
  const portraitRel = `../assets/team/${doctor.portraitFile}`;
  const thumbRel = portraitRel.replace(/\.webp$/i, "-640.webp");
  const quals = doctor.qualifications.join(", ");
  const langs = doctor.languages.join(", ");
  const careHighlights = listItems(doctor.areasOfCare.slice(0, 3), false);
  const careList = listItems(doctor.areasOfCare, true);
  const interestList = listItems(doctor.professionalInterests, true);
  const bookingUrl = doctor.bookingUrl || null;
  const bookLabel = bookingUrl
    ? `Book Appointment`
    : `Call reception to book with ${doctor.name}`;

  let html = template;
  html = html.split("Dr Debra Larkins").join(doctor.name);
  html = html.split("dr-debra-larkins").join(doctor.slug);
  html = html.split("Dr Debra Larkins’s").join(`${doctor.name}’s`);
  html = html.split("Dr Debra Larkins'").join(`${doctor.name}'`);

  if (bookingUrl) {
    // Keep HotDoc lightbox workflow; point every Debra HotDoc href at this doctor.
    html = html.replace(
      /href="https:\/\/www\.hotdoc\.com\.au[^"]*"/gi,
      `href="${bookingUrl}"`,
    );
  } else {
    // Phone-only booking (no HotDoc slug available yet) — replace whole anchors.
    html = html.replace(
      /<a\b[^>]*\bhref="https:\/\/www\.hotdoc\.com\.au[^"]*"[^>]*>[\s\S]*?<\/a>/gi,
      `<a class="button wmc-book-appointment wmc-book-practitioner" href="${PHONE_TEL}" aria-label="${escapeHtml(bookLabel)}">Call Reception to Book</a>`,
    );
    html = html.replace(
      /<a\b[^>]*\bclass="([^"]*\bwmc-book-appointment\b[^"]*)"[^>]*>[\s\S]*?<\/a>/gi,
      (match, cls) => {
        if (match.includes(PHONE_TEL) && match.includes("Call Reception to Book")) return match;
        return `<a class="${cls}" href="${PHONE_TEL}" aria-label="${escapeHtml(bookLabel)}">Call Reception to Book</a>`;
      },
    );
  }

  // Remove Debra insurance notices — not applicable / not verified for imports.
  html = html.replace(/<p class="practitioner-booking-notice">[\s\S]*?<\/p>/gi, "");
  // Scrub leftover Debra meta / schema claims.
  html = html.replace(/shared antenatal care/gi, doctor.areasOfCare[0] || "general practice");
  html = html.replace(/General practice and Shared antenatal care/gi, doctor.areasOfCare.join(", "));
  html = html.replace(/Broad general practice and Shared antenatal care/gi, doctor.professionalInterests.join(", "));
  html = html.replace(/"MBBS"/g, `"${doctor.qualifications[0] || "FRACGP"}"`);
  html = html.replace(/\bMBBS and FRACGP\b/g, doctor.qualifications.join(" and "));
  html = html.replace(/\bMBBS, FRACGP\b/g, doctor.qualifications.join(", "));
  html = html.replace(/"knowsLanguage":\["English"\]/g, `"knowsLanguage":${JSON.stringify(doctor.languages)}`);
  html = html.replace(
    /"knowsAbout":\[[^\]]*\]/g,
    `"knowsAbout":${JSON.stringify(doctor.areasOfCare)}`,
  );
  html = html.replace(
    /"urlTemplate":"https:\/\/www\.hotdoc\.com\.au[^"]*"/g,
    `"urlTemplate":"${bookingUrl || PHONE_TEL}"`,
  );
  html = html.replace(
    /Explore general practice, shared antenatal care, background and booking options\./gi,
    doctor.description.replace(/^Meet .+?\. /, "").replace(/^Explore /, "Explore ") || doctor.description,
  );
  html = html.replace(
    /Meet Dr Golnar Mortezaei at Woolloongabba Medical Centre\. Explore general practice, shared antenatal care, background and booking options\./g,
    doctor.description,
  );
  html = html.replace(
    /Meet [^"]+ at Woolloongabba Medical Centre\. Explore general practice, shared antenatal care, background and booking options\./g,
    doctor.description,
  );
  if (!bookingUrl) {
    html = html.replace(
      /Dr Golnar Mortezaei does not bulk bill for insurance patients\./g,
      `Appointments with ${doctor.name} are booked by telephone via reception.`,
    );
    html = html.replace(
      /Dr James Chanaka does not bulk bill for insurance patients\./g,
      `Appointments with ${doctor.name} are booked by telephone via reception.`,
    );
    html = html.replace(
      /Use the Book Appointment button to open the practitioner’s current online booking destination, or call Woolloongabba Medical Centre on \(07\) 3217 3344 if you need help choosing an appointment type\.[^"]*/g,
      `Appointments with ${doctor.name} are booked by telephone. Please call reception on ${PHONE_DISPLAY}.`,
    );
  } else {
    html = html.replace(
      /Dr Golnar Mortezaei does not bulk bill for insurance patients\./g,
      `Book online with ${doctor.name} through HotDoc, or call reception on ${PHONE_DISPLAY}.`,
    );
    html = html.replace(
      /Dr James Chanaka does not bulk bill for insurance patients\./g,
      `Book online with ${doctor.name} through HotDoc, or call reception on ${PHONE_DISPLAY}.`,
    );
  }

  html = html.replace(
    /<img\b[^>]*data-practitioner-image="true"[^>]*>/i,
    `<img alt="${escapeHtml(doctor.name)}" data-local-team-src="${portraitRel}" data-practitioner-image="true" decoding="async" fetchpriority="high" height="1000" loading="eager" src="${portraitRel}" width="800" srcset="${thumbRel} 640w, ${portraitRel} 1122w" sizes="(min-width: 1025px) 420px, (min-width: 768px) 250px, 176px"/>`,
  );

  html = html.replace(
    /<ul class="practitioner-care-highlights">[\s\S]*?<\/ul>/i,
    `<ul class="practitioner-care-highlights">${careHighlights}</ul>`,
  );
  html = html.replace(
    /(<section\b[^>]*\bid="biography"[^>]*>[\s\S]*?<h2>[\s\S]*?<\/h2>\s*<p>)([\s\S]*?)(<\/p>)/i,
    `$1${escapeHtml(doctor.biography)}$3`,
  );
  html = html.replace(
    /(<h2>Qualifications<\/h2>\s*<p>)([\s\S]*?)(<\/p>)/i,
    `$1${escapeHtml(quals)}$3`,
  );
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

  // Replace Debra-oriented patient guides with neutral GP guides already on the site.
  const guideLinks =
    doctor.slug === "dr-james"
      ? [
          ["../knowledge/articles/common-childhood-illnesses.html", "Common Childhood Illnesses"],
          ["../knowledge/articles/childrens-preventive-healthcare.html", "Children's Preventive Healthcare"],
          ["../knowledge/articles/how-telehealth-works.html", "How Telehealth Works"],
          ["../knowledge/articles/why-regular-check-ups-matter.html", "Why Regular Check-Ups Matter"],
          ["../services/mental-health.html", "Mental Health"],
          ["../services/childrens-health.html", "Children's Health"],
        ]
      : [
          ["../knowledge/articles/what-is-preventive-healthcare.html", "What Is Preventive Healthcare?"],
          ["../knowledge/articles/why-regular-check-ups-matter.html", "Why Regular Check-Ups Matter"],
          ["../knowledge/articles/how-telehealth-works.html", "How Telehealth Works"],
          ["../services/chronic-disease-care.html", "Chronic Disease Care"],
          ["../services/family-health.html", "Family Health"],
          ["../services/preventive-healthcare.html", "Preventive Healthcare"],
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

  // Booking CTA copy.
  html = html.replace(
    /(<section\b[^>]*\bid="book"[^>]*>[\s\S]*?<h2>)([\s\S]*?)(<\/h2>\s*<p>)([\s\S]*?)(<\/p>)/i,
    bookingUrl
      ? `$1Book with ${escapeHtml(doctor.name)}.$3Use the Book Appointment button to open ${escapeHtml(doctor.name)}’s current online booking destination, or call Woolloongabba Medical Centre on ${PHONE_DISPLAY} if you need help choosing an appointment type.$5`
      : `$1Book with ${escapeHtml(doctor.name)}.$3Please call our reception team on ${PHONE_DISPLAY} to book with ${escapeHtml(doctor.name)}. Online booking is not yet linked for this practitioner.$5`,
  );

  // FAQ snippets
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
    bookingUrl
      ? `$1Use the Book Appointment button to open ${escapeHtml(doctor.name)}’s HotDoc booking page, or call reception on ${PHONE_DISPLAY} if you need help choosing an appointment type.$3`
      : `$1Appointments with ${escapeHtml(doctor.name)} are booked by telephone. Please call reception on ${PHONE_DISPLAY} to arrange a suitable appointment.$3`,
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
  html = html.replace(
    /data-governance-page="doctors\/[^"]+"/i,
    `data-governance-page="${pathRel}"`,
  );
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
      data: {
        pageId: page.id,
        html,
        body,
        contentSha256,
        immutable: true,
      },
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

  const portraitPath = `../assets/team/${doctor.portraitFile}`;
  const bookingUrl = doctor.bookingUrl || null;
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
      portraitPath,
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
      portraitPath,
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

  const nameCandidates = [doctor.name];
  if (doctor.slug === "dr-james") nameCandidates.push("Dr James", "Dr James Chanaka");
  if (doctor.slug === "dr-golnar-mortezaei") nameCandidates.push("Dr Golnar Mortezaei");

  // Prefer updating prior stub / import for the same published name only.
  const existing = await prisma.gpDoctorProfileDraft.findFirst({
    where: {
      clinicId,
      OR: [
        { practitionerId: practitioner.id },
        {
          preferredPublishedName: { in: nameCandidates },
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
      sourceUrl: doctor.sourceImageUrl,
      sourceProfileUrl: doctor.sourceProfileUrl,
      importedAt: new Date().toISOString(),
    },
    completenessScore: completeness.score,
    reviewNotes: `Imported from live profile ${doctor.sourceProfileUrl}. HotDoc deep-link not yet assigned — phone booking only.`,
  };

  let draft;
  if (existing) {
    draft = await prisma.gpDoctorProfileDraft.update({
      where: { id: existing.id },
      data,
    });
    await prisma.gpDoctorProfileStatusAudit.create({
      data: {
        profileId: draft.id,
        fromStatus: existing.status,
        toStatus: "draft",
        actorName: "practitioner_import",
        note: `Re-imported live profile fields for ${doctor.slug}`,
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
  const report = [];

  for (const doctor of DOCTORS) {
    console.log(`Portrait ${doctor.portraitFile}…`);
    await writePortrait(doctor.portraitFile, doctor.sourceImageUrl);
    const html = buildDoctorHtml(template, doctor);
    const { practitioner, pagePath } = await upsertPractitionerPage(clinic.id, doctor, html);
    const { draft, completeness } = await upsertImportDraft(clinic.id, doctor, practitioner);
    report.push({
      name: doctor.name,
      slug: doctor.slug,
      pagePath,
      practitionerId: practitioner.id,
      draftId: draft.id,
      completeness,
      importedFields: [
        "name",
        "credentials",
        "biography",
        "qualifications",
        "specialInterests",
        "languages",
        "profileImage",
        "professionalSummary",
        doctor.yearsPractising ? "yearsPractising" : null,
      ].filter(Boolean),
      missing: completeness.missing,
      booking: "phone-only (HotDoc deep-link not published on source)",
      urls: {
        local: `http://127.0.0.1:3100/${pagePath}`,
        next: `https://next.gabbamedicalcentre.com.au/${pagePath}`,
        source: doctor.sourceProfileUrl,
      },
    });
    console.log(`Onboarded ${doctor.name} → ${pagePath} (completeness ${completeness.score}%)`);
  }

  await writeFile(
    path.join(webRoot, "scripts", "_onboard-golnar-james-report.json"),
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
