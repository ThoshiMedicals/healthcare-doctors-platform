import { publicPageName } from "@/cms/staff-labels";

export type ImageUse = {
  assetPath: string;
  pagePath: string;
  alt: string;
};

const SKIP_SCHEME = /^(?:data|blob|javascript):/i;

export function normalizeAssetPath(value: string): string {
  const raw = value.trim();
  if (!raw || SKIP_SCHEME.test(raw)) return "";
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      if (url.hostname === "gabbamedicalcentre.com.au" || url.hostname === "www.gabbamedicalcentre.com.au") {
        return cleanPath(url.pathname);
      }
      return url.toString();
    } catch {
      return "";
    }
  }
  return cleanPath(raw);
}

function cleanPath(value: string): string {
  const withoutQuery = value.split(/[?#]/)[0] ?? "";
  const parts: string[] = [];
  for (const part of withoutQuery.split(/[\\/]/)) {
    if (!part || part === ".") continue;
    if (part === "..") {
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  return parts.join("/");
}

function decodeText(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function attribute(tag: string, name: string): string {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
  return decodeText(match?.[1] ?? match?.[2] ?? "");
}

function srcsetUrls(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0] ?? "")
    .filter(Boolean);
}

export function imageUsesFromHtml(html: string, pagePath: string): ImageUse[] {
  const uses: ImageUse[] = [];
  const push = (raw: string, alt = "") => {
    const assetPath = normalizeAssetPath(raw);
    if (!assetPath) return;
    uses.push({ assetPath, pagePath, alt: alt.trim() });
  };

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    const alt = attribute(tag, "alt");
    push(attribute(tag, "src"), alt);
    for (const url of srcsetUrls(attribute(tag, "srcset"))) push(url, alt);
  }
  const socialImages: string[] = [];
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if (attribute(tag, "property").toLowerCase() !== "og:image") continue;
    const content = attribute(tag, "content");
    socialImages.push(normalizeAssetPath(content));
    push(content);
  }
  const socialAlt = html.match(/property="og:image:alt"\s+content="([^"]*)"|content="([^"]*)"\s+property="og:image:alt"/i);
  const ogAlt = decodeText(socialAlt?.[1] ?? socialAlt?.[2] ?? "");
  if (ogAlt) {
    for (const use of uses) {
      if (!use.alt && socialImages.includes(use.assetPath)) use.alt = ogAlt;
    }
  }
  for (const match of html.matchAll(/"(logo|image)"\s*:\s*"(https?:[^"]+)"/gi)) push(match[2] ?? "");
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (attribute(tag, "rel").toLowerCase() !== "apple-touch-icon") continue;
    push(attribute(tag, "href"));
  }
  return uses;
}

export function imageTitle(assetPath: string): string {
  const file = assetLabel(assetPath)
    .replace(/\.(png|jpe?g|gif|avif)$/i, "")
    .replace(/_/g, "-");
  return publicPageName(file);
}

export function assetLabel(assetPath: string): string {
  if (/^https?:\/\//i.test(assetPath)) {
    try {
      return new URL(assetPath).pathname.split("/").pop() || assetPath;
    } catch {
      return assetPath;
    }
  }
  return assetPath.split("/").pop() || assetPath;
}

export function assetKind(assetPath: string): string {
  if (/^https?:\/\//i.test(assetPath)) return "External image";
  if (assetPath.includes("/team/")) return "Practitioner portrait";
  if (assetPath.includes("/brand/")) return "Brand";
  return "Content image";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function recordDate(value: Date | null | undefined): string {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export function displayRecordDate(value: Date | null | undefined): string {
  const iso = recordDate(value);
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
}

export function recordDateStatus(value: Date | null | undefined, today = new Date()): "none" | "expired" | "current" {
  const iso = recordDate(value);
  if (!iso) return "none";
  const current = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Brisbane" }).format(today);
  return iso < current ? "expired" : "current";
}

export function imageGovernanceSnapshot(row: {
  uploadedBy: string | null;
  approvedAt: Date | null;
  photographer: string | null;
  copyrightOwner: string | null;
  expiresAt: Date | null;
  altText: string;
  usage: string[];
  reviewedBy: string | null;
  evidenceReference: string | null;
  contentSha256: string | null;
}) {
  return {
    uploadedBy: row.uploadedBy,
    approvedAt: recordDate(row.approvedAt) || null,
    photographer: row.photographer,
    copyrightOwner: row.copyrightOwner,
    expiresAt: recordDate(row.expiresAt) || null,
    altText: row.altText,
    usage: row.usage,
    reviewedBy: row.reviewedBy,
    evidenceReference: row.evidenceReference,
    contentSha256: row.contentSha256,
  };
}
