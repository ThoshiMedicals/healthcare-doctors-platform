import fs from 'fs';
import path from 'path';

const root = path.resolve('old-html');

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'assets', 'qa', 'tools'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.isFile() && e.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

const files = walk(root);
let withGov = 0;
let withReview = 0;
let emptyReview = 0;
let footerTrust = 0;
let agpalLink = 0;
const samples = [];

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  if (html.includes('footer-trust')) footerTrust++;
  if (html.includes('agpal-accreditation.html')) agpalLink++;
  const m = html.match(/data-governance-page="([^"]+)"[^>]*data-governance-review="([^"]*)"/);
  if (m) {
    withGov++;
    if (m[2]) {
      withReview++;
      if (samples.length < 8) samples.push({ page: m[1], review: m[2] });
    } else emptyReview++;
  }
}

const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const importantCount = (css.match(/!important/g) || []).length;
const fontFaces = [...css.matchAll(/font-family:\s*([^;}{]+)/gi)]
  .map((m) => m[1].trim().replace(/['"]/g, ''))
  .reduce((acc, v) => {
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});

const govJs = fs.existsSync(path.join(root, 'governance-published.js'))
  ? fs.readFileSync(path.join(root, 'governance-published.js'), 'utf8').slice(0, 800)
  : 'missing';

console.log(
  JSON.stringify(
    {
      htmlFiles: files.length,
      withGov,
      withReview,
      emptyReview,
      footerTrust,
      agpalLink,
      samples,
      cssImportant: importantCount,
      topFonts: Object.entries(fontFaces)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12),
      govJsPreview: govJs,
    },
    null,
    2
  )
);
