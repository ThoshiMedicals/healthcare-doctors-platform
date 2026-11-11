/**
 * PWA installability presentation for served public HTML.
 *
 * Adds the web app manifest link + install meta tags, a `viewport-fit=cover`
 * augmentation (so safe-area insets resolve on notch/Dynamic-Island
 * devices), standalone-only safe-area padding for the sticky header/care
 * dock, and a small dismissible "Add to Home Screen" tip. Nothing here
 * touches the hero, golden markup, SEO tags, or schema — every addition is
 * either inert outside an installed PWA context (the safe-area CSS is
 * gated behind `@media (display-mode: standalone)`) or a self-contained,
 * idempotent block that can be re-applied safely on every render.
 */

const THEME_COLOR = "#163f62"; // brand navy/blue (see public/styles.css --navy / --blue); not purple.
const MANIFEST_VERSION = "wmc-pwa-icons-lockup-20261111a";

// --- 1) <head> link/meta tags -------------------------------------------------

const PWA_HEAD_TAG_PATTERN =
  /<link\b(?=[^>]*\brel\s*=\s*(["'])manifest\1)[^>]*\/?>\s*|<meta\b(?=[^>]*\bname\s*=\s*(["'])(?:theme-color|mobile-web-app-capable|apple-mobile-web-app-capable|apple-mobile-web-app-status-bar-style|apple-mobile-web-app-title)\2)[^>]*\/?>\s*/gi;

export const PWA_HEAD_TAGS = [
  `<link rel="manifest" href="/manifest.webmanifest?v=${MANIFEST_VERSION}">`,
  `<meta name="theme-color" content="${THEME_COLOR}">`,
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
  '<meta name="apple-mobile-web-app-title" content="Gabba Medical">',
].join("\n");

const VIEWPORT_META = /<meta\b([^>]*\bname\s*=\s*["']viewport["'][^>]*)>/i;

/**
 * Append `viewport-fit=cover` to the existing viewport meta content without
 * disturbing attribute order or other directives (width/initial-scale stay
 * exactly as approved). No-op if the tag is missing or already covers it.
 */
export function ensureViewportFitCover(html: string): string {
  return html.replace(VIEWPORT_META, (whole, attrs: string) => {
    if (/viewport-fit\s*=/i.test(attrs)) return whole;
    const contentMatch = attrs.match(/\bcontent\s*=\s*(["'])([^"']*)\1/i);
    if (!contentMatch) return whole;
    const [fullAttr, quote, value] = contentMatch;
    const nextAttrs = attrs.replace(fullAttr, `content=${quote}${value},viewport-fit=cover${quote}`);
    return `<meta${nextAttrs}>`;
  });
}

/** Insert manifest/meta tags once, idempotently, and extend the viewport tag. */
export function applyPwaHeadTags(html: string): string {
  if (!/<head\b[^>]*>/i.test(html)) return html;
  const withoutExisting = html.replace(PWA_HEAD_TAG_PATTERN, "");
  const withViewportFit = ensureViewportFitCover(withoutExisting);
  return withViewportFit.replace(/<head\b[^>]*>\s*/i, (head) => `${head.trimEnd()}\n${PWA_HEAD_TAGS}\n`);
}

// --- 2) Standalone-only safe-area CSS -----------------------------------------

const SAFE_AREA_STYLE_ID = "wmc-pwa-safe-area";
const SAFE_AREA_STYLE_PATTERN = new RegExp(
  `<style\\b[^>]*id="${SAFE_AREA_STYLE_ID}"[\\s\\S]*?<\\/style>\\s*`,
  "i",
);

/**
 * Padding only applies inside an installed PWA (`display-mode: standalone`),
 * so regular browser tabs/visual-regression baselines are unaffected. Header
 * gets inset-top clearance under a notch/Dynamic Island; the floating care
 * dock keeps inset-bottom/left/right clearance (bottom already handled on
 * mobile by styles.css — this adds standalone-only left/right too).
 */
const SAFE_AREA_STYLE = `<style id="${SAFE_AREA_STYLE_ID}">
@media (display-mode: standalone){
header{padding-top:env(safe-area-inset-top,0px)}
.persistent-care-actions{
  right:calc(22px + env(safe-area-inset-right,0px));
  bottom:calc(22px + env(safe-area-inset-bottom,0px));
}
}
</style>
`;

export function applyPwaSafeAreaStyle(html: string): string {
  if (!/<\/head>/i.test(html)) return html;
  const withoutExisting = html.replace(SAFE_AREA_STYLE_PATTERN, "");
  return withoutExisting.replace(/<\/head>/i, `${SAFE_AREA_STYLE}</head>`);
}

// --- 3) Dismissible "Add to Home Screen" tip ----------------------------------

const INSTALL_TIP_ID = "wmc-pwa-install-tip";
const INSTALL_TIP_PATTERN = new RegExp(
  `<!--\\s*${INSTALL_TIP_ID}:start\\s*-->[\\s\\S]*?<!--\\s*${INSTALL_TIP_ID}:end\\s*-->\\s*`,
  "i",
);

const INSTALL_TIP_BLOCK = `<!-- ${INSTALL_TIP_ID}:start -->
<style id="${INSTALL_TIP_ID}-style">
#${INSTALL_TIP_ID}{position:fixed;left:14px;right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px) + var(--action-dock-height,0px));z-index:130;display:flex;align-items:center;justify-content:space-between;gap:12px;max-width:420px;margin:0 auto;padding:12px 14px;border-radius:14px;background:#163f62;color:#fff;font:13px/1.4 inherit;box-shadow:0 14px 34px rgba(16,38,58,.28)}
#${INSTALL_TIP_ID}[hidden]{display:none!important}
#${INSTALL_TIP_ID} p{margin:0}
#${INSTALL_TIP_ID}-actions{display:flex;flex-shrink:0;gap:8px}
#${INSTALL_TIP_ID} button{border:0;border-radius:999px;padding:7px 12px;font-size:12.5px;font-weight:600;cursor:pointer}
#${INSTALL_TIP_ID}-install{background:#fff;color:#163f62}
#${INSTALL_TIP_ID}-dismiss{background:rgba(255,255,255,.16);color:#fff}
@media (prefers-reduced-motion:no-preference){#${INSTALL_TIP_ID}{transition:opacity .25s ease}}
</style>
<div id="${INSTALL_TIP_ID}" class="${INSTALL_TIP_ID}" hidden role="note" aria-live="polite">
<p id="${INSTALL_TIP_ID}-text">Install this site for quick access to booking and your doctors.</p>
<div id="${INSTALL_TIP_ID}-actions">
<button type="button" id="${INSTALL_TIP_ID}-install" hidden>Install</button>
<button type="button" id="${INSTALL_TIP_ID}-dismiss" aria-label="Dismiss install tip">Not now</button>
</div>
</div>
<script>(function(){try{
var KEY="wmcPwaInstallTipDismissed";
if(sessionStorage.getItem(KEY))return;
if(window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches)return;
if(window.navigator&&window.navigator.standalone)return;
var ua=window.navigator.userAgent||"";
var isIOS=/iPad|iPhone|iPod/.test(ua)&&!window.MSStream;
var isIOSSafari=isIOS&&/Safari/.test(ua)&&!/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
var tip,textEl,installBtn,dismissBtn,deferredPrompt;
function hide(){try{sessionStorage.setItem(KEY,"1")}catch(e){}if(tip)tip.hidden=true}
function ensure(){
if(tip)return tip;
tip=document.getElementById("${INSTALL_TIP_ID}");
if(!tip)return null;
textEl=document.getElementById("${INSTALL_TIP_ID}-text");
installBtn=document.getElementById("${INSTALL_TIP_ID}-install");
dismissBtn=document.getElementById("${INSTALL_TIP_ID}-dismiss");
if(dismissBtn)dismissBtn.addEventListener("click",hide);
return tip;
}
function show(mode){
var el=ensure();
if(!el)return;
if(mode==="ios"){
if(textEl)textEl.textContent='Install this site: tap Share, then "Add to Home Screen".';
}else if(installBtn){
installBtn.hidden=false;
installBtn.addEventListener("click",function(){
if(!deferredPrompt)return;
deferredPrompt.prompt();
deferredPrompt.userChoice.finally(function(){deferredPrompt=null;hide()});
});
}
el.hidden=false;
}
window.addEventListener("beforeinstallprompt",function(e){
e.preventDefault();
deferredPrompt=e;
setTimeout(function(){show("android")},2500);
});
if(isIOSSafari)setTimeout(function(){show("ios")},2500);
window.addEventListener("appinstalled",hide);
}catch(e){}})();</script>
<!-- ${INSTALL_TIP_ID}:end -->
`;

export function applyPwaInstallTip(html: string): string {
  if (!/<\/body>/i.test(html)) return html;
  const withoutExisting = html.replace(INSTALL_TIP_PATTERN, "");
  return withoutExisting.replace(/<\/body>/i, `${INSTALL_TIP_BLOCK}</body>`);
}

// --- 4) Service worker registration (public HTML only) -------------------------

const SW_REGISTER_ID = "wmc-pwa-sw-register";
const SW_REGISTER_PATTERN = new RegExp(
  `<!--\\s*${SW_REGISTER_ID}:start\\s*-->[\\s\\S]*?<!--\\s*${SW_REGISTER_ID}:end\\s*-->\\s*`,
  "gi",
);

/**
 * Register the fail-closed shell SW on public pages only. Admin/auth HTML never
 * passes through applyPwaMeta, so this script is never injected there.
 */
const SW_REGISTER_BLOCK = `<!-- ${SW_REGISTER_ID}:start -->
<script>
(function(){try{
if(!("serviceWorker" in navigator))return;
window.addEventListener("load",function(){
navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(function(){});
});
}catch(e){}})();
</script>
<!-- ${SW_REGISTER_ID}:end -->
`;

export function applyPwaServiceWorkerRegister(html: string): string {
  if (!/<\/body>/i.test(html)) return html;
  const withoutExisting = html.replace(SW_REGISTER_PATTERN, "");
  return withoutExisting.replace(/<\/body>/i, `${SW_REGISTER_BLOCK}</body>`);
}

// --- Composed entry point ------------------------------------------------------

/** Single call site for render-published-document.ts, alongside applyFaviconLinks. */
export function applyPwaMeta(html: string): string {
  return applyPwaInstallTip(
    applyPwaServiceWorkerRegister(applyPwaSafeAreaStyle(applyPwaHeadTags(html))),
  );
}
