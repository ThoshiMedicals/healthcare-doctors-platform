import { pageRegions } from "@/regression/regions";

export type PublishComparison = {
  ok: boolean;
  reasons: string[];
};

/**
 * Compares the page that is live now with the page that would go live.
 * Navigation, accessibility hooks, and the tag structure must match.
 * Text values inside the approved content slots may change.
 */
export function comparePublishedPages(currentHtml: string, nextHtml: string): PublishComparison {
  const reasons: string[] = [];
  const current = pageRegions(currentHtml);
  const next = pageRegions(nextHtml);

  if (current.navigation !== next.navigation) reasons.push("Navigation changed.");
  if (current.skipLink !== next.skipLink) reasons.push("The skip link changed.");
  if (current.mainOpen !== next.mainOpen) reasons.push("The main landmark changed.");
  if (bookingWorkflow(current.appointmentActions) !== bookingWorkflow(next.appointmentActions)) {
    reasons.push("The appointment actions changed.");
  }
  if (JSON.stringify(current.digitalReceptionScripts) !== JSON.stringify(next.digitalReceptionScripts)) {
    reasons.push("Digital Reception changed.");
  }
  if (layoutSignature(current.header ?? "") !== layoutSignature(next.header ?? "")) reasons.push("The header layout changed.");
  if (layoutSignature(current.footer ?? "") !== layoutSignature(next.footer ?? "")) reasons.push("The footer layout changed.");
  if (JSON.stringify(schemaShape(current.schema)) !== JSON.stringify(schemaShape(next.schema))) {
    reasons.push("Schema structure changed.");
  }
  if (tagSignature(currentHtml) !== tagSignature(nextHtml)) reasons.push("Page structure changed.");

  return { ok: reasons.length === 0, reasons };
}

/** HotDoc addresses are published content. The lightbox attributes and labels stay in the comparison. */
function bookingWorkflow(fragment: string | null): string | null {
  if (!fragment) return fragment;
  return fragment
    .replace(/href="https:\/\/www\.hotdoc\.com\.au[^"]*"/gi, 'href="https://www.hotdoc.com.au/"')
    .replace(/href="tel:[^"]*"/gi, 'href="tel:"')
    .replace(/\s(?:alt|aria-label|data-photo-fallback)="[^"]*"/gi, "")
    .replace(/>([^<]*)</g, "><");
}

export function layoutSignature(fragment: string): string {
  return fragment
    .replace(/href="tel:[^"]*"/gi, 'href="tel:"')
    .replace(/href="mailto:[^"]*"/gi, 'href="mailto:"')
    .replace(/href="https:\/\/www\.hotdoc\.com\.au[^"]*"/gi, 'href="https://www.hotdoc.com.au/"')
    .replace(/href="https:\/\/www\.google\.com\/maps[^"]*"/gi, 'href="https://www.google.com/maps"')
    .replace(/\s(?:alt|aria-label|data-photo-fallback)="[^"]*"/gi, "")
    .replace(/>([^<]*)</g, "><");
}

export function tagSignature(html: string): string {
  return [...html.matchAll(/<([a-z0-9]+)([^>]*)>/gi)]
    .map((match) => {
      const id = /(?:^|\s)id="([^"]*)"/i.exec(match[2])?.[1] ?? "";
      const className = /(?:^|\s)class="([^"]*)"/i.exec(match[2])?.[1] ?? "";
      return `${match[1].toLowerCase()}#${id}.${className}`;
    })
    .join("\n");
}

function schemaShape(blocks: readonly string[]): unknown[] {
  return blocks.map((block) => {
    const json = block.match(/>([\s\S]*?)<\/script>/i)?.[1] ?? "";
    try {
      return shape(JSON.parse(json));
    } catch {
      return "invalid-json";
    }
  });
}

function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, shape((value as Record<string, unknown>)[key])]),
    );
  }
  return typeof value;
}
