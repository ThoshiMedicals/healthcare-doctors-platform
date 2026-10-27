import fs from 'fs';
import path from 'path';

const SKIP = new Set(['node_modules', '.git', 'assets', 'qa', 'tools', '.next', 'crops', 'sources']);

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

const re = /<div class="patient-tasks"[^>]*>[\s\S]*?<\/div>/g;
let changed = 0;
let scanned = 0;
let remaining = 0;

for (const root of ['old-html', 'apps/web/public']) {
  if (!fs.existsSync(root)) continue;
  for (const f of walk(root)) {
    scanned++;
    const html = fs.readFileSync(f, 'utf8');
    if (!html.includes('patient-tasks')) continue;
    const next = html.replace(re, '');
    if (next !== html) {
      fs.writeFileSync(f, next);
      changed++;
    }
    if (next.includes('class="patient-tasks"') || next.includes("class='patient-tasks'")) {
      remaining++;
      console.error('REMAINING', f);
    }
  }
}

console.log(JSON.stringify({ scanned, changed, remaining }, null, 2));
