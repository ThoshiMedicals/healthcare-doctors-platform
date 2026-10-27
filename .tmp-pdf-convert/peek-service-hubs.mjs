import fs from 'fs';

function has(html, ...needles) {
  return needles.map(n => ({ n, ok: html.includes(n) }));
}

function sectionIds(html) {
  return [...html.matchAll(/<section[^>]*id="([^"]+)"/g)].map(m => m[1]);
}

for (const file of [
  'old-html/services/skin-checks.html',
  'old-html/services/womens-health.html',
  'old-html/services/family-health.html',
  'old-html/services/chronic-disease-care.html',
  'old-html/services/pathology.html',
  'old-html/services/telehealth.html',
]) {
  if (!fs.existsSync(file)) {
    console.log('MISSING', file);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  console.log('\n====', file);
  console.log(
    'hero',
    /service-authority-hero/.test(html),
    'wayfinding',
    /topic-wayfinding/.test(html),
    'guides',
    /id="patient-guides"|wmc-reciprocal-guides/.test(html),
    'practitioners',
    /id="related-practitioners"/.test(html),
    'book',
    /id="book"|service-booking-cta/.test(html)
  );
  console.log('sections', sectionIds(html).join(', '));
  const way = html.match(/topic-wayfinding[\s\S]{0,400}/);
  if (way) console.log('way:', way[0].replace(/\s+/g, ' ').slice(0, 280));
}
