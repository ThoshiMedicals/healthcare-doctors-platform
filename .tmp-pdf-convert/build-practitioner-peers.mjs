/**
 * Build practitioner peer graph from published search-index related links.
 * Peers share verified service URLs only — no inferred clinical claims.
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve('apps/web/public/search-index');
const doctors = JSON.parse(fs.readFileSync(path.join(root, 'doctors.json'), 'utf8'));
const services = JSON.parse(fs.readFileSync(path.join(root, 'services.json'), 'utf8'));

const serviceTitle = new Map(
  services.map(s => [String(s.url || '').replace(/^\/+/, ''), s.title || s.h1 || ''])
);

function serviceLinks(entry) {
  return [...new Set((entry.related || [])
    .map(u => String(u || '').replace(/^\/+/, ''))
    .filter(u => u.startsWith('services/') && u.endsWith('.html')))];
}

function prettyService(url) {
  const titled = serviceTitle.get(url);
  if (titled) return titled;
  return url
    .replace(/^services\//, '')
    .replace(/\.html$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

const rows = doctors.map(doc => {
  const url = String(doc.url || '').replace(/^\/+/, '');
  const servicesFor = serviceLinks(doc);
  return {
    url,
    name: doc.title || doc.h1 || url,
    role: /chiro|physio|obstetric|gynaec/i.test(doc.description || '')
      ? null
      : 'General Practitioner',
    services: servicesFor,
    expertise: servicesFor.slice(0, 6).map(prettyService),
  };
});

const byUrl = new Map(rows.map(r => [r.url, r]));

const graph = {};
for (const row of rows) {
  const sharedMap = new Map(); // peerUrl -> Set of services
  for (const svc of row.services) {
    for (const other of rows) {
      if (other.url === row.url) continue;
      if (!other.services.includes(svc)) continue;
      if (!sharedMap.has(other.url)) sharedMap.set(other.url, new Set());
      sharedMap.get(other.url).add(svc);
    }
  }
  const peers = [...sharedMap.entries()]
    .map(([peerUrl, set]) => {
      const peer = byUrl.get(peerUrl);
      const shared = [...set].map(prettyService).slice(0, 3);
      return {
        url: peerUrl,
        name: peer?.name || peerUrl,
        shared,
        count: set.size,
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 4);

  graph[row.url] = {
    name: row.name,
    expertise: row.expertise,
    peers,
  };
}

const out = {
  generated: new Date().toISOString().slice(0, 10),
  source: 'search-index/doctors.json + services.json (shared service links only)',
  disclaimer:
    'Peer links are based on publicly listed related services on practitioner profiles. They do not indicate availability, clinical suitability, or a recommendation of one practitioner over another.',
  practitioners: graph,
};

const targets = [
  path.join(root, 'practitioner-peers.json'),
  path.resolve('old-html/search-index/practitioner-peers.json'),
];
for (const target of targets) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(out));
  console.log('wrote', target, 'peers for', Object.keys(graph).length, 'practitioners');
}

// sanity sample
const sample = out.practitioners['doctors/dr-tanya-goodwill.html'];
console.log('tanya peers', JSON.stringify(sample, null, 2));
