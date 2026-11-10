/**
 * Maps published care-area labels (as stored on practitioner payloads / highlights)
 * to existing service page paths. Only exact, evidence-based destinations — no invented pages.
 */
export const CARE_AREA_SERVICE_MAP: ReadonlyArray<{
  match: RegExp;
  servicePath: string;
  serviceLabel: string;
}> = [
  // Accept ASCII or typographic apostrophes in care-area labels.
  { match: /women[''\u2019]?s\s+health/i, servicePath: "services/womens-health.html", serviceLabel: "Women's Health" },
  // Do not match the "men's" substring inside "women's health".
  { match: /(^|[^a-z])men[''\u2019]?s\s+health/i, servicePath: "services/mens-health.html", serviceLabel: "Men's Health" },
  { match: /child(ren)?([''\u2019]?s)?\s+health|child\s+health/i, servicePath: "services/childrens-health.html", serviceLabel: "Children's Health" },
  { match: /mental\s+health/i, servicePath: "services/mental-health.html", serviceLabel: "Mental Health" },
  { match: /family\s+(health|medicine)|general\s+practice/i, servicePath: "services/family-health.html", serviceLabel: "Family Health" },
  {
    match: /chronic\s+(disease|medical\s+conditions?)|diabetes|heart\s+disease|copd|osteoarthritis|osteoporosis/i,
    servicePath: "services/chronic-disease-care.html",
    serviceLabel: "Chronic Disease Care",
  },
  { match: /skin\s+check|dermatology|skin\s+cancer/i, servicePath: "services/skin-checks.html", serviceLabel: "Skin Checks" },
  // Same clinical skin signals also qualify practitioners for the skin-cancer-care service page.
  {
    match: /skin\s+check|dermatology|skin\s+cancer/i,
    servicePath: "services/skin-cancer-care.html",
    serviceLabel: "Skin Cancer Care",
  },
  { match: /vaccin|immunis|travel\s+health/i, servicePath: "services/vaccinations.html", serviceLabel: "Vaccinations" },
  { match: /preventive|prevention/i, servicePath: "services/preventive-healthcare.html", serviceLabel: "Preventive Healthcare" },
  {
    match: /antenatal|postnatal|maternity|pregnancy|pre-pregnancy/i,
    servicePath: "services/antenatal-postnatal-care.html",
    serviceLabel: "Antenatal & Postnatal Care",
  },
];

/** Service path → which care-area regexes qualify a practitioner for that service page. */
export function matchingCareLabel(areas: readonly string[], servicePath: string): string | null {
  const normalized = servicePath.replace(/^\//, "");
  for (const area of areas) {
    for (const rule of CARE_AREA_SERVICE_MAP) {
      if (rule.servicePath === normalized && rule.match.test(area)) {
        return area;
      }
    }
  }
  return null;
}

export function servicesForCareAreas(areas: readonly string[]): Array<{ path: string; label: string }> {
  const out: Array<{ path: string; label: string }> = [];
  const seen = new Set<string>();
  for (const area of areas) {
    for (const rule of CARE_AREA_SERVICE_MAP) {
      if (!rule.match.test(area)) continue;
      if (seen.has(rule.servicePath)) continue;
      seen.add(rule.servicePath);
      out.push({ path: rule.servicePath, label: rule.serviceLabel });
    }
  }
  return out;
}
