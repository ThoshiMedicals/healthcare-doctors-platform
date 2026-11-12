/**
 * Phase 3D — shared patient share primitives (Web Share + copy-link).
 * Agents mount buttons via surface injectors; runtime lives in public/patient-share.js.
 */

import { escapeHtmlAttr } from "@/clinics/branding";

export const PATIENT_SHARE_CANONICAL_ORIGIN = "https://gabbamedicalcentre.com.au";

export const PATIENT_SHARE_STYLE_ID = "wmc-patient-share";
export const PATIENT_SHARE_SCRIPT_VERSION = "wmc-patient-share-20261112a";
export const PATIENT_SHARE_SCRIPT_HREF = `/wmc-cache/patient-share.js?v=${PATIENT_SHARE_SCRIPT_VERSION}`;
export const PATIENT_SHARE_LIVE_ID = "wmc-patient-share-live";

export type PatientSharePayload = {
  /** Absolute canonical URL to share */
  url: string;
  /** Short share title (often document/og title) */
  title: string;
  /** Optional share text — no PII, no invented clinic facts */
  text?: string;
  /** Surface key for analytics-free diagnostics only (data attribute) */
  surface: string;
  /** Accessible button name override */
  label?: string;
};

const PATIENT_SHARE_STYLE = `<style id="${PATIENT_SHARE_STYLE_ID}">
.wmc-patient-share{display:inline-flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0}
.wmc-patient-share__btn{
  appearance:none;cursor:pointer;min-height:44px;min-width:44px;padding:10px 14px;
  border:1px solid rgba(15,45,60,.22);border-radius:10px;background:#fff;color:inherit;
  font:inherit;font-weight:600;line-height:1.2
}
.wmc-patient-share__btn:focus-visible{outline:2px solid #0b5cab;outline-offset:2px}
.wmc-patient-share__btn[aria-busy="true"]{opacity:.72}
.doctor-profile-actions .wmc-patient-share{margin-left:0}
.wmc-patient-share--toolbar{margin:12px 0 0}
.wmc-patient-share-live{
  position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
  clip:rect(0,0,0,0);white-space:nowrap;border:0
}
</style>`;

/** Normalise CMS pagePath to a site-relative path without leading slash. */
export function normalisePagePath(pagePath: string): string {
  return String(pagePath || "")
    .replace(/^\//, "")
    .replace(/\\/g, "/")
    .split("?")[0]
    .split("#")[0];
}

/**
 * Prefer `<link rel="canonical">` href; else build production URL from pagePath.
 * Never invent alternate hosts or query tracking params.
 */
export function resolveCanonicalShareUrl(html: string, pagePath: string): string {
  const canonical = html.match(
    /<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i,
  ) || html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
  if (canonical?.[1]) {
    try {
      const u = new URL(canonical[1], PATIENT_SHARE_CANONICAL_ORIGIN);
      if (u.hostname === "gabbamedicalcentre.com.au" || u.hostname === "www.gabbamedicalcentre.com.au") {
        u.hash = "";
        u.search = "";
        return u.toString().replace(/\/$/, "") === PATIENT_SHARE_CANONICAL_ORIGIN
          ? `${PATIENT_SHARE_CANONICAL_ORIGIN}/`
          : u.toString();
      }
    } catch {
      /* fall through */
    }
  }
  const path = normalisePagePath(pagePath);
  if (!path || path === "index.html") return `${PATIENT_SHARE_CANONICAL_ORIGIN}/`;
  return `${PATIENT_SHARE_CANONICAL_ORIGIN}/${path}`;
}

/** Best-effort share title from og:title or <title>. */
export function resolveShareTitle(html: string, fallback: string): string {
  const og = html.match(/<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    || html.match(/<meta\b[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["'][^>]*>/i);
  if (og?.[1]?.trim()) return og[1].trim();
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (title?.[1]?.trim()) return title[1].trim();
  return fallback;
}

export function patientShareButtonHtml(payload: PatientSharePayload): string {
  const label = payload.label || "Share";
  const textAttr = payload.text ? ` data-share-text="${escapeHtmlAttr(payload.text)}"` : "";
  return (
    `<span class="wmc-patient-share" data-wmc-share-root="${escapeHtmlAttr(payload.surface)}">` +
    `<button type="button" class="wmc-patient-share__btn" data-wmc-share` +
    ` data-share-url="${escapeHtmlAttr(payload.url)}"` +
    ` data-share-title="${escapeHtmlAttr(payload.title)}"` +
    ` data-share-surface="${escapeHtmlAttr(payload.surface)}"` +
    `${textAttr}` +
    ` aria-label="${escapeHtmlAttr(label)}">` +
    `${escapeHtmlAttr(label)}` +
    `</button></span>`
  );
}

export function patientShareLiveRegionHtml(): string {
  return (
    `<p id="${PATIENT_SHARE_LIVE_ID}" class="wmc-patient-share-live" role="status" aria-live="polite" aria-atomic="true"></p>`
  );
}

/** Idempotent: style + live region + deferred share script. */
export function ensurePatientShareRuntime(html: string): string {
  let next = html;
  if (!new RegExp(`<style\\b[^>]*id="${PATIENT_SHARE_STYLE_ID}"`, "i").test(next)) {
    next = next.replace(/<\/head>/i, `${PATIENT_SHARE_STYLE}</head>`);
  }
  if (!new RegExp(`id="${PATIENT_SHARE_LIVE_ID}"`, "i").test(next)) {
    if (/<\/body>/i.test(next)) {
      next = next.replace(/<\/body>/i, `${patientShareLiveRegionHtml()}</body>`);
    } else {
      next += patientShareLiveRegionHtml();
    }
  }
  const scriptTag =
    `<script defer src="${PATIENT_SHARE_SCRIPT_HREF}" data-wmc-patient-share-runtime="1"></script>`;
  if (!/data-wmc-patient-share-runtime=["']1["']/i.test(next)) {
    if (/<\/body>/i.test(next)) {
      next = next.replace(/<\/body>/i, `${scriptTag}</body>`);
    } else {
      next += scriptTag;
    }
  }
  return next;
}
