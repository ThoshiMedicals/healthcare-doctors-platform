import { decodeText, escapeText, listItemTexts, replaceListLabels, replaceTaggedText } from "@/cms/html-text";

export type PracticeCard = { kicker: string; heading: string; text: string };
export type PracticeSection = {
  id: string;
  heading: string;
  paragraphs: string[];
  lists: string[][];
  faqs: { question: string; answer: string }[];
  cards: PracticeCard[];
  chips: string[];
};

export type PracticeDocument = {
  kind: "practice";
  title: string;
  summary: string;
  sections: PracticeSection[];
};

const CONTENT_SECTION = /article-section|about-hub-card|knowledge-final-cta/;

export function readPracticeDocument(html: string): PracticeDocument {
  return {
    kind: "practice",
    title: textOf(html.match(/<h1>([\s\S]*?)<\/h1>/i)?.[1] ?? ""),
    summary: textOf(html.match(/<p class="lede">([\s\S]*?)<\/p>/i)?.[1] ?? ""),
    sections: contentSections(html).map((section) => readSection(section.attrs, section.inner)),
  };
}

export function isPracticeDocument(value: unknown): value is PracticeDocument {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  return data.kind === "practice" && typeof data.title === "string" && Array.isArray(data.sections);
}

export function practiceDocumentFrom(value: unknown): PracticeDocument | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (isPracticeDocument(data.document)) return data.document;
  if (isPracticeDocument(data)) return data;
  return null;
}

export function practiceFromForm(formData: FormData, baseline: PracticeDocument): PracticeDocument {
  const field = (name: string) => String(formData.get(name) ?? "").trim();
  return {
    kind: "practice",
    title: field("title"),
    summary: field("summary"),
    sections: baseline.sections.map((section, index) => ({
      id: section.id,
      heading: field(`s${index}-heading`),
      paragraphs: section.paragraphs.map((_paragraph, paragraph) => field(`s${index}-p${paragraph}`)),
      lists: section.lists.map((list, listIndex) => list.map((_item, item) => field(`s${index}-l${listIndex}-${item}`))),
      faqs: section.faqs.map((_faq, faq) => ({ question: field(`s${index}-fq${faq}`), answer: field(`s${index}-fa${faq}`) })),
      cards: section.cards.map((card, cardIndex) => ({
        kicker: field(`s${index}-cardk${cardIndex}`) || card.kicker,
        heading: field(`s${index}-cardh${cardIndex}`),
        text: field(`s${index}-cardt${cardIndex}`),
      })),
      chips: section.chips.map((_chip, chip) => field(`s${index}-chip${chip}`)),
    })),
  };
}

export function applyPracticeDocument(html: string, document: PracticeDocument): { html: string; errors: string[] } {
  const sections = contentSections(html);
  const current = readPracticeDocument(html);
  const errors = structureProblems(current, document);
  if (errors.length > 0 || sections.length !== document.sections.length) return { html, errors };
  let next = replaceTaggedText(html, /(<h1>)([\s\S]*?)(<\/h1>)/i, document.title);
  next = replaceTaggedText(next, /(<p class="lede">)([\s\S]*?)(<\/p>)/i, document.summary);
  const shifted = contentSections(next);
  for (let index = shifted.length - 1; index >= 0; index -= 1) {
    const section = shifted[index];
    const replacement = document.sections[index];
    if (!section || !replacement) continue;
    const applied = applySection(section.inner, replacement);
    errors.push(...applied.errors.map((error) => `${replacement.heading || replacement.id || "Section"}: ${error}`));
    next = `${next.slice(0, section.innerStart)}${applied.inner}${next.slice(section.innerEnd)}`;
  }
  return { html: errors.length > 0 ? html : next, errors };
}

export function practiceLinkProblems(currentHtml: string, nextHtml: string, pagePath: string, knownPaths: ReadonlySet<string>): string[] {
  const problems = linkProblems(nextHtml, pagePath, knownPaths);
  const before = footerHrefs(currentHtml);
  const after = footerHrefs(nextHtml);
  if (before.join("\n") !== after.join("\n")) problems.push("Footer links changed.");
  for (const href of after) {
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("https://")) continue;
    if (!href.split(/[?#]/)[0].endsWith(".html")) continue;
    const resolved = resolvePage(pagePath, href);
    if (!resolved || !knownPaths.has(resolved)) problems.push(`Footer link does not match a published page: ${href}`);
  }
  return problems;
}

function readSection(attrs: string, inner: string): PracticeSection {
  return {
    id: attrs.match(/\bid="([^"]+)"/i)?.[1] ?? "",
    heading: textOf(inner.match(/<h2>([\s\S]*?)<\/h2>/i)?.[1] ?? ""),
    paragraphs: paragraphTexts(inner),
    lists: [...inner.matchAll(/<(?:ul|ol)\b[^>]*>([\s\S]*?)<\/(?:ul|ol)>/gi)].map((match) => listItemTexts(match[1])),
    faqs: [...inner.matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/gi)].map((match) => ({
      question: textOf(match[1]),
      answer: textOf(match[2]),
    })),
    cards: cardsIn(inner),
    chips: chipsIn(inner),
  };
}

function applySection(inner: string, section: PracticeSection): { inner: string; errors: string[] } {
  const errors: string[] = [];
  let next = inner.replace(/(<h2>)([\s\S]*?)(<\/h2>)/i, (_match, open: string, current: string, close: string) =>
    sameText(current, section.heading) ? `${open}${current}${close}` : `${open}${escapeText(section.heading)}${close}`,
  );
  next = replaceParagraphs(next, section.paragraphs, errors);
  let listIndex = 0;
  next = next.replace(/<(ul|ol)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag: string, attrs: string, list: string) => {
    const labels = section.lists[listIndex] ?? [];
    listIndex += 1;
    const replaced = replaceListLabels(list, labels);
    if (replaced == null) {
      errors.push("A list must keep the same number of items.");
      return match;
    }
    return `<${tag}${attrs}>${replaced}</${tag}>`;
  });
  let faqIndex = 0;
  next = next.replace(/<details>(\s*)<summary>([\s\S]*?)<\/summary>(\s*)<p>([\s\S]*?)<\/p>/gi, (match, before: string, question: string, middle: string, answer: string) => {
    const faq = section.faqs[faqIndex];
    faqIndex += 1;
    if (!faq) return match;
    const nextQuestion = sameText(question, faq.question) ? question : escapeText(faq.question);
    const nextAnswer = sameText(answer, faq.answer) ? answer : escapeText(faq.answer);
    return `<details>${before}<summary>${nextQuestion}</summary>${middle}<p>${nextAnswer}</p>`;
  });
  if (faqIndex !== section.faqs.length) errors.push("FAQs must keep the same number of questions.");
  next = replaceCards(next, section.cards, errors);
  next = replaceChips(next, section.chips, errors);
  return { inner: next, errors };
}

function replaceParagraphs(inner: string, paragraphs: string[], errors: string[]): string {
  const matches = [...maskBlocks(inner).matchAll(/<p(?:\s+class="form-email-handoff")?>([\s\S]*?)<\/p>/gi)];
  if (matches.length !== paragraphs.length) {
    errors.push("The page must keep the same number of paragraphs.");
    return inner;
  }
  let next = inner;
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const match = matches[index];
    const current = match[1] ?? "";
    const start = match.index ?? 0;
    if (sameText(current, paragraphs[index] ?? "")) continue;
    const rewritten = rewriteParagraph(match[0], current, paragraphs[index] ?? "");
    if (rewritten == null) {
      errors.push("A paragraph that contains a link was left unchanged.");
      continue;
    }
    next = `${next.slice(0, start)}${rewritten}${next.slice(start + match[0].length)}`;
  }
  return next;
}

function rewriteParagraph(full: string, current: string, nextText: string): string | null {
  const open = full.slice(0, full.indexOf(">") + 1);
  const strong = current.match(/^(\s*<strong>)([\s\S]*?)(<\/strong>)(\s*)([\s\S]*)$/i);
  if (strong && !/<[^>]+>/.test(strong[5] ?? "")) {
    const label = textOf(strong[2] ?? "");
    const rest = textOf(strong[5] ?? "");
    if (nextText.startsWith(label)) {
      return `${open}${strong[1]}${strong[2]}${strong[3]}${strong[4]}${escapeText(nextText.slice(label.length).trim())}</p>`;
    }
    if (rest && nextText.endsWith(rest)) {
      return `${open}${strong[1]}${escapeText(nextText.slice(0, nextText.length - rest.length).trim())}${strong[3]}${strong[4]}${strong[5]}</p>`;
    }
    return null;
  }
  if (/<[^>]+>/.test(current)) return null;
  return `${open}${escapeText(nextText)}</p>`;
}

function replaceCards(inner: string, cards: PracticeCard[], errors: string[]): string {
  const found = [...inner.matchAll(/<div class="network-location-card">/gi)];
  if (found.length !== cards.length) {
    errors.push("Location cards must keep the same number of entries.");
    return inner;
  }
  let next = inner;
  for (let index = found.length - 1; index >= 0; index -= 1) {
    const start = found[index]?.index ?? 0;
    const end = balancedEnd(next, start, "div");
    const block = next.slice(start, end);
    const card = cards[index];
    if (!card) continue;
    const replaced = block
      .replace(/(<span class="knowledge-card-kicker">)([\s\S]*?)(<\/span>)/i, (_match, open: string, current: string, close: string) =>
        sameText(current, card.kicker) ? `${open}${current}${close}` : `${open}${escapeText(card.kicker)}${close}`,
      )
      .replace(/(<h3>)([\s\S]*?)(<\/h3>)/i, (_match, open: string, current: string, close: string) =>
        sameText(current, card.heading) ? `${open}${current}${close}` : `${open}${escapeText(card.heading)}${close}`,
      )
      .replace(/(<p>)([\s\S]*?)(<\/p>)/i, (_match, open: string, current: string, close: string) =>
        sameText(current, card.text) ? `${open}${current}${close}` : `${open}${escapeText(card.text)}${close}`,
      );
    next = `${next.slice(0, start)}${replaced}${next.slice(end)}`;
  }
  return next;
}

function replaceChips(inner: string, chips: string[], errors: string[]): string {
  return inner.replace(/<div class="knowledge-trust-strip">[\s\S]*?<\/div>/gi, (block) => {
    const found = [...block.matchAll(/<span>([\s\S]*?)<\/span>/gi)];
    if (found.length !== chips.length) {
      errors.push("The highlight line must keep the same number of items.");
      return block;
    }
    let index = 0;
    return block.replace(/<span>([\s\S]*?)<\/span>/gi, (match, current: string) => {
      const chip = chips[index] ?? "";
      index += 1;
      return sameText(current, chip) ? match : `<span>${escapeText(chip)}</span>`;
    });
  });
}

function cardsIn(inner: string): PracticeCard[] {
  const cards: PracticeCard[] = [];
  for (const match of inner.matchAll(/<div class="network-location-card">/gi)) {
    const start = match.index ?? 0;
    const block = inner.slice(start, balancedEnd(inner, start, "div"));
    cards.push({
      kicker: textOf(block.match(/<span class="knowledge-card-kicker">([\s\S]*?)<\/span>/i)?.[1] ?? ""),
      heading: textOf(block.match(/<h3>([\s\S]*?)<\/h3>/i)?.[1] ?? ""),
      text: textOf(block.match(/<p>([\s\S]*?)<\/p>/i)?.[1] ?? ""),
    });
  }
  return cards;
}

function chipsIn(inner: string): string[] {
  const block = inner.match(/<div class="knowledge-trust-strip">[\s\S]*?<\/div>/i)?.[0] ?? "";
  return [...block.matchAll(/<span>([\s\S]*?)<\/span>/gi)].map((match) => textOf(match[1]));
}

function paragraphTexts(inner: string): string[] {
  return [...maskBlocks(inner).matchAll(/<p(?:\s+class="form-email-handoff")?>([\s\S]*?)<\/p>/gi)].map((match) => textOf(match[1]));
}

function contentSections(html: string): { attrs: string; inner: string; innerStart: number; innerEnd: number; start: number; end: number }[] {
  const sections: { attrs: string; inner: string; innerStart: number; innerEnd: number; start: number; end: number }[] = [];
  for (const match of html.matchAll(/<section\b([^>]*)>/gi)) {
    const attrs = match[1] ?? "";
    if (!CONTENT_SECTION.test(attrs)) continue;
    const start = match.index ?? 0;
    if (sections.some((section) => start > section.start && start < section.end)) continue;
    const end = balancedEnd(html, start, "section");
    const innerStart = start + match[0].length;
    const innerEnd = end - "</section>".length;
    sections.push({ attrs, inner: html.slice(innerStart, innerEnd), innerStart, innerEnd, start, end });
  }
  return sections;
}

function structureProblems(current: PracticeDocument, next: PracticeDocument): string[] {
  if (current.sections.length !== next.sections.length) return ["The page sections cannot be added or removed."];
  const errors: string[] = [];
  current.sections.forEach((section, index) => {
    const candidate = next.sections[index];
    const name = section.heading || section.id || `Section ${index + 1}`;
    if (!candidate || candidate.id !== section.id) errors.push("The page sections cannot be rearranged.");
    if (!candidate) return;
    if (candidate.paragraphs.length !== section.paragraphs.length) errors.push(`${name}: the body must keep the same number of paragraphs.`);
    if (candidate.lists.length !== section.lists.length || candidate.lists.some((list, listIndex) => list.length !== section.lists[listIndex]?.length)) {
      errors.push(`${name}: lists must keep the same number of items.`);
    }
    if (candidate.faqs.length !== section.faqs.length) errors.push(`${name}: FAQs must keep the same number of questions.`);
    if (candidate.cards.length !== section.cards.length) errors.push(`${name}: location cards must keep the same number of entries.`);
    if (candidate.chips.length !== section.chips.length) errors.push(`${name}: the highlight line must keep the same number of items.`);
  });
  return errors;
}

function maskBlocks(inner: string): string {
  let next = inner
    .replace(/<details\b[\s\S]*?<\/details>/gi, (block) => " ".repeat(block.length))
    .replace(/<(?:ul|ol)\b[\s\S]*?<\/(?:ul|ol)>/gi, (block) => " ".repeat(block.length));
  for (const className of [
    "resource-links",
    "information-list",
    "about-hub-links",
    "service-cta-actions",
    "network-location-actions",
    "network-location-grid",
    "knowledge-trust-strip",
    "faq-search",
    "faq-category-filters",
  ]) {
    next = maskDiv(next, className);
  }
  return next;
}

function maskDiv(inner: string, className: string): string {
  const pattern = new RegExp(`<div class="${className}[^"]*">`, "gi");
  let next = inner;
  for (const match of inner.matchAll(pattern)) {
    const start = match.index ?? 0;
    const end = balancedEnd(inner, start, "div");
    if (end <= start) continue;
    next = `${next.slice(0, start)}${" ".repeat(end - start)}${next.slice(end)}`;
  }
  return next;
}

function balancedEnd(html: string, start: number, name: "section" | "div"): number {
  const pattern = new RegExp(`<\\/?${name}\\b[^>]*>`, "gi");
  let depth = 0;
  for (const match of html.slice(start).matchAll(pattern)) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return start + (match.index ?? 0) + match[0].length;
  }
  return start;
}

function linkProblems(html: string, pagePath: string, knownPaths: ReadonlySet<string>): string[] {
  const problems: string[] = [];
  for (const href of [...html.matchAll(/\shref="([^"]*)"/gi)].map((match) => match[1] ?? "")) {
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    if (/^https?:\/\//i.test(href)) {
      if (!href.startsWith("https://")) problems.push(`Links must stay on https: ${href}`);
      continue;
    }
    if (/^\s*javascript:/i.test(href)) {
      problems.push(`A link is not a valid page address: ${href}`);
      continue;
    }
    if (!href.split(/[?#]/)[0].endsWith(".html")) continue;
    const resolved = resolvePage(pagePath, href);
    if (!resolved || !knownPaths.has(resolved)) problems.push(`Internal link does not match a published page: ${href}`);
  }
  return problems;
}

function footerHrefs(html: string): string[] {
  const footer = html.match(/<footer\b[\s\S]*<\/footer>/i)?.[0] ?? "";
  return [...footer.matchAll(/\shref="([^"]*)"/gi)].map((match) => match[1] ?? "");
}

function resolvePage(fromPath: string, href: string): string | null {
  const clean = href.split(/[?#]/)[0] ?? "";
  if (!clean.endsWith(".html")) return null;
  const base = fromPath.split("/").slice(0, -1);
  const parts = [...base, ...clean.split("/")];
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") resolved.pop();
    else resolved.push(part);
  }
  return resolved.join("/");
}

function textOf(value: string): string {
  return decodeText(value.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

function sameText(current: string, next: string): boolean {
  return textOf(current) === next;
}
