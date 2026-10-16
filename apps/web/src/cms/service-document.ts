import { articleLinkProblems, relativeHref, resolveSitePath } from "@/cms/article-document";
import { decodeText, escapeText, listItemTexts, replaceListLabels, replaceTaggedText } from "@/cms/html-text";

export type ServiceStep = { heading: string; text: string };
export type ServiceReference = { href: string; label: string };
export type ServicePractitioner = { href: string; label: string; note: string };

export type ServiceSection = {
  id: string;
  heading: string;
  paragraphs: string[];
  lists: string[][];
  steps: ServiceStep[];
  faqs: { question: string; answer: string }[];
  references: ServiceReference[];
  practitioners: ServicePractitioner[];
};

export type ServiceDocument = {
  kind: "service";
  title: string;
  summary: string;
  updated: string;
  sections: ServiceSection[];
};

export function readServiceDocument(html: string, pagePath = ""): ServiceDocument {
  return {
    kind: "service",
    title: textOf(html.match(/<h1>([\s\S]*?)<\/h1>/i)?.[1] ?? ""),
    summary: textOf(html.match(/<p class="lede">([\s\S]*?)<\/p>/i)?.[1] ?? ""),
    updated: html.match(/Updated (\d{4}-\d{2}-\d{2})/)?.[1] ?? "",
    sections: [...html.matchAll(/<section\b[^>]*class="[^"]*article-section[^"]*"[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/section>/gi)].map((match) =>
      readSection(match[1], match[2], pagePath),
    ),
  };
}

export function isServiceDocument(value: unknown): value is ServiceDocument {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  return data.kind === "service" && typeof data.title === "string" && Array.isArray(data.sections);
}

export function serviceDocumentFrom(value: unknown): ServiceDocument | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (isServiceDocument(data.document)) return data.document;
  if (isServiceDocument(data)) return data;
  return null;
}

export function serviceFromForm(formData: FormData, baseline: ServiceDocument): ServiceDocument {
  const field = (name: string) => String(formData.get(name) ?? "").trim();
  return {
    kind: "service",
    title: field("title"),
    summary: field("summary"),
    updated: field("updated") || baseline.updated,
    sections: baseline.sections.map((section, index) => ({
      id: section.id,
      heading: field(`s${index}-heading`),
      paragraphs: section.paragraphs.map((_paragraph, paragraph) => field(`s${index}-p${paragraph}`)),
      lists: section.lists.map((list, listIndex) => list.map((_item, item) => field(`s${index}-l${listIndex}-${item}`))),
      steps: section.steps.map((step, stepIndex) => ({
        heading: field(`s${index}-sh${stepIndex}`) || step.heading,
        text: field(`s${index}-st${stepIndex}`),
      })),
      faqs: section.faqs.map((_faq, faq) => ({ question: field(`s${index}-fq${faq}`), answer: field(`s${index}-fa${faq}`) })),
      references: section.references.map((reference, referenceIndex) => ({
        href: field(`s${index}-ref${referenceIndex}`) || reference.href,
        label: field(`s${index}-refl${referenceIndex}`),
      })),
      practitioners: section.practitioners.map((practitioner, practitionerIndex) => ({
        href: field(`s${index}-prac${practitionerIndex}`) || practitioner.href,
        label: field(`s${index}-pracl${practitionerIndex}`),
        note: field(`s${index}-pracn${practitionerIndex}`),
      })),
    })),
  };
}

export function applyServiceDocument(html: string, document: ServiceDocument, pagePath = ""): { html: string; errors: string[] } {
  const current = readServiceDocument(html, pagePath);
  const errors = structureProblems(current, document);
  if (errors.length > 0) return { html, errors };
  if (document.updated && !/^\d{4}-\d{2}-\d{2}$/.test(document.updated)) {
    return { html, errors: ["The review date must stay in YYYY-MM-DD form."] };
  }
  let next = replaceTaggedText(html, /(<h1>)([\s\S]*?)(<\/h1>)/i, document.title);
  next = replaceTaggedText(next, /(<p class="lede">)([\s\S]*?)(<\/p>)/i, document.summary);
  if (document.updated && current.updated && document.updated !== current.updated) {
    next = next.replace(/(Updated )\d{4}-\d{2}-\d{2}/, `$1${document.updated}`);
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

export function serviceLinkProblems(html: string, pagePath: string, knownPaths: ReadonlySet<string>): string[] {
  const problems = articleLinkProblems(html, pagePath, knownPaths);
  const document = readServiceDocument(html, pagePath);
  for (const section of document.sections) {
    for (const practitioner of section.practitioners) {
      if (!practitioner.href.startsWith("doctors/")) {
        problems.push(`Related practitioner link is not a practitioner profile: ${practitioner.href}`);
      }
    }
    for (const reference of section.references) {
      if (!reference.href.startsWith("https://")) problems.push(`References must stay on https: ${reference.href}`);
    }
  }
  return problems;
}

function readSection(id: string, inner: string, pagePath: string): ServiceSection {
  return {
    id,
    heading: textOf(inner.match(/<h2>([\s\S]*?)<\/h2>/i)?.[1] ?? ""),
    paragraphs: [...maskBlocks(inner).matchAll(/<p>([\s\S]*?)<\/p>/gi)].map((match) => textOf(match[1])),
    lists: [...inner.matchAll(/<ul class="(?:service-care-list|local-area-list)">([\s\S]*?)<\/ul>/gi)].map((match) => listItemTexts(match[1])),
    steps: [...inner.matchAll(/<div class="care-journey-item">\s*<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>\s*<\/div>/gi)].map((match) => ({
      heading: textOf(match[1]),
      text: textOf(match[2]),
    })),
    faqs: [...inner.matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>\s*<\/details>/gi)].map((match) => ({
      question: textOf(match[1]),
      answer: textOf(match[2]),
    })),
    references: referencesIn(inner),
    practitioners:
      id === "related-practitioners"
        ? [...inner.matchAll(/<a class="resource-link" href="([^"]+)"><span>([\s\S]*?)<\/span><span>([\s\S]*?)<\/span><\/a>/gi)].map((match) => ({
            href: resolveSitePath(pagePath, match[1]) ?? match[1],
            label: textOf(match[2]),
            note: textOf(match[3]),
          }))
        : [],
  };
}

function applySection(inner: string, section: ServiceSection, pagePath: string): { inner: string; errors: string[] } {
  const errors: string[] = [];
  let next = inner.replace(/(<h2>)([\s\S]*?)(<\/h2>)/i, (_match, open: string, current: string, close: string) =>
    sameText(current, section.heading) ? `${open}${current}${close}` : `${open}${escapeText(section.heading)}${close}`,
  );
  next = replaceBodyParagraphs(next, section.paragraphs, errors);
  let listIndex = 0;
  next = next.replace(/<ul class="(service-care-list|local-area-list)">([\s\S]*?)<\/ul>/gi, (match, className: string, list: string) => {
    const labels = section.lists[listIndex] ?? [];
    listIndex += 1;
    const replaced = replaceListLabels(list, labels);
    if (replaced == null) {
      errors.push("A list must keep the same number of items.");
      return match;
    }
    return `<ul class="${className}">${replaced}</ul>`;
  });
  let stepIndex = 0;
  next = next.replace(/<div class="care-journey-item">(\s*)<h3>([\s\S]*?)<\/h3>(\s*)<p>([\s\S]*?)<\/p>(\s*)<\/div>/gi, (match, before: string, heading: string, middle: string, text: string, after: string) => {
    const step = section.steps[stepIndex];
    stepIndex += 1;
    if (!step) return match;
    const nextHeading = sameText(heading, step.heading) ? heading : escapeText(step.heading);
    const nextText = sameText(text, step.text) ? text : escapeText(step.text);
    return `<div class="care-journey-item">${before}<h3>${nextHeading}</h3>${middle}<p>${nextText}</p>${after}</div>`;
  });
  let faqIndex = 0;
  next = next.replace(/<details>(\s*)<summary>([\s\S]*?)<\/summary>(\s*)<p>([\s\S]*?)<\/p>(\s*)<\/details>/gi, (match, before: string, question: string, middle: string, answer: string, after: string) => {
    const faq = section.faqs[faqIndex];
    faqIndex += 1;
    if (!faq) return match;
    const nextQuestion = sameText(question, faq.question) ? question : escapeText(faq.question);
    const nextAnswer = sameText(answer, faq.answer) ? answer : escapeText(faq.answer);
    return `<details>${before}<summary>${nextQuestion}</summary>${middle}<p>${nextAnswer}</p>${after}</details>`;
  });
  if (faqIndex !== section.faqs.length) errors.push("FAQs must keep the same number of questions.");
  let referenceIndex = 0;
  next = next.replace(/<div class="external-info">[\s\S]*?<\/div>\s*<\/div>/gi, (block) =>
    block.replace(/<a class="resource-link" href="([^"]+)"([^>]*)><span>([\s\S]*?)<\/span>/gi, (match, href: string, rest: string, label: string) => {
      const reference = section.references[referenceIndex];
      referenceIndex += 1;
      if (!reference || !reference.href.startsWith("https://") || /[\s"<>]/.test(reference.href)) {
        errors.push("A reference must stay an https link.");
        return match;
      }
      const nextLabel = sameText(label, reference.label) ? label : escapeText(reference.label);
      return `<a class="resource-link" href="${reference.href}"${rest}><span>${nextLabel}</span>`;
    }),
  );
  if (section.practitioners.length > 0) {
    let practitionerIndex = 0;
    next = next.replace(/<a class="resource-link" href="([^"]+)"><span>([\s\S]*?)<\/span><span>([\s\S]*?)<\/span><\/a>/gi, (match, href: string, label: string, note: string) => {
      const practitioner = section.practitioners[practitionerIndex];
      practitionerIndex += 1;
      if (!practitioner) return match;
      const nextHref = practitioner.href.endsWith(".html") && !practitioner.href.includes("..") ? relativeHref(pagePath, practitioner.href) : "";
      if (!nextHref) {
        errors.push(`The practitioner link ${practitioner.label || practitioner.href} is not a published profile.`);
        return match;
      }
      const nextLabel = sameText(label, practitioner.label) ? label : escapeText(practitioner.label);
      const nextNote = sameText(note, practitioner.note) ? note : escapeText(practitioner.note);
      return `<a class="resource-link" href="${nextHref}"><span>${nextLabel}</span><span>${nextNote}</span></a>`;
    });
  }
  return { inner: next, errors };
}

function replaceBodyParagraphs(inner: string, paragraphs: string[], errors: string[]): string {
  const matches = [...maskBlocks(inner).matchAll(/<p>([\s\S]*?)<\/p>/gi)];
  if (matches.length !== paragraphs.length) {
    errors.push("The service body must keep the same number of paragraphs.");
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
    next = `${next.slice(0, start)}<p>${escapeText(paragraphs[index] ?? "")}</p>${next.slice(start + match[0].length)}`;
  }
  return next;
}

function referencesIn(inner: string): ServiceReference[] {
  const block = inner.match(/<div class="external-info">[\s\S]*?<\/div>\s*<\/div>/i)?.[0] ?? "";
  return [...block.matchAll(/<a class="resource-link" href="([^"]+)"[^>]*><span>([\s\S]*?)<\/span>/gi)].map((match) => ({
    href: match[1],
    label: textOf(match[2]),
  }));
}

function structureProblems(current: ServiceDocument, next: ServiceDocument): string[] {
  if (current.sections.length !== next.sections.length) return ["The service sections cannot be added or removed."];
  const errors: string[] = [];
  current.sections.forEach((section, index) => {
    const candidate = next.sections[index];
    if (!candidate || candidate.id !== section.id) errors.push("The service sections cannot be rearranged.");
    if (!candidate) return;
    if (candidate.paragraphs.length !== section.paragraphs.length) errors.push(`${section.heading}: the body must keep the same number of paragraphs.`);
    if (candidate.lists.length !== section.lists.length || candidate.lists.some((list, listIndex) => list.length !== section.lists[listIndex]?.length)) {
      errors.push(`${section.heading}: lists must keep the same number of items.`);
    }
    if (candidate.steps.length !== section.steps.length) errors.push(`${section.heading}: the visit steps must keep the same number of items.`);
    if (candidate.faqs.length !== section.faqs.length) errors.push(`${section.heading}: FAQs must keep the same number of questions.`);
    if (candidate.references.length !== section.references.length) errors.push(`${section.heading}: references must keep the same number of links.`);
    if (candidate.practitioners.length !== section.practitioners.length) errors.push(`${section.heading}: related practitioners must keep the same number of links.`);
  });
  return errors;
}

function maskBlocks(inner: string): string {
  let next = inner
    .replace(/<details\b[\s\S]*?<\/details>/gi, (block) => " ".repeat(block.length))
    .replace(/<ul\b[\s\S]*?<\/ul>/gi, (block) => " ".repeat(block.length));
  for (const className of ["resource-links", "care-journey-grid", "external-info"]) {
    next = maskDiv(next, className);
  }
  return next;
}

function maskDiv(inner: string, className: string): string {
  const pattern = new RegExp(`<div class="${className}[^"]*">`, "gi");
  let next = inner;
  for (const match of inner.matchAll(pattern)) {
    const start = match.index ?? 0;
    const end = balancedDivEnd(inner, start);
    if (end <= start) continue;
    next = `${next.slice(0, start)}${" ".repeat(end - start)}${next.slice(end)}`;
  }
  return next;
}

function balancedDivEnd(html: string, start: number): number {
  let depth = 0;
  for (const match of html.slice(start).matchAll(/<\/?div\b[^>]*>/gi)) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return start + (match.index ?? 0) + match[0].length;
  }
  return start;
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
