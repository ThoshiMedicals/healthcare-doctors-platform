import fs from 'node:fs';
const h = fs.readFileSync(new URL('../old-html/doctors/dr-tanya-goodwill.html', import.meta.url), 'utf8');
const i = h.lastIndexOf('</main>');
console.log('idx', i);
console.log(h.slice(Math.max(0, i - 180), i + 20));
const classes = [...h.matchAll(/class="([^"]+)"/g)].map((m) => m[1]).filter((c) => /article|profile|doctor|page-main|shell|practitioner/.test(c));
console.log([...new Set(classes)].slice(0, 30));
