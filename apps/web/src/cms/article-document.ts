import { decodeText, escapeText, listItemTexts, replaceListLabels, replaceTaggedText } from "@/cms/html-text";

export type ArticleFaq = { question: string; answer: string };
export type ArticleLink = { href: string; label: string };
export type ArticlePractitioner = { href: string; label: string; summary: string };
export type ArticleGuide = { href: string; kicker: string; title: string; summary: string };

export type ArticleSection = {
  id: string;
  heading: string;
  paragraphs: string[];
  takeaways: string[];
  faqs: ArticleFaq[];
  sources: ArticleLink[];
  services: ArticleLink[];
  practitioners: ArticlePractitioner[];
  guides: ArticleGuide[];
};

export type ArticleDocument = {
  title: string;
  summary: string;
  updated: string;
  sections: ArticleSection[];
};

export function readArticleDocument(html: string, pagePath = ""): ArticleDocument {
  return {
    title: textOf(html.match(/<h1>([\s\S]*?)<\/h1>/i)?.[1] ?? ""),
    summary: textOf(html.match(/<p class="lede">([\s\S]*?)<\/p>/i)?.[1] ?? ""),
    updated: html.match(/<div class="knowledge-byline">[\s\S]*?<span>Updated (\d{4}-\d{2}-\d{2})<\/span>/i)?.[1] ?? "",
    sections: [...html.matchAll(/<section\b[^>]*class="article-section"[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/section>/gi)].map((match) =>
      readSection(match[1], match[2], pagePath),
    ),
  };
}

export function isArticleDocument(value: unknown): value is ArticleDocument {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  return typeof data.title === "string" && Array.isArray(data.sections);
}

export function articleFromForm(formData: FormData, baseline: ArticleDocument): ArticleDocument {
  const field = (name: string) => String(formData.get(name) ?? "").trim();
  return {
    title: field("title"),
    summary: field("summary"),
    updated: field("updated") || baseline.updated,
    sections: baseline.sections.map((section, index) => ({
      id: section.id,
      heading: field(`s${index}-heading`),
      paragraphs: section.paragraphs.map((_paragraph, paragraph) => field(`s${index}-p${paragraph}`)),
      takeaways: section.takeaways.map((_item, item) => field(`s${index}-t${item}`)),
      faqs: section.faqs.map((_faq, faq) => ({ question: field(`s${index}-fq${faq}`), answer: field(`s${index}-fa${faq}`) })),
      sources: section.sources.map((source, sourceIndex) => ({
        href: field(`s${index}-src${sourceIndex}`) || source.href,
        label: field(`s${index}-srcl${sourceIndex}`),
      })),
      services: section.services.map((service, serviceIndex) => ({
        href: field(`s${index}-svc${serviceIndex}`) || service.href,
        label: field(`s${index}-svcl${serviceIndex}`),
      })),
      practitioners: section.practitioners.map((practitioner, practitionerIndex) => ({
        href: field(`s${index}-prac${practitionerIndex}`) || practitioner.href,
        label: field(`s${index}-pracl${practitionerIndex}`),
        summary: field(`s${index}-pracs${practitionerIndex}`),
      })),
      guides: section.guides.map((guide, guideIndex) => ({
        href: field(`s${index}-guide${guideIndex}`) || guide.href,
        kicker: field(`s${index}-guidek${guideIndex}`),
        title: field(`s${index}-guidet${guideIndex}`),
        summary: field(`s${index}-guides${guideIndex}`),
      })),
    })),
  };
}

export function articleDocumentFrom(value: unknown): ArticleDocument | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (isArticleDocument(data.document)) return data.document;
  if (isArticleDocument(data)) return data;
  return null;
}

export function applyArticleDocument(html: string, document: ArticleDocument, pagePath = ""): { html: string; errors: string[] } {
  const current = readArticleDocument(html, pagePath);
  const errors = structureProblems(current, document);
  if (errors.length > 0) return { html, errors };
  let next = replaceTaggedText(html, /(<h1>)([\s\S]*?)(<\/h1>)/i, document.title);
  next = replaceTaggedText(next, /(<p class="lede">)([\s\S]*?)(<\/p>)/i, document.summary);
  if (document.updated && current.updated && document.updated !== current.updated) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(document.updated)) {
      return { html, errors: ["The review date must stay in YYYY-MM-DD form."] };
    }
    next = next.replace(
      /(<div class="knowledge-byline">[\s\S]*?<span>Updated )\d{4}-\d{2}-\d{2}(<\/span>)/i,
      `$1${document.updated}$2`,
    );
  }
  document.sections.forEach((section) => {
    const pattern = new RegExp(`(<section\\b[^>]*\\bid="${escapeRegExp(section.id)}"[^>]*>)([\\s\\S]*?)(<\\/section>)`, "i");
    next = next.replace(pattern, (_match, open: string, inner: string, close: string) => {
      const applied = applySection(inner, section, pagePath);
      errors.push(...applied.errors.map((error) => `${section.heading || section.id}: ${error}`));
      return `${open}${applied.inner}${close}`;
    });
  });
  return { html: errors.length > 0 ? html : next, errors };
}

export function articleLinkProblems(html: string, pagePath: string, knownPaths: ReadonlySet<string>): string[] {
  const problems: string[] = [];
  for (const href of hrefs(html)) {
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    if (/^https?:\/\//i.test(href)) {
      if (!href.startsWith("https://")) problems.push(`Source links must stay on https: ${href}`);
      continue;
    }
    if (/^\s*javascript:/i.test(href) || href.includes('"') || href.includes("<")) {
      problems.push(`A link is not a valid page address: ${href}`);
      continue;
    }
    if (!href.split(/[?#]/)[0].endsWith(".html")) continue;
    const resolved = resolveSitePath(pagePath, href);
    if (!resolved || !knownPaths.has(resolved)) problems.push(`Internal link does not match a published page: ${href}`);
  }
  const related = readArticleDocument(html, pagePath);
  for (const section of related.sections) {
    for (const link of section.services) {
      if (!knownPaths.has(link.href)) problems.push(`Related service link is not a service page: ${link.href}`);
    }
    for (const link of section.practitioners) {
      if (!link.href.startsWith("doctors/")) problems.push(`Related practitioner link is not a practitioner profile: ${link.href}`);
    }
    for (const link of section.guides) {
      if (!link.href.startsWith("knowledge/")) problems.push(`Related article link is not a Knowledge Centre page: ${link.href}`);
    }
  }
  return problems;
}

export function knowledgeHubs(articlePath: string, pages: ReadonlyArray<{ path: string; html: string }>): Array<{ path: string; linked: boolean }> {
  const file = articlePath.split("/").pop() ?? articlePath;
  return pages
    .filter((page) => page.path.startsWith("knowledge/") && !page.path.includes("/articles/") && page.path !== articlePath)
    .filter((page) => page.html.includes(file))
    .map((page) => ({ path: page.path, linked: page.html.includes(file) }));
}

export function resolveSitePath(fromPath: string, href: string): string | null {
  if (!href || href.startsWith("#") || /^(?:mailto|tel|https?|javascript):/i.test(href)) return null;
  const [pathOnly] = href.split(/[?#]/);
  const base = fromPath.split("/").slice(0, -1);
  const stack = [...base];
  for (const part of pathOnly.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  const resolved = stack.join("/");
  return resolved.endsWith(".html") ? resolved : null;
}

export function relativeHref(fromPath: string, targetPath: string): string {
  const from = fromPath.split("/").slice(0, -1);
  const target = targetPath.split("/");
  let shared = 0;
  while (shared < from.length && shared < target.length && from[shared] === target[shared]) shared += 1;
  return [...Array.from({ length: from.length - shared }, () => ".."), ...target.slice(shared)].join("/");
}

function readSection(id: string, inner: string, pagePath: string): ArticleSection {
  const withoutBlocks = maskBlocks(inner);
  return {
    id,
    heading: textOf(inner.match(/<h2>([\s\S]*?)<\/h2>/i)?.[1] ?? ""),
    paragraphs: [...withoutBlocks.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map((match) => textOf(match[1])),
    takeaways: listItemTexts(inner.match(/<ul class="service-care-list">([\s\S]*?)<\/ul>/i)?.[1] ?? ""),
    faqs: [...inner.matchAll(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/gi)].map((match) => ({
      question: textOf(match[1]),
      answer: textOf(match[2]),
    })),
    sources: id === "trusted-australian-information" ? resourceLinks(inner, pagePath) : [],
    services: id === "related-services" ? resourceLinks(inner, pagePath) : [],
    practitioners: [...inner.matchAll(/<a class="practitioner-knowledge-link" href="([^"]+)"><strong>([\s\S]*?)<\/strong><span>([\s\S]*?)<\/span>/gi)].map(
      (match) => ({
        href: resolveSitePath(pagePath, match[1]) ?? match[1],
        label: textOf(match[2]),
        summary: textOf(match[3]),
      }),
    ),
    guides: [...inner.matchAll(/<a class="knowledge-article-card" href="([^"]+)">\s*<span class="knowledge-card-kicker">([\s\S]*?)<\/span>\s*<strong>([\s\S]*?)<\/strong>\s*<span>([\s\S]*?)<\/span>/gi)].map(
      (match) => ({
        href: resolveSitePath(pagePath, match[1]) ?? match[1],
        kicker: textOf(match[2]),
        title: textOf(match[3]),
        summary: textOf(match[4]),
      }),
    ),
  };
}

function applySection(inner: string, section: ArticleSection, pagePath: string): { inner: string; errors: string[] } {
  const errors: string[] = [];
  let next = inner.replace(/(<h2>)([\s\S]*?)(<\/h2>)/i, (_match, open: string, current: string, close: string) =>
    sameText(current, section.heading) ? `${open}${current}${close}` : `${open}${escapeText(section.heading)}${close}`,
  );
  next = replaceBodyParagraphs(next, section.paragraphs, errors);
  next = next.replace(/(<ul class="service-care-list">)([\s\S]*?)(<\/ul>)/i, (match, open: string, list: string, close: string) => {
    const replaced = replaceListLabels(list, section.takeaways);
    if (replaced == null) {
      errors.push("Key takeaways must keep the same number of items.");
      return match;
    }
    return `${open}${replaced}${close}`;
  });
  let faqIndex = 0;
  next = next.replace(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/gi, (match, question: string, answer: string) => {
    const faq = section.faqs[faqIndex];
    faqIndex += 1;
    if (!faq) return match;
    const nextQuestion = sameText(question, faq.question) ? question : escapeText(faq.question);
    const nextAnswer = sameText(answer, faq.answer) ? answer : escapeText(faq.answer);
    return `<details><summary>${nextQuestion}</summary><p>${nextAnswer}</p></details>`;
  });
  if (faqIndex !== section.faqs.length) errors.push("FAQs must keep the same number of questions.");
  next = replaceResourceLinks(next, section.sources.length > 0 ? section.sources : section.services, pagePath, errors);
  next = replacePractitionerLinks(next, section.practitioners, pagePath, errors);
  next = replaceGuideLinks(next, section.guides, pagePath, errors);
  return { inner: next, errors };
}

function replaceBodyParagraphs(inner: string, paragraphs: string[], errors: string[]): string {
  const masked = maskBlocks(inner);
  const matches = [...masked.matchAll(/<p>([\s\S]*?)<\/p>/gi)];
  if (matches.length !== paragraphs.length) {
    errors.push("The article body must keep the same number of paragraphs.");
    return inner;
  }
  let next = inner;
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const match = matches[index];
    const current = match[1] ?? "";
    const start = match.index ?? 0;
    if (sameText(current, paragraphs[index] ?? "")) continue;
    if (/<[^>]+>/.test(current)) {
      errors.push("A paragraph that contains a link was left unchanged.");
      continue;
    }
    const replacement = `<p>${escapeText(paragraphs[index] ?? "")}</p>`;
    next = `${next.slice(0, start)}${replacement}${next.slice(start + match[0].length)}`;
  }
  return next;
}

function replaceResourceLinks(inner: string, links: ArticleLink[], pagePath: string, errors: string[]): string {
  let index = 0;
  return inner.replace(/<a class="resource-link" href="([^"]+)"([^>]*)><strong>([\s\S]*?)<\/strong>/gi, (match, href: string, rest: string, label: string) => {
    const link = links[index];
    index += 1;
    if (!link) return match;
    const nextHref = linkHref(href, link.href, pagePath);
    if (!nextHref) {
      errors.push(`The link ${link.label || link.href} is not a valid published address.`);
      return match;
    }
    const nextLabel = sameText(label, link.label) ? label : escapeText(link.label);
    return `<a class="resource-link" href="${nextHref}"${rest}><strong>${nextLabel}</strong>`;
  });
}

function replacePractitionerLinks(inner: string, links: ArticlePractitioner[], pagePath: string, errors: string[]): string {
  let index = 0;
  return inner.replace(
    /<a class="practitioner-knowledge-link" href="([^"]+)"><strong>([\s\S]*?)<\/strong><span>([\s\S]*?)<\/span>/gi,
    (match, href: string, label: string, summary: string) => {
      const link = links[index];
      index += 1;
      if (!link) return match;
      const nextHref = linkHref(href, link.href, pagePath);
      if (!nextHref) {
        errors.push(`The practitioner link ${link.label || link.href} is not a published profile.`);
        return match;
      }
      const nextLabel = sameText(label, link.label) ? label : escapeText(link.label);
      const nextSummary = sameText(summary, link.summary) ? summary : escapeText(link.summary);
      return `<a class="practitioner-knowledge-link" href="${nextHref}"><strong>${nextLabel}</strong><span>${nextSummary}</span>`;
    },
  );
}

function replaceGuideLinks(inner: string, links: ArticleGuide[], pagePath: string, errors: string[]): string {
  let index = 0;
  return inner.replace(
    /<a class="knowledge-article-card" href="([^"]+)">(\s*)<span class="knowledge-card-kicker">([\s\S]*?)<\/span>(\s*)<strong>([\s\S]*?)<\/strong>(\s*)<span>([\s\S]*?)<\/span>/gi,
    (match, href: string, afterHref: string, kicker: string, afterKicker: string, title: string, afterTitle: string, summary: string) => {
      const link = links[index];
      index += 1;
      if (!link) return match;
      const nextHref = linkHref(href, link.href, pagePath);
      if (!nextHref) {
        errors.push(`The related article link ${link.title || link.href} is not a published Knowledge Centre page.`);
        return match;
      }
      return `<a class="knowledge-article-card" href="${nextHref}">${afterHref}<span class="knowledge-card-kicker">${sameText(kicker, link.kicker) ? kicker : escapeText(link.kicker)}</span>${afterKicker}<strong>${sameText(title, link.title) ? title : escapeText(link.title)}</strong>${afterTitle}<span>${sameText(summary, link.summary) ? summary : escapeText(link.summary)}</span>`;
    },
  );
}

function linkHref(currentHref: string, target: string, pagePath: string): string | null {
  if (!target || target.includes('"') || target.includes("<") || /^\s*javascript:/i.test(target)) return null;
  if (/^https:\/\//i.test(target)) return target === currentHref || target.startsWith("https://") ? target : null;
  if (!target.endsWith(".html") || target.includes("..")) return null;
  return relativeHref(pagePath, target);
}

function structureProblems(current: ArticleDocument, next: ArticleDocument): string[] {
  if (current.sections.length !== next.sections.length) return ["The article sections cannot be added or removed."];
  const errors: string[] = [];
  current.sections.forEach((section, index) => {
    const candidate = next.sections[index];
    if (!candidate || candidate.id !== section.id) errors.push("The article sections cannot be rearranged.");
    if (!candidate) return;
    if (candidate.paragraphs.length !== section.paragraphs.length) errors.push(`${section.heading}: the body must keep the same number of paragraphs.`);
    if (candidate.takeaways.length !== section.takeaways.length) errors.push(`${section.heading}: key takeaways must keep the same number of items.`);
    if (candidate.faqs.length !== section.faqs.length) errors.push(`${section.heading}: FAQs must keep the same number of questions.`);
    if (candidate.sources.length !== section.sources.length) errors.push(`${section.heading}: sources must keep the same number of references.`);
    if (candidate.services.length !== section.services.length) errors.push(`${section.heading}: related services must keep the same number of links.`);
    if (candidate.practitioners.length !== section.practitioners.length) errors.push(`${section.heading}: related practitioners must keep the same number of links.`);
    if (candidate.guides.length !== section.guides.length) errors.push(`${section.heading}: related articles must keep the same number of links.`);
  });
  return errors;
}

function resourceLinks(inner: string, pagePath: string): ArticleLink[] {
  return [...inner.matchAll(/<a class="resource-link" href="([^"]+)"[^>]*><strong>([\s\S]*?)<\/strong>/gi)].map((match) => ({
    href: /^https?:\/\//i.test(match[1]) ? match[1] : resolveSitePath(pagePath, match[1]) ?? match[1],
    label: textOf(match[2]),
  }));
}

function maskBlocks(inner: string): string {
  return inner
    .replace(/<details\b[\s\S]*?<\/details>/gi, (block) => " ".repeat(block.length))
    .replace(/<ul\b[\s\S]*?<\/ul>/gi, (block) => " ".repeat(block.length))
    .replace(/<div class="resource-links"[\s\S]*?<\/div>/gi, (block) => " ".repeat(block.length))
    .replace(/<div class="practitioner-knowledge-links"[\s\S]*?<\/div>/gi, (block) => " ".repeat(block.length))
    .replace(/<div class="knowledge-article-grid[\s\S]*?<\/div>/gi, (block) => " ".repeat(block.length));
}

function hrefs(html: string): string[] {
  return [...html.matchAll(/\bhref="([^"]+)"/gi)].map((match) => match[1]);
}

function textOf(value: string): string {
  return decodeText(value.replace(/<[^>]+>/g, "")).trim();
}

function sameText(current: string, next: string): boolean {
  return textOf(current) === next;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
