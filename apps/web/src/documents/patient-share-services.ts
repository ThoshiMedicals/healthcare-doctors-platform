/**
 * Phase 3D Agent 2 — services / knowledge share mounts.
 */

import {
  ensurePatientShareRuntime,
  normalisePagePath,
  patientShareButtonHtml,
  resolveCanonicalShareUrl,
  resolveShareTitle,
} from "@/documents/patient-share-core";

const SERVICES_SHARE_ROOT = "services";
const KNOWLEDGE_SHARE_ROOT = "knowledge";

/** Hub + all pages under `services/` (conservative — no unrelated care-area slugs). */
export function isServicesPagePath(pagePath: string): boolean {
  const path = normalisePagePath(pagePath);
  if (path === "services.html") return true;
  return /^services\/.+\.html$/i.test(path);
}

/** `knowledge/index.html` and any nested `knowledge/**` HTML topic or article page. */
export function isKnowledgePagePath(pagePath: string): boolean {
  const path = normalisePagePath(pagePath);
  if (path === "knowledge/index.html") return true;
  return /^knowledge\/.+\.html$/i.test(path);
}

function shareRootForPath(pagePath: string): typeof SERVICES_SHARE_ROOT | typeof KNOWLEDGE_SHARE_ROOT | null {
  const path = normalisePagePath(pagePath);
  if (isServicesPagePath(path)) return SERVICES_SHARE_ROOT;
  if (isKnowledgePagePath(path)) return KNOWLEDGE_SHARE_ROOT;
  return null;
}

function alreadyMounted(html: string, shareRoot: string): boolean {
  return new RegExp(`data-wmc-share-root=["']${shareRoot}["']`, "i").test(html);
}

function injectToolbarAfterHeroH1(html: string, toolbar: string): string {
  const heroBlock = html.match(
    /<section\b[^>]*\bpage-hero\b[^>]*>[\s\S]*?<h1\b[^>]*>[\s\S]*?<\/h1>/i,
  );
  if (heroBlock?.[0]) {
    return html.replace(heroBlock[0], `${heroBlock[0]}${toolbar}`);
  }
  const mainH1 = html.match(/<main\b[^>]*>[\s\S]*?<h1\b[^>]*>[\s\S]*?<\/h1>/i);
  if (mainH1?.[0]) {
    return html.replace(mainH1[0], `${mainH1[0]}${toolbar}`);
  }
  const anyH1 = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/i);
  if (anyH1?.[0]) {
    return html.replace(anyH1[0], `${anyH1[0]}${toolbar}`);
  }
  return html;
}

function injectBeforeBreadcrumb(html: string, toolbar: string): string {
  const pattern = /(<div class="breadcrumb-bar")/i;
  if (!pattern.test(html)) return html;
  return html.replace(pattern, `${toolbar}$1`);
}

function injectSurfaceShare(
  html: string,
  pagePath: string,
  shareRoot: typeof SERVICES_SHARE_ROOT | typeof KNOWLEDGE_SHARE_ROOT,
): string {
  if (alreadyMounted(html, shareRoot)) return html;

  const url = resolveCanonicalShareUrl(html, pagePath);
  const isKnowledge = shareRoot === KNOWLEDGE_SHARE_ROOT;
  const title = resolveShareTitle(
    html,
    isKnowledge ? "Health advice | Woolloongabba Medical Centre" : "Healthcare services | Woolloongabba Medical Centre",
  );
  const share = patientShareButtonHtml({
    url,
    title,
    surface: shareRoot,
    label: isKnowledge ? "Share article" : "Share this page",
  });
  const toolbar = `<div class="wmc-patient-share--toolbar">${share}</div>`;

  let next = injectToolbarAfterHeroH1(html, toolbar);
  if (next === html) {
    next = injectBeforeBreadcrumb(html, toolbar);
  }
  if (next === html) return html;
  return alreadyMounted(next, shareRoot) ? next : html;
}

/** Mount share controls on services hub, service authority pages, and knowledge centre articles. */
export function injectPatientShareServices(html: string, pagePath: string): string {
  const shareRoot = shareRootForPath(pagePath);
  if (!shareRoot) return html;

  let next = html;
  if (!alreadyMounted(html, shareRoot)) {
    next = injectSurfaceShare(html, normalisePagePath(pagePath), shareRoot);
  }

  if (!alreadyMounted(next, shareRoot)) {
    return html;
  }

  return ensurePatientShareRuntime(next);
}
