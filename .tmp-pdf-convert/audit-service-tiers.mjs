import fs from 'fs';
import path from 'path';

const indexDir = 'apps/web/public/search-index';
const manifest = JSON.parse(fs.readFileSync(path.join(indexDir, 'manifest.json'), 'utf8'));
const rows = [];
for (const shard of manifest.shards || []) {
  rows.push(...JSON.parse(fs.readFileSync(path.join(indexDir, `${shard}.json`), 'utf8')));
}
const byUrl = new Map(rows.map(r => [r.url, r]));

const isArticle = url => String(url || '').includes('/articles/') || String(url || '').startsWith('knowledge/articles/');
const isKnowledgeHub = (url, category) =>
  category === 'Advice' ||
  category === 'Knowledge' ||
  String(url || '').startsWith('knowledge/') ||
  url === 'health-knowledge-centre.html';
const isDoctor = (url, category) => category === 'Doctor' || String(url || '').startsWith('doctors/');
const isService = (url, category) =>
  category === 'Service' || String(url || '').startsWith('services/') || url === 'services.html';

function classify(signals) {
  const authority_score =
    Math.min(Math.max(0, signals.related_practitioners), 15) * 2 +
    Math.min(Math.max(0, signals.related_knowledge), 20) +
    Math.min(Math.max(0, signals.related_services), 10) +
    Math.min(Math.max(0, signals.inbound_article_links), 40) * 1.5 +
    Math.min(Math.max(0, signals.inbound_practitioner_links), 15) * 1.5;
  let tier = 'Thin';
  if (authority_score >= 40) tier = 'Hub';
  else if (authority_score >= 14) tier = 'Developing';
  return { authority_score: Number(authority_score.toFixed(1)), tier };
}

const services = rows.filter(r => {
  const url = String(r.url || '');
  if (url === 'services.html') return false;
  return r.category === 'Service' || url.startsWith('services/');
});

const inboundArticles = new Map();
const inboundPractitioners = new Map();
for (const row of rows) {
  for (const related of row.related || []) {
    if (!String(related).startsWith('services/') || related === 'services.html') continue;
    if (isArticle(row.url)) inboundArticles.set(related, (inboundArticles.get(related) || 0) + 1);
    if (isDoctor(row.url, row.category))
      inboundPractitioners.set(related, (inboundPractitioners.get(related) || 0) + 1);
  }
}

const scored = services
  .map(svc => {
    const url = String(svc.url || '');
    const related = svc.related || [];
    const related_practitioners = related.filter(item => isDoctor(item, byUrl.get(item)?.category)).length;
    const related_knowledge = related.filter(item => {
      const t = byUrl.get(item);
      return isArticle(item) || isKnowledgeHub(item, t?.category);
    }).length;
    const related_services = related.filter(
      item => item !== url && isService(item, byUrl.get(item)?.category) && item !== 'services.html'
    ).length;
    const inbound_article_links = inboundArticles.get(url) || 0;
    const inbound_practitioner_links = inboundPractitioners.get(url) || 0;
    const { authority_score, tier } = classify({
      related_practitioners,
      related_knowledge,
      related_services,
      inbound_article_links,
      inbound_practitioner_links,
    });
    return {
      url,
      title: svc.title || svc.h1,
      tier,
      authority_score,
      related_practitioners,
      related_knowledge,
      related_services,
      inbound_article_links,
      inbound_practitioner_links,
    };
  })
  .sort((a, b) => b.authority_score - a.authority_score || a.title.localeCompare(b.title));

const byTier = { Hub: [], Developing: [], Thin: [] };
for (const row of scored) byTier[row.tier].push(row);

const out = { generated: new Date().toISOString().slice(0, 10), counts: {
  Hub: byTier.Hub.length,
  Developing: byTier.Developing.length,
  Thin: byTier.Thin.length,
}, services: scored };

fs.writeFileSync('apps/web/public/search-index/service-authority-tiers.json', JSON.stringify(out));
fs.writeFileSync('old-html/search-index/service-authority-tiers.json', JSON.stringify(out));
console.log(JSON.stringify(out.counts, null, 2));
for (const tier of ['Hub', 'Developing', 'Thin']) {
  console.log('\n==', tier, '==');
  for (const s of byTier[tier]) {
    console.log(
      `${s.authority_score.toFixed(1).padStart(5)} ${s.title} | p=${s.related_practitioners} k=${s.related_knowledge} s=${s.related_services} ia=${s.inbound_article_links} ip=${s.inbound_practitioner_links}`
    );
  }
}
