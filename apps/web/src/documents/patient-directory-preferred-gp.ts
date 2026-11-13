/**
 * M2 — Save Preferred GP from practitioner directory / profiles.
 * Reuses WmcPreferredGp (wmc.preferredGp.v1). No new storage keys.
 */

import { APPROVED_GP_CATALOG } from "@/documents/patient-preferred-gp";

export const DIRECTORY_PREFERRED_GP_STYLE_ID = "wmc-directory-preferred-gp";
export const DIRECTORY_PREFERRED_GP_SCRIPT_ID = "wmc-directory-preferred-gp-runtime";
export const DIRECTORY_PREFERRED_GP_MARKER = "wmc-directory-preferred-gp-v1";

const PATIENT_PREFERRED_GP_SCRIPT_HREF =
  "/wmc-cache/patient-preferred-gp.js?v=wmc-preferred-gp-20261113m2";

const STYLE = `<style id="${DIRECTORY_PREFERRED_GP_STYLE_ID}">
.wmc-save-preferred-gp{
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  min-height:44px;padding:8px 12px;margin-top:8px;border-radius:10px;
  border:1px solid rgba(30,140,140,.35);background:#fff;color:#123B5D;
  font-weight:650;font-size:.86rem;cursor:pointer;text-decoration:none
}
.wmc-save-preferred-gp[aria-pressed="true"]{
  background:#E8F6F6;border-color:#1E8C8C
}
.wmc-save-preferred-gp:focus-visible{outline:2px solid #1E8C8C;outline-offset:2px}
.practitioner-directory-card .wmc-save-preferred-gp,
.gp-discovery-actions .wmc-save-preferred-gp{width:100%}
.wmc-directory-preferred-banner{
  margin:12px 0 16px;padding:12px 14px;border-radius:12px;
  border:1px solid rgba(30,140,140,.25);background:linear-gradient(180deg,#E8F6F6 0%,#fff 85%);
  color:#123B5D;font-size:.9rem;line-height:1.4
}
.wmc-directory-preferred-banner a{font-weight:650;color:#1E8C8C}
.wmc-profile-preferred-gp-wrap{margin:12px 0;display:flex;flex-wrap:wrap;gap:8px}
</style>`;

const RUNTIME = `<script id="${DIRECTORY_PREFERRED_GP_SCRIPT_ID}">(function(){
try{
  function syncButtons(){
    var api=window.WmcPreferredGp;
    var current=api&&typeof api.get==="function"?api.get():null;
    var slug=current&&current.slug?String(current.slug).toLowerCase():"";
    document.querySelectorAll("[data-wmc-save-preferred-gp]").forEach(function(btn){
      var target=String(btn.getAttribute("data-wmc-save-preferred-gp")||"").toLowerCase();
      var on=!!slug&&slug===target;
      btn.setAttribute("aria-pressed",on?"true":"false");
      btn.textContent=on?"Preferred GP saved":"Save as preferred GP";
    });
  }
  function onClick(event){
    var btn=event.target&&event.target.closest&&event.target.closest("[data-wmc-save-preferred-gp]");
    if(!btn)return;
    event.preventDefault();
    var slug=btn.getAttribute("data-wmc-save-preferred-gp");
    var api=window.WmcPreferredGp;
    if(!api||typeof api.set!=="function")return;
    if(api.set(slug)){
      syncButtons();
      var panel=document.getElementById("preferred-gp-panel");
      if(panel&&typeof api.mount==="function"){
        try{panel.removeAttribute("data-wmc-preferred-gp-mounted");api.mount(panel);}catch(e){}
      }
    }
  }
  document.addEventListener("click",onClick);
  window.addEventListener("wmc:preferred-gp-changed",syncButtons);
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",syncButtons,{once:true});
  }else{syncButtons();}
  setTimeout(syncButtons,0);
}catch(e){}
})();</script>`;

function isTeamListing(pagePath: string): boolean {
  return pagePath === "team.html" || pagePath === "team-general-practitioners.html";
}

function isDoctorProfile(pagePath: string): boolean {
  return /^doctors\/.+\.html$/i.test(pagePath);
}

function slugFromDoctorPath(pagePath: string): string | null {
  const m = pagePath.match(/^doctors\/([^/]+)\.html$/i);
  if (!m) return null;
  const slug = m[1].toLowerCase();
  return APPROVED_GP_CATALOG.some((e) => e.slug === slug) ? slug : null;
}

function ensurePreferredGpScript(html: string): string {
  let next = html.replace(
    /(?:\/wmc-cache\/)?(?:\.\.\/)*patient-preferred-gp\.js(?:\?[^"]*)?(?=")/g,
    PATIENT_PREFERRED_GP_SCRIPT_HREF,
  );
  if (!/<script\b[^>]*\bsrc="[^"]*patient-preferred-gp\.js[^"]*"/i.test(next)) {
    next = next.replace(
      /<\/body>/i,
      `<script defer="" src="${PATIENT_PREFERRED_GP_SCRIPT_HREF}"></script></body>`,
    );
  }
  return next;
}

function ensureAssets(html: string): string {
  let next = html;
  // Append-only: never strip/reinsert (keeps order stable for public-ux idempotency).
  if (!new RegExp(`id="${DIRECTORY_PREFERRED_GP_STYLE_ID}"`, "i").test(next)) {
    next = next.includes("</head>")
      ? next.replace(/<\/head>/i, `${STYLE}</head>`)
      : `${STYLE}${next}`;
  }
  next = ensurePreferredGpScript(next);
  if (!new RegExp(`id="${DIRECTORY_PREFERRED_GP_SCRIPT_ID}"`, "i").test(next)) {
    next = next.replace(/<\/body>/i, `${RUNTIME}</body>`);
  }
  return next;
}

function injectDirectoryBanner(html: string): string {
  if (/data-wmc-directory-preferred-banner/i.test(html)) return html;
  const banner =
    `<aside class="wmc-directory-preferred-banner shell" data-wmc-directory-preferred-banner="">` +
    `Save a preferred GP on this device for quicker booking next time. ` +
    `<a href="patient-hub.html#preferred-gp-panel">Open Preferred GP on Patient Hub</a>.` +
    `</aside>`;
  if (/id="general-practitioners"/i.test(html)) {
    return html.replace(
      /(<section\b[^>]*\bid="general-practitioners"[^>]*>)/i,
      `${banner}$1`,
    );
  }
  if (/class="[^"]*team-directory-grid/i.test(html)) {
    return html.replace(/(<div\b[^>]*\bteam-directory-grid\b[^>]*>)/i, `${banner}$1`);
  }
  return html.replace(/<\/main>/i, `${banner}</main>`);
}

function savePreferredButton(slug: string): string {
  return `<button type="button" class="wmc-save-preferred-gp" data-wmc-save-preferred-gp="${slug}" aria-pressed="false">Save as preferred GP</button>`;
}

/**
 * Add Save Preferred GP buttons on directory cards that link to approved catalog profiles.
 */
function injectDirectoryCardButtons(html: string): string {
  const slugSet = new Set(APPROVED_GP_CATALOG.map((e) => e.slug));
  let next = html.replace(
    /<article\b([^>]*\bpractitioner-directory-card\b[^>]*)>([\s\S]*?)<\/article>/gi,
    (full, attrs: string, inner: string) => {
      if (/data-wmc-save-preferred-gp=/i.test(inner) || /data-wmc-save-preferred-gp=/i.test(attrs)) {
        return full;
      }
      const hrefMatch = inner.match(/href="(?:\.\.\/)?doctors\/([a-z0-9-]+)\.html"/i);
      const classMatch = `${attrs} ${inner}`.match(/\bpractitioner-(dr-[a-z0-9-]+|mr-[a-z0-9-]+)\b/i);
      const slug = (hrefMatch?.[1] || classMatch?.[1] || "").toLowerCase();
      if (!slug || !slugSet.has(slug)) return full;
      const btn = savePreferredButton(slug);
      if (/<\/div>\s*$/i.test(inner.trim())) {
        return `<article${attrs}>${inner.replace(/<\/div>(\s*)$/i, `${btn}</div>$1`)}</article>`;
      }
      return `<article${attrs}>${inner}${btn}</article>`;
    },
  );

  // team-general-practitioners.html: profile href lives inside gp-discovery-actions
  // (nested <li> in care-area lists make outer-card regex unsafe).
  next = next.replace(
    /<div\b([^>]*\bgp-discovery-actions\b[^>]*)>([\s\S]*?)<\/div>/gi,
    (full, attrs: string, inner: string) => {
      if (/data-wmc-save-preferred-gp=/i.test(inner)) return full;
      const hrefMatch = inner.match(/href="(?:\.\.\/)?doctors\/([a-z0-9-]+)\.html"/i);
      const slug = (hrefMatch?.[1] || "").toLowerCase();
      if (!slug || !slugSet.has(slug)) return full;
      return `<div${attrs}>${savePreferredButton(slug)}${inner}</div>`;
    },
  );

  return next;
}

function injectProfileButton(html: string, slug: string): string {
  if (/data-wmc-save-preferred-gp=/i.test(html)) return html;
  const btn =
    `<div class="wmc-profile-preferred-gp-wrap" data-wmc-profile-preferred-wrap="">` +
    `<button type="button" class="wmc-save-preferred-gp" data-wmc-save-preferred-gp="${slug}" aria-pressed="false">Save as preferred GP</button>` +
    `</div>`;
  if (/class="[^"]*practitioner-actions/i.test(html)) {
    return html.replace(
      /(<div\b[^>]*\bpractitioner-actions\b[^>]*>)/i,
      `$1${btn}`,
    );
  }
  if (/<h1\b/i.test(html)) {
    return html.replace(/(<h1\b[^>]*>[\s\S]*?<\/h1>)/i, `$1${btn}`);
  }
  return html.replace(/<\/main>/i, `${btn}</main>`);
}

/**
 * Idempotent M2 inject for team listings and approved doctor profiles.
 */
export function injectDirectoryPreferredGpSave(html: string, pagePath: string): string {
  const path = pagePath.replace(/^\//, "");
  if (isTeamListing(path)) {
    let next = injectDirectoryBanner(html);
    next = injectDirectoryCardButtons(next);
    return ensureAssets(next);
  }
  if (isDoctorProfile(path)) {
    const slug = slugFromDoctorPath(path);
    if (!slug) return html;
    const next = injectProfileButton(html, slug);
    return ensureAssets(next);
  }
  return html;
}
