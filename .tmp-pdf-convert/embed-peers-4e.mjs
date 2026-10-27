import fs from 'fs';

const peers = JSON.parse(
  fs.readFileSync('apps/web/public/search-index/practitioner-peers.json', 'utf8')
);
const sitePath = 'old-html/site.js';
let site = fs.readFileSync(sitePath, 'utf8');
const marker = '/* 4E — Practitioner authority visibility.';
const start = site.indexOf(marker);
if (start < 0) throw new Error('4E marker not found');

const block = `${marker}
   Peer recommendations use the published related-service graph only.
   No availability, suitability, or clinical ranking claims. */
(() => {
  const PEERS = ${JSON.stringify(peers)};

  const path = (location.pathname || '').replace(/\\\\/g, '/');
  const depth = (path.match(/\\/(doctors|services|knowledge)\\//) || path.includes('/knowledge/articles/'))
    ? (path.includes('/knowledge/articles/') ? 2 : 1)
    : 0;
  const root = depth === 2 ? '../../' : depth === 1 ? '../' : '';

  const escapeHtml = value =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  document.querySelectorAll('#related-practitioners').forEach(section => {
    section.classList.add('authority-related-practitioners');
    const hasProvenance = [...section.querySelectorAll('p')].some(p =>
      /published|publicly|profile|verified|availability|suitability/i.test(p.textContent || '')
    );
    if (!hasProvenance && !section.querySelector('.authority-signal-note')) {
      const note = document.createElement('p');
      note.className = 'authority-signal-note';
      note.textContent =
        'Shown from published profile links for this topic. This is not a clinical ranking or availability guarantee.';
      const heading = section.querySelector('h2');
      if (heading) heading.after(note);
      else section.prepend(note);
    }
  });

  document
    .querySelectorAll('#related-services, #patient-guides, #areas-of-care, #professional-interests')
    .forEach(section => {
      section.classList.add('authority-signal-section');
    });

  document.querySelectorAll('.practitioner-care-highlights').forEach(list => {
    list.classList.add('authority-expertise-list');
    const wrap = list.closest('.practitioner-care-overview');
    if (wrap && !wrap.querySelector('.authority-expertise-caption')) {
      const caption = document.createElement('p');
      caption.className = 'authority-expertise-caption';
      caption.textContent = 'Published areas of care from this profile';
      const label = wrap.querySelector('.practitioner-care-label');
      if (label) label.after(caption);
      else wrap.prepend(caption);
    }
  });

  const doctorMatch = path.match(/\\/doctors\\/(dr-[^/]+?|mr-[^/]+?)\\.html/i);
  if (!doctorMatch || document.querySelector('[data-authority-peers]')) return;

  const doctorUrl = 'doctors/' + doctorMatch[1].toLowerCase() + '.html';
  const node = PEERS.practitioners && PEERS.practitioners[doctorUrl];
  if (!node || !node.peers || !node.peers.length) return;

  const insertAfter =
    document.querySelector('#related-services') ||
    document.querySelector('#professional-interests') ||
    document.querySelector('#areas-of-care') ||
    document.querySelector('#patient-guides');
  if (!insertAfter || !insertAfter.parentNode) return;

  const cards = node.peers
    .slice(0, 4)
    .map(peer => {
      const shared = (peer.shared || []).slice(0, 3).map(escapeHtml).join(' · ');
      return (
        '<a class="authority-peer-card" href="' +
        escapeHtml(root + peer.url) +
        '">' +
        '<strong>' +
        escapeHtml(peer.name) +
        '</strong>' +
        '<span class="authority-peer-shared">Shared published care areas: ' +
        (shared || 'Related services') +
        '</span>' +
        '<em>View profile →</em></a>'
      );
    })
    .join('');

  const section = document.createElement('section');
  section.className = 'article-section authority-peer-band';
  section.id = 'related-practitioners';
  section.setAttribute('data-authority-peers', 'graph');
  section.setAttribute('aria-label', 'Other practitioners in related care areas');
  section.innerHTML =
    '<p class="eyebrow">Related practitioners</p>' +
    '<h2>Other practitioners in related care areas</h2>' +
    '<p class="authority-signal-note">' +
    escapeHtml(
      PEERS.disclaimer ||
        'Peer links are based on publicly listed related services on practitioner profiles. They do not indicate availability or clinical suitability.'
    ) +
    '</p>' +
    '<div class="authority-peer-grid">' +
    cards +
    '</div>' +
    '<p class="service-inline-action"><a class="text-link" href="' +
    escapeHtml(root) +
    'team.html">Meet Our Team →</a></p>';

  insertAfter.insertAdjacentElement('afterend', section);

  const toc = document.querySelector('.on-this-page-links, .long-page-nav-list, [data-long-page-nav]');
  if (toc && !toc.querySelector('a[href="#related-practitioners"]')) {
    const a = document.createElement('a');
    a.href = '#related-practitioners';
    a.textContent = 'Related practitioners';
    toc.append(a);
  }
})();
`;

fs.writeFileSync(sitePath, site.slice(0, start) + block);
fs.copyFileSync(sitePath, 'apps/web/public/site.js');
console.log('embedded peers into site.js', Buffer.byteLength(JSON.stringify(peers)), 'bytes graph');
