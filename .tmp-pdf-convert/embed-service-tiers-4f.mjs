import fs from 'fs';

// Ensure tiers file is current
import './audit-service-tiers.mjs';

const tiers = JSON.parse(
  fs.readFileSync('apps/web/public/search-index/service-authority-tiers.json', 'utf8')
);

// Enrich with related knowledge/practitioner URLs from services shard for wayfinding.
const services = JSON.parse(
  fs.readFileSync('apps/web/public/search-index/services.json', 'utf8')
);
const doctors = JSON.parse(
  fs.readFileSync('apps/web/public/search-index/doctors.json', 'utf8')
);
const manifest = JSON.parse(
  fs.readFileSync('apps/web/public/search-index/manifest.json', 'utf8')
);
const allRows = [];
for (const shard of manifest.shards || []) {
  allRows.push(
    ...JSON.parse(fs.readFileSync(`apps/web/public/search-index/${shard}.json`, 'utf8'))
  );
}
const byUrl = new Map(allRows.map(r => [r.url, r]));

function prettyTitle(url, entry) {
  if (entry?.title) return entry.title;
  if (entry?.h1) return entry.h1;
  return String(url || '')
    .replace(/^knowledge\/(articles\/)?/, '')
    .replace(/\.html$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

const enriched = {
  ...tiers,
  services: tiers.services.map(row => {
    const entry = services.find(s => s.url === row.url) || {};
    const related = entry.related || [];
    const knowledge = related
      .filter(u => String(u).startsWith('knowledge/') || String(u).includes('/articles/'))
      .slice(0, 4)
      .map(u => ({
        url: u,
        title: prettyTitle(u, byUrl.get(u)),
      }));
    const practitioners = related
      .filter(u => String(u).startsWith('doctors/'))
      .slice(0, 4)
      .map(u => ({
        url: u,
        title: prettyTitle(u, byUrl.get(u)),
      }));
    return { ...row, knowledge, practitioners };
  }),
};

fs.writeFileSync(
  'apps/web/public/search-index/service-authority-tiers.json',
  JSON.stringify(enriched)
);
fs.writeFileSync(
  'old-html/search-index/service-authority-tiers.json',
  JSON.stringify(enriched)
);

const sitePath = 'old-html/site.js';
let site = fs.readFileSync(sitePath, 'utf8');
const marker = '/* 4F — Service hub presentation';
const start = site.indexOf(marker);
const head = start >= 0 ? site.slice(0, start) : site.replace(/\s*$/, '\n\n');

const block = `${marker}
   Marks Hub / Developing / Thin services from the authority graph and
   standardises a destination pathway rail (guides · practitioners · book). */
(() => {
  const TIERS = ${JSON.stringify(enriched)};

  const pathName = (location.pathname || '').replace(/\\\\/g, '/');
  const serviceMatch = pathName.match(/\\/services\\/([^/]+?\\.html)/i);
  const isDirectory = /\\/services(\\.html)?$/i.test(pathName) || /\\/services\\/?$/i.test(pathName);

  const escapeHtml = value =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const depth = pathName.includes('/services/') ? 1 : 0;
  const root = depth ? '../' : '';

  const byUrl = Object.fromEntries((TIERS.services || []).map(s => [s.url, s]));

  const tierLabel = tier =>
    tier === 'Hub' ? 'Service hub' : tier === 'Developing' ? 'Connected service' : 'Focused service';
  const tierClass = tier =>
    tier === 'Hub' ? 'service-tier-hub' : tier === 'Developing' ? 'service-tier-developing' : 'service-tier-thin';

  // Directory listing: mark rows by tier for visual scanning.
  if (isDirectory) {
    document.body.classList.add('services-directory-page');
    document.querySelectorAll('a.service-directory-row[href]').forEach(a => {
      const href = (a.getAttribute('href') || '').replace(/\\\\/g, '/');
      const key = href.replace(/^\\.\\//, '').replace(/^\\//, '');
      const row = byUrl[key] || byUrl['services/' + key.replace(/^services\\//, '')];
      if (!row) return;
      a.classList.add('service-tier-link', tierClass(row.tier));
      a.setAttribute('data-service-tier', row.tier.toLowerCase());
      if (!a.querySelector('.service-tier-chip')) {
        const chip = document.createElement('span');
        chip.className = 'service-tier-chip';
        chip.textContent = tierLabel(row.tier);
        const strong = a.querySelector('strong');
        if (strong) strong.append(chip);
        else a.prepend(chip);
      }
    });
    return;
  }

  if (!serviceMatch) return;
  const serviceUrl = 'services/' + serviceMatch[1].toLowerCase();
  const row = byUrl[serviceUrl];
  if (!row) return;

  document.body.classList.add('service-authority-page', tierClass(row.tier));
  document.body.setAttribute('data-service-tier', row.tier.toLowerCase());
  document.body.setAttribute('data-service-score', String(row.authority_score));

  const article =
    document.querySelector('article.service-authority-article, article.article, main .article') ||
    document.querySelector('main');
  if (article) {
    article.classList.add('service-authority-article', tierClass(row.tier));
    article.setAttribute('data-service-tier', row.tier.toLowerCase());
  }

  // Hero chip — patient-facing labels, not internal scores.
  const hero =
    document.querySelector('.service-authority-hero .page-hero-inner, .page-hero .page-hero-inner, .page-hero');
  if (hero && !hero.querySelector('.service-tier-chip')) {
    const chip = document.createElement('p');
    chip.className = 'service-tier-chip service-tier-chip--hero';
    chip.textContent = tierLabel(row.tier);
    chip.setAttribute('title', 'Based on published links across guides, practitioners and related services.');
    const eyebrow = hero.querySelector('.eyebrow');
    if (eyebrow) eyebrow.after(chip);
    else hero.prepend(chip);
  }

  // Wayfinding for hubs missing Knowledge links.
  if (!document.querySelector('.topic-wayfinding') && (row.knowledge || []).length) {
    const nav = document.createElement('nav');
    nav.className = 'topic-wayfinding';
    nav.setAttribute('aria-label', 'Related topic');
    nav.innerHTML =
      '<div class="shell">' +
      row.knowledge
        .slice(0, 2)
        .map(
          item =>
            '<a href="' +
            escapeHtml(root + item.url) +
            '">Read about ' +
            escapeHtml(String(item.title || '').replace(/\\.$/, '')) +
            '.</a>'
        )
        .join('') +
      '</div>';
    const heroEl = document.querySelector('.page-hero, .service-authority-hero');
    const crumbs = document.querySelector('.breadcrumb-bar');
    if (heroEl) heroEl.insertAdjacentElement('afterend', nav);
    else if (crumbs) crumbs.insertAdjacentElement('beforebegin', nav);
  }

  if (document.querySelector('[data-service-pathways]')) return;

  const guideSection = document.querySelector('#patient-guides');
  const practitionerSection = document.querySelector('#related-practitioners');
  const bookSection = document.querySelector('#book, .service-booking-cta');
  const bookHref =
    document.querySelector('#book a.wmc-book-appointment, .service-booking-cta a.wmc-book-appointment, a.wmc-book-appointment')?.getAttribute('href') ||
    'https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox';

  const guideLinks = [
    ...document.querySelectorAll('#patient-guides a.resource-link, #patient-guides a.knowledge-article-card'),
  ]
    .slice(0, 3)
    .map(a => ({
      href: a.getAttribute('href'),
      label: (a.querySelector('span,strong')?.textContent || a.textContent || 'Guide')
        .replace(/\\s+/g, ' ')
        .trim()
        .replace(/→.*$/, '')
        .trim(),
    }))
    .filter(x => x.href);

  if (!guideLinks.length && row.knowledge?.length) {
    row.knowledge.slice(0, 3).forEach(item => {
      guideLinks.push({ href: root + item.url, label: item.title });
    });
  }

  const practitionerLinks = [
    ...document.querySelectorAll('#related-practitioners a.resource-link, #related-practitioners a.practitioner-knowledge-link'),
  ]
    .slice(0, 3)
    .map(a => ({
      href: a.getAttribute('href'),
      label: (a.querySelector('strong,span')?.textContent || a.textContent || 'Practitioner')
        .replace(/\\s+/g, ' ')
        .trim()
        .split(/Skin|Dermatology|Chronic|Diabetes|Mental|Women|Men|Child|Procedural|General/)[0]
        .trim() || (a.querySelector('strong,span')?.textContent || 'Practitioner').trim(),
    }))
    .filter(x => x.href);

  if (!practitionerLinks.length && row.practitioners?.length) {
    row.practitioners.slice(0, 3).forEach(item => {
      practitionerLinks.push({ href: root + item.url, label: item.title });
    });
  }

  const listHtml = (items, empty) =>
    items.length
      ? '<ul class="service-hub-pathways__list">' +
        items
          .map(
            item =>
              '<li><a href="' +
              escapeHtml(item.href) +
              '">' +
              escapeHtml(item.label) +
              '</a></li>'
          )
          .join('') +
        '</ul>'
      : '<p class="service-hub-pathways__empty">' + escapeHtml(empty) + '</p>';

  const rail = document.createElement('section');
  rail.className = 'service-hub-pathways';
  rail.setAttribute('data-service-pathways', row.tier.toLowerCase());
  rail.setAttribute('aria-label', 'Guides, practitioners, and booking');
  rail.innerHTML =
    '<div class="shell service-hub-pathways__inner">' +
    '<div class="service-hub-pathways__intro">' +
    '<p class="eyebrow">Continue in this care area</p>' +
    '<h2>Guides, practitioners, and booking</h2>' +
    '<p>Move between Health Advice, this service, and published practitioner profiles — then book when you are ready.</p>' +
    '</div>' +
    '<div class="service-hub-pathways__grid">' +
    '<article class="service-hub-pathways__card">' +
    '<p class="service-hub-pathways__kicker">Related guides</p>' +
    '<h3>Health Advice</h3>' +
    listHtml(guideLinks, 'Browse Health Advice from the Knowledge Centre.') +
    (guideSection
      ? '<a class="service-hub-pathways__more" href="#patient-guides">All related guides →</a>'
      : '<a class="service-hub-pathways__more" href="' +
        escapeHtml(root) +
        'knowledge/index.html">Health Advice →</a>') +
    '</article>' +
    '<article class="service-hub-pathways__card">' +
    '<p class="service-hub-pathways__kicker">Related practitioners</p>' +
    '<h3>Published profiles</h3>' +
    listHtml(
      practitionerLinks,
      'Ask reception which practitioner is available for this service.'
    ) +
    (practitionerSection
      ? '<a class="service-hub-pathways__more" href="#related-practitioners">All related practitioners →</a>'
      : '<a class="service-hub-pathways__more" href="' +
        escapeHtml(root) +
        'team.html">Meet Our Team →</a>') +
    '</article>' +
    '<article class="service-hub-pathways__card service-hub-pathways__card--book">' +
    '<p class="service-hub-pathways__kicker">Booking pathway</p>' +
    '<h3>Book this service</h3>' +
    '<p class="service-hub-pathways__empty">Online booking opens HotDoc. Reception can help if you are unsure which appointment type to choose.</p>' +
    '<div class="service-hub-pathways__actions">' +
    '<a class="button wmc-book-appointment" data-hotdoc-button data-hotdoc-widget="lightbox" href="' +
    escapeHtml(bookHref) +
    '">Book Appointment</a>' +
    '<a class="button button-secondary" href="tel:+61732173344">Call reception</a>' +
    '</div>' +
    (bookSection ? '<a class="service-hub-pathways__more" href="#book">Booking details on this page →</a>' : '') +
    '</article>' +
    '</div></div>';

  // Prefer after breadcrumb so the page chrome stays: hero → topics → crumbs → pathways.
  const insertAfter =
    document.querySelector('.breadcrumb-bar') ||
    document.querySelector('.topic-wayfinding') ||
    document.querySelector('.page-hero, .service-authority-hero');
  if (insertAfter) insertAfter.insertAdjacentElement('afterend', rail);
  else if (article) article.insertAdjacentElement('afterbegin', rail);

  // Mark existing destination sections for standardised hub styling.
  guideSection?.classList.add('service-hub-destination', 'service-hub-destination--guides');
  practitionerSection?.classList.add('service-hub-destination', 'service-hub-destination--practitioners');
  bookSection?.classList.add('service-hub-destination', 'service-hub-destination--book');
})();
`;

fs.writeFileSync(sitePath, head.replace(/\s*$/, '\n\n') + block);
fs.copyFileSync(sitePath, 'apps/web/public/site.js');
console.log(
  '4F embedded',
  enriched.counts,
  'bytes',
  Buffer.byteLength(JSON.stringify(enriched))
);
