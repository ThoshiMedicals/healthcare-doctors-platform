/**
 * Phase 3D Agent 1 — practitioner / team / preferred-GP share mounts.
 */

import { PREFERRED_GP_STORAGE_KEY } from "@/documents/patient-preferred-gp";
import {
  PATIENT_SHARE_CANONICAL_ORIGIN,
  ensurePatientShareRuntime,
  normalisePagePath,
  patientShareButtonHtml,
  resolveCanonicalShareUrl,
  resolveShareTitle,
} from "@/documents/patient-share-core";

const PRACTITIONER_SHARE_ROOT = "practitioner";
const TEAM_SHARE_ROOT = "team";
const PREFERRED_GP_SHARE_ROOT = "preferred-gp";
const PREFERRED_GP_SHARE_SYNC_SCRIPT_ID = "wmc-preferred-gp-share-sync";

export function isDoctorProfilePagePath(pagePath: string): boolean {
  return /^doctors\/.+\.html$/i.test(normalisePagePath(pagePath));
}

export function isTeamListingPagePath(pagePath: string): boolean {
  const path = normalisePagePath(pagePath);
  if (isDoctorProfilePagePath(path)) return false;
  return path === "team.html" || /^team-.+\.html$/i.test(path);
}

export function isPatientHubPagePath(pagePath: string): boolean {
  return normalisePagePath(pagePath) === "patient-hub.html";
}

function alreadyMounted(html: string, shareRoot: string): boolean {
  return new RegExp(`data-wmc-share-root=["']${shareRoot}["']`, "i").test(html);
}

function injectDoctorProfileShare(html: string, pagePath: string): string {
  if (alreadyMounted(html, PRACTITIONER_SHARE_ROOT)) return html;

  const url = resolveCanonicalShareUrl(html, pagePath);
  const title = resolveShareTitle(html, "Practitioner profile");
  const share = patientShareButtonHtml({
    url,
    title,
    surface: PRACTITIONER_SHARE_ROOT,
    label: "Share profile",
  });

  const actionsPattern = /(<div class="doctor-profile-actions"[^>]*>)([\s\S]*?)(<\/div>)/i;
  if (actionsPattern.test(html)) {
    return html.replace(actionsPattern, (full, open, inner, close) => {
      if (/data-wmc-share-root=["']practitioner["']/i.test(full)) return full;
      return `${open}${inner}${share}${close}`;
    });
  }

  const headingFallback =
    /(<div class="doctor-profile-heading"[^>]*>[\s\S]*?<h1[^>]*>[\s\S]*?<\/h1>)/i;
  if (headingFallback.test(html)) {
    const toolbarHtml = `<div class="wmc-patient-share--toolbar">${share}</div>`;
    return html.replace(headingFallback, `$1${toolbarHtml}`);
  }

  return html;
}

function injectTeamPageShare(html: string, pagePath: string): string {
  if (alreadyMounted(html, TEAM_SHARE_ROOT)) return html;

  const url = resolveCanonicalShareUrl(html, pagePath);
  const title = resolveShareTitle(html, "Our Team");
  const share = patientShareButtonHtml({
    url,
    title,
    surface: TEAM_SHARE_ROOT,
    label: "Share this page",
  });
  const toolbar = `<div class="wmc-patient-share--toolbar">${share}</div>`;

  const heroPattern =
    /(<section class="page-hero[^"]*"[^>]*>[\s\S]*?<div class="shell page-hero-inner"[^>]*>[\s\S]*?<h1[^>]*>[\s\S]*?<\/h1>)/i;
  if (heroPattern.test(html)) {
    return html.replace(heroPattern, `$1${toolbar}`);
  }

  const h1Pattern = /(<main[^>]*>[\s\S]*?<h1[^>]*>[\s\S]*?<\/h1>)/i;
  if (h1Pattern.test(html)) {
    return html.replace(h1Pattern, `$1${toolbar}`);
  }

  return html;
}

function preferredGpShareButtonHtml(): string {
  return (
    `<span class="wmc-patient-share wmc-preferred-gp-share" data-wmc-share-root="${PREFERRED_GP_SHARE_ROOT}">` +
    `<button type="button" class="wmc-patient-share__btn" data-wmc-share` +
    ` data-wmc-share-preferred-gp="1"` +
    ` data-share-url=""` +
    ` data-share-title="My preferred GP"` +
    ` data-share-surface="${PREFERRED_GP_SHARE_ROOT}"` +
    ` aria-label="Share my preferred GP" tabindex="-1" disabled>Share my preferred GP</button></span>`
  );
}

function preferredGpShareSyncScriptHtml(): string {
  const key = PREFERRED_GP_STORAGE_KEY;
  const origin = PATIENT_SHARE_CANONICAL_ORIGIN;
  return (
    `<script id="${PREFERRED_GP_SHARE_SYNC_SCRIPT_ID}">` +
    `(function(){` +
    `var KEY=${JSON.stringify(key)};` +
    `var ORIGIN=${JSON.stringify(origin)};` +
    `function setMountVisible(mount,visible){` +
    `if(!mount)return;` +
    `if(visible){mount.removeAttribute('hidden');mount.removeAttribute('aria-hidden');}` +
    `else{mount.setAttribute('hidden','');mount.setAttribute('aria-hidden','true');}` +
    `}` +
    `function sync(){` +
    `var btn=document.querySelector('[data-wmc-share-preferred-gp="1"]');` +
    `var mount=document.querySelector('[data-wmc-preferred-gp-share-mount="1"]');` +
    `if(!btn)return;` +
    `try{` +
    `var raw=localStorage.getItem(KEY);` +
    `if(!raw){` +
    `btn.setAttribute('data-share-url','');` +
    `btn.setAttribute('data-share-title','My preferred GP');` +
    `btn.setAttribute('disabled','');` +
    `btn.setAttribute('tabindex','-1');` +
    `setMountVisible(mount,false);` +
    `return;` +
    `}` +
    `var o=JSON.parse(raw);` +
    `if(o&&o.profilePath){` +
    `var path=String(o.profilePath).replace(/^\\//,'');` +
    `btn.setAttribute('data-share-url',ORIGIN+'/'+path);` +
    `if(o.name)btn.setAttribute('data-share-title',o.name+' | Woolloongabba Medical Centre');` +
    `btn.removeAttribute('disabled');` +
    `btn.removeAttribute('tabindex');` +
    `setMountVisible(mount,true);` +
    `return;` +
    `}` +
    `btn.setAttribute('data-share-url','');` +
    `btn.setAttribute('disabled','');` +
    `btn.setAttribute('tabindex','-1');` +
    `setMountVisible(mount,false);` +
    `}catch(e){` +
    `btn.setAttribute('data-share-url','');` +
    `btn.setAttribute('disabled','');` +
    `btn.setAttribute('tabindex','-1');` +
    `setMountVisible(mount,false);` +
    `}` +
    `}` +
    `sync();` +
    `window.addEventListener('wmc:preferred-gp-changed',sync);` +
    `})();</script>`
  );
}

function injectPreferredGpShare(html: string): string {
  if (alreadyMounted(html, PREFERRED_GP_SHARE_ROOT)) return html;
  if (!/id=["']preferred-gp-panel["']/i.test(html)) return html;

  // A11Y-001: dormant until Preferred GP exists — hidden from AT/SR and tab order.
  const mount =
    `<div class="wmc-preferred-gp-share-mount" data-wmc-preferred-gp-share-mount="1" hidden aria-hidden="true">${preferredGpShareButtonHtml()}</div>`;
  let next = html.replace(
    /(<div[^>]*\bid=["']preferred-gp-panel["'][^>]*>)([\s\S]*?)(<\/div>)/i,
    `$1$2$3${mount}`,
  );

  if (next === html) {
    next = html.replace(/(<div[^>]*\bid=["']preferred-gp-panel["'][^>]*\/?>)/i, `$1${mount}`);
  }

  if (!new RegExp(`id="${PREFERRED_GP_SHARE_SYNC_SCRIPT_ID}"`, "i").test(next)) {
    if (/<\/body>/i.test(next)) {
      next = next.replace(/<\/body>/i, `${preferredGpShareSyncScriptHtml()}</body>`);
    } else {
      next += preferredGpShareSyncScriptHtml();
    }
  }

  return next;
}

/** Mount share controls on doctor profiles, team listings, and patient-hub preferred GP. */
export function injectPatientSharePractitioner(html: string, pagePath: string): string {
  const path = normalisePagePath(pagePath);
  const touchesDoctor = isDoctorProfilePagePath(path);
  const touchesTeam = isTeamListingPagePath(path);
  const touchesHub = isPatientHubPagePath(path);

  if (!touchesDoctor && !touchesTeam && !touchesHub) {
    return html;
  }

  let next = html;
  if (touchesDoctor) {
    next = injectDoctorProfileShare(next, path);
  }
  if (touchesTeam) {
    next = injectTeamPageShare(next, path);
  }
  if (touchesHub) {
    next = injectPreferredGpShare(next);
  }

  return ensurePatientShareRuntime(next);
}
