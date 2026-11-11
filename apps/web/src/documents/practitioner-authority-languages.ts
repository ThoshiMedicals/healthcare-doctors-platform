/**
 * Owner-approved practitioner language fills applied at public render time.
 * Does not invent clinical interests, qualifications, or portraits.
 */

/** Phase 2 owner-provided languages (verified before publication). */
export const APPROVED_PRACTITIONER_LANGUAGES: Readonly<Record<string, readonly string[]>> = {
  "dr-mary-abadir": ["English", "Russian"],
  "dr-nirupa-sivathasan": ["English"],
  "mr-samuel-stafford": ["English"],
};

const LANGUAGE_PLACEHOLDER_SOURCE =
  "No practitioner-specific languages are listed in the current verified public profile.";

function isLanguagePlaceholder(value: string): boolean {
  return new RegExp(LANGUAGE_PLACEHOLDER_SOURCE.replace(/\./g, "\\."), "i").test(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatLanguageList(languages: readonly string[]): string {
  if (languages.length === 1) return languages[0];
  if (languages.length === 2) return `${languages[0]} and ${languages[1]}`;
  return `${languages.slice(0, -1).join(", ")}, and ${languages[languages.length - 1]}`;
}

function slugFromDoctorPath(pagePath: string): string | null {
  const normalized = pagePath.replace(/^\/+/, "").replace(/\\/g, "/");
  const m = normalized.match(/^doctors\/([^/]+)\.html$/i);
  return m ? m[1] : null;
}

function enrichPersonKnowsLanguage(
  node: Record<string, unknown>,
  languages: readonly string[],
): Record<string, unknown> {
  const type = node["@type"];
  const types = Array.isArray(type) ? type.map(String) : [String(type ?? "")];
  if (!types.includes("Person")) return node;

  const existing = node.knowsLanguage;
  const hasUseful =
    (typeof existing === "string" && existing.trim().length > 0 && !isLanguagePlaceholder(existing)) ||
    (Array.isArray(existing) &&
      existing.some(
        (entry) => typeof entry === "string" && entry.trim() && !isLanguagePlaceholder(entry),
      ));

  if (hasUseful) return node;
  return { ...node, knowsLanguage: [...languages] };
}

function enrichFaqLanguageAnswers(
  node: Record<string, unknown>,
  languages: readonly string[],
): Record<string, unknown> {
  const type = node["@type"];
  const types = Array.isArray(type) ? type.map(String) : [String(type ?? "")];
  if (!types.includes("FAQPage")) return node;

  const label = formatLanguageList(languages);
  const mainEntity = node.mainEntity;
  if (!Array.isArray(mainEntity)) return node;

  const nextEntities = mainEntity.map((entry) => {
    if (!entry || typeof entry !== "object") return entry;
    const q = entry as Record<string, unknown>;
    const name = typeof q.name === "string" ? q.name : "";
    if (!/languages?/i.test(name)) return entry;
    const answer = q.acceptedAnswer;
    if (!answer || typeof answer !== "object") return entry;
    const accepted = answer as Record<string, unknown>;
    const text = typeof accepted.text === "string" ? accepted.text : "";
    if (text.trim() && !isLanguagePlaceholder(text)) return entry;
    return {
      ...q,
      acceptedAnswer: { ...accepted, text: label },
    };
  });

  return { ...node, mainEntity: nextEntities };
}

function enrichJsonLdLanguages(html: string, languages: readonly string[]): string {
  return html.replace(
    /<script\b([^>]*\btype=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi,
    (full, attrs: string, raw: string) => {
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown> | { "@graph"?: unknown[] };
        const enrichNode = (node: Record<string, unknown>) =>
          enrichFaqLanguageAnswers(enrichPersonKnowsLanguage(node, languages), languages);

        if (parsed && Array.isArray((parsed as { "@graph"?: unknown[] })["@graph"])) {
          const graph = (parsed as { "@graph": unknown[] })["@graph"].map((node) =>
            node && typeof node === "object" ? enrichNode(node as Record<string, unknown>) : node,
          );
          return `<script${attrs}>${JSON.stringify({ ...(parsed as object), "@graph": graph })}</script>`;
        }
        if (parsed && typeof parsed === "object") {
          return `<script${attrs}>${JSON.stringify(enrichNode(parsed as Record<string, unknown>))}</script>`;
        }
      } catch {
        return full;
      }
      return full;
    },
  );
}

/**
 * Replace placeholder language copy + schema for owner-approved practitioner languages.
 * Idempotent when the approved language string is already present.
 */
export function applyApprovedPractitionerLanguages(html: string, pagePath: string): string {
  const slug = slugFromDoctorPath(pagePath);
  if (!slug) return html;
  const languages = APPROVED_PRACTITIONER_LANGUAGES[slug];
  if (!languages?.length) return html;

  const label = formatLanguageList(languages);
  const escaped = escapeHtml(label);
  let next = html;

  // Visible credentials block.
  next = next.replace(
    /(id="credentials"[\s\S]*?<h2>Languages<\/h2>\s*<p>)([\s\S]*?)(<\/p>)/i,
    (full, open: string, body: string, close: string) => {
      if (isLanguagePlaceholder(body) || !body.trim()) {
        return `${open}${escaped}${close}`;
      }
      // Already filled with something other than the placeholder — leave alone.
      return full;
    },
  );

  // Visible FAQ details.
  next = next.replace(
    /(<details>\s*<summary>What languages does [^<]+<\/summary>\s*<p>)([\s\S]*?)(<\/p>\s*<\/details>)/gi,
    (full, open: string, body: string, close: string) => {
      if (isLanguagePlaceholder(body) || !body.trim()) {
        return `${open}${escaped}${close}`;
      }
      return full;
    },
  );

  next = enrichJsonLdLanguages(next, languages);
  return next;
}
