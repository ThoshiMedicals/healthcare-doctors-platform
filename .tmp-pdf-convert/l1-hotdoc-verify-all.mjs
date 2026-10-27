import fs from 'fs';

const routes = JSON.parse(fs.readFileSync('old-html/qa/PRACTITIONER-HOTDOC-ROUTES.json', 'utf8'));

async function check(url) {
  if (url.startsWith('tel:')) return { ok: true, status: 'tel', finalUrl: url, slugRetained: true };
  const res = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WMC-Readiness/1.0)', Accept: 'text/html' },
  });
  const text = await res.text();
  const title = (text.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1]?.trim() || '';
  const notFound = /page not found|couldn't find|does not exist/i.test(title + text.slice(0, 4000));
  const expectedSlug = url.split('/doctors/')[1]?.split('?')[0] || '';
  const slugRetained = res.url.includes(`/doctors/${expectedSlug}`);
  const nameHint = expectedSlug.split('-').slice(0, 3).join(' ');
  const bodyHasSlug = text.toLowerCase().includes(expectedSlug.slice(0, 20).toLowerCase());
  return {
    ok: res.ok && !notFound && slugRetained,
    status: res.status,
    finalUrl: res.url,
    title: title.slice(0, 100),
    slugRetained,
    bodyHasSlug,
    nameHint,
  };
}

const results = [];
for (const p of routes.practitioners) {
  const r = await check(p.booking_url);
  results.push({ name: p.name, booking_mode: p.booking_mode, booking_url: p.booking_url, ...r });
  console.log(`${r.ok ? 'OK' : 'FAIL'} ${p.name} slug=${r.slugRetained} ${r.status}`);
}

const out = {
  verifiedAt: new Date().toISOString(),
  method: 'HTTP GET; require 200, non-404, practitioner slug retained on final URL; tel accepted for reception_only',
  results,
  allOk: results.every((r) => r.ok),
  okCount: results.filter((r) => r.ok).length,
  total: results.length,
};
fs.writeFileSync('old-html/qa/HOTDOC_LIVE_VERIFY_L1.json', JSON.stringify(out, null, 2));
console.log('allOk', out.allOk, out.okCount, '/', out.total);
