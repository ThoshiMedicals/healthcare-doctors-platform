import fs from 'fs';

const g = JSON.parse(fs.readFileSync('old-html/search-index/manifest.json', 'utf8'));
const p = JSON.parse(fs.readFileSync('apps/web/public/search-index/manifest.json', 'utf8'));

function routesOf(m) {
  if (Array.isArray(m.routes)) return m.routes.map(String);
  if (Array.isArray(m.pages)) return m.pages.map((x) => (typeof x === 'string' ? x : x.url || x.path));
  if (Array.isArray(m.catalog)) return m.catalog.map((x) => x.url || x.path || x.route || JSON.stringify(x));
  return [];
}

const gR = new Set(routesOf(g));
const pR = new Set(routesOf(p));
const onlyG = [...gR].filter((x) => !pR.has(x)).sort();
const onlyP = [...pR].filter((x) => !gR.has(x)).sort();

console.log(
  JSON.stringify(
    {
      goldenKeys: Object.keys(g),
      publicKeys: Object.keys(p),
      goldenRouteCount: gR.size,
      publicRouteCount: pR.size,
      onlyGolden: onlyG,
      onlyPublic: onlyP,
      bytesEqual:
        fs.readFileSync('old-html/search-index/manifest.json').equals(
          fs.readFileSync('apps/web/public/search-index/manifest.json')
        ),
    },
    null,
    2
  )
);
