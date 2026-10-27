import fs from 'fs';

const files = [
  'old-html/index.html',
  'old-html/doctors/dr-tanya-goodwill.html',
  'old-html/services/womens-health.html',
  'old-html/services.html',
  'old-html/knowledge/index.html',
  'old-html/patient-information.html',
  'old-html/new-patients.html',
];

for (const f of files) {
  const raw = fs.readFileSync(f, 'utf8');
  const noScript = raw.replace(/<script[\s\S]*?<\/script>/gi, '');
  console.log('\n==== ' + f + ' ====');
  const bc = noScript.match(/<body[^>]*>/i);
  if (bc) console.log('BODY:', bc[0].slice(0, 220));
  console.log('patient-tasks:', /patient-tasks/.test(noScript));
  console.log('governance host:', /data-governance-page/.test(noScript));
  const gov = noScript.match(
    /data-governance-page="([^"]+)"[^>]*data-governance-review="([^"]*)"/
  );
  if (gov) {
    const host = noScript.match(/<div[^>]*data-governance-page[^>]*>/);
    console.log(
      'gov:',
      gov[1],
      'review=',
      JSON.stringify(gov[2]),
      'host=',
      host?.[0]
    );
  }
  const secs = [...noScript.matchAll(/<(section|nav|aside|footer|header|main)([^>]*)>/gi)];
  for (const m of secs) {
    const attrs = m[2];
    const cls = (attrs.match(/class="([^"]*)"/) || [])[1] || '';
    const id = (attrs.match(/id="([^"]*)"/) || [])[1] || '';
    const aria = (attrs.match(/aria-label="([^"]*)"/) || [])[1] || '';
    console.log(
      m[1] +
        (id ? '#' + id : '') +
        (cls ? '.' + cls.split(/\s+/).slice(0, 5).join('.') : '') +
        (aria ? ' [' + aria + ']' : '')
    );
  }
  const heads = [
    ...noScript.matchAll(/<(h[123]|p class="eyebrow")[^>]*>([^<]{0,110})/gi),
  ];
  for (const h of heads.slice(0, 45)) {
    console.log('  ' + h[1] + ': ' + h[2].replace(/\s+/g, ' ').trim());
  }
  console.log(
    'book CTAs:',
    (noScript.match(/wmc-book-appointment/g) || []).length,
    'hotdoc poster/app:',
    (noScript.match(/hotdoc-poster|hotdoc-app|class="[^"]*hotdoc/g) || []).length,
    'trust-line:',
    /trust-line|info-trust-logos|accreditation|AGPAL|RACGP/i.test(noScript)
  );
  // snippet around hotdoc / patient-tasks / governance
  if (/hotdoc/i.test(noScript)) {
    const hits = [...noScript.matchAll(/class="[^"]*hotdoc[^"]*"/gi)].slice(0, 12);
    console.log('hotdoc classes:', hits.map((x) => x[0]).join(' | '));
  }
}
