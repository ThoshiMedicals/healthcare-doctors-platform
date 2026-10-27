import fs from 'fs';
import path from 'path';

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['assets', 'qa', 'tools', 'cms', 'node_modules'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.html')) acc.push(path.relative('old-html', p).replace(/\\/g, '/'));
  }
  return acc;
}

const ownership = JSON.parse(fs.readFileSync('old-html/navigation-ownership.json', 'utf8'));
const html = walk('old-html');
const missingInOwnership = html.filter((f) => !ownership.pages[f]);
const missingInHtml = Object.keys(ownership.pages).filter((f) => !html.includes(f));
const broken = [];
for (const [file, entry] of Object.entries(ownership.pages)) {
  for (const crumb of entry.breadcrumbs || []) {
    if (!fs.existsSync(path.join('old-html', crumb.path))) broken.push(`${file} -> ${crumb.path}`);
  }
}

console.log(
  JSON.stringify(
    {
      htmlCount: html.length,
      ownershipCount: Object.keys(ownership.pages).length,
      missingInOwnership,
      missingInHtml,
      brokenPaths: broken,
      ok: missingInOwnership.length === 0 && missingInHtml.length === 0 && broken.length === 0,
    },
    null,
    2
  )
);
