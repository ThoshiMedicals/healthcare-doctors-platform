/**
 * Patient Journey M1 — Care Hub refinement + visit preparation.
 * Patient Hub shows one "Prepare for Your Visit" entry; Care Hub grid lives at #wmc-care-hub.
 * Visit prep: non-clinical boolean checklist + Clear/Reset (wmc.visitPrep.v1).
 */

export const PATIENT_JOURNEY_MARKER = "wmc-patient-journey-v1";
export const PATIENT_JOURNEY_STYLE_ID = "wmc-patient-journey-enhancements";
export const PATIENT_JOURNEY_VISIT_PREP_STORAGE_KEY = "wmc.visitPrep.v1";
export const PATIENT_JOURNEY_CARE_HUB_ID = "wmc-care-hub";

/** Primary Care Hub tiles (blueprint-shaped). */
const CARE_PRIMARY: Array<{ href: string; label: string; hint: string }> = [
  { href: "#wmc-visit-prep", label: "Visit preparation", hint: "Non-clinical checklist" },
  { href: "new-patients.html", label: "New patients", hint: "First-visit guidance" },
  { href: "telehealth.html", label: "Telehealth", hint: "How telehealth visits work" },
  { href: "test-results.html", label: "Results & recalls", hint: "How results are shared" },
  { href: "repeat-scripts.html", label: "Repeat scripts", hint: "Approved request guidance" },
  { href: "referrals.html", label: "Referrals", hint: "Referral information" },
  { href: "#practice-info-strip", label: "Practice details", hint: "Hours, contact, location" },
];

/** Secondary destinations preserved from PJ-01 (no clinical invent). */
const CARE_SECONDARY: Array<{ href: string; label: string; hint: string }> = [
  { href: "fees-billing.html", label: "Fees & billing", hint: "Approved fee information" },
  { href: "bulk-billing.html", label: "Bulk billing", hint: "Bulk-billing facts" },
  { href: "after-hours-care.html", label: "After-hours care", hint: "When the clinic is closed" },
  { href: "book-appointment.html", label: "Visit information", hint: "Booking and visit tips" },
  { href: "team.html", label: "GP directory", hint: "Meet our doctors" },
  { href: "#preferred-gp-panel", label: "Preferred GP", hint: "Save your preferred doctor" },
  {
    href: "#digital-reception",
    label: "Digital Reception",
    hint: "Ask for the next step",
  },
  { href: "knowledge/index.html", label: "Health articles", hint: "Trusted education index" },
];

const VISIT_PREP_ITEMS: Array<{ id: string; label: string }> = [
  { id: "medicare", label: "Bring your Medicare or concession card" },
  { id: "arrive", label: "Plan to arrive a few minutes early for check-in" },
  { id: "reason", label: "Be ready to share the reason for your visit with reception" },
  {
    id: "telehealth",
    label: "For telehealth: quiet place, charged device, working camera and microphone",
  },
];

const STYLE = `<style id="${PATIENT_JOURNEY_STYLE_ID}">
body.patient-hub-page .patient-journey-entry{
  margin:12px 0 4px;padding:14px 16px;border-radius:var(--patient-hub-card-radius,14px);
  border:1px solid rgba(30,140,140,.28);background:linear-gradient(180deg,#E8F6F6 0%,#fff 78%);
  box-shadow:0 6px 18px rgba(18,59,93,.05);display:grid;gap:.35rem
}
body.patient-hub-page .patient-journey-entry a.patient-journey-entry-cta{
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  min-height:48px;text-decoration:none;color:var(--patient-hub-navy,#123B5D);font-weight:700
}
body.patient-hub-page .patient-journey-entry p{margin:0;font-size:.84rem;line-height:1.4;color:#4a5d6c}
body.patient-hub-page .patient-journey-entry-cta span[aria-hidden]{color:var(--patient-hub-teal,#1E8C8C);font-size:1.1rem}
body.patient-hub-page .patient-journey-care{
  margin:16px 0 8px;padding:16px;border-radius:var(--patient-hub-card-radius,14px);
  border:1px solid rgba(18,59,93,.12);background:#fff;
  box-shadow:0 6px 18px rgba(18,59,93,.05);scroll-margin-top:88px
}
body.patient-hub-page .patient-journey-care h2{
  margin:0 0 .35rem;font-size:1.05rem;color:var(--patient-hub-navy,#123B5D)
}
body.patient-hub-page .patient-journey-care>p{
  margin:0 0 .85rem;font-size:.84rem;line-height:1.4;color:#4a5d6c
}
body.patient-hub-page .patient-journey-care-grid,
body.patient-hub-page .patient-journey-care-more-grid{
  display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0;padding:0;list-style:none
}
body.patient-hub-page .patient-journey-care-grid a,
body.patient-hub-page .patient-journey-care-more-grid a{
  display:flex;flex-direction:column;justify-content:center;gap:.15rem;
  min-height:52px;padding:10px 12px;border-radius:12px;text-decoration:none;
  border:1px solid rgba(30,140,140,.22);background:#E8F6F6;color:var(--patient-hub-navy,#123B5D)
}
body.patient-hub-page .patient-journey-care-more-grid a{background:#fff}
body.patient-hub-page .patient-journey-care-grid a strong,
body.patient-hub-page .patient-journey-care-more-grid a strong{font-size:.86rem;font-weight:700}
body.patient-hub-page .patient-journey-care-grid a span,
body.patient-hub-page .patient-journey-care-more-grid a span{font-size:.72rem;line-height:1.3;color:#4a5d6c}
body.patient-hub-page .patient-journey-care-more{
  margin-top:10px;border:1px solid rgba(18,59,93,.1);border-radius:12px;background:#fafcfc
}
body.patient-hub-page .patient-journey-care-more>summary{
  list-style:none;cursor:pointer;padding:12px 14px;font-weight:650;color:var(--patient-hub-navy,#123B5D);
  min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:12px
}
body.patient-hub-page .patient-journey-care-more>summary::-webkit-details-marker{display:none}
body.patient-hub-page .patient-journey-care-more>summary::after{content:"+";color:var(--patient-hub-teal,#1E8C8C)}
body.patient-hub-page .patient-journey-care-more[open]>summary::after{content:"–"}
body.patient-hub-page .patient-journey-care-more-body{padding:0 12px 12px}
body.patient-hub-page .patient-journey-prep{
  margin:14px 0 0;border:1px solid rgba(18,59,93,.12);border-radius:var(--patient-hub-card-radius,14px);
  background:#fff;overflow:hidden;scroll-margin-top:88px
}
body.patient-hub-page .patient-journey-prep>summary{
  list-style:none;cursor:pointer;padding:14px 16px;font-weight:700;color:var(--patient-hub-navy,#123B5D);
  min-height:48px;display:flex;align-items:center;justify-content:space-between;gap:12px
}
body.patient-hub-page .patient-journey-prep>summary::-webkit-details-marker{display:none}
body.patient-hub-page .patient-journey-prep>summary::after{content:"+";color:var(--patient-hub-teal,#1E8C8C);font-weight:700}
body.patient-hub-page .patient-journey-prep[open]>summary::after{content:"–"}
body.patient-hub-page .patient-journey-prep-body{padding:0 16px 14px;display:grid;gap:10px}
body.patient-hub-page .patient-journey-prep-body>p{margin:0;font-size:.82rem;line-height:1.4;color:#4a5d6c}
body.patient-hub-page .patient-journey-prep-list{margin:0;padding:0;list-style:none;display:grid;gap:8px}
body.patient-hub-page .patient-journey-prep-list label{
  display:flex;align-items:flex-start;gap:10px;min-height:44px;padding:8px 10px;
  border-radius:10px;background:rgba(232,246,246,.55);font-size:.86rem;line-height:1.35;
  color:var(--patient-hub-navy,#123B5D);cursor:pointer
}
body.patient-hub-page .patient-journey-prep-list input{
  width:1.15rem;height:1.15rem;margin:.15rem 0 0;flex:0 0 auto;accent-color:#1E8C8C
}
body.patient-hub-page .patient-journey-prep-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
body.patient-hub-page .patient-journey-prep-clear{
  min-height:44px;padding:0 14px;border-radius:10px;border:1px solid rgba(18,59,93,.2);
  background:#fff;color:var(--patient-hub-navy,#123B5D);font-weight:650;cursor:pointer
}
body.patient-hub-page .patient-journey-prep-status{margin:0;font-size:.78rem;color:#4a5d6c;min-height:1.2em}
body.patient-hub-page .patient-journey-prep-links{display:flex;flex-wrap:wrap;gap:10px 14px}
body.patient-hub-page .patient-journey-prep-links a{
  min-height:44px;display:inline-flex;align-items:center;font-weight:650;color:var(--patient-hub-teal,#1E8C8C)
}
@media (max-width:319px){
  body.patient-hub-page .patient-journey-care-grid,
  body.patient-hub-page .patient-journey-care-more-grid{grid-template-columns:1fr}
}
@media (min-width:768px){
  body.patient-hub-page .patient-journey-care-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
  body.patient-hub-page .patient-journey-care-more-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
}
</style>`;

const VISIT_PREP_SCRIPT = `<script id="wmc-patient-journey-visit-prep-runtime">(function(){
try{
  var KEY=${JSON.stringify(PATIENT_JOURNEY_VISIT_PREP_STORAGE_KEY)};
  var root=document.querySelector("[data-wmc-visit-prep]");
  if(!root)return;
  var allowed={};
  root.querySelectorAll('input[type="checkbox"][data-prep-id]').forEach(function(el){
    allowed[el.getAttribute("data-prep-id")]=true;
  });
  var statusEl=root.querySelector("[data-wmc-visit-prep-status]");
  var clearBtn=root.querySelector("[data-wmc-visit-prep-clear]");
  function persist(){
    var next={};
    root.querySelectorAll('input[type="checkbox"][data-prep-id]').forEach(function(el){
      var key=el.getAttribute("data-prep-id");
      if(allowed[key]&&el.checked)next[key]=true;
    });
    try{window.localStorage.setItem(KEY,JSON.stringify(next));}catch(err){}
    if(statusEl){
      var n=Object.keys(next).length;
      statusEl.textContent=n? (n+" item"+(n===1?"":"s")+" saved on this device.") : "";
    }
  }
  var state={};
  try{
    var raw=window.localStorage.getItem(KEY);
    if(raw){
      var parsed=JSON.parse(raw);
      if(parsed&&typeof parsed==="object"){
        Object.keys(parsed).forEach(function(k){
          if(allowed[k]&&parsed[k]===true)state[k]=true;
        });
      }
    }
  }catch(e){}
  root.querySelectorAll('input[type="checkbox"][data-prep-id]').forEach(function(box){
    var id=box.getAttribute("data-prep-id");
    box.checked=!!state[id];
    box.addEventListener("change",persist);
  });
  if(clearBtn){
    clearBtn.addEventListener("click",function(){
      root.querySelectorAll('input[type="checkbox"][data-prep-id]').forEach(function(el){el.checked=false;});
      try{window.localStorage.removeItem(KEY);}catch(err){}
      if(statusEl)statusEl.textContent="Checklist cleared on this device.";
    });
  }
  persist();
}catch(e){}
})();</script>`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linkListHtml(
  links: Array<{ href: string; label: string; hint: string }>,
  className: string,
): string {
  const items = links
    .map(
      (link) =>
        `<li><a href="${escapeHtml(link.href)}"><strong>${escapeHtml(link.label)}</strong><span>${escapeHtml(link.hint)}</span></a></li>`,
    )
    .join("");
  return `<ul class="${className}">${items}</ul>`;
}

function entryCardHtml(): string {
  return (
    `<aside class="patient-journey-entry" data-wmc-journey-entry="">` +
    `<a class="patient-journey-entry-cta" href="#${PATIENT_JOURNEY_CARE_HUB_ID}">` +
    `<span>Prepare for Your Visit</span><span aria-hidden="true">→</span></a>` +
    `<p>Open the Care Hub for visit preparation, new-patient guidance, telehealth tips, and approved practice information.</p>` +
    `</aside>`
  );
}

function careHubHtml(): string {
  return (
    `<section class="patient-journey-care" id="${PATIENT_JOURNEY_CARE_HUB_ID}" data-wmc-care-hub="" aria-labelledby="patient-journey-care-title">` +
    `<h2 id="patient-journey-care-title">Care Hub</h2>` +
    `<p>Prepare and manage your visit with approved clinic information. Booking stays with HotDoc. Digital Reception and Preferred GP remain available from the hub.</p>` +
    linkListHtml(CARE_PRIMARY, "patient-journey-care-grid") +
    `<details class="patient-journey-care-more">` +
    `<summary>More practice information</summary>` +
    `<div class="patient-journey-care-more-body">` +
    linkListHtml(CARE_SECONDARY, "patient-journey-care-more-grid") +
    `</div></details>` +
    visitPrepHtml() +
    `</section>`
  );
}

function visitPrepHtml(): string {
  const items = VISIT_PREP_ITEMS.map(
    (item) =>
      `<li><label><input type="checkbox" data-prep-id="${escapeHtml(item.id)}" />` +
      `<span>${escapeHtml(item.label)}</span></label></li>`,
  ).join("");
  return (
    `<details class="patient-journey-prep" id="wmc-visit-prep" data-wmc-visit-prep="" open>` +
    `<summary>Visit preparation checklist</summary>` +
    `<div class="patient-journey-prep-body">` +
    `<p>A simple non-clinical checklist for this device only. It does not store medical notes, results, or family health details.</p>` +
    `<ul class="patient-journey-prep-list">${items}</ul>` +
    `<div class="patient-journey-prep-actions">` +
    `<button type="button" class="patient-journey-prep-clear" data-wmc-visit-prep-clear="">Clear checklist</button>` +
    `<p class="patient-journey-prep-status" data-wmc-visit-prep-status="" aria-live="polite"></p>` +
    `</div>` +
    `<div class="patient-journey-prep-links">` +
    `<a href="telehealth.html">Telehealth guide</a>` +
    `<a href="after-hours-care.html">After-hours care</a>` +
    `<a href="new-patients.html">New patients</a>` +
    `</div></div></details>`
  );
}

function journeyBlockHtml(): string {
  return (
    `<!--${PATIENT_JOURNEY_MARKER}:start-->` +
    entryCardHtml() +
    careHubHtml() +
    `<!--${PATIENT_JOURNEY_MARKER}:end-->`
  );
}

/**
 * Idempotent Patient Hub Care Hub + visit-prep inject. No-op off patient-hub.html.
 */
export function refinePatientJourneyEnhancements(html: string, pagePath: string): string {
  if (pagePath !== "patient-hub.html") return html;
  let next = html;

  next = next.replace(
    new RegExp(
      `<style\\b[^>]*id="${PATIENT_JOURNEY_STYLE_ID}"[\\s\\S]*?<\\/style>\\s*`,
      "i",
    ),
    "",
  );
  next = next.includes("</head>")
    ? next.replace(/<\/head>/i, `${STYLE}</head>`)
    : `${STYLE}${next}`;

  const markerPattern = new RegExp(
    `<!--\\s*${PATIENT_JOURNEY_MARKER}:start\\s*-->[\\s\\S]*?<!--\\s*${PATIENT_JOURNEY_MARKER}:end\\s*-->\\s*`,
    "i",
  );
  const block = journeyBlockHtml();

  if (markerPattern.test(next)) {
    next = next.replace(markerPattern, `${block}`);
  } else if (/data-wmc-hub-install-card/i.test(next)) {
    next = next.replace(
      /(<aside\b[^>]*\bdata-wmc-hub-install-card\b[^>]*>[\s\S]*?<\/aside>)/i,
      `$1${block}`,
    );
  } else if (/id="patient-dashboard-primary"/i.test(next)) {
    next = next.replace(
      /(<section\b[^>]*\bid="patient-dashboard-primary"[^>]*>[\s\S]*?)(<\/section>)/i,
      `$1${block}$2`,
    );
  }

  next = next.replace(
    /<script\b[^>]*\bid="wmc-patient-journey-visit-prep-runtime"[^>]*>[\s\S]*?<\/script>\s*/i,
    "",
  );
  next = next.replace(/<\/body>/i, `${VISIT_PREP_SCRIPT}</body>`);

  return next;
}

/** All Care Hub destinations (primary + secondary) for tests. */
export function listPatientJourneyCareLinks(): ReadonlyArray<{ href: string; label: string }> {
  return [...CARE_PRIMARY, ...CARE_SECONDARY].map(({ href, label }) => ({ href, label }));
}

export function listPatientJourneyVisitPrepIds(): ReadonlyArray<string> {
  return VISIT_PREP_ITEMS.map((item) => item.id);
}
