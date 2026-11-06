import type { StorySurfaceQuote } from "@/story-capture/integration";
import { WMC_RECRUITMENT_OFFER } from "@/recruitment/offer-config";
import {
  JOIN_ATTRACTION_NAV,
  escapeHtml,
  renderEvPageShell,
  renderRecommendedNextBand,
  type EvShellInput,
} from "../ev-shell";
import { journeyFor, type JourneyPageKey } from "../journey-questions";

/** Short boundary line — colleague voice, not product/QA language. */
const ADVISORY =
  "Optional. This may help if you are still working something out — it does not decide anything for you or for us.";
const OPTIONAL_SKIP =
  "Skip this page entirely if it is not useful. You can still call or write whenever you like.";

function shellWithJourney(
  pageKey: JourneyPageKey,
  input: EvShellInput,
): string {
  const j = journeyFor(pageKey);
  return renderEvPageShell({
    ...input,
    heroEyebrow: j?.question ?? input.heroEyebrow,
    h1: j?.h1 ?? input.h1,
    lede: j?.answerLede ?? input.lede,
  });
}

function toolScript(toolId: string, clinicSlug: string): string {
  const bust = toolId === "express-interest" ? "wmc-attr-eoi-20261105c" : "wmc-attr-practice-20261104b";
  return `<script src="../attraction-tools/${toolId}.js?v=${bust}" defer data-clinic-slug="${escapeHtml(clinicSlug)}"></script>`;
}

function scoreField(
  name: string,
  title: string,
  hint: string,
  max: number,
  value: number,
): string {
  return `<label class="attr-score-field"><span class="attr-field-label">${escapeHtml(title)}</span><span class="ev-hint">${escapeHtml(hint)}</span><input name="${escapeHtml(name)}" type="number" min="0" max="${max}" value="${value}" inputmode="numeric" required aria-describedby="${escapeHtml(name)}-hint"/><span id="${escapeHtml(name)}-hint" class="ev-hint">0 = not yet · ${max} = yes, I’m there.</span></label>`;
}

export function renderDoctorReadinessHtml(clinicSlug: string): string {
  const article = `<section class="article-section" id="wizard">
<p>${escapeHtml(ADVISORY)}</p>
<p class="ev-hint">${escapeHtml(OPTIONAL_SKIP)}</p>
<div id="doctor-readiness-root" class="attraction-tool-panel" data-tool="doctor-readiness">
<p>Five private ratings — only if they help you think. Skip any line you are unsure about, or leave the whole page and contact us anyway.</p>
<form id="doctor-readiness-form">
<label><span class="attr-field-label">Your name (optional)</span><input name="applicantName" autocomplete="name"/></label>
<label><span class="attr-field-label">Email (optional)</span><span class="ev-hint">Only if you want us to receive a copy of what you typed.</span><input name="applicantEmail" type="email" autocomplete="email"/></label>
${scoreField("credentials", "Registration and paperwork", "AHPRA, provider-number steps, and documents you would bring to a first chat.", 30, 20)}
${scoreField("availability", "Days you could work", "How clear you are about preferred days each week.", 25, 15)}
${scoreField("clinical", "Pace of practice", "How well a continuity-focused, paced book suits you (rather than high-throughput consulting).", 20, 12)}
${scoreField("fit", "Fit with this practice", "How well Woolloongabba’s style matches what you want.", 15, 10)}
${scoreField("practical", "Ready to get in touch", "How ready you feel to write or call us now.", 10, 6)}
<button class="button" type="submit">That’s enough for now</button>
</form>
<div id="doctor-readiness-result" hidden></div>
</div>
${renderRecommendedNextBand("join-our-team/doctor-readiness.html")}
</section>`;

  return shellWithJourney("doctor-readiness.html", {
    path: "join-our-team/doctor-readiness.html",
    title: "Am I ready to talk? | Woolloongabba Medical Centre",
    metaDescription: "Optional private ratings before you talk with Woolloongabba Medical Centre about joining.",
    h1: "Am I ready to talk with the practice?",
    lede: "This may help if you are still working something out. Optional — call or write whenever you like.",
    honestyLine: ADVISORY,
    breadcrumb: [
      { label: "Home", href: "../index.html" },
      { label: "Join Our Team", href: "../join-our-team.html" },
      { label: "Am I ready to talk?" },
    ],
    navOwner: "join-team",
    sideNavHtml: JOIN_ATTRACTION_NAV("doctor-readiness.html"),
    articleHtml: article,
    extraScripts: toolScript("doctor-readiness", clinicSlug),
  });
}

export function renderProviderNumberHtml(): string {
  const article = `<section class="article-section">
<p>${escapeHtml(ADVISORY)}</p>
<p class="ev-hint">${escapeHtml(OPTIONAL_SKIP)} Skip entirely if you already have a provider number sorted.</p>
<div class="attraction-tool-panel" id="provider-number-root" data-tool="provider-number-readiness">
<p>Medicare provider numbers come from Services Australia — not from this practice. Use the list below only if you are still preparing paperwork.</p>
<ol>
<li>Confirm your AHPRA registration pathway.</li>
<li>Gather practice location details (we can share our address).</li>
<li>Apply through Services Australia.</li>
<li>Talk with us about start timing once your pathway is clear.</li>
</ol>
<p><strong>We do not</strong> issue, approve, guarantee or speed up provider numbers.</p>
<label><span class="attr-field-label">Your notes (optional)</span><span class="ev-hint">For your own reference — questions, reference numbers, or reminders.</span><textarea id="pn-notes" rows="4" aria-describedby="pn-notes-hint"></textarea></label>
<p id="pn-notes-hint" class="ev-hint">Kept on your phone or computer unless you choose to tell us separately.</p>
<button class="button" type="button" id="pn-save-draft">Save for myself</button>
<p id="pn-status" class="ev-synth" hidden></p>
</div>
${renderRecommendedNextBand("join-our-team/provider-number-readiness.html")}
</section>`;
  return shellWithJourney("provider-number-readiness.html", {
    path: "join-our-team/provider-number-readiness.html",
    title: "Provider numbers | Woolloongabba Medical Centre",
    metaDescription: "What Woolloongabba Medical Centre can and cannot do about Medicare provider numbers.",
    h1: "What should I know about provider numbers?",
    lede: "Only if provider numbers are still on your mind. Services Australia issues them — not us.",
    honestyLine: "Woolloongabba Medical Centre does not issue or guarantee Medicare provider numbers.",
    breadcrumb: [
      { label: "Home", href: "../index.html" },
      { label: "Join Our Team", href: "../join-our-team.html" },
      { label: "Provider numbers" },
    ],
    navOwner: "join-team",
    sideNavHtml: JOIN_ATTRACTION_NAV("provider-number-readiness.html"),
    articleHtml: article,
    extraScripts: `<script src="../attraction-tools/local-draft.js?v=wmc-attr-practice-20261104b" defer data-draft-key="wmc-pn-readiness" data-status-id="pn-status" data-textarea-id="pn-notes" data-button-id="pn-save-draft"></script>`,
  });
}

export function renderDpaNavigatorHtml(): string {
  const article = `<section class="article-section">
<p>${escapeHtml(ADVISORY)}</p>
<p class="ev-hint">${escapeHtml(OPTIONAL_SKIP)} Skip if Distribution Priority Area (DPA) or Health Insurance Act s19AB rules do not apply to you.</p>
<div class="attraction-tool-panel" id="dpa-root" data-tool="dpa-19ab-navigator">
<p>Choose the line that fits you best. You will see a short next step. Official answers sit with government sources — not with us.</p>
<label><span class="attr-field-label">Where are you up to?</span><span class="ev-hint">Pick one, then tap below — only if useful.</span>
<select id="dpa-stage">
<option value="exploring">Still exploring</option>
<option value="overseas_trained">Overseas-trained / thinking about 19AB</option>
<option value="dpa_location">Checking DPA location rules</option>
<option value="local_ready">Mostly sorted on the local pathway</option>
</select></label>
<button class="button" type="button" id="dpa-advise">Show a plain next step</button>
<div id="dpa-result" hidden></div>
</div>
${renderRecommendedNextBand("join-our-team/dpa-navigator.html")}
</section>`;
  return shellWithJourney("dpa-navigator.html", {
    path: "join-our-team/dpa-navigator.html",
    title: "DPA & 19AB | Woolloongabba Medical Centre",
    metaDescription: "Plain next steps on DPA and 19AB questions for GPs considering Woolloongabba Medical Centre.",
    h1: "Do DPA or 19AB rules affect me?",
    lede: "Optional. Skip if DPA or 19AB does not apply to you. Official answers come from government sources, not from the practice.",
    honestyLine: ADVISORY,
    breadcrumb: [
      { label: "Home", href: "../index.html" },
      { label: "Join Our Team", href: "../join-our-team.html" },
      { label: "DPA & 19AB" },
    ],
    navOwner: "join-team",
    sideNavHtml: JOIN_ATTRACTION_NAV("dpa-navigator.html"),
    articleHtml: article,
    extraScripts: `<script src="../attraction-tools/dpa-navigator.js?v=wmc-attr-practice-20261104b" defer></script>`,
  });
}

export function renderSessionPlannerHtml(): string {
  const article = `<section class="article-section">
<p>${escapeHtml(ADVISORY)}</p>
<p class="ev-hint">${escapeHtml(OPTIONAL_SKIP)} You can also just mention preferred days in your note to us.</p>
<div class="attraction-tool-panel" id="session-planner-root" data-tool="session-planner">
<p>Note the days and sessions you would prefer — only if that helps you think. Rooms and nursing cover are confirmed with you in person — nothing here is a booking or a request for rooms.</p>
<label><span class="attr-field-label">Preferred days</span><span class="ev-hint" id="sp-days-hint">Example: Mon, Tue, Thu</span><input id="sp-days" aria-describedby="sp-days-hint"/></label>
<label><span class="attr-field-label">Sessions per week</span><span class="ev-hint">Usually a morning or afternoon consulting block.</span><input id="sp-count" type="number" min="1" max="10" value="4" inputmode="numeric"/></label>
<label><span class="attr-field-label">Anything else?</span><span class="ev-hint">Start timing, part-time preferences, or questions — optional.</span><textarea id="sp-notes" rows="3"></textarea></label>
<button class="button" type="button" id="sp-save">Save for myself</button>
<p id="sp-status" class="ev-synth" hidden></p>
</div>
${renderRecommendedNextBand("join-our-team/session-planner.html")}
</section>`;
  return shellWithJourney("session-planner.html", {
    path: "join-our-team/session-planner.html",
    title: "Preferred days | Woolloongabba Medical Centre",
    metaDescription: "Optional note of preferred consulting days before talking with Woolloongabba Medical Centre.",
    h1: "Which days might work?",
    lede: "Optional. Sketch days if it helps — we confirm sessions with you. This is not a booking.",
    honestyLine: ADVISORY,
    breadcrumb: [
      { label: "Home", href: "../index.html" },
      { label: "Join Our Team", href: "../join-our-team.html" },
      { label: "Preferred days" },
    ],
    navOwner: "join-team",
    sideNavHtml: JOIN_ATTRACTION_NAV("session-planner.html"),
    articleHtml: article,
    extraScripts: `<script src="../attraction-tools/session-planner.js?v=wmc-attr-practice-20261104b" defer></script>`,
  });
}

export function renderPracticeSupportHtml(): string {
  const rows: Array<{ cap: string; means: string; detail: string; askHint: string }> = [
    {
      cap: "Rooms",
      means: `Consulting rooms against agreed sessions (${WMC_RECRUITMENT_OFFER.consultRooms} rooms).`,
      detail: "Room allocation is matched to your agreed days and nursing cover — not a first-come open floor.",
      askHint: "Which days / rooms are realistic?",
    },
    {
      cap: "Nursing",
      means: `Treatment-room and preventive support where it fits (${WMC_RECRUITMENT_OFFER.nurses} nurses on roster).`,
      detail: "Nursing can prepare pathways, recalls and treatment-room work so consulting time stays protected.",
      askHint: "What nursing cover sits on my sessions?",
    },
    {
      cap: "Reception",
      means: "Booking, enquiries and patient flow.",
      detail: "Reception manages HotDoc and phone bookings, front-desk enquiries and day-to-day patient flow.",
      askHint: "How are new vs return patients booked?",
    },
    {
      cap: "IT / clinical systems",
      means: "Orientation to practice systems and HotDoc.",
      detail: "Clinical records, appointments and HotDoc pathways are introduced during onboarding — software names confirmed privately.",
      askHint: "What orientation / hand-over looks like?",
    },
    {
      cap: "Governance",
      means: WMC_RECRUITMENT_OFFER.agpalAccredited
        ? "Privacy, emergency and AGPAL-aligned policies."
        : "Privacy, emergency and accredited practice policies.",
      detail: "Practice policies sit alongside your clinical judgement — not as a substitute for it.",
      askHint: "Emergency / after-hours expectations?",
    },
    {
      cap: "Mentoring / peers",
      means: "Colleagues to talk with — not a training guarantee unless agreed.",
      detail: `${WMC_RECRUITMENT_OFFER.gps} GPs on roster means peer discussion is available; formal mentoring is confirmed individually if needed.`,
      askHint: "Is informal peer support enough for me?",
    },
  ];
  const table = rows
    .map(
      (row) =>
        `<tr><th scope="row">${escapeHtml(row.cap)}</th><td class="matrix-means"><strong>${escapeHtml(row.means)}</strong>${escapeHtml(row.detail)}</td><td><label class="matrix-ask"><input type="checkbox" data-matrix="${escapeHtml(row.cap)}" /><span>Ask</span></label><span class="matrix-ask-hint">${escapeHtml(row.askHint)}</span></td></tr>`,
    )
    .join("");
  const article = `<section class="article-section">
<p>${escapeHtml(ADVISORY)}</p>
<div class="attraction-tool-panel" data-tool="practice-support-matrix">
<p><strong>Conversation checklist</strong> — tick topics to raise in a confidential discussion. Saved on this device only; nothing is sent until you choose to contact us.</p>
<table class="attraction-matrix"><thead><tr><th scope="col">Support</th><th scope="col">What it means here</th><th scope="col">Ask about?</th></tr></thead><tbody>${table}</tbody></table>
<button class="button" type="button" id="matrix-save">Save checklist on this device</button>
<p id="matrix-status" class="ev-synth" hidden></p>
</div>
${renderRecommendedNextBand("join-our-team/practice-support.html")}
</section>`;
  return shellWithJourney("practice-support.html", {
    path: "join-our-team/practice-support.html",
    title: "Practice support | Woolloongabba Medical Centre",
    metaDescription: "Rooms, nursing, reception and systems around consulting at Woolloongabba Medical Centre.",
    h1: "How the practice supports consulting",
    lede: "Rooms, nursing, reception and systems around the consult — so you can see what sits beside the clinical work.",
    honestyLine: ADVISORY,
    breadcrumb: [
      { label: "Home", href: "../index.html" },
      { label: "Join Our Team", href: "../join-our-team.html" },
      { label: "Practice Support" },
    ],
    navOwner: "join-team",
    sideNavHtml: JOIN_ATTRACTION_NAV("practice-support.html"),
    articleHtml: article,
    extraScripts: `<script src="../attraction-tools/practice-support.js?v=wmc-attr-ev-20261105a" defer></script>`,
  });
}

export function renderRegistrarPathwayHtml(): string {
  const stages = [
    "Learn how the practice works",
    "Ask about supervision capacity",
    "Check your own timing and paperwork",
    "Introduce yourself",
    "Talk with the practice",
    "Onboarding if you both agree",
  ];
  const article = `<section class="article-section">
<p>Registrar and early-career places depend on supervision and room capacity — they are not always open.</p>
<ol>${stages.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>
${renderRecommendedNextBand("join-our-team/registrar-pathway.html")}
</section>`;
  return shellWithJourney("registrar-pathway.html", {
    path: "join-our-team/registrar-pathway.html",
    title: "Registrar & Early Career Pathway | Woolloongabba Medical Centre",
    metaDescription: "Registrar and early-career conversations at Woolloongabba Medical Centre, subject to capacity.",
    h1: "Registrar and early career",
    lede: "Supervision, training support and session growth — timed against what the practice can offer now.",
    honestyLine: "We do not run open intake. Timing depends on supervision and capacity.",
    breadcrumb: [
      { label: "Home", href: "../index.html" },
      { label: "Join Our Team", href: "../join-our-team.html" },
      { label: "Registrar Pathway" },
    ],
    navOwner: "join-team",
    sideNavHtml: JOIN_ATTRACTION_NAV("registrar-pathway.html"),
    articleHtml: article,
  });
}

export function renderOpportunityPackHtml(_quotes: StorySurfaceQuote[] = []): string {
  const article = `<section class="article-section" id="pack">
<div class="attraction-pack-document">
<p class="eyebrow">Would I like a few pages to keep?</p>
<h2>Pages worth bookmarking</h2>
<p>Short links about how this practice works — useful if you want to think it over, or share with a partner, before you talk with us. This is not a job offer.</p>
<div class="join-journey-grid join-journey-grid--2">
<article class="join-journey-card"><h3><a href="../about-us/practice-experience.html">Practice Experience</a></h3><p>How the day runs — nursing, reception, continuity and session rhythm.</p></article>
<article class="join-journey-card"><h3><a href="gp-opportunities.html">GP Opportunities</a></h3><p>Whether this practice is likely to fit you, and how a conversation usually starts.</p></article>
<article class="join-journey-card"><h3><a href="../about-us/community-catchment.html">Community &amp; Catchment</a></h3><p>Where we are in Brisbane and who shapes the consulting book.</p></article>
<article class="join-journey-card"><h3><a href="../about-us/continuity-in-practice.html">Continuity in Practice</a></h3><p>How relationships and unfinished stories return across the week.</p></article>
<article class="join-journey-card"><h3><a href="practice-support.html">Practice Support</a></h3><p>Rooms, nursing, reception and the systems around consulting.</p></article>
<article class="join-journey-card"><h3><a href="gp-faq.html">GP FAQ</a></h3><p>Common questions doctors ask before getting in touch.</p></article>
</div>
<p class="attraction-pack-download"><a class="button" href="/assets/attraction/opportunity-pack-summary.txt" data-track-pack-download data-pack-id="gp-opportunity-pack" download="wmc-gp-opportunity-pack.txt">Download a one-page summary</a></p>
</div>
${renderRecommendedNextBand("join-our-team/opportunity-pack.html")}
</section>`;
  return shellWithJourney("opportunity-pack.html", {
    path: "join-our-team/opportunity-pack.html",
    title: "Pages to keep | Woolloongabba Medical Centre",
    metaDescription: "A short set of practice pages for GPs considering Woolloongabba Medical Centre.",
    h1: "A few pages to take away",
    lede: "Key pages about the practice, support and next steps — for when you want to think before you talk with us.",
    honestyLine: "This is not a job offer. It does not promise sessions, patient volume or Medicare outcomes.",
    breadcrumb: [
      { label: "Home", href: "../index.html" },
      { label: "Join Our Team", href: "../join-our-team.html" },
      { label: "Pages to keep" },
    ],
    navOwner: "join-team",
    sideNavHtml: JOIN_ATTRACTION_NAV("opportunity-pack.html"),
    articleHtml: article,
    bodyClass: "ev-pack-page",
    pageType: "conversion",
  });
}

export function renderExpressInterestHtml(clinicSlug: string): string {
  // Enquiry stage only: named contact + confidentiality are injected by public-ux refine.
  // No side-nav, journey next-step, or explore reading — form is the page.
  const article = `<section class="article-section eoi-focus-stack" id="express-interest" data-eoi-focus-stack="true">
<form id="eoi-form" class="attraction-tool-panel" data-clinic-slug="${escapeHtml(clinicSlug)}">
<div class="eoi-field-grid">
<label><span class="attr-field-label">Name</span><input name="name" required autocomplete="name"/></label>
<label><span class="attr-field-label">Mobile</span><input name="phone" type="tel" required autocomplete="tel" inputmode="tel"/></label>
<label><span class="attr-field-label">Email</span><input name="email" type="email" required autocomplete="email"/></label>
<label><span class="attr-field-label">Preferred contact method</span>
<select name="preferredContact" required>
<option value="">Select…</option>
<option value="phone">Phone call</option>
<option value="email">Email</option>
<option value="callback">Callback at a convenient time</option>
</select>
</label>
</div>
<label><span class="attr-field-label">Optional message</span><span class="ev-hint">Anything helpful — or leave blank.</span><textarea name="availabilityNotes" rows="3"></textarea></label>
<button class="button" type="submit">Request a Confidential Discussion</button>
</form>
<div id="eoi-result" hidden></div>
</section>`;
  return renderEvPageShell({
    path: "join-our-team/express-interest.html",
    title: "Express Interest | Woolloongabba Medical Centre",
    metaDescription: "Start a confidential GP discussion with Woolloongabba Medical Centre — no CV required for first contact.",
    heroEyebrow: "Confidential GP enquiry",
    h1: "Request a confidential discussion",
    lede: "",
    honestyLine: "This starts a confidential conversation. It is not a job offer or a promise of sessions.",
    breadcrumb: [
      { label: "Home", href: "../index.html" },
      { label: "Join Our Team", href: "../join-our-team.html" },
      { label: "Express Interest" },
    ],
    navOwner: "join-team",
    sideNavHtml: "",
    articleHtml: article,
    bodyClass: "ev-eoi-page eoi-focus-page",
    pageType: "conversion",
    extraScripts: toolScript("express-interest", clinicSlug),
  });
}

function journeyCard(
  href: string,
  title: string,
  blurb: string,
  feature = false,
  variant: "default" | "story" = "default",
): string {
  const cls = [
    "join-journey-card",
    feature ? "join-journey-card--feature" : "",
    variant === "story" ? "join-journey-card--story" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `<article class="${cls}"><a class="join-journey-card-hit" href="${escapeHtml(href)}"><h3>${escapeHtml(title)} <span class="join-journey-card-affordance" aria-hidden="true">→</span></h3><p>${escapeHtml(blurb)}</p></a></article>`;
}

export function renderJoinOurTeamHubHtml(): string {
  const article = `
<section class="article-section" id="join-hub-start">
<p class="eyebrow">Could this practice be a fit?</p>
<h2>A few useful pages</h2>
<p>Woolloongabba Medical Centre is built on continuity and long-term relationships — not high-throughput consulting. Start with the week in the rooms, jump to current roles, or write to us when you are ready.</p>
<div class="join-hub-cta-row">
<a class="button" href="about-us/practice-experience.html">Practice Experience</a>
<a class="button-secondary join-hub-cta-highlight" href="join-our-team/gp-opportunities.html">GP Opportunities</a>
<a class="button-secondary" href="join-our-team/express-interest.html">Express Interest</a>
<a class="text-link" href="join-our-team/opportunity-pack.html">Pages to keep</a>
</div>
</section>

<section class="article-section" id="how-joining-works">
<p class="eyebrow">How people usually get a feel for us</p>
<h2>Useful pages — in any order</h2>
<p>Picture the work, see whether you would fit (and any roles we are advertising), glance at optional paperwork questions if you need them, then start a conversation when you are ready.</p>
</section>

<section class="article-section join-journey-band join-journey-band--feature" id="understand-practice" data-journey-group="understand">
<p class="eyebrow">What is it actually like to work here?</p>
<h2>Practice Experience</h2>
<p>How the day runs — nursing, continuity, rooms and the quiet systems that keep consulting coherent.</p>
<ul class="join-module-chips" aria-label="Practice Experience modules">
<li>Day structure</li><li>Nursing support</li><li>Continuity</li><li>Rooms &amp; flow</li><li>Team rhythm</li><li>Community context</li><li>First ninety days</li>
</ul>
<div class="join-hub-cta-row">
<a class="button-secondary" href="about-us/practice-experience.html">Open Practice Experience <span aria-hidden="true">→</span></a>
</div>
<div class="join-journey-grid join-journey-grid--3">
${journeyCard("about-us/community-catchment.html", "Community & Catchment", "Who will I be caring for?", false, "story")}
${journeyCard("about-us/continuity-in-practice.html", "Continuity in Practice", "How does continuity show up in the week?", false, "story")}
${journeyCard("about-us/clinical-interests.html", "Clinical Interests", "Can my interests sit inside general practice here?", false, "story")}
</div>
</section>

<section class="article-section join-journey-band" id="explore-opportunities" data-journey-group="opportunities">
<p class="eyebrow">Would I fit here?</p>
<h2>Current opportunities &amp; support</h2>
<p>See whether a conversation makes sense — including any roles currently advertised — and what support sits around consulting.</p>
<div class="join-journey-grid join-journey-grid--3">
${journeyCard("join-our-team/gp-opportunities.html", "GP Opportunities", "Would I fit here — and are there roles open now?")}
${journeyCard("join-our-team/practice-support.html", "Practice Support", "What sits around the consult?")}
${journeyCard("join-our-team/registrar-pathway.html", "Registrar Pathway", "Is there a pathway if I am early in my GP career?")}
</div>
</section>

<section class="article-section join-journey-band" id="check-readiness" data-journey-group="readiness">
<p class="eyebrow">Optional — only if useful</p>
<h2>Questions some doctors still have</h2>
<p>Not required before you call or write. Use only if you are still working something out.</p>
<div class="join-journey-grid join-journey-grid--2">
${journeyCard("join-our-team/gp-faq.html", "GP FAQ", "What do doctors usually ask before getting in touch?")}
${journeyCard("join-our-team/doctor-readiness.html", "Am I ready to talk?", "Optional — only if a private sense-check helps.")}
${journeyCard("join-our-team/provider-number-readiness.html", "Provider numbers", "Optional — only if provider numbers are still on your mind.")}
${journeyCard("join-our-team/dpa-navigator.html", "DPA & 19AB", "Optional — skip if DPA or 19AB does not apply to you.")}
${journeyCard("join-our-team/session-planner.html", "Preferred days", "Optional — jot preferred days if it helps.")}
</div>
</section>

<section class="article-section join-journey-band" id="opportunity-pack" data-journey-group="pack">
<p class="eyebrow">Would I like a few pages to keep?</p>
<h2>Pages to keep</h2>
<p>Bookmarks while you decide — practice experience, support and how to get in touch.</p>
<div class="join-hub-cta-row">
<a class="button-secondary" href="join-our-team/opportunity-pack.html">Open pages to keep</a>
</div>
</section>

<section class="article-section join-journey-band join-journey-band--climax" id="express-interest" data-journey-group="eoi">
<p class="eyebrow">Ready for a conversation?</p>
<h2>Start a conversation with the practice</h2>
<p>A short introduction is enough. Someone at the practice reads every note.</p>
<div class="join-hub-cta-row">
<a class="button" href="join-our-team/express-interest.html">Express Interest</a>
<a class="button-secondary" href="tel:+61732173344">Call about joining</a>
</div>
</section>
${renderRecommendedNextBand("join-our-team.html")}`;

  return shellWithJourney("join-our-team.html", {
    path: "join-our-team.html",
    title: "Join Our Team | Woolloongabba Medical Centre",
    metaDescription:
      "Join Woolloongabba Medical Centre — continuity-focused general practice, opportunities and how to get in touch.",
    h1: "Join Our Team",
    lede: "A continuity-focused practice — read how we work, see if it fits, then get in touch.",
    honestyLine:
      "These pages describe how the practice works for doctors. They are not job advertisements or offers of employment.",
    breadcrumb: [
      { label: "Home", href: "index.html" },
      { label: "Join Our Team" },
    ],
    navOwner: "join-team",
    sideNavHtml: JOIN_ATTRACTION_NAV("join-our-team.html", ""),
    onThisPageHtml: `<a href="#how-joining-works">Useful pages</a><a href="#understand-practice">Practice Experience</a><a href="#explore-opportunities">Opportunities</a><a href="#check-readiness">Optional questions</a><a href="#express-interest">Express Interest</a>`,
    articleHtml: article,
    bodyClass: "ev-join-hub-page",
    pageType: "conversion",
  });
}
