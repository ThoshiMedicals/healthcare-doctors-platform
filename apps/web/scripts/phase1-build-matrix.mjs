import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const require = createRequire(import.meta.url);

// Load map by evaluating compiled-free regex table from source file text is fragile;
// duplicate the approved matching rules inline to match care-area-service-map.ts.
const CARE_AREA_SERVICE_MAP = [
  { match: /women[''\u2019]?s\s+health/i, servicePath: "services/womens-health.html", serviceLabel: "Women's Health" },
  { match: /(^|[^a-z])men[''\u2019]?s\s+health/i, servicePath: "services/mens-health.html", serviceLabel: "Men's Health" },
  { match: /child(ren)?([''\u2019]?s)?\s+health|child\s+health/i, servicePath: "services/childrens-health.html", serviceLabel: "Children's Health" },
  { match: /adolescent|youth\s+health/i, servicePath: "services/childrens-health.html", serviceLabel: "Children's Health" },
  { match: /mental\s+health/i, servicePath: "services/mental-health.html", serviceLabel: "Mental Health" },
  { match: /family\s+(health|medicine)|general\s+practice|primary\s+care/i, servicePath: "services/family-health.html", serviceLabel: "Family Health" },
  {
    match: /chronic\s+(disease|medical\s+conditions?)|diabetes|heart\s+disease|copd|osteoarthritis|osteoporosis/i,
    servicePath: "services/chronic-disease-care.html",
    serviceLabel: "Chronic Disease Care",
  },
  { match: /skin\s+check|dermatology|skin\s+cancer/i, servicePath: "services/skin-checks.html", serviceLabel: "Skin Checks" },
  { match: /skin\s+check|dermatology|skin\s+cancer/i, servicePath: "services/skin-cancer-care.html", serviceLabel: "Skin Cancer Care" },
  { match: /vaccin|immunis|travel\s+health/i, servicePath: "services/vaccinations.html", serviceLabel: "Vaccinations" },
  { match: /preventive|prevention/i, servicePath: "services/preventive-healthcare.html", serviceLabel: "Preventive Healthcare" },
  {
    match: /antenatal|postnatal|maternity|pregnancy|pre-pregnancy|shared\s+antenatal/i,
    servicePath: "services/antenatal-postnatal-care.html",
    serviceLabel: "Antenatal & Postnatal Care",
  },
  {
    match: /pre-pregnancy|recurrent\s+miscarriage|obstetric|gynaecolog/i,
    servicePath: "services/womens-health.html",
    serviceLabel: "Women's Health",
  },
  {
    match: /pre-pregnancy|recurrent\s+miscarriage/i,
    servicePath: "services/pre-pregnancy-care.html",
    serviceLabel: "Pre-Pregnancy Care",
  },
];

function servicesForCareAreas(areas) {
  const out = [];
  const seen = new Set();
  for (const area of areas) {
    for (const rule of CARE_AREA_SERVICE_MAP) {
      if (!rule.match.test(area)) continue;
      if (seen.has(rule.servicePath)) continue;
      seen.add(rule.servicePath);
      out.push({ path: rule.servicePath, label: rule.serviceLabel, via: area });
    }
  }
  return out;
}

const golden = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../.tmp-phase1-golden-doctors.json"), "utf8"));
const services = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../.tmp-phase1-golden-services.json"), "utf8"));
const cmsPath = path.resolve(__dirname, "../.tmp-phase1-cms-practitioners.json");
const cms = fs.existsSync(cmsPath) ? JSON.parse(fs.readFileSync(cmsPath, "utf8")) : { rows: [] };

const practitioners = [];

for (const g of golden) {
  const areas = [...new Set([...(g.knowsAbout || []), ...(g.interestsVisible || []), ...(g.highlights || [])])];
  practitioners.push({
    key: g.slug,
    name: g.name,
    origin: "golden",
    areas,
    mappedServices: servicesForCareAreas(areas),
    bookCta: g.bookCta,
    fracgp: g.fracgp,
    franzcog: g.franzcog,
  });
}

for (const c of cms.rows || []) {
  if (c.status !== "published") continue;
  if (practitioners.some((p) => p.key === c.slug || `dr-${c.slug}` === c.slug)) {
    // Prefer CMS areas when published import; still keep golden if same slug exists in golden set
    const existing = practitioners.find((p) => p.key === c.slug || p.key === path.basename(c.pagePath || "", ".html"));
    if (existing && Array.isArray(c.areasOfCare) && c.areasOfCare.length) {
      existing.cmsAreas = c.areasOfCare;
      existing.mappedServices = servicesForCareAreas([
        ...new Set([...(existing.areas || []), ...c.areasOfCare]),
      ]);
      existing.origin = "golden+cms";
    }
    continue;
  }
  const areas = c.areasOfCare || [];
  practitioners.push({
    key: c.slug,
    name: c.name,
    origin: c.importSource === "practitioner_import" ? "cms-import" : "cms",
    areas,
    mappedServices: servicesForCareAreas(areas),
    bookCta: c.bookingUrl ? "HOTDOC" : "UNKNOWN",
    fracgp: JSON.stringify(c.qualifications || []).includes("FRACGP"),
    franzcog: JSON.stringify(c.qualifications || []).includes("FRANZCOG"),
    pagePath: c.pagePath,
  });
}

const matrix = services.map((svc) => {
  const goldenOnRail = (svc.practitioners || []).map((p) => p.slug.replace(/\.html$/, ""));
  const approvedByMap = practitioners
    .filter((p) => p.mappedServices.some((s) => s.path === svc.path))
    .map((p) => ({
      key: p.key,
      name: p.name,
      origin: p.origin,
      via: p.mappedServices.find((s) => s.path === svc.path)?.via,
    }));
  const missingFromRail = approvedByMap.filter((p) => !goldenOnRail.includes(p.key) && !goldenOnRail.includes(`${p.key}.html`));
  const onRailWithoutMapEvidence = goldenOnRail.filter(
    (slug) => !approvedByMap.some((p) => p.key === slug || p.key === slug.replace(/\.html$/, "")),
  );
  return {
    service: svc.path,
    title: svc.title,
    hasRelatedRail: svc.hasRelatedRail,
    hasBook: svc.hasBook,
    hasTeamLink: svc.hasTeamLink,
    goldenRail: goldenOnRail,
    approvedByMap,
    missingFromRail: missingFromRail.map((p) => p.key),
    onRailWithoutMapEvidence,
    deadEnd: !svc.hasRelatedRail || (svc.practitionerCount === 0 && !svc.hasTeamLink),
  };
});

const unmappedAreas = [];
for (const p of practitioners) {
  for (const area of p.areas) {
    const hit = CARE_AREA_SERVICE_MAP.some((r) => r.match.test(area));
    if (!hit) unmappedAreas.push({ practitioner: p.name, area });
  }
}

const out = {
  generatedAt: new Date().toISOString(),
  practitionerCount: practitioners.length,
  serviceCount: matrix.length,
  practitioners,
  matrix,
  unmappedAreas: [...new Map(unmappedAreas.map((u) => [`${u.practitioner}|${u.area}`, u])).values()],
};

fs.writeFileSync(path.resolve(__dirname, "../.tmp-phase1-matrix.json"), JSON.stringify(out, null, 2));
console.log(
  `matrix: ${practitioners.length} practitioners, ${matrix.length} services, ${out.unmappedAreas.length} unmapped area rows`,
);
