import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const oldHtml = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'old-html');
const doctorsDir = path.join(oldHtml, 'doctors');
const registryPath = path.join(oldHtml, 'cms', 'governance-records.json');
const workflowPath = path.join(oldHtml, 'cms', 'governance-workflow.json');

const doctorPages = fs.readdirSync(doctorsDir)
  .filter((name) => name.endsWith('.html'))
  .map((name) => `doctors/${name}`)
  .sort();

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const existing = new Set(registry.records.map((row) => row.path));
let added = 0;
for (const pagePath of doctorPages) {
  if (existing.has(pagePath)) continue;
  registry.records.push({
    path: pagePath,
    collection: 'practitioner',
    reviewType: 'clinical',
    status: 'awaiting_review'
  });
  added += 1;
}
registry.records.sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);

const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
workflow.reviewPublication.registeredPages = registry.records.length;
fs.writeFileSync(workflowPath, `${JSON.stringify(workflow, null, 2)}\n`);

let wired = 0;
for (const pagePath of doctorPages) {
  const absolute = path.join(oldHtml, pagePath);
  let html = fs.readFileSync(absolute, 'utf8');
  const host = `<div data-governance-review data-governance-page="${pagePath}" hidden></div>`;
  if (!html.includes('data-governance-review')) {
    if (!html.includes('</main>')) {
      throw new Error(`missing </main>: ${pagePath}`);
    }
    html = html.replace('</main>', `${host}</main>`);
  } else if (!html.includes(`data-governance-page="${pagePath}"`)) {
    throw new Error(`wrong governance host path: ${pagePath}`);
  }

  if (!/governance-published\.js/.test(html)) {
    html = html.replace(
      /(<script\b[^>]*\bsrc=")([^"]*?)(site\.js)("[^>]*>\s*<\/script>)/i,
      (match, open, prefix, file, close) => `${open}${prefix}governance-published.js${close}${open}${prefix}${file}${close}`
    );
    if (!/governance-published\.js/.test(html)) {
      throw new Error(`could not insert governance-published.js: ${pagePath}`);
    }
  }

  fs.writeFileSync(absolute, html);
  wired += 1;
}

console.log(JSON.stringify({
  doctorPages: doctorPages.length,
  addedToRegistry: added,
  registeredPages: registry.records.length,
  wiredHosts: wired
}, null, 2));
