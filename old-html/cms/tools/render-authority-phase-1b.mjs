/**
 * Renders Phase 1B educational diagrams into approved knowledge pages.
 * Source: old-html/cms/authority-phase-1b-blocks.json
 *
 * Preserves URLs, schema, SEO metadata and booking markup.
 * One diagram per page. No heroes. No service pages.
 */
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const specPath = path.join(repoRoot, "old-html/cms/authority-phase-1b-blocks.json");
const spec = JSON.parse(await readFile(specPath, "utf8"));

const START = "<!-- authority-phase-1b:start -->";
const END = "<!-- authority-phase-1b:end -->";
const WIDTH = 1600;
const HEIGHT = 1200;

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function figure(assetRoot, asset) {
  const base = asset.file.replace(/\.webp$/, "");
  const srcset = `${assetRoot}${base}-640.webp 640w, ${assetRoot}${base}-960.webp 960w, ${assetRoot}${asset.file} 1600w`;
  const sizes = "(min-width: 1100px) 920px, 100vw";
  for (const file of [`${base}.webp`, `${base}-640.webp`, `${base}-960.webp`]) {
    const disk = path.join(repoRoot, "old-html/assets/knowledge/authority", file);
    if (!existsSync(disk)) throw new Error(`Missing asset ${disk}`);
  }
  return `<figure class="authority-figure authority-figure--diagram" data-authority-figure="diagram">
<picture>
<source type="image/webp" sizes="${sizes}" srcset="${srcset}"/>
<img alt="${esc(asset.alt)}" class="authority-image" decoding="async" height="${HEIGHT}" loading="lazy" sizes="${sizes}" src="${assetRoot}${asset.file}" width="${WIDTH}"/>
</picture>
<figcaption>${esc(asset.caption)}</figcaption>
</figure>`;
}

function renderSection(page) {
  const block = page.section;
  const fig = figure(page.assetRoot, block.figure);
  if (block.figureOnly) {
    return `${START}
${fig}
${END}`;
  }
  const paragraphs = (block.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join("");
  const note = block.note ? `<p class="authority-block-note">${esc(block.note)}</p>` : "";
  const guide = block.guideLink
    ? `<p><a class="text-link" href="${esc(block.guideLink.href)}">${esc(block.guideLink.label)}</a></p>`
    : "";
  return `${START}
<section class="article-section authority-block" id="${esc(block.id)}" data-authority-block="education">
<p class="eyebrow">${esc(block.eyebrow)}</p>
<h2>${esc(block.heading)}</h2>
${paragraphs}
${fig}
${note}
${guide}
</section>
${END}`;
}

function replaceBundle(html, bundle) {
  if (html.includes(START)) {
    const pattern = new RegExp(`${START}[\\s\\S]*?${END}\\n?`);
    if (!pattern.test(html)) throw new Error("Broken Phase 1B markers");
    return html.replace(pattern, `${bundle}\n`);
  }
  return null;
}

function insertAfterSection(html, sectionId, bundle) {
  const open = `id="${sectionId}"`;
  const at = html.indexOf(open);
  if (at < 0) throw new Error(`Missing section #${sectionId}`);
  const sectionStart = html.lastIndexOf("<section", at);
  const close = html.indexOf("</section>", at);
  if (sectionStart < 0 || close < 0) throw new Error(`Cannot close section #${sectionId}`);
  const end = close + "</section>".length;
  return html.slice(0, end) + `\n${bundle}\n` + html.slice(end);
}

function insertInsideSection(html, sectionId, bundle) {
  const open = `id="${sectionId}"`;
  const at = html.indexOf(open);
  if (at < 0) throw new Error(`Missing section #${sectionId}`);
  const close = html.indexOf("</section>", at);
  if (close < 0) throw new Error(`Cannot close section #${sectionId}`);
  // Place figure before section close, after existing paragraphs.
  return html.slice(0, close) + `\n${bundle}\n` + html.slice(close);
}

function applyOnThisPage(html, page) {
  if (!page.onThisPage) return html;
  if (html.includes(page.onThisPage.to)) return html;
  if (!html.includes(page.onThisPage.from)) {
    throw new Error(`${page.file} on-this-page navigation did not match`);
  }
  return html.replace(page.onThisPage.from, page.onThisPage.to);
}

const report = [];
for (const page of spec.pages) {
  const filePath = path.join(repoRoot, page.file);
  let html = await readFile(filePath, "utf8");
  const bundle = renderSection(page);
  const replaced = replaceBundle(html, bundle);
  if (replaced) {
    html = replaced;
  } else if (page.insertInsideSectionId) {
    html = insertInsideSection(html, page.insertInsideSectionId, bundle);
  } else if (page.insertAfterSectionId) {
    html = insertAfterSection(html, page.insertAfterSectionId, bundle);
  } else {
    throw new Error(`${page.file} has no insert strategy`);
  }
  html = applyOnThisPage(html, page);

  if (!html.includes('rel="canonical"') || !html.includes("application/ld+json") || !html.includes("wmc-book-appointment")) {
    throw new Error(`${page.file} lost canonical, schema or booking markup`);
  }
  if ((html.match(/data-authority-figure="diagram"/g) || []).length !== 1 && !page.file.includes("protecting-your-skin")) {
    // hubs should have exactly one Phase 1B diagram; sun article also one
  }
  const diagramCount = (html.match(/data-authority-figure="diagram"/g) || []).length;
  if (diagramCount !== 1) {
    throw new Error(`${page.file} expected 1 diagram, found ${diagramCount}`);
  }
  if (!html.includes("loading=\"lazy\"")) throw new Error(`${page.file} missing lazy loading`);
  if (!html.includes("<picture>")) throw new Error(`${page.file} missing picture element`);

  await writeFile(filePath, html);
  report.push({ file: page.file, id: page.section.id || page.insertInsideSectionId, asset: page.section.figure.file });
  console.log(`Updated ${page.file}`);
}

console.log(JSON.stringify(report, null, 2));
