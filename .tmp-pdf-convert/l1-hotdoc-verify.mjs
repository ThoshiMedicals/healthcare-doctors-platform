import fs from 'fs';

const routes = JSON.parse(fs.readFileSync('old-html/qa/PRACTITIONER-HOTDOC-ROUTES.json', 'utf8'));
const focus = [
  'Dr Mary Abadir',
  'Dr Sumita Singh',
  'Dr Tanya Goodwill',
  'Dr Anand Singh',
  'Dr Wasantha Hettiarchchi',
  'Dr Steven Chang',
  'Mr Samuel Stafford',
];

const targets = routes.practitioners.filter((p) => focus.includes(p.name));

async function check(url) {
  if (url.startsWith('tel:')) {
    return { ok: true, status: 'tel', finalUrl: url, mode: 'reception_only' };
  }
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; WMC-Readiness/1.0; +https://gabbamedicalcentre.com.au)',
        Accept: 'text/html',
      },
    });
    const text = await res.text();
    const title = (text.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1]?.trim() || '';
    const notFound =
      /page not found|couldn't find|does not exist|404/i.test(title) ||
      /page not found|couldn't find that doctor/i.test(text.slice(0, 5000));
    const hasBooking =
      /book|appointment|select a time|availability/i.test(text.slice(0, 12000)) ||
      /hotdoc/i.test(title);
    return {
      ok: res.ok && !notFound,
      status: res.status,
      finalUrl: res.url,
      title: title.slice(0, 120),
      notFound,
      hasBookingSignals: hasBooking,
    };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

const results = [];
for (const p of targets) {
  const r = await check(p.booking_url);
  results.push({
    name: p.name,
    profile: p.profile,
    booking_mode: p.booking_mode,
    booking_url: p.booking_url,
    ...r,
  });
  console.log(
    `${r.ok ? 'OK' : 'FAIL'} ${p.name} → ${r.status || r.error} ${r.title || r.mode || ''}`
  );
}

fs.writeFileSync(
  'old-html/qa/HOTDOC_LIVE_VERIFY_L1.json',
  JSON.stringify(
    {
      verifiedAt: new Date().toISOString(),
      method: 'HTTP GET follow redirects; reception_only = tel: accepted',
      focus,
      results,
      allOk: results.every((r) => r.ok),
    },
    null,
    2
  )
);
console.log('wrote old-html/qa/HOTDOC_LIVE_VERIFY_L1.json allOk=', results.every((r) => r.ok));
