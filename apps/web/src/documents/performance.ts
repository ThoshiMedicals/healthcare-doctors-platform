// Optimise delivered public HTML without changing the stored published source.
const imageDimensions: Record<string, readonly [number, number]> = {
  "assets/brand/agpal-mark.webp": [386, 386],
  "assets/brand/bulk-billing-practice.png": [1080, 1080],
  "assets/location-storefront-polished.webp": [1800, 1013],
  "assets/patient-information/new-patients-welcome-hero.webp": [1200, 900],
  "assets/clinic-reception.png": [1080, 870],
  "assets/community/gabba-stadium-precinct-aerial.webp": [1800, 1013],
  "assets/patient-information/telehealth-consultations-poster.webp": [1200, 900],
};

function optimiseImages(html: string, isHomepage: boolean): string {
  return html.replace(/<img\b[^>]*>/gi, tag => {
    const src = tag.match(/\bsrc\s*=\s*(["'])(.*?)\1/i)?.[2];
    if (!src) return tag;
    const normalized = src.replace(/^(?:(?:\.\.\/)|(?:\.\/)|\/)+/, "").split(/[?#]/, 1)[0];
    const dimensions = imageDimensions[normalized];
    if (!dimensions) return tag;

    const hasWidth = /\bwidth\s*=/.test(tag);
    const hasHeight = /\bheight\s*=/.test(tag);
    let result = tag;
    if (!hasWidth || !hasHeight) {
      result = result.replace(/\/?>$/, closing =>
        `${hasWidth ? "" : ` width="${dimensions[0]}"`}${hasHeight ? "" : ` height="${dimensions[1]}"`}${closing}`
      );
    }
    if (!isHomepage || /\bsrcset\s*=/.test(result)) return result;

    let candidates: string | undefined;
    let sizes: string | undefined;
    if (normalized === "assets/clinic-reception.png") {
      candidates = "assets/performance/clinic-reception-720.webp 720w, assets/performance/clinic-reception-1080.webp 1080w";
      sizes = "(max-width: 700px) 100vw, (max-width: 1024px) 70vw, 50vw";
    } else if (normalized === "assets/location-storefront-polished.webp") {
      candidates = "assets/performance/location-storefront-720.webp 720w, assets/performance/location-storefront-1280.webp 1280w, assets/performance/location-storefront-1800.webp 1800w";
      sizes = "(max-width: 700px) 100vw, (max-width: 1024px) 90vw, 50vw";
    } else if (normalized === "assets/community/gabba-stadium-precinct-aerial.webp") {
      candidates = "assets/performance/gabba-stadium-900.webp 900w, assets/community/gabba-stadium-precinct-aerial.webp 1800w";
      sizes = "(max-width: 700px) 100vw, (max-width: 1024px) 85vw, 48vw";
    } else if (normalized === "assets/patient-information/new-patients-welcome-hero.webp") {
      candidates = "assets/performance/new-patients-welcome-600.webp 600w, assets/patient-information/new-patients-welcome-hero.webp 1200w";
      sizes = "(max-width: 700px) 100vw, (max-width: 1024px) 90vw, 48vw";
    }
    if (candidates && sizes) {
      result = result.replace(/\/?>$/, closing =>
        ` srcset="${candidates}" sizes="${sizes}"${closing}`
      );
    }
    return result;
  });
}

export function optimiseHomepageDelivery(html: string, pagePath: string): string {
  let next = html;
  const isHomepage = pagePath === "index.html";
  if (isHomepage) {
    next = next
      .replace(
        '<source media="(max-width: 700px)" srcset="assets/hero-final-desktop.webp"/>',
        '<source media="(max-width: 700px)" srcset="assets/hero-final-mobile.webp" width="820" height="941"/>',
      )
      .replace(
        'href="assets/hero-final-desktop.webp" media="(max-width: 700px)"',
        'href="assets/hero-final-mobile.webp" media="(max-width: 700px)"',
      );
  }
  return optimiseImages(next, isHomepage);
}
