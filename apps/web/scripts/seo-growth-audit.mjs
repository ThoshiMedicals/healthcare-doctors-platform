/**
 * SEO Authority Recovery audit — evidence from live UAT HTML only.
 * Does not invent content; reports what is present vs missing on pages.
 */
const base = process.env.SEO_AUDIT_BASE || "http://127.0.0.1:3100";

const DOCTORS = [
  ["Tanya", "/doctors/dr-tanya-goodwill.html"],
  ["Debra", "/doctors/dr-debra-larkins.html"],
  ["Anand", "/doctors/dr-anand-singh.html"],
  ["Sumita", "/doctors/dr-sumita-singh.html"],
  ["Golnar", "/doctors/dr-golnar-mortezaei.html"],
  ["James", "/doctors/dr-james.html"],
  ["Yamesha", "/doctors/dr-yamesha-ranatunga.html"],
];

const SERVICE_INTENTS = [
  ["Women's Health", "/services/womens-health.html"],
  ["Men's Health", "/services/mens-health.html"],
  ["Family Medicine", "/services/family-health.html"],
  ["Skin Checks", "/services/skin-checks.html"],
  ["Vaccinations", "/services/vaccinations.html"],
  ["Mental Health", "/services/mental-health.html"],
  ["Chronic Disease", "/services/chronic-disease-care.html"],
  ["Children's Health", "/services/childrens-health.html"],
  ["Travel Health", null], // expect gap or vaccinations proxy
  ["Sexual Health", null],
  ["Preventive Care", "/services/preventive-healthcare.html"],
];

const LOCAL_TERMS = [
  "Woolloongabba",
  "Brisbane",
  "South Brisbane",
  "Kangaroo Point",
  "Highgate Hill",
  "Dutton Park",
  "East Brisbane",
];

function strip(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function meta(html, name) {
  const re1 = new RegExp(`name="${name}"\\s+content="([^"]*)"`, "i");
  const re2 = new RegExp(`content="([^"]*)"\\s+name="${name}"`, "i");
  return (html.match(re1) || html.match(re2) || [])[1] || "";
}

function titleOf(html) {
  return (html.match(/<title>([^<]+)/i) || [])[1] || "";
}

function h1Of(html) {
  return (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]?.replace(/<[^>]+>/g, "").trim() || "";
}

function canonical(html) {
  return (
    (html.match(/rel="canonical"[^>]*href="([^"]+)"/i) ||
      html.match(/href="([^"]+)"[^>]*rel="canonical"/i) ||
      [])[1] || ""
  );
}

function ldTypes(html) {
  return [...new Set([...html.matchAll(/"@type"\s*:\s*"([^"]+)"/g)].map((m) => m[1]))];
}

function linksTo(html, prefix) {
  return [...new Set([...html.matchAll(new RegExp(`href="(${prefix}[^"#?]*)"`, "g"))].map((m) => m[1]))];
}

function careHighlights(html) {
  const block = html.match(
    /practitioner-care-highlights[\s\S]*?<\/ul>|gp-discovery-areas[\s\S]*?<\/ul>/i,
  );
  if (!block) return [];
  return [...block[0].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) =>
    m[1].replace(/<[^>]+>/g, "").trim(),
  );
}

function extractLabelBlock(text, labels) {
  for (const lab of labels) {
    const i = text.toLowerCase().indexOf(lab.toLowerCase());
    if (i >= 0) return text.slice(i, Math.min(text.length, i + 220));
  }
  return "";
}

async function fetchHtml(path) {
  const res = await fetch(base + path, { redirect: "manual" });
  const html = res.status >= 200 && res.status < 400 ? await res.text() : "";
  return { status: res.status, html, xrobots: res.headers.get("x-robots-tag") };
}

async function auditDoctors() {
  const rows = [];
  for (const [name, path] of DOCTORS) {
    const { status, html } = await fetchHtml(path);
    if (status !== 200) {
      rows.push({ name, path, status, error: true });
      continue;
    }
    const text = strip(html);
    const types = ldTypes(html);
    const svc = linksTo(html, "/services/");
    const knowledge = linksTo(html, "/knowledge/");
    const updates = linksTo(html, "/updates/");
    const highlights = careHighlights(html);
    const hotdoc = /hotdoc\.com/i.test(html);
    const tel = /href="tel:/i.test(html);
    rows.push({
      name,
      path,
      status,
      title: titleOf(html),
      h1: h1Of(html),
      description: meta(html, "description"),
      descriptionLen: meta(html, "description").length,
      canonical: canonical(html),
      careHighlights: highlights,
      hasLanguagesLabel: /languages?/i.test(text),
      languagesSnippet: extractLabelBlock(text, ["Languages", "Language"]),
      hasQualificationsLabel: /qualifications?|FRACGP|MBBS|MD\b/i.test(text),
      qualificationsSnippet: extractLabelBlock(text, ["Qualifications", "Credentials"]),
      hasInterestLabel: /special interests?|areas of interest|helping patients|areas of care|clinical interests/i.test(
        text,
      ),
      interestSnippet: extractLabelBlock(text, [
        "Special interests",
        "Helping patients",
        "Areas of care",
        "Areas of interest",
      ]),
      serviceLinks: svc,
      knowledgeLinks: knowledge,
      updateLinks: updates,
      hotdoc,
      tel,
      schemaTypes: types,
      hasPhysician: types.includes("Physician"),
      hasPerson: types.includes("Person"),
      hasFAQ: types.includes("FAQPage"),
      hasBreadcrumb: types.includes("BreadcrumbList"),
      hasMedicalClinic: types.includes("MedicalClinic"),
      knowsLanguageInLd: /knowsLanguage/.test(html),
      medicalSpecialtyInLd: /medicalSpecialty/.test(html),
      wordCount: text.split(/\s+/).length,
    });
  }
  return rows;
}

async function auditServices() {
  const rows = [];
  for (const [intent, path] of SERVICE_INTENTS) {
    if (!path) {
      rows.push({
        intent,
        path: null,
        status: "MISSING_PAGE",
        doctorLinks: [],
        knowledgeLinks: [],
        localHits: [],
      });
      continue;
    }
    const { status, html } = await fetchHtml(path);
    if (status !== 200) {
      rows.push({ intent, path, status, error: true });
      continue;
    }
    const text = strip(html);
    const doctorLinks = linksTo(html, "/doctors/");
    const teamLinks = [...linksTo(html, "/team"), ...linksTo(html, "/team-")];
    const knowledgeLinks = linksTo(html, "/knowledge/");
    const types = ldTypes(html);
    const localHits = LOCAL_TERMS.filter((t) => text.includes(t));
    const hasAvailablePractitioners =
      /available practitioners|our (gps|doctors|team)|meet (our )?(gps|doctors)/i.test(text) ||
      doctorLinks.length > 0;
    rows.push({
      intent,
      path,
      status,
      title: titleOf(html),
      descriptionLen: meta(html, "description").length,
      h1: h1Of(html),
      doctorLinks,
      teamLinks,
      knowledgeLinks,
      hasAvailablePractitioners,
      schemaTypes: types,
      hasService: types.includes("Service") || types.includes("MedicalProcedure"),
      hasFAQ: types.includes("FAQPage"),
      hasBreadcrumb: types.includes("BreadcrumbList"),
      hasMedicalClinic: types.includes("MedicalClinic"),
      localHits,
      wordCount: text.split(/\s+/).length,
      serviceOutbound: linksTo(html, "/services/").filter((u) => u !== path),
    });
  }
  return rows;
}

async function auditLocalHomeContact() {
  const paths = ["/", "/contact.html", "/bulk-billing.html", "/team-general-practitioners.html"];
  const out = [];
  for (const path of paths) {
    const { status, html } = await fetchHtml(path);
    const text = status === 200 ? strip(html) : "";
    out.push({
      path,
      status,
      localHits: LOCAL_TERMS.filter((t) => text.includes(t)),
      schemaTypes: status === 200 ? ldTypes(html) : [],
      hasLocalBusiness: status === 200 && /LocalBusiness/.test(html),
      hasMedicalClinic: status === 200 && /MedicalClinic/.test(html),
    });
  }
  return out;
}

async function auditLaunchAssets() {
  const assets = {
    golnar: {
      profile: "/doctors/dr-golnar-mortezaei.html",
      updateCandidates: [],
      team: "/team.html",
      gpIndex: "/team-general-practitioners.html",
    },
    james: {
      profile: "/doctors/dr-james.html",
      updateCandidates: [],
      team: "/team.html",
      gpIndex: "/team-general-practitioners.html",
    },
  };

  const updatesIndex = await fetchHtml("/updates/");
  const updatesHtml = updatesIndex.html || "";
  const updateLinks = [
    ...new Set([...updatesHtml.matchAll(/href="(\/updates\/[^"]+\.html)"/g)].map((m) => m[1])),
  ];

  for (const link of updateLinks.slice(0, 80)) {
    const { status, html } = await fetchHtml(link);
    if (status !== 200) continue;
    const t = strip(html) + " " + titleOf(html);
    if (/Golnar|Mortezaei/i.test(t)) assets.golnar.updateCandidates.push(link);
    if (/James Chanaka|Dr James/i.test(t) && /welcome|join|new/i.test(t)) {
      assets.james.updateCandidates.push(link);
    } else if (/James Chanaka/i.test(t)) {
      assets.james.updateCandidates.push(link);
    }
  }

  const result = {};
  for (const [key, a] of Object.entries(assets)) {
    const profile = await fetchHtml(a.profile);
    const team = await fetchHtml(a.team);
    const gp = await fetchHtml(a.gpIndex);
    const nameRe = key === "golnar" ? /Golnar|Mortezaei/i : /James Chanaka|Dr James/i;
    const profileHtml = profile.html;
    const hotdoc = /hotdoc\.com/i.test(profileHtml);
    const tel = /href="tel:/i.test(profileHtml);
    const linksFromProfile = {
      services: linksTo(profileHtml, "/services/"),
      updates: linksTo(profileHtml, "/updates/"),
      knowledge: linksTo(profileHtml, "/knowledge/"),
    };
    const updateDetails = [];
    for (const u of a.updateCandidates) {
      const uh = await fetchHtml(u);
      updateDetails.push({
        path: u,
        linksToProfile: linksTo(uh.html, "/doctors/").some((x) => x.includes(a.profile.replace("/doctors/", ""))),
        allDoctorLinks: linksTo(uh.html, "/doctors/"),
        serviceLinks: linksTo(uh.html, "/services/"),
      });
    }
    result[key] = {
      profileOk: profile.status === 200,
      inTeam: nameRe.test(team.html),
      inGpIndex: nameRe.test(gp.html),
      booking: { hotdoc, tel, path: hotdoc ? "hotdoc" : tel ? "phone" : "none" },
      updates: updateDetails,
      profileCrossLinks: linksFromProfile,
    };
  }
  return result;
}

async function auditKnowledgeSample() {
  const index = await fetchHtml("/knowledge/");
  const articleLinks = [
    ...new Set([...index.html.matchAll(/href="(\/knowledge\/articles\/[^"]+\.html)"/g)].map((m) => m[1])),
  ].slice(0, 12);
  const rows = [];
  for (const path of articleLinks) {
    const { status, html } = await fetchHtml(path);
    if (status !== 200) continue;
    rows.push({
      path,
      title: titleOf(html),
      serviceLinks: linksTo(html, "/services/"),
      doctorLinks: linksTo(html, "/doctors/"),
      bookLinks: [...html.matchAll(/href="([^"]*(?:book-appointment|hotdoc)[^"]*)"/gi)].map((m) => m[1]),
      schemaTypes: ldTypes(html),
      hasArticle: /"@type"\s*:\s*"Article"/.test(html) || /"@type"\s*:\s*"MedicalWebPage"/.test(html),
    });
  }
  return { indexStatus: index.status, sampleCount: rows.length, rows };
}

const report = {
  generatedAt: new Date().toISOString(),
  base,
  doctors: await auditDoctors(),
  services: await auditServices(),
  local: await auditLocalHomeContact(),
  launchAssets: await auditLaunchAssets(),
  knowledge: await auditKnowledgeSample(),
};

const outPath = new URL("../../../docs/WMC-SEO-GROWTH-AUDIT-EVIDENCE.json", import.meta.url);
import { writeFileSync } from "node:fs";
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ok: true, out: outPath.pathname, doctors: report.doctors.length, services: report.services.length }, null, 2));
