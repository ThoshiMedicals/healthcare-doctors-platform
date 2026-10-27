import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const oldHtml = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'old-html');
const registry = JSON.parse(fs.readFileSync(path.join(oldHtml, 'cms', 'governance-records.json'), 'utf8'));
const publicJs = fs.readFileSync(path.join(oldHtml, 'governance-published.js'), 'utf8');
const marker = 'window.WMC_APPROVED_GOVERNANCE = Object.freeze(';
const approvals = marker && publicJs.includes(marker)
  ? JSON.parse(publicJs.split(marker)[1].split(');')[0])
  : {};

const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Australia/Brisbane',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());
const horizonDays = 60;
const horizon = new Date(`${today}T00:00:00Z`);
horizon.setUTCDate(horizon.getUTCDate() + horizonDays);
const horizonIso = horizon.toISOString().slice(0, 10);

const eligible = Object.fromEntries(registry.records.map((row) => [row.path, row]));
const overdue = [];
const dueSoon = [];
const current = [];

for (const [pagePath, entry] of Object.entries(approvals)) {
  if (!eligible[pagePath] || entry.status !== 'approved') continue;
  const next = entry.nextReview;
  if (!next) continue;
  const row = {
    path: pagePath,
    collection: eligible[pagePath].collection,
    reviewType: eligible[pagePath].reviewType,
    reviewedBy: entry.reviewedBy,
    contentOwner: entry.contentOwner,
    lastReviewed: entry.lastReviewed,
    nextReviewDue: next,
    daysRemaining: Math.round((Date.parse(`${next}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000)
  };
  if (next < today) overdue.push(row);
  else if (next <= horizonIso) dueSoon.push(row);
  else current.push(row);
}

const awaitingReview = registry.records
  .filter((row) => !approvals[row.path] || approvals[row.path].status !== 'approved')
  .map((row) => ({ path: row.path, collection: row.collection, reviewType: row.reviewType, status: row.status }));

const payload = {
  generatedOn: today,
  timezone: 'Australia/Brisbane',
  horizonDays,
  counts: {
    eligible: registry.records.length,
    approvedWithDates: overdue.length + dueSoon.length + current.length,
    overdue: overdue.length,
    dueWithinHorizon: dueSoon.length,
    current: current.length,
    awaitingReview: awaitingReview.length,
    incompleteApprovals: 0
  },
  overdue,
  dueWithinHorizon: dueSoon,
  current,
  awaitingReviewSample: awaitingReview.slice(0, 25),
  incompleteApprovals: []
};

const out = path.join(oldHtml, 'cms', 'governance-expiry-report.json');
fs.writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`GOVERNANCE EXPIRY REPORT: eligible=${payload.counts.eligible} approved=${payload.counts.approvedWithDates} overdue=${payload.counts.overdue} due_within_${horizonDays}d=${payload.counts.dueWithinHorizon} awaiting=${payload.counts.awaitingReview}`);
console.log(`Wrote cms/governance-expiry-report.json`);
