// Only the homepage delivery markup is optimised here.
// Published content, SEO metadata, schema and booking markup are unchanged.
const homepageImageDimensions: Record<string, readonly [number, number]> = {
  "assets/brand/agpal-mark.webp": [386, 386],
  "assets/brand/bulk-billing-practice.png": [1080, 1080],
  "assets/location-storefront-polished.webp": [1800, 1013],
  "assets/patient-information/new-patients-welcome-hero.webp": [1200, 900],
  "assets/clinic-reception.png": [1080, 870],
  "assets/patient-information/telehealth-consultations-poster.webp": [1200, 900],
};

function addVerifiedDimensions(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = tag.match(/\bsrc\s*=\s*(["'])(.*?)\1/i)?.[2];
    if (!src) return tag;
    const normalized = src.replace(/^(?:(?:\.\.\/)|(?:\.\/)|\/)+/, "").split(/[?#]/, 1)[0];
    const dimensions = homepageImageDimensions[normalized];
    if (!dimensions) return tag;

    const hasWidth = /\bwidth\s*=/.test(tag);
    const hasHeight = /\bheight\s*=/.test(tag);
    if (hasWidth && hasHeight) return tag;

    return tag.replace(/\/?>$/, (closing) =>
      `${hasWidth ? "" : ` width="${dimensions[0]}"`}${hasHeight ? "" : ` height="${dimensions[1]}"`}${closing}`
    );
  });
}

export function optimiseHomepageDelivery(html: string, pagePath: string): string {
  if (pagePath !== "index.html") return html;

  // Art-directed mobile crop and matching mobile preload; desktop/tablet unchanged.
  const withMobileHero = html
    .replace(
      '<source media="(max-width: 700px)" srcset="assets/hero-final-desktop.webp"/>',
      '<source media="(max-width: 700px)" srcset="assets/hero-final-mobile.webp" width="820" height="941"/>',
    )
    .replace(
      'href="assets/hero-final-desktop.webp" media="(max-width: 700px)"',
      'href="assets/hero-final-mobile.webp" media="(max-width: 700px)"',
    );

  return addVerifiedDimensions(withMobileHero);
}
