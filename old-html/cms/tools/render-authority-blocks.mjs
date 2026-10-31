/**
 * Renders Phase 1A authority blocks into the existing knowledge hubs.
 * Source of truth: old-html/cms/authority-content-blocks.json
 *
 * Re-run after editing the JSON. Existing URLs, schema, SEO metadata,
 * booking markup and surrounding page architecture are left in place.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const specPath = path.join(repoRoot, "old-html/cms/authority-content-blocks.json");
const spec = JSON.parse(await readFile(specPath, "utf8"));

const START = "<!-- authority-phase-1a:start -->";
const END = "<!-- authority-phase-1a:end -->";
const DIMS = {
  hero: [1920, 1080],
  diagram: [1600, 1200],
  infographic: [1200, 1600],
};

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function figure(asset) {
  const [width, height] = DIMS[asset.role];
  if (!width) throw new Error(`Unknown figure role ${asset.role}`);
  const base = asset.file.replace(/\.webp$/, "");
  const srcset = [...spec.variants, width]
    .filter((variant, index, all) => all.indexOf(variant) === index && variant <= width)
    .map((variant) => {
      const file = variant === width ? asset.file : `${base}-${variant}.webp`;
      return `${spec.assetRoot}${file} ${variant}w`;
    })
    .join(", ");
  const sizes = asset.role === "infographic"
    ? "(min-width: 800px) 440px, 100vw"
    : "(min-width: 1100px) 920px, 100vw";
  return `<figure class="authority-figure authority-figure--${asset.role}" data-authority-figure="${asset.role}">
<img alt="${esc(asset.alt)}" class="authority-image" decoding="async" height="${height}" loading="lazy" sizes="${sizes}" src="${spec.assetRoot}${asset.file}" srcset="${srcset}" width="${width}"/>
<figcaption>${esc(asset.caption)}</figcaption>
</figure>`;
}

function checklist(items) {
  return `<ol class="authority-checklist">${items.map((item, index) => `<li><span class="authority-step" aria-hidden="true">${index + 1}</span><div><strong>${esc(item.title)}</strong><span>${esc(item.text)}</span></div></li>`).join("")}</ol>`;
}

function renderSection(block) {
  const approved = (block.figures || []).filter((item) => item.role !== "hero");
  const byRole = (role) => approved.filter((item) => item.role === role).map(figure).join("\n");
  const paragraphs = (block.paragraphs || []).map((paragraph) => `<p>${esc(paragraph)}</p>`).join("");
  const links = (block.links || []).map((link) => `<p><a class="text-link" href="${esc(link.href)}">${esc(link.label)}</a></p>`).join("");
  const guide = block.guideLink
    ? `<p><a class="text-link" href="${esc(block.guideLink.href)}">${esc(block.guideLink.label)}</a></p>`
    : "";
  const note = block.note ? `<p class="authority-block-note">${esc(block.note)}</p>` : "";
  return `<section class="article-section authority-block" id="${esc(block.id)}" data-authority-block="${esc(block.type)}">
<p class="eyebrow">${esc(block.eyebrow)}</p>
<h2>${esc(block.heading)}</h2>
${paragraphs}
${byRole("hero")}
${byRole("diagram")}
${block.items ? checklist(block.items) : ""}
${byRole("infographic")}
${note}
${links}
${guide}
</section>`;
}

function renderBundle(page) {
  return `${START}\n${page.sections.map(renderSection).join("\n")}\n${END}\n`;
}

function insertServices(html, page) {
  if (!page.extraServices) return html;
  const missing = page.extraServices.links.filter((link) => !html.includes(`href="${link.href}"`));
  if (!missing.length) return html;
  const addition = missing.map((link) => `<a class="resource-link" href="${esc(link.href)}"><strong>${esc(link.title)}</strong><span>${esc(link.label)}</span></a>`).join("");
  const anchor = page.extraServices.anchorBefore;
  const at = html.indexOf(anchor);
  if (at < 0) throw new Error(`${page.file} is missing the related-services anchor`);
  const close = html.lastIndexOf("</div>", at);
  if (close < 0) throw new Error(`${page.file} related-services container was not found`);
  return html.slice(0, close) + addition + html.slice(close);
}

function markRelatedSection(html, page) {
  const id = page.relatedSectionId;
  const tagged = `id="${id}" data-authority-block="related-care"`;
  if (html.includes(tagged)) return html;
  const token = `id="${id}"`;
  if (!html.includes(token)) throw new Error(`${page.file} is missing #${id}`);
  return html.replace(token, tagged);
}

function markPractitioners(html) {
  if (html.includes('id="related-practitioners"')) return html;
  const token = `class="practitioner-knowledge-links"`;
  if (!html.includes(token)) return html;
  return html.replace(
    token,
    `class="practitioner-knowledge-links" id="related-practitioners" data-authority-block="related-practitioners"`,
  );
}

function appendPractitioners(html, page) {
  if (!page.practitioners?.length) return html;
  if (html.includes('id="related-practitioners"')) return html;
  const sectionAt = html.indexOf(`id="${page.relatedSectionId}"`);
  if (sectionAt < 0) throw new Error(`${page.file} is missing the related-care section`);
  const close = html.indexOf("</section>", sectionAt);
  const cards = page.practitioners.map((person) => `<a class="practitioner-knowledge-link" href="${esc(person.href)}"><strong>${esc(person.name)}</strong><span>${esc(person.summary)}</span><em>View practitioner profile →</em></a>`).join("");
  const block = `<div class="practitioner-knowledge-links" id="related-practitioners" data-authority-block="related-practitioners">${cards}</div>`;
  return html.slice(0, close) + block + html.slice(close);
}

function applyPage(html, page) {
  const bundle = renderBundle(page);
  if (html.includes(START)) {
    const pattern = new RegExp(`${START}[\\s\\S]*?${END}\\n?`);
    if (!pattern.test(html)) throw new Error(`${page.file} has a start marker without an end marker`);
    html = html.replace(pattern, bundle);
  } else if (!html.includes(page.insertBefore)) {
    throw new Error(`${page.file} is missing the insert anchor`);
  } else {
    html = html.replace(page.insertBefore, `${bundle}${page.insertBefore}`);
  }

  if (!html.includes(page.onThisPage.to)) {
    if (!html.includes(page.onThisPage.from)) {
      throw new Error(`${page.file} on-this-page navigation did not match`);
    }
    html = html.replace(page.onThisPage.from, page.onThisPage.to);
  }

  html = insertServices(html, page);
  html = markRelatedSection(html, page);
  html = markPractitioners(html);
  html = appendPractitioners(html, page);
  return html;
}

for (const page of spec.pages) {
  const filePath = path.join(repoRoot, page.file);
  const original = await readFile(filePath, "utf8");
  const next = applyPage(original, page);
  if (!next.includes('rel="canonical"') || !next.includes("application/ld+json") || !next.includes("wmc-book-appointment")) {
    throw new Error(`${page.file} lost canonical, schema or booking markup`);
  }
  await writeFile(filePath, next);
  console.log(`Updated ${page.file}`);
}
