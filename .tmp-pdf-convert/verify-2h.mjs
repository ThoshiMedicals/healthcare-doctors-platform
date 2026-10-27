import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const oldHtml = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'old-html');
const registry = JSON.parse(fs.readFileSync(path.join(oldHtml, 'cms', 'governance-records.json'), 'utf8'));
const workflow = JSON.parse(fs.readFileSync(path.join(oldHtml, 'cms', 'governance-workflow.json'), 'utf8'));
const ownership = JSON.parse(fs.readFileSync(path.join(oldHtml, 'cms', 'governance-ownership-metadata.json'), 'utf8'));
const publicBundle = fs.readFileSync(path.join(oldHtml, 'governance-published.js'), 'utf8');
const siteJs = fs.readFileSync(path.join(oldHtml, 'site.js'), 'utf8');

const doctors = fs.readdirSync(path.join(oldHtml, 'doctors'))
  .filter((name) => name.endsWith('.html'))
  .map((name) => `doctors/${name}`)
  .sort();

const practitionerRows = registry.records.filter((row) => row.collection === 'practitioner');
const doctorFailures = [];

for (const pagePath of doctors) {
  const html = fs.readFileSync(path.join(oldHtml, pagePath), 'utf8');
  const hostOk = html.includes(`data-governance-page="${pagePath}"`) && /data-governance-review[^>]*\bhidden\b/.test(html);
  const scriptOk = (html.match(/governance-published\.js/g) || []).length === 1;
  const record = registry.records.find((row) => row.path === pagePath);
  if (!hostOk || !scriptOk || !record || record.status !== 'awaiting_review' || record.reviewType !== 'clinical') {
    doctorFailures.push(pagePath);
  }
}

const book = fs.readFileSync(path.join(oldHtml, 'book-appointment.html'), 'utf8');
const publicFields = Object.keys(ownership.publicFields || {});
const labels = ['Reviewed By', 'Content Owner', 'Last Reviewed', 'Next Review Due'].every((label) =>
  JSON.stringify(ownership).includes(label)
);

const report = {
  registeredPages: registry.records.length,
  workflowCount: workflow.reviewPublication.registeredPages,
  practitionerCount: practitionerRows.length,
  doctorPages: doctors.length,
  doctorFailures,
  bookAppointmentHost: book.includes('data-governance-page="book-appointment.html"') && /governance-published\.js/.test(book),
  publicBundleEmpty: /Object\.freeze\(\{\}\)/.test(publicBundle) || /Object\.freeze\(\{\s*\}\)/.test(publicBundle),
  siteFailClosed: siteJs.includes("governanceHost.hidden = true") && siteJs.includes('record.nextReview >= todayInBrisbane'),
  ownershipFields: publicFields,
  ownershipLabelsPresent: labels,
  ownershipPractitioner: Boolean(ownership.ownershipByCollection?.practitioner),
  expiryToolExists: fs.existsSync(path.join(oldHtml, 'cms', 'tools', 'report_governance_review_expiry.py')),
  cmsExpiryPageExists: fs.existsSync(path.join(oldHtml, '..', 'apps', 'web', 'src', 'app', 'admin', '(dashboard)', 'governance', 'expiry', 'page.tsx')),
  validationDocExists: fs.existsSync(path.join(oldHtml, 'qa', 'GOVERNANCE_OPERATIONS_VALIDATION.md'))
};

console.log(JSON.stringify(report, null, 2));

const ok =
  report.registeredPages === report.workflowCount &&
  report.practitionerCount === report.doctorPages &&
  report.doctorFailures.length === 0 &&
  report.bookAppointmentHost &&
  report.publicBundleEmpty &&
  report.siteFailClosed &&
  report.ownershipLabelsPresent &&
  report.ownershipPractitioner &&
  report.expiryToolExists &&
  report.cmsExpiryPageExists &&
  report.validationDocExists &&
  publicFields.includes('reviewedBy') &&
  publicFields.includes('contentOwner') &&
  publicFields.includes('lastReviewed') &&
  publicFields.includes('nextReview');

if (!ok) {
  console.error('VERIFY_2H_FAILED');
  process.exit(1);
}
console.log('VERIFY_2H_OK');
