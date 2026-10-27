import fs from 'fs';

function snippet(file, re, pad = 0) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(re);
  if (!m) return console.log(file, 'NO MATCH', re);
  const i = m.index;
  console.log('\n---', file, '---');
  console.log(raw.slice(i, i + Math.min(900, m[0].length + pad)).replace(/\s+/g, ' ').slice(0, 700));
}

snippet('old-html/doctors/dr-tanya-goodwill.html', /doctor-profile-actions[\s\S]{0,500}/);
snippet('old-html/doctors/dr-tanya-goodwill.html', /service-booking-cta[\s\S]{0,600}/);
snippet('old-html/doctors/dr-tanya-goodwill.html', /data-governance[\s\S]{0,120}/);
snippet('old-html/index.html', /healthcare-services-list[\s\S]{0,800}/);
snippet('old-html/index.html', /class="hero[\s\S]{0,400}/);
snippet('old-html/new-patients.html', /critical-action-band[\s\S]{0,500}/);
snippet('old-html/styles.css', /--navy[\s\S]{0,200}/);
snippet('old-html/services.html', /services-editorial-close|service-directory|Book Appointment[\s\S]{0,200}/);

// Count fonts link
const idx = fs.readFileSync('old-html/index.html', 'utf8');
const fonts = idx.match(/fonts\.googleapis[^"']+/g);
console.log('\nfonts:', fonts);
console.log('home has governance?', /data-governance-page/.test(idx));
console.log('team before philosophy?', idx.indexOf('id="team"') < idx.indexOf('id="philosophy"'));
