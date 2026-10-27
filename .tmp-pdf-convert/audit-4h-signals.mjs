import fs from 'fs';
import path from 'path';

const root = 'old-html';
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const site = fs.readFileSync(path.join(root, 'site.js'), 'utf8');
const gov = fs.readFileSync(path.join(root, 'governance-published.js'), 'utf8');

const signals = {
  findInfoDesktop: /patient-tasks/.test(css) && !/patient-tasks[^\{]*\{[^}]*display:\s*none/.test(
    css.match(/@media[^{]*min-width:\s*768px[^}]*\{[\s\S]*?\.patient-tasks[\s\S]*?\}/)?.[0] || ''
  ),
  conversionBand: site.includes('conversion-band--mid'),
  motionTokens: css.includes('--motion-enter'),
  peerEmbed: site.includes('PRACTITIONER_PEERS') || site.includes('practitioner-peers') || site.includes('peer'),
  serviceTiers: site.includes('service-hub-pathways') || site.includes('SERVICE_AUTHORITY'),
  brandTokens4g: css.includes('--fs-display') && css.includes('--space-9'),
  clinicalStripCss: css.includes('clinical-review-strip'),
  govEmpty: /WMC_APPROVED_GOVERNANCE\s*=\s*Object\.freeze\(\{\}\)/.test(gov),
  importantCount: (css.match(/!important/g) || []).length,
  reducedMotion: css.includes('prefers-reduced-motion'),
  skipLink: css.includes('.skip-link'),
  focusVisible: css.includes(':focus-visible'),
};

 // More precise Find Information desktop visibility check
const hideRules = [...css.matchAll(/\.patient-tasks[^{]*\{[^}]+\}/g)].map((m) => m[0]);
const mediaHides = [...css.matchAll(/@media[^{]*\([^)]*768[^)]*\)[^{]*\{[\s\S]*?\}/g)].length;
signals.patientTasksRulesSample = hideRules.slice(0, 5);
signals.patientTasksDisplayNone = hideRules.some((r) => /display:\s*none/.test(r));

console.log(JSON.stringify(signals, null, 2));
