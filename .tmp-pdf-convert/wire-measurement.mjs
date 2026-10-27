import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'old-html');
let changed = 0;
let scanned = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'tools' || entry.name === 'qa' || entry.name === 'cms') {
      if (dir === root) continue;
    }
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(absolute);
      continue;
    }
    if (!entry.name.endsWith('.html')) continue;
    scanned += 1;
    let html = fs.readFileSync(absolute, 'utf8');
    if (/measurement\.js/.test(html)) continue;
    const next = html.replace(
      /(<script\b[^>]*\bsrc=")([^"]*?)(site\.js)("[^>]*>\s*<\/script>)/gi,
      (match, open, prefix, file, close) => `${open}${prefix}measurement.js${close}${open}${prefix}${file}${close}`
    );
    if (next === html) continue;
    fs.writeFileSync(absolute, next);
    changed += 1;
  }
}

walk(root);
console.log(JSON.stringify({ scanned, changed }, null, 2));
