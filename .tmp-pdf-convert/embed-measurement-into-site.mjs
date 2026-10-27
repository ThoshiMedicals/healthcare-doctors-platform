import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const oldHtml = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'old-html');
const measurement = fs.readFileSync(path.join(oldHtml, 'measurement.js'), 'utf8').trim();
let site = fs.readFileSync(path.join(oldHtml, 'site.js'), 'utf8');

const markerStart = '/* === WMC_MEASUREMENT_EMBED_START === */';
const markerEnd = '/* === WMC_MEASUREMENT_EMBED_END === */';

if (site.includes(markerStart)) {
  site = site.replace(
    new RegExp(`${markerStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${markerEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`),
    ''
  );
}

/* Remove the sync-XHR bootstrap if present. */
site = site.replace(
  /\(\(\) => \{\r?\n  \/\* Ensure Phase 1 measurement exists even when a page still lacks the script tag\. \*\/\r?\n  if \(!window\.WMCMeasurement\) \{[\s\S]*?\/\* Measurement is progressive enhancement only\. \*\/\r?\n    \}\r?\n  \}\r?\n\r?\n  \/\* Task shortcuts/,
  '(() => {\n  /* Task shortcuts'
);

const embed = `${markerStart}\n${measurement}\n${markerEnd}\n\n`;
fs.writeFileSync(path.join(oldHtml, 'site.js'), embed + site);
console.log('embedded measurement into site.js', {
  measurementBytes: measurement.length,
  siteBytes: fs.statSync(path.join(oldHtml, 'site.js')).size
});
