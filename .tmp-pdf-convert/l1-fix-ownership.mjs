import fs from 'fs';
import path from 'path';

const files = [
  'knowledge/articles/is-a-tummy-bug-the-same-as-gastro.html',
  'knowledge/articles/is-a-water-infection-the-same-as-a-uti.html',
  'knowledge/articles/is-hay-fever-a-fever.html',
  'knowledge/articles/is-this-sinus.html',
  'knowledge/articles/is-this-thrush.html',
  'knowledge/articles/what-are-school-sores.html',
];

const ownershipPath = 'old-html/navigation-ownership.json';
const ownership = JSON.parse(fs.readFileSync(ownershipPath, 'utf8'));

function toSitePath(href, articleFile) {
  if (!href) return null;
  if (href.startsWith('http') || href.startsWith('tel:') || href.startsWith('#')) return null;
  const baseDir = path.posix.dirname(articleFile);
  let cleaned = href.replace(/\\/g, '/');
  // resolve relative to article
  const abs = path.posix.normalize(path.posix.join(baseDir, cleaned));
  return abs.replace(/^\.\//, '');
}

for (const file of files) {
  const html = fs.readFileSync(path.join('old-html', file), 'utf8');
  const h1 = (html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || [])[1]?.trim() || path.basename(file, '.html');
  const crumbBlock = (html.match(/class="visible-breadcrumbs"[\s\S]*?<\/nav>/i) || [])[0] || '';
  const crumbs = [];
  const linkRe = /<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>|<span[^>]*aria-current="page"[^>]*>([^<]+)<\/span>/gi;
  let m;
  while ((m = linkRe.exec(crumbBlock))) {
    const href = m[1];
    const label = (m[2] || m[3] || '').trim();
    if (!label) continue;
    if (href) {
      const p = toSitePath(href, file);
      if (p) crumbs.push({ label, path: p });
    } else {
      crumbs.push({ label, path: file });
    }
  }
  // Ensure Home + Knowledge Centre + topic + page
  if (!crumbs.length || crumbs[crumbs.length - 1].path !== file) {
    crumbs.push({ label: h1, path: file });
  }
  // Normalize first crumb to index.html
  if (crumbs[0] && /index\.html$/i.test(crumbs[0].path) === false && crumbs[0].label.toLowerCase() === 'home') {
    crumbs[0].path = 'index.html';
  }
  ownership.pages[file] = {
    section: 'knowledge',
    breadcrumbs: crumbs,
  };
  console.log('added', file, '→', crumbs.map((c) => c.label).join(' > '));
}

fs.writeFileSync(ownershipPath, JSON.stringify(ownership, null, 2) + '\n');
console.log('updated', ownershipPath, 'pages', Object.keys(ownership.pages).length);
