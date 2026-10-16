import { applyArticleDocument, type ArticleDocument } from "@/cms/article-document";
import { applyPracticeDocument, type PracticeDocument } from "@/cms/practice-document";
import { applyServiceDocument, type ServiceDocument } from "@/cms/service-document";
import { decodeText, escapeText, listItemTexts, replaceListLabels, replaceTaggedText } from "@/cms/html-text";
import { applyPractitionerMedia, bookingUrlProblems } from "@/cms/practitioner-media";

export type HourRow = { dayOfWeek: string; opens: string; closes: string };

export type PractitionerContent = {
  name?: string;
  sourceName?: string;
  biography: string;
  areasOfCare: string[];
  professionalInterests: string[];
  qualifications: string[];
  languages: string[];
  portraitFile?: string;
  sourcePortraitFile?: string;
  bookingUrl?: string;
  sourceBookingUrl?: string;
  /** False on listing cards, so only the name, photo, and booking link are written. */
  profileText?: boolean;
};

export type TextContent = {
  title: string;
  summary: string;
  introduction?: string;
  author?: string;
  sourceAuthor?: string;
  document?: ArticleDocument;
  serviceDocument?: ServiceDocument;
  practiceDocument?: PracticeDocument;
  pagePath?: string;
};

/** A published title or summary that already appears on another card, hub, or index. */
export type RepeatBinding = {
  pagePath: string;
  title: string;
  sourceTitle: string;
  summary: string;
  sourceSummary: string;
  author: string;
  sourceAuthor: string;
  topicPage: boolean;
};

export type ClinicContent = {
  phoneDisplay: string;
  phoneTel: string;
  email: string;
  streetAddress: string;
  suburb: string;
  state: string;
  postcode: string;
  openingHours: HourRow[];
  hotdocUrl?: string;
};

export type OverlayInput = {
  practitioner?: PractitionerContent | null;
  service?: TextContent | null;
  practice?: TextContent | null;
  article?: TextContent | null;
  update?: TextContent | null;
  clinic?: ClinicContent | null;
  repeats?: RepeatBinding[];
};

const WEEKDAY_GROUPS = [
  ["monday", "tuesday", "wednesday", "thursday"],
  ["friday"],
  ["saturday"],
  ["sunday"],
] as const;

export function practitionerFromPayload(value: unknown): PractitionerContent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  return {
    name: data.name ? String(data.name) : undefined,
    sourceName: data.sourceName ? String(data.sourceName) : undefined,
    biography: String(data.biography ?? ""),
    areasOfCare: stringList(data.areasOfCare),
    professionalInterests: stringList(data.professionalInterests),
    qualifications: stringList(data.qualifications),
    languages: stringList(data.languages),
    portraitFile: data.portraitFile ? String(data.portraitFile) : undefined,
    sourcePortraitFile: data.sourcePortraitFile ? String(data.sourcePortraitFile) : undefined,
    bookingUrl: data.bookingUrl ? String(data.bookingUrl) : undefined,
    sourceBookingUrl: data.sourceBookingUrl ? String(data.sourceBookingUrl) : undefined,
  };
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

export function readPractitionerSlots(html: string): PractitionerContent {
  const biography = inner(html, /<section\b[^>]*\bid="biography"[^>]*>[\s\S]*?<h2>[\s\S]*?<\/h2>\s*<p>([\s\S]*?)<\/p>/i);
  const highlights = listInner(html, /<ul class="practitioner-care-highlights">([\s\S]*?)<\/ul>/i);
  const interests = listInner(html, /<section\b[^>]*\bid="professional-interests"[^>]*>([\s\S]*?)<\/section>/i);
  const qualifications = inner(html, /<h2>Qualifications<\/h2>\s*<p>([\s\S]*?)<\/p>/i);
  const languages = inner(html, /<h2>Languages<\/h2>\s*<p>([\s\S]*?)<\/p>/i);
  return {
    biography,
    areasOfCare: highlights,
    professionalInterests: interests,
    qualifications: qualifications ? qualifications.split(",").map((item) => item.trim()).filter(Boolean) : [],
    languages: languages ? languages.split(",").map((item) => item.trim()).filter(Boolean) : [],
  };
}

export function readLede(html: string): string {
  return inner(html, /<p class="lede">([\s\S]*?)<\/p>/i);
}

export function readIntroduction(html: string): string {
  return inner(html, /<section\b[^>]*\bid="introduction"[^>]*>[\s\S]*?<h2>[\s\S]*?<\/h2>\s*<p>([\s\S]*?)<\/p>/i);
}

export function readUpdateSummary(html: string): string {
  return inner(html, /<p class="update-article-summary">([\s\S]*?)<\/p>/i);
}

export function readTitle(html: string): string {
  return inner(html, /<h1>([\s\S]*?)<\/h1>/i);
}

export function applyOverlay(html: string, input: OverlayInput): { html: string; errors: string[] } {
  const errors: string[] = [];
  let next = html;
  if (input.practitioner) {
    const applied = applyPractitioner(next, input.practitioner);
    next = applied.html;
    errors.push(...applied.errors);
  }
  if (input.service) {
    if (input.service.serviceDocument) {
      const applied = applyServiceDocument(next, input.service.serviceDocument, input.service.pagePath ?? "");
      next = applied.html;
      errors.push(...applied.errors);
    } else {
      next = applySummaryPage(next, input.service, false);
    }
  }
  if (input.practice) {
    if (input.practice.practiceDocument) {
      const applied = applyPracticeDocument(next, input.practice.practiceDocument);
      next = applied.html;
      errors.push(...applied.errors);
    } else {
      next = applySummaryPage(next, input.practice, false);
    }
  }
  if (input.article) {
    if (input.article.document) {
      const applied = applyArticleDocument(next, input.article.document, input.article.pagePath ?? "");
      next = applied.html;
      errors.push(...applied.errors);
    } else {
      next = applySummaryPage(next, input.article, true);
    }
  }
  if (input.update) next = applyUpdate(next, input.update);
  if (input.repeats) {
    for (const binding of input.repeats) next = applyRepeatBinding(next, binding);
  }
  if (input.clinic) {
    const applied = applyClinic(next, input.clinic);
    next = applied.html;
    errors.push(...applied.errors);
  }
  return { html: next, errors };
}

function applyPractitioner(html: string, content: PractitionerContent): { html: string; errors: string[] } {
  const errors: string[] = [];
  let next = html;
  if (content.name && content.sourceName && content.name !== content.sourceName) {
    next = replacePersonName(next, content.sourceName, content.name);
  }
  if (content.profileText !== false) {
    next = replaceTaggedText(
      next,
      /(<section\b[^>]*\bid="biography"[^>]*>[\s\S]*?<h2>[\s\S]*?<\/h2>\s*<p>)([\s\S]*?)(<\/p>)/i,
      content.biography,
    );
    next = replaceSectionList(next, /(<ul class="practitioner-care-highlights">)([\s\S]*?)(<\/ul>)/i, content.areasOfCare, "Areas of interest", errors);
    next = replaceSectionList(
      next,
      /(<section\b[^>]*\bid="professional-interests"[^>]*>)([\s\S]*?)(<\/section>)/i,
      content.professionalInterests,
      "Professional interests",
      errors,
    );
    if (content.qualifications.length > 0) {
      next = replaceTaggedText(next, /(<h2>Qualifications<\/h2>\s*<p>)([\s\S]*?)(<\/p>)/i, content.qualifications.join(", "));
    }
    if (content.languages.length > 0) {
      next = replaceTaggedText(next, /(<h2>Languages<\/h2>\s*<p>)([\s\S]*?)(<\/p>)/i, content.languages.join(", "));
    }
  }
  if (errors.length > 0) return { html, errors };
  const media = applyPractitionerMedia(next, content);
  return { html: media.html, errors: media.errors };
}

function applySummaryPage(html: string, content: TextContent, withIntroduction: boolean): string {
  let next = replaceTaggedText(html, /(<h1>)([\s\S]*?)(<\/h1>)/i, content.title);
  next = replaceTaggedText(next, /(<p class="lede">)([\s\S]*?)(<\/p>)/i, content.summary);
  if (withIntroduction && content.introduction) {
    next = replaceTaggedText(
      next,
      /(<section\b[^>]*\bid="introduction"[^>]*>[\s\S]*?<h2>[\s\S]*?<\/h2>\s*<p>)([\s\S]*?)(<\/p>)/i,
      content.introduction,
    );
  }
  return next;
}

function applyUpdate(html: string, content: TextContent): string {
  let next = replaceTaggedText(html, /(<h1>)([\s\S]*?)(<\/h1>)/i, content.title);
  next = replaceTaggedText(next, /(<p class="update-article-summary">)([\s\S]*?)(<\/p>)/i, content.summary);
  if (content.author && content.sourceAuthor && content.author !== content.sourceAuthor) {
    const current = decodeText(html.match(/<p class="update-author">([\s\S]*?)<\/p>/i)?.[1]?.trim() ?? "");
    const prefix = current.startsWith("By ") ? "By " : "";
    next = replaceTaggedText(next, /(<p class="update-author">)([\s\S]*?)(<\/p>)/i, `${prefix}${content.author}`);
  }
  return next;
}

function applyClinic(html: string, content: ClinicContent): { html: string; errors: string[] } {
  const errors: string[] = [];
  const golden = readGoldenContact(html);
  let next = html;
  if (golden.phoneDisplay && content.phoneDisplay !== golden.phoneDisplay) {
    next = next.split(golden.phoneDisplay).join(escapeVisible(content.phoneDisplay));
  }
  if (golden.phoneTel && content.phoneTel !== golden.phoneTel) {
    next = next.split(`tel:${golden.phoneTel}`).join(`tel:${content.phoneTel}`);
  }
  if (golden.email && content.email !== golden.email) {
    next = next.split(golden.email).join(escapeVisible(content.email));
  }
  const composedGolden = `${golden.streetAddress}, ${golden.suburb} ${golden.state} ${golden.postcode}`;
  const composedNext = `${content.streetAddress}, ${content.suburb} ${content.state} ${content.postcode}`;
  if (golden.streetAddress && composedGolden !== composedNext && next.includes(composedGolden)) {
    next = next.split(composedGolden).join(escapeVisible(composedNext));
  }
  if (golden.streetAddress && content.streetAddress !== golden.streetAddress) {
    next = next.split(golden.streetAddress).join(escapeVisible(content.streetAddress));
  }
  next = replaceJsonField(next, "streetAddress", golden.streetAddress, content.streetAddress);
  next = replaceJsonField(next, "addressLocality", golden.suburb, content.suburb);
  next = replaceJsonField(next, "addressRegion", golden.state, content.state);
  next = replaceJsonField(next, "postalCode", golden.postcode, content.postcode);
  const goldenMap = mapQuery(golden.streetAddress, golden.suburb, golden.state, golden.postcode);
  const nextMap = mapQuery(content.streetAddress, content.suburb, content.state, content.postcode);
  if (goldenMap && goldenMap !== nextMap && next.includes(goldenMap)) next = next.split(goldenMap).join(nextMap);

  const sharedHotdoc = readSharedHotdoc(html);
  if (content.hotdocUrl && sharedHotdoc && content.hotdocUrl !== sharedHotdoc) {
    const problems = bookingUrlProblems(content.hotdocUrl);
    if (problems.length > 0) errors.push(...problems);
    else next = next.split(sharedHotdoc).join(content.hotdocUrl);
  }
  if (golden.phoneDisplay && content.phoneDisplay !== golden.phoneDisplay) {
    const schemaTel = html.match(/"telephone":"([^"]*)"/)?.[1] ?? "";
    if (schemaTel) {
      next = next.split(`"telephone":${JSON.stringify(schemaTel)}`).join(`"telephone":${JSON.stringify(schemaTelephone(content.phoneDisplay))}`);
    }
  }

  const hours = footerHourLabels(next).map((label, index) => {
    const days = WEEKDAY_GROUPS[index] ?? [];
    const rows = days.map((day) => content.openingHours.find((hour) => hour.dayOfWeek === day));
    if (rows.some((row) => !row)) {
      errors.push(`Opening hours are missing for ${label}.`);
      return null;
    }
    const first = rows[0];
    if (!first || rows.some((row) => row && (row.opens !== first.opens || row.closes !== first.closes))) {
      errors.push(`${label} must share one opening and closing time because the page shows that group in a single line.`);
      return null;
    }
    return { label, time: `${formatClock(first.opens)}\u2013${formatClock(first.closes)}` };
  });
  if (errors.length === 0) {
    next = replaceHourBlock(next, /(<div\b[^>]*class="footer-hours"[^>]*>)([\s\S]*?)(<\/div>)/i, hours);
    next = replaceHourBlock(next, /(<div\b[^>]*class="contact-hours-detail"[^>]*>)([\s\S]*?)(<\/div>)/i, hours);
    next = applyHoursSchema(next, content.openingHours);
  }
  return { html: next, errors };
}

function replaceSectionList(
  html: string,
  pattern: RegExp,
  labels: readonly string[],
  name: string,
  errors: string[],
): string {
  if (labels.length === 0) return html;
  return html.replace(pattern, (match, open: string, inner: string, close: string) => {
    const replaced = replaceListLabels(inner, labels);
    if (replaced == null) {
      const count = listItemTexts(inner).length;
      errors.push(`${name} must keep ${count} item${count === 1 ? "" : "s"} so the page structure stays the same.`);
      return match;
    }
    return `${open}${replaced}${close}`;
  });
}

function replaceHourBlock(
  html: string,
  pattern: RegExp,
  hours: Array<{ label: string; time: string } | null>,
): string {
  return html.replace(pattern, (match, open: string, inner: string, close: string) => {
    let next = inner;
    hours.forEach((hour, index) => {
      if (!hour) return;
      const labels = footerHourLabels(inner);
      const label = labels[index];
      if (!label) return;
      const expression = new RegExp(`(<b>${escapeRegExp(label)}<\\/b>\\s*)([^<]+)`);
      next = next.replace(expression, `$1${hour.time}`);
    });
    return next === inner ? match : `${open}${next}${close}`;
  });
}

function footerHourLabels(html: string): string[] {
  const block = html.match(/<div\b[^>]*class="footer-hours"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? html;
  return [...block.matchAll(/<b>([^<]+)<\/b>/g)].map((match) => match[1]);
}

export function readGoldenContact(html: string): {
  phoneDisplay: string;
  phoneTel: string;
  email: string;
  streetAddress: string;
  suburb: string;
  state: string;
  postcode: string;
} {
  const phoneTag = html.match(/<a\b[^>]*class="header-phone"[^>]*>[\s\S]*?<\/a>/i)?.[0] ?? "";
  return {
    phoneDisplay: decodeText(phoneTag.match(/>([^<]+)<\/a>/)?.[1]?.trim() ?? ""),
    phoneTel: phoneTag.match(/href="tel:([^"]+)"/)?.[1] ?? "",
    email: html.match(/href="mailto:([^"]+)"/i)?.[1] ?? "",
    streetAddress: html.match(/"streetAddress":"([^"]*)"/)?.[1] ?? "",
    suburb: html.match(/"addressLocality":"([^"]*)"/)?.[1] ?? "",
    state: html.match(/"addressRegion":"([^"]*)"/)?.[1] ?? "",
    postcode: html.match(/"postalCode":"([^"]*)"/)?.[1] ?? "",
  };
}

export function readSharedHotdoc(html: string): string {
  const header = html.match(/<div class="header-cta">[\s\S]*?<\/div>/i)?.[0] ?? "";
  return header.match(/href="(https:\/\/www\.hotdoc\.com\.au[^"]+)"/i)?.[1] ?? "";
}

export function readUpdateAuthor(html: string): string {
  const byline = decodeText(html.match(/<p class="update-author">([\s\S]*?)<\/p>/i)?.[1]?.trim() ?? "");
  return byline.replace(/^By\s+/, "");
}

export function schemaTelephone(display: string): string {
  const digits = phoneToTel(display).replace(/\D/g, "");
  if (digits.startsWith("61") && digits.length >= 10) {
    const national = digits.slice(2);
    return `+61 ${national.slice(0, 1)} ${national.slice(1, 5)} ${national.slice(5)}`.trim();
  }
  return phoneToTel(display);
}

export function repeatFromPayload(value: unknown, fallbackPath = ""): RepeatBinding | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const nested = data.document && typeof data.document === "object" && !Array.isArray(data.document)
    ? (data.document as Record<string, unknown>)
    : data;
  const title = String(nested.title ?? data.title ?? "");
  const summary = String(nested.summary ?? data.summary ?? "");
  const sourceTitle = String(data.sourceTitle ?? "");
  const sourceSummary = String(data.sourceSummary ?? "");
  const author = String(data.author ?? "");
  const sourceAuthor = String(data.sourceAuthor ?? "");
  const pagePath = String(data.pagePath ?? fallbackPath);
  if (!pagePath || !sourceTitle) return null;
  if (sourceTitle === title && sourceSummary === summary && sourceAuthor === author) return null;
  return {
    pagePath,
    title,
    sourceTitle,
    summary,
    sourceSummary,
    author,
    sourceAuthor,
    topicPage: data.topicPage === true,
  };
}

export function applyRepeatBinding(html: string, binding: RepeatBinding): string {
  if (!binding.pagePath || !binding.sourceTitle) return html;
  if (ownsPage(html, binding.pagePath)) {
    let next = replaceExactTextNodes(html, binding.sourceTitle, binding.title);
    next = replaceExactTextNodes(next, binding.sourceSummary, binding.summary);
    if (binding.topicPage && binding.sourceTitle !== binding.title) {
      next = replaceExactTextNodes(
        next,
        `Healthcare Knowledge Centre · ${binding.sourceTitle}`,
        `Healthcare Knowledge Centre · ${binding.title}`,
      );
    }
    next = replaceAuthorByline(next, binding);
    return replaceSchemaName(next, binding.pagePath, binding.sourceTitle, binding.title);
  }
  let next = html.replace(/<article\b[^>]*>[\s\S]*?<\/article>/gi, (article) =>
    referencesPath(article, binding.pagePath) ? replaceBindingText(article, binding) : article,
  );
  next = next.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, (anchor) =>
    referencesPath(anchor, binding.pagePath) ? replaceBindingText(anchor, binding) : anchor,
  );
  return replaceSchemaName(next, binding.pagePath, binding.sourceTitle, binding.title);
}

export function applyReceptionIndex(source: string, bindings: readonly RepeatBinding[]): string {
  const marker = "window.WMC_DIGITAL_RECEPTION_INDEX = ";
  const start = source.indexOf(marker);
  if (start < 0 || bindings.length === 0) return source;
  const jsonStart = start + marker.length;
  const jsonEnd = source.lastIndexOf(";");
  if (jsonEnd <= jsonStart) return source;
  let items: Array<Record<string, unknown>>;
  try {
    items = JSON.parse(source.slice(jsonStart, jsonEnd)) as Array<Record<string, unknown>>;
  } catch {
    return source;
  }
  let changed = false;
  for (const item of items) {
    const url = String(item.url ?? "");
    for (const binding of bindings) {
      if (!hrefMatches(url, binding.pagePath)) continue;
      if (binding.sourceTitle !== binding.title) {
        if (item.title === binding.sourceTitle) {
          item.title = binding.title;
          changed = true;
        }
        if (item.h1 === binding.sourceTitle) {
          item.h1 = binding.title;
          changed = true;
        }
        if (typeof item.text === "string" && item.text.includes(binding.sourceTitle)) {
          item.text = item.text.split(binding.sourceTitle).join(binding.title);
          changed = true;
        }
      }
      if (binding.sourceSummary && binding.sourceSummary !== binding.summary && item.description === binding.sourceSummary) {
        item.description = binding.summary;
        changed = true;
      }
    }
  }
  if (!changed) return source;
  return `${source.slice(0, jsonStart)}${JSON.stringify(items)}${source.slice(jsonEnd)}`;
}

function replaceBindingText(fragment: string, binding: RepeatBinding): string {
  let next = replaceExactTextNodes(fragment, binding.sourceTitle, binding.title);
  next = replaceExactTextNodes(next, binding.sourceSummary, binding.summary);
  return replaceAuthorByline(next, binding);
}

function replaceAuthorByline(html: string, binding: RepeatBinding): string {
  if (!binding.sourceAuthor || binding.sourceAuthor === binding.author) return html;
  const source = binding.sourceAuthor.startsWith("By ") ? binding.sourceAuthor : `By ${binding.sourceAuthor}`;
  const next = binding.author.startsWith("By ") ? binding.author : `By ${binding.author}`;
  return replaceExactTextNodes(html, source, next);
}

export function replaceExactTextNodes(html: string, source: string, next: string): string {
  if (!source || source === next) return html;
  const encoded = escapeText(next);
  return html.replace(/>([^<]+)</g, (match, text: string) => {
    if (decodeText(text).trim() !== source) return match;
    const leading = text.match(/^\s*/)?.[0] ?? "";
    const trailing = text.match(/\s*$/)?.[0] ?? "";
    return `>${leading}${encoded}${trailing}<`;
  });
}

function replacePersonName(html: string, source: string, next: string): string {
  let out = replaceExactTextNodes(html, source, next);
  out = out.replace(/(\s(?:alt|aria-label|data-photo-fallback)=")([^"]*)(")/gi, (_match, open: string, value: string, close: string) => {
    const decoded = decodeText(value);
    if (!decoded.includes(source)) return `${open}${value}${close}`;
    return `${open}${escapeText(decoded.split(source).join(next))}${close}`;
  });
  const from = `"name":${JSON.stringify(source)}`;
  const to = `"name":${JSON.stringify(next)}`;
  return out.replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, (block) =>
    block.includes(from) ? block.split(from).join(to) : block,
  );
}

function replaceSchemaName(html: string, pagePath: string, source: string, next: string): string {
  if (!source || source === next) return html;
  const from = `"name":${JSON.stringify(source)}`;
  const to = `"name":${JSON.stringify(next)}`;
  return html.replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, (block) => {
    if (!block.includes(from) || !block.includes(pagePath)) return block;
    return block.split(from).join(to);
  });
}

function replaceJsonField(html: string, key: string, source: string, next: string): string {
  if (!source || source === next) return html;
  const from = `"${key}":${JSON.stringify(source)}`;
  const to = `"${key}":${JSON.stringify(next)}`;
  return html.split(from).join(to);
}

function mapQuery(street: string, suburb: string, state: string, postcode: string): string {
  return [street, suburb, state, postcode].filter(Boolean).join(" ").replace(/ /g, "+");
}

function applyHoursSchema(html: string, rows: readonly HourRow[]): string {
  const groups = [
    { token: '["Monday","Tuesday","Wednesday","Thursday"]', days: ["monday", "tuesday", "wednesday", "thursday"] },
    { token: '"Friday"', days: ["friday"] },
    { token: '"Saturday"', days: ["saturday"] },
    { token: '"Sunday"', days: ["sunday"] },
  ];
  let next = html;
  for (const group of groups) {
    const first = rows.find((row) => row.dayOfWeek === group.days[0]);
    if (!first || group.days.some((day) => {
      const row = rows.find((item) => item.dayOfWeek === day);
      return !row || row.opens !== first.opens || row.closes !== first.closes;
    })) {
      continue;
    }
    const pattern = new RegExp(
      `("dayOfWeek":${escapeRegExp(group.token)},"opens":")\\d{2}:\\d{2}(","closes":")\\d{2}:\\d{2}(")`,
    );
    next = next.replace(pattern, `$1${schemaClock(first.opens)}$2${schemaClock(first.closes)}$3`);
  }
  return next;
}

function schemaClock(value: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return value;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function ownsPage(html: string, pagePath: string): boolean {
  const canonical = new RegExp(`<link\\b[^>]*href="[^"]*/${escapeRegExp(pagePath)}"[^>]*rel="canonical"`, "i");
  const reversed = new RegExp(`<link\\b[^>]*rel="canonical"[^>]*href="[^"]*/${escapeRegExp(pagePath)}"`, "i");
  return canonical.test(html) || reversed.test(html);
}

function referencesPath(fragment: string, pagePath: string): boolean {
  return [...fragment.matchAll(/href="([^"]+)"/gi)].some((match) => hrefMatches(match[1], pagePath));
}

function hrefMatches(href: string, pagePath: string): boolean {
  const file = pagePath.split("/").pop() ?? pagePath;
  const base = href.split(/[?#]/)[0]?.split("/").pop() ?? "";
  if (base !== file) return false;
  if (file === "index.html") return href.split(/[?#]/)[0].endsWith(pagePath);
  return true;
}

export function formatClock(value: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return value;
  let hour = Number(match[1]);
  const minute = match[2];
  const suffix = hour >= 12 ? "PM" : "AM";
  hour %= 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${suffix}`;
}

export function phoneToTel(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (digits.startsWith("0")) return `+61${digits.slice(1)}`;
  if (digits.startsWith("61")) return `+${digits}`;
  return digits ? `+${digits}` : display;
}

function inner(html: string, pattern: RegExp): string {
  const match = html.match(pattern);
  return match?.[1] ? decodeText(match[1].trim()) : "";
}

function listInner(html: string, pattern: RegExp): string[] {
  const match = html.match(pattern);
  return match?.[1] ? listItemTexts(match[1]) : [];
}

function escapeVisible(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
