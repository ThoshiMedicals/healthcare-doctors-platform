/**
 * Shared HTML shell for Experience Validation attraction pages.
 * Does not edit golden master files. No JobPosting schema.
 */

import { isRecruitmentHoldActive } from "@/importer/recruitment-hold";
import { JOURNEY_BY_PAGE } from "./journey-questions";

export const EV_BANNER_HTML = `<aside class="ev-banner" role="note" data-ev-banner="true">
<p class="ev-banner-title"><strong>Draft pages for review</strong></p>
<p>These pages help doctors understand Woolloongabba Medical Centre before a conversation.
Some stories, images or examples may still be temporary until the practice approves final wording and media.
This is a review environment — not the final public site in every detail.</p>
</aside>`;

/** Compact EV notice — Story flagship (PE Wave 1): less visual competition with hero/feature. */
export const EV_BANNER_HTML_COMPACT = `<aside class="ev-banner ev-banner--compact" role="note" data-ev-banner="true">
<p><strong>Draft for review.</strong> Some examples may still be temporary until the practice approves final media — not every detail is final yet.</p>
</aside>`;

export const EV_BANNER_STYLE = `<style id="ev-banner-style">
:root{
--attr-navy:#12324f;--attr-navy-ink:#1e3a5f;--attr-wash:#f5f8fc;--attr-paper:#fff;--attr-tool-field:#f8fafc;--attr-border:#e2e8f0;--attr-border-strong:#c5d4e8;--attr-muted:#64748b;--attr-body:#334155;--attr-teal:#3d6b8c;
--attr-space-xs:8px;--attr-space-sm:14px;--attr-space-md:24px;--attr-space-lg:36px;--attr-space-xl:56px;--attr-space-hero:56px;
--attr-measure-lede:40ch;--attr-measure-lede-wide:68ch;--attr-measure-story:52ch;--attr-font-serif:"Libre Baskerville",Georgia,serif;--attr-font-sans:Inter,system-ui,sans-serif
}
.ev-banner{background:#fff8e6;border:1px solid #e6c96a;border-radius:10px;padding:.85rem 1.1rem;margin:0 0 1.25rem;color:#3d3418}
.ev-banner-title{margin:0 0 .25rem;font-size:.85rem;letter-spacing:.02em;font-family:var(--attr-font-sans)}
.ev-banner p{margin:.3rem 0;font-size:.875rem;line-height:1.45}
.ev-banner--compact{padding:.55rem .9rem;margin:0 0 1rem;border-radius:8px}
.ev-banner--compact p{margin:0;font-size:.8rem;line-height:1.4}
.ev-synth{font-size:.8rem;color:#5a4d28;margin-top:.5rem}
.ev-hint{font-size:.85rem;color:var(--attr-ink-muted,#5c6570);margin:.35rem 0 .75rem}
.pe-honesty{display:none!important}
/* P0-2: keep patient Book accessible but demote vs recruitment sticky on Attraction */
body[data-ev="true"] .header-cta .button.wmc-book-appointment,
body[data-attraction-type] .header-cta .button.wmc-book-appointment,
body[data-attraction-surface="true"] .header-cta .button.wmc-book-appointment{
background:transparent!important;color:var(--attr-navy-ink)!important;border:1px solid var(--attr-navy-ink)!important;
box-shadow:none!important;font-weight:500!important;min-height:2.4rem;padding:.45rem .9rem
}
body[data-ev="true"] .mobile-header-book,
body[data-attraction-type] .mobile-header-book,
body[data-attraction-surface="true"] .mobile-header-book{background:transparent!important;color:var(--attr-navy-ink)!important;border:1px solid var(--attr-border-strong);font-weight:500}
body[data-ev="true"] .persistent-care-actions--recruitment,
body[data-attraction-type] .persistent-care-actions--recruitment,
body[data-attraction-surface="true"] .persistent-care-actions--recruitment{
left:50%!important;right:auto!important;bottom:22px;transform:translateX(-50%);
background:transparent!important;border:0!important;border-radius:999px!important;
box-shadow:none!important;z-index:60;max-width:calc(100vw - 44px);overflow:visible!important
}
body[data-ev="true"] .persistent-care-actions--recruitment .persistent-care-actions-inner,
body[data-attraction-type] .persistent-care-actions--recruitment .persistent-care-actions-inner,
body[data-attraction-surface="true"] .persistent-care-actions--recruitment .persistent-care-actions-inner{
border-radius:0!important;overflow:visible;background:transparent!important;box-shadow:none!important;border:0!important;padding:0!important
}
body[data-ev="true"] .persistent-care-actions--recruitment.is-suppressed,
body[data-attraction-type] .persistent-care-actions--recruitment.is-suppressed,
body[data-attraction-surface="true"] .persistent-care-actions--recruitment.is-suppressed{
transform:translate(-50%,10px);opacity:0;pointer-events:none
}
body[data-ev="true"] .persistent-care-actions--recruitment .persistent-care-book,
body[data-attraction-type] .persistent-care-actions--recruitment .persistent-care-book,
body[data-attraction-surface="true"] .persistent-care-actions--recruitment .persistent-care-book{
min-height:3rem;font-weight:700;letter-spacing:.01em
}
@media(max-width:700px){
body[data-ev="true"] .persistent-care-actions--recruitment,
body[data-attraction-type] .persistent-care-actions--recruitment,
body[data-attraction-surface="true"] .persistent-care-actions--recruitment{
left:10px!important;right:10px!important;width:auto;max-width:none;transform:none;bottom:calc(10px + env(safe-area-inset-bottom))
}
body[data-ev="true"] .persistent-care-actions--recruitment.is-suppressed,
body[data-attraction-type] .persistent-care-actions--recruitment.is-suppressed,
body[data-attraction-surface="true"] .persistent-care-actions--recruitment.is-suppressed{
transform:translateY(10px)
}
}
/* PE flagship Wave 1 */
body.ev-pe-page .page-hero.page-hero--story,
body.ev-pe-page .page-hero.pe-hero{
position:relative;background:linear-gradient(135deg,var(--attr-wash) 0%,#eef3f8 48%,#fff 100%);
padding-top:2.5rem;padding-bottom:var(--attr-space-hero);border-bottom:1px solid var(--attr-border)
}
body.ev-pe-page .page-hero .pe-honesty{background:rgba(255,255,255,.72);padding:.65rem .85rem;border-radius:8px;border:1px solid var(--attr-border)}
body.ev-pe-page .attraction-story-feature{margin-top:.25rem}
body.ev-pe-page .attraction-story-feature .attraction-story-figure img{max-height:480px;width:100%;height:auto;object-fit:cover;border-radius:0;display:block}
body.ev-pe-page .pe-feature-figure{margin:0;overflow:hidden}
/* Chapter illustrations — support copy; not equal-weight heroes.
   Keep ~16:9 on laptop so max-height alone does not force ~2.4:1 face crops. */
body.ev-pe-page .pe-media--chapter,body.pe-hub-page .pe-media--chapter{margin:0.85rem 0 1.15rem;max-width:min(42rem,100%)}
body.ev-pe-page .pe-media--chapter img,body.pe-hub-page .pe-media--chapter img{
width:100%;height:auto;aspect-ratio:16/9;max-height:360px;object-fit:cover;object-position:center 28%;display:block;border-radius:2px
}
@media(max-width:700px){
body.ev-pe-page .attraction-story-feature .attraction-story-figure img{max-height:220px}
body.ev-pe-page .pe-media--chapter,body.pe-hub-page .pe-media--chapter{max-width:100%;margin:0.65rem 0 0.9rem}
body.ev-pe-page .pe-media--chapter img,body.pe-hub-page .pe-media--chapter img{max-height:200px;object-position:center 24%}
}
body.ev-pe-page .attraction-next-step--quiet h2,
body.ev-pe-page .attraction-next-step h2{font-family:var(--attr-font-serif)!important;font-size:1.45rem;font-weight:700}
body.ev-pe-page .attraction-next-step .eyebrow{letter-spacing:.12em}
body[data-attraction-type] .page-hero{padding-bottom:var(--attr-space-hero)}
body[data-attraction-type] .page-hero .eyebrow{font-family:var(--attr-font-sans);font-size:.72rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--attr-teal)}
body[data-attraction-type] .page-hero .lede{font-family:var(--attr-font-sans);font-size:1.125rem;line-height:1.5;max-width:var(--attr-measure-lede);color:var(--attr-body)}
body[data-attraction-type="story"] .page-hero{background:linear-gradient(180deg,var(--attr-wash) 0%,#fff 100%)}
body[data-attraction-type="story"] .page-hero h1{font-family:var(--attr-font-serif)!important;font-size:clamp(2rem,3vw,2.6rem);line-height:1.15;color:var(--attr-navy);font-weight:700}
body[data-attraction-type="story"] .page-hero .lede,
body.ev-pe-page .page-hero .lede{max-width:min(var(--attr-measure-lede-wide),100%);width:100%}
body[data-attraction-type="conversion"] .page-hero .lede{max-width:min(var(--attr-measure-lede-wide),100%)}
body[data-attraction-type="story"] .article{max-width:none}
body[data-attraction-type="story"] .article>.article-section>h2,body[data-attraction-type="story"] .article h2{font-family:var(--attr-font-serif)!important;font-size:clamp(1.5rem,2.2vw,1.9rem);line-height:1.25;color:var(--attr-navy);font-weight:700}
/* Use the full article column — a 52ch measure left ~40% empty and stretched sections vertically. */
body[data-attraction-type="story"] .article>.article-section>p,
body[data-attraction-type="story"] .article>.article-section>ul,
body[data-attraction-type="story"] .article>.article-section>ol,
body.ev-pe-page .pe-article .pe-module>p,
body.ev-pe-page .pe-article .pe-module>ul,
body.pe-hub-page .pe-article .pe-module>p,
body.pe-hub-page .pe-article .pe-module>ul{max-width:none!important;width:100%!important;line-height:1.55}
body[data-attraction-type="story"] .article-section{margin:var(--attr-space-xl) 0;padding:0}
body[data-attraction-type="tool"] .page-hero{background:#f8fafc;border-bottom:1px solid var(--attr-border)}
body[data-attraction-type="tool"] .page-hero h1{font-family:var(--attr-font-sans)!important;font-size:clamp(1.65rem,2.4vw,2rem);line-height:1.2;color:var(--attr-navy);font-weight:600}
body[data-attraction-type="tool"] .article h2{font-family:var(--attr-font-sans)!important;font-size:1.35rem;font-weight:600;color:var(--attr-navy)}
body[data-attraction-type="tool"] .article-section{margin:var(--attr-space-md) 0}
body[data-attraction-type="tool"] .article p{line-height:1.45}
body[data-attraction-type="conversion"] .page-hero{background:linear-gradient(135deg,var(--attr-wash) 0%,#eef3f8 55%,#e8eef5 100%)}
body[data-attraction-type="conversion"] .page-hero h1{font-family:var(--attr-font-serif)!important;font-size:clamp(2rem,3vw,2.65rem);line-height:1.15;color:var(--attr-navy);font-weight:700}
body[data-attraction-type="conversion"].ev-pack-page .page-hero h1,body[data-attraction-type="conversion"].ev-opportunities-page .page-hero h1{font-family:var(--attr-font-sans)!important;font-weight:650;font-size:clamp(1.75rem,2.6vw,2.2rem)}
body[data-attraction-type="conversion"] .article-section{margin:var(--attr-space-lg) 0}
/* Join hub — large right-bleed photo soft-merged into hero wash (not a floating card) */
body.ev-join-hub-page .page-hero.page-hero--conversion.careers-employer-hero{position:relative;overflow:hidden;isolation:isolate;min-height:clamp(280px,30vw,390px);max-height:480px}
body.ev-join-hub-page .page-hero.careers-employer-hero .careers-employer-hero-inner{position:static;display:flex;align-items:center;padding-top:1.15rem;padding-bottom:1.15rem;min-height:inherit;max-width:none;grid-template-columns:none;gap:0}
body.ev-join-hub-page .page-hero.careers-employer-hero .careers-employer-hero-copy{position:relative;z-index:2;max-width:min(34rem,48%);padding-right:1.25rem}
body.ev-join-hub-page .page-hero.careers-employer-hero .careers-employer-hero-copy h1{font-size:clamp(1.75rem,2.5vw,2.25rem)!important;margin:.35rem 0 .5rem}
body.ev-join-hub-page .page-hero.careers-employer-hero .careers-employer-hero-copy .lede{font-size:1rem;line-height:1.45;margin:0}
body.ev-join-hub-page .page-hero.careers-employer-hero .page-hero-inner{max-width:none}
body.ev-join-hub-page .page-hero.careers-employer-hero .careers-employer-hero-visual{position:absolute;inset:0 0 0 auto;width:min(62vw,820px);margin:0;overflow:hidden;border-radius:0;background:transparent;box-shadow:none;z-index:0;-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 18%,#000 100%);mask-image:linear-gradient(90deg,transparent 0%,#000 18%,#000 100%)}
body.ev-join-hub-page .page-hero.careers-employer-hero .careers-employer-hero-visual img{display:block;width:100%;height:100%;min-height:100%;aspect-ratio:auto;object-fit:cover;object-position:center 38%}
body.ev-join-hub-page .page-hero.careers-employer-hero::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(90deg,rgba(238,243,248,.94) 0%,rgba(238,243,248,.78) 36%,rgba(238,243,248,.22) 58%,transparent 76%)}
body.ev-join-hub-page #join-hub-start{margin-top:.35rem;padding:1.15rem 1.25rem 1.25rem;border:1px solid var(--attr-border);border-radius:14px;background:var(--attr-wash)}
body.ev-join-hub-page #join-hub-start .eyebrow{margin:0 0 .35rem;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;font-weight:600;color:var(--attr-teal);font-family:var(--attr-font-sans)}
body.ev-join-hub-page #join-hub-start h2{margin:0 0 .45rem;font-family:var(--attr-font-serif)!important;font-size:1.45rem;color:var(--attr-navy)}
body.ev-join-hub-page #join-hub-start>p:not(.eyebrow){margin:0 0 .85rem;max-width:none}
body.ev-join-hub-page #how-joining-works{margin:1.5rem 0 1rem;padding-bottom:.35rem;border-bottom:1px solid var(--attr-border)}
body.ev-join-hub-page #how-joining-works .eyebrow{margin:0 0 .35rem;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;font-weight:600;color:var(--attr-teal);font-family:var(--attr-font-sans)}
body.ev-join-hub-page #how-joining-works h2{margin:0 0 .4rem;font-family:var(--attr-font-serif)!important;font-size:1.55rem;color:var(--attr-navy)}
body.ev-join-hub-page #how-joining-works p:not(.eyebrow){margin:0;max-width:48rem;color:var(--attr-muted)}
/* Attraction footer — three even columns instead of empty right void */
body[data-ev="true"] .footer-grid.attraction-footer-grid,
body[data-attraction-type] .footer-grid.attraction-footer-grid{
grid-template-columns:minmax(220px,1.15fr) minmax(160px,.85fr) minmax(200px,1fr)!important;
gap:1.75rem 2.25rem!important;align-items:start!important
}
body[data-ev="true"] .attraction-footer-grid .footer-nav-explore .footer-accordion-content,
body[data-attraction-type] .attraction-footer-grid .footer-nav-explore .footer-accordion-content{
display:grid;grid-template-columns:1fr;gap:.35rem
}
body[data-ev="true"] .attraction-footer-grid .footer-hours,
body[data-attraction-type] .attraction-footer-grid .footer-hours{
display:grid;gap:.2rem;margin:0 0 .85rem;font-size:.85rem;color:rgba(248,250,252,.88)
}
body[data-ev="true"] .attraction-footer-grid .footer-hours strong,
body[data-attraction-type] .attraction-footer-grid .footer-hours strong{color:#fff;margin-bottom:.15rem}
body[data-ev="true"] .attraction-footer-grid .footer-contact,
body[data-attraction-type] .attraction-footer-grid .footer-contact{margin:0 0 .85rem}
body[data-ev="true"] .attraction-footer-grid .footer-trust,
body[data-attraction-type] .attraction-footer-grid .footer-trust{margin-top:.85rem}
body[data-ev="true"] .attraction-footer-grid .footer-trust img,
body[data-attraction-type] .attraction-footer-grid .footer-trust img{max-height:56px;width:auto}
body[data-ev="true"] .footer-bottom,
body[data-attraction-type] .footer-bottom{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.75rem 1.25rem;align-items:center}
@media(max-width:900px){
body[data-ev="true"] .footer-grid.attraction-footer-grid,
body[data-attraction-type] .footer-grid.attraction-footer-grid{grid-template-columns:1fr 1fr!important}
body[data-ev="true"] .attraction-footer-grid>.footer-identity,
body[data-attraction-type] .attraction-footer-grid>.footer-identity{grid-column:1/-1}
body[data-ev="true"] footer .footer-grid > div:first-child,
body[data-attraction-type] footer .footer-grid > div:first-child,
body[data-ev="true"] .footer-identity,
body[data-attraction-type] .footer-identity{
display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:none!important;
gap:14px!important;justify-items:start;min-width:0
}
body[data-ev="true"] footer .footer-grid > div:first-child > .footer-brand,
body[data-ev="true"] footer .footer-grid > div:first-child > p,
body[data-ev="true"] footer .footer-grid > div:first-child > .footer-trust,
body[data-attraction-type] footer .footer-grid > div:first-child > .footer-brand,
body[data-attraction-type] footer .footer-grid > div:first-child > p,
body[data-attraction-type] footer .footer-grid > div:first-child > .footer-trust{
grid-column:1/-1!important;grid-row:auto!important;width:100%;margin:0!important
}
body[data-ev="true"] .footer-identity .footer-brand img,
body[data-attraction-type] .footer-identity .footer-brand img{display:block;max-width:min(100%,280px)!important;height:auto!important;width:auto!important}
body[data-ev="true"] .footer-identity>p,
body[data-attraction-type] .footer-identity>p{margin:0!important;max-width:36rem;line-height:1.5}
body[data-ev="true"] .footer-identity .footer-trust,
body[data-attraction-type] .footer-identity .footer-trust{margin-top:0!important;justify-content:flex-start;gap:12px!important}
}
@media(max-width:560px){
body[data-ev="true"] .footer-grid.attraction-footer-grid,
body[data-attraction-type] .footer-grid.attraction-footer-grid{grid-template-columns:1fr!important}
}
@media(max-width:900px){
body.ev-join-hub-page .page-hero.careers-employer-hero{min-height:0}
body.ev-join-hub-page .page-hero.careers-employer-hero .careers-employer-hero-inner{display:grid;grid-template-columns:1fr;gap:1.1rem;align-items:start;padding-top:1.25rem;padding-bottom:1.25rem}
body.ev-join-hub-page .page-hero.careers-employer-hero .careers-employer-hero-copy{max-width:none;padding-right:0}
body.ev-join-hub-page .page-hero.careers-employer-hero .careers-employer-hero-visual{position:relative;inset:auto;width:100%;border-radius:16px;-webkit-mask-image:none;mask-image:none;min-height:220px}
body.ev-join-hub-page .page-hero.careers-employer-hero .careers-employer-hero-visual img{min-height:220px;aspect-ratio:16/10}
body.ev-join-hub-page .page-hero.careers-employer-hero::after{display:none}
}
.attraction-tool-panel{border:1px solid var(--attr-border);border-radius:12px;padding:var(--attr-space-md);margin:var(--attr-space-sm) 0;background:var(--attr-tool-field)}
body[data-attraction-type="tool"] .attraction-tool-panel{background:var(--attr-tool-field);box-shadow:none}
.attraction-tool-panel h3{margin-top:0;font-family:var(--attr-font-sans);font-size:1.05rem;color:var(--attr-navy);font-weight:600}
body[data-attraction-type="tool"] details.attraction-tool-panel{padding:.85rem 1rem}
body[data-attraction-type="tool"] details.attraction-tool-panel summary{
  cursor:pointer;font-family:var(--attr-font-sans);color:var(--attr-navy);
  display:block;min-height:44px;padding:.35rem 0;line-height:1.35;font-size:1rem;font-weight:650;
}
.page-nav .nav-group-title,.page-nav .nav-title{margin:1rem 0 .35rem;font-size:.75rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--attr-muted)}
body[data-attraction-type] .page-hero .eyebrow,
.attraction-next-step .eyebrow,
.attraction-fit-pillars .eyebrow,
.join-journey-band .eyebrow{font-size:.75rem;letter-spacing:.05em}
.page-nav a.nav-cta-primary{font-weight:600}
.page-nav a.nav-cta-accent{color:#fff!important;background:#0f8b8d!important;border-radius:8px;font-weight:650;padding:.35rem .65rem;margin:.15rem 0}
.page-nav a.nav-cta-accent:hover,.page-nav a.nav-cta-accent.active{background:#0c7375!important;color:#fff!important}
body[data-attraction-type] .page-nav a.active{background:var(--attr-wash);border-radius:8px}
body[data-attraction-type="story"] .page-nav a.active{background:#eef4f9}
body[data-attraction-type="tool"] .page-nav a.active{background:#e8eef5;font-weight:600}
body[data-attraction-type="conversion"] .page-nav a.active,body[data-attraction-type="conversion"] .page-nav a.nav-cta-primary.active{background:#e4edf6;font-weight:650}
.join-hub-cta-row{display:flex;flex-wrap:wrap;gap:.75rem;margin:1rem 0 1.25rem;align-items:center}
.join-hub-cta-row .button-secondary,.join-hub-cta-row a.button-secondary{display:inline-flex;align-items:center;gap:.35rem;min-height:2.75rem;padding:.65rem 1.1rem;border:1px solid var(--attr-navy-ink);border-radius:8px;color:var(--attr-navy-ink);text-decoration:none;font-weight:600;background:#fff}
.join-hub-cta-row .button-secondary:hover,.join-hub-cta-row a.button-secondary:hover{background:#eef4f9;border-color:var(--attr-navy)}
.join-hub-cta-row a.button-secondary.join-hub-cta-highlight{background:#0f8b8d;border-color:#0f8b8d;color:#fff}
.join-hub-cta-row a.button-secondary.join-hub-cta-highlight:hover{background:#0c7375;border-color:#0c7375;color:#fff}
.attraction-fit-pillars{margin:1.25rem 0 1.5rem;padding:1.15rem 1.25rem;border:1px solid var(--attr-border);border-radius:14px;background:var(--attr-wash)}
.attraction-fit-pillars .eyebrow{margin:0 0 .35rem;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;font-weight:600;color:var(--attr-teal);font-family:var(--attr-font-sans)}
.attraction-fit-pillars h2{margin:0 0 .45rem;font-family:var(--attr-font-serif)!important;font-size:1.35rem;color:var(--attr-navy)}
.attraction-fit-pillars>p{margin:0 0 .85rem;color:var(--attr-muted);max-width:42rem}
.attraction-fit-pillar-list{list-style:none;margin:0;padding:0;display:grid;gap:.65rem}
.attraction-fit-pillar-list li{margin:0;padding:.7rem .85rem;border-radius:10px;background:#fff;border:1px solid var(--attr-border);color:var(--attr-body);font-size:.95rem;line-height:1.45}
.attraction-fit-pillar-list strong{display:block;margin-bottom:.15rem;color:var(--attr-navy);font-family:var(--attr-font-sans);font-size:.88rem}
.careers-opportunity-actions{display:flex;flex-wrap:wrap;gap:.55rem;margin-top:.85rem;align-items:center}
.careers-opportunity-actions .button-secondary,.careers-opportunity-actions a.button-secondary{display:inline-flex;align-items:center;min-height:2.5rem;padding:.55rem 1rem;border:1px solid var(--attr-navy-ink);border-radius:8px;color:var(--attr-navy-ink);text-decoration:none;font-weight:600;background:#fff}
.careers-opportunity-actions a[data-track-opportunity-cta="pack"]{border-color:var(--attr-teal);color:var(--attr-teal)}
.join-hub-cta-row .text-link{display:inline-flex;align-items:center;gap:.35rem;min-height:2.75rem;padding:.55rem .95rem;border:1px solid var(--attr-navy-ink);border-radius:8px;font-size:.95rem;font-weight:600;color:var(--attr-navy-ink);text-decoration:none;background:#fff;border-bottom:1px solid var(--attr-navy-ink)}
.join-hub-cta-row .text-link:hover{background:#eef4f9;color:var(--attr-navy)}
.join-journey-band{margin:var(--attr-space-lg) 0;padding:var(--attr-space-md) 0;border-top:1px solid var(--attr-border)}
.join-journey-band--feature{padding:var(--attr-space-lg) 1.35rem;border:1px solid var(--attr-border-strong);border-radius:14px;background:var(--attr-wash);border-top:1px solid var(--attr-border-strong)}
.join-journey-band--climax{padding:var(--attr-space-xl) 1.5rem;border-radius:14px;background:var(--attr-navy);color:#f8fafc!important;border:none;border-top:none}
/* Beat site .page-main .article h2/p institutional slate on navy climax */
.page-main .article .join-journey-band--climax,
.page-main .article .join-journey-band--climax h2,
.page-main .article .join-journey-band--climax p,
.page-main .article .join-journey-band--climax .eyebrow,
.join-journey-band--climax h2,
.join-journey-band--climax p{color:#f8fafc!important}
.join-journey-band--climax .button{background:#f8fafc;color:var(--attr-navy)!important;min-height:3rem;font-weight:650}
.join-journey-band--climax a.button-secondary{border-color:#f8fafc;color:#f8fafc!important;background:transparent}
.join-journey-band .eyebrow{margin:0 0 .35rem;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;font-weight:600;color:var(--attr-teal);font-family:var(--attr-font-sans)}
.join-journey-band--climax .eyebrow{color:#b6d0e8!important}
.join-journey-grid{display:grid;gap:.75rem;margin-top:1rem}
@media(min-width:720px){.join-journey-grid--2{grid-template-columns:1fr 1fr}.join-journey-grid--3{grid-template-columns:1fr 1fr 1fr}.join-journey-grid--4{grid-template-columns:1fr 1fr 1fr 1fr}}
.join-journey-card{border:1px solid var(--attr-border);border-radius:12px;padding:0;background:#fff;transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease}
.join-journey-card-hit{display:block;padding:1rem 1.1rem;color:inherit;text-decoration:none;border-radius:12px;min-height:100%;outline-offset:2px}
.join-journey-card-hit:focus-visible{outline:3px solid #174f75}
.join-journey-card h3{margin:.15rem 0 .35rem;font-size:1.05rem;font-family:var(--attr-font-sans);font-weight:600;color:var(--attr-navy);display:flex;align-items:baseline;justify-content:space-between;gap:.5rem}
.join-journey-card-affordance{flex:0 0 auto;color:var(--attr-teal);font-weight:700;font-size:1.05rem;line-height:1;transform:translateX(0);transition:transform .18s ease}
.join-journey-card p{margin:0;font-size:.92rem;line-height:1.45;color:#475569}
.join-journey-card:hover{border-color:#9bb4c8;box-shadow:0 8px 20px rgba(23,48,68,.08)}
.join-journey-card:hover .join-journey-card-affordance{transform:translateX(3px)}
@media(prefers-reduced-motion:reduce){.join-journey-card,.join-journey-card-affordance{transition:none}}
/* Equal explore cards — no false “selected” accent; keep card chrome so links read as actions */
.join-journey-card--feature{border-color:var(--attr-border);background:#fff;box-shadow:none}
.join-journey-card--story{border:1px solid var(--attr-border);border-radius:12px;padding:0;background:#fff}
.join-journey-card--story h3{color:var(--attr-navy)}
/* Override .article ul/li padding + li+li margin that misalign chips in a flex row */
.page-main .article ul.join-module-chips,
.join-module-chips{
display:flex;flex-wrap:wrap;align-items:center;gap:8px;
margin:.85rem 0 0;padding:0!important;list-style:none!important
}
.page-main .article ul.join-module-chips>li,
.join-module-chips>li{
display:inline-flex;align-items:center;margin:0!important;padding:.35rem .65rem;
font-size:.72rem;line-height:1.2;border-radius:999px;background:#e8eef5;color:var(--attr-navy-ink);
font-family:var(--attr-font-sans);font-weight:500;list-style:none
}
.page-main .article ul.join-module-chips>li::marker,.join-module-chips>li::marker{content:""}
.persistent-care-actions--recruitment .persistent-care-book{background:var(--attr-navy);color:#fff;text-decoration:none;font-weight:650}
.attraction-next-step{margin:var(--attr-space-lg) 0 0;padding:1.25rem 1.35rem;border:1px solid var(--attr-border-strong);border-radius:14px;background:var(--attr-wash)}
.attraction-next-step .eyebrow{margin:0 0 .35rem;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;font-weight:600;color:var(--attr-teal)}
.attraction-next-step h2{margin:.15rem 0 .5rem;font-size:1.35rem;line-height:1.25;font-family:var(--attr-font-serif);font-weight:700;color:var(--attr-navy)}
body[data-attraction-type="tool"] .attraction-next-step h2{font-family:var(--attr-font-sans);font-weight:650;font-size:1.25rem}
.attraction-next-step p{margin:0 0 1rem;font-size:.95rem;line-height:1.45;color:var(--attr-body)}
.attraction-next-step-actions{display:flex;flex-wrap:wrap;gap:.75rem;align-items:center}
.attraction-next-step-actions .button-secondary,.attraction-next-step-actions a.button-secondary{display:inline-flex;align-items:center;min-height:2.75rem;padding:.65rem 1.1rem;border:1px solid var(--attr-navy-ink);border-radius:8px;color:var(--attr-navy-ink);text-decoration:none;font-weight:600}
body[data-attraction-type="story"] .attraction-next-step,body[data-attraction-type="tool"] .attraction-next-step{background:transparent;border-color:transparent;border-top:1px solid var(--attr-border);border-radius:0;padding:var(--attr-space-md) 0 0}
body[data-attraction-type="story"] .attraction-next-step .button,body[data-attraction-type="tool"] .attraction-next-step .button{background:transparent;color:var(--attr-navy-ink);border:1px solid var(--attr-navy-ink)}
body[data-attraction-type="conversion"] .attraction-next-step--to-eoi{background:var(--attr-wash);border-color:var(--attr-border-strong)}
.attraction-next-step--end{background:transparent;border:none;border-top:1px solid var(--attr-border);border-radius:0;padding:var(--attr-space-md) 0 0}
.attraction-next-step--end .attraction-next-step-actions .button{display:none}
.attraction-story-figure{margin:0 0 var(--attr-space-lg);border-radius:14px;overflow:hidden;background:var(--attr-wash)}
.attraction-story-figure img{display:block;width:100%;height:auto;max-height:420px;object-fit:cover}
.attraction-story-figure figcaption{font-size:.8rem;color:var(--attr-muted);padding:.65rem 1rem .85rem;font-family:var(--attr-font-sans);line-height:1.4}
.attraction-story-feature{display:grid;gap:var(--attr-space-md);margin:0 0 var(--attr-space-xl)}
@media(min-width:900px){.attraction-story-feature{grid-template-columns:1.1fr .9fr;align-items:center}.attraction-story-feature .attraction-story-figure{margin:0}}
.attraction-conversion-panel{padding:var(--attr-space-lg) 1.35rem;border-radius:14px;background:var(--attr-wash);border:1px solid var(--attr-border-strong);box-shadow:inset 4px 0 0 var(--attr-navy);margin:0 0 var(--attr-space-lg)}
.attraction-conversion-panel h2{margin-top:0;color:var(--attr-navy)}
.attraction-pack-document{padding:var(--attr-space-lg) 1.5rem;border-radius:14px;background:#fff;border:1px solid var(--attr-border-strong);margin:0 0 var(--attr-space-md)}
.attraction-pack-document>.eyebrow{margin:0 0 .35rem}
.attraction-pack-document>h2{margin:.15rem 0 .75rem;font-family:var(--attr-font-serif);color:var(--attr-navy);font-size:clamp(1.5rem,2.2vw,1.9rem)}
.attraction-pack-document>.join-journey-grid{margin:1.25rem 0 1.5rem}
.attraction-pack-download{margin:1.25rem 0 0}
.attraction-story-feature--copy{display:block;padding:var(--attr-space-lg) 0 var(--attr-space-md);border-bottom:1px solid var(--attr-border);margin:0 0 var(--attr-space-lg)}
.attraction-story-feature--copy .attraction-story-feature-copy{max-width:var(--attr-measure-story)}
/* GP Journey feature stills — editorial, not brochure heroes */
.attraction-journey-feature{margin:0 0 var(--attr-space-lg);max-width:min(52rem,100%)}
.attraction-journey-feature img{display:block;width:100%;height:auto;max-height:340px;object-fit:cover;border-radius:2px}
body.ev-catchment-page .attraction-journey-feature,body.ev-opportunities-page .attraction-journey-feature{margin-top:.15rem}
@media(max-width:700px){
.attraction-journey-feature{max-width:100%;margin:0 0 .85rem}
.attraction-journey-feature img{max-height:200px}
}
.attraction-eoi-climax{padding:var(--attr-space-xl) 1.5rem;border-radius:14px;background:var(--attr-navy);color:#f8fafc;margin:0 0 var(--attr-space-lg)}
.attraction-eoi-climax p,.attraction-eoi-climax label{color:#e8eef5}
.attraction-eoi-climax .attraction-tool-panel{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.18);color:#f8fafc}
.attraction-eoi-climax .attraction-tool-panel label,.attraction-eoi-climax .attraction-tool-panel .attr-field-label{color:#f8fafc}
.attraction-eoi-climax .attraction-tool-panel .ev-hint{color:rgba(248,250,252,.78)}
.eoi-optional-details{border:1px solid var(--attr-border);border-radius:12px;padding:1rem 1rem .35rem;margin:1rem 0 1.25rem;background:var(--attr-tool-field)}
.eoi-optional-details legend{font-family:var(--attr-font-sans);font-weight:600;color:var(--attr-navy);padding:0 .35rem}
.attraction-eoi-climax .eoi-optional-details{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.18)}
.attraction-eoi-climax .eoi-optional-details legend{color:#f8fafc}
.attraction-eoi-climax input,.attraction-eoi-climax textarea{background:#fff;color:var(--attr-navy);border-radius:8px;border:1px solid #c5d4e8;width:100%;padding:.55rem .7rem;margin-top:.35rem;font-family:var(--attr-font-sans)}
.attraction-eoi-climax .button{background:#f8fafc;color:var(--attr-navy);font-weight:650;min-height:3rem}
.attraction-matrix{width:100%;border-collapse:collapse;font-family:var(--attr-font-sans);font-size:.92rem}
.attraction-matrix th,.attraction-matrix td{border-bottom:1px solid var(--attr-border);padding:.65rem .5rem;text-align:left;vertical-align:top}
.attraction-matrix th{color:var(--attr-navy);font-weight:600;width:22%}
.attraction-matrix th[scope=col]:last-child,.attraction-matrix td:last-child{width:9.5rem;white-space:nowrap}
.attraction-matrix .matrix-ask{display:inline-flex;align-items:center;gap:.45rem;margin:0;width:auto;flex-direction:row;font-size:.84rem;font-weight:600;color:var(--attr-navy);cursor:pointer}
.attraction-matrix .matrix-ask input[type=checkbox]{
appearance:auto;-webkit-appearance:checkbox;width:1.05rem;height:1.05rem;min-width:1.05rem;min-height:1.05rem;max-width:1.05rem;margin:0;padding:0;border:1px solid var(--attr-border-strong);border-radius:3px;flex:0 0 auto;accent-color:var(--attr-teal,#0f8b8d)
}
.attraction-matrix .matrix-ask-hint{display:block;margin-top:.35rem;font-size:.78rem;font-weight:500;color:var(--attr-muted);line-height:1.35;white-space:normal;max-width:11rem}
.attraction-matrix td.matrix-means{color:var(--attr-body);line-height:1.45}
.attraction-matrix td.matrix-means strong{display:block;margin-bottom:.2rem;color:var(--attr-navy);font-size:.82rem;font-weight:650}
/* Mobile UX — touch targets, forms, chip scroll, journey access */
.attraction-tool-panel label{display:flex;flex-direction:column;align-items:stretch;gap:.4rem;margin:0 0 1rem;width:100%;font-family:var(--attr-font-sans);font-size:.95rem;color:var(--attr-navy)}
.attraction-tool-panel .attr-field-label{font-weight:600;line-height:1.35}
.attraction-tool-panel input:not([type=checkbox]):not([type=radio]),.attraction-tool-panel textarea,.attraction-tool-panel select{
width:100%;max-width:100%;box-sizing:border-box;min-height:48px;font-size:16px;line-height:1.35;
padding:.75rem .85rem;border:1px solid var(--attr-border-strong);border-radius:10px;background:#fff;color:var(--attr-navy);font-family:var(--attr-font-sans)
}
.attraction-tool-panel input[type=checkbox],.attraction-tool-panel input[type=radio]{
width:auto;max-width:none;min-height:0;padding:0;border-radius:3px
}
.attraction-tool-panel textarea{min-height:7rem;resize:vertical}
.attraction-tool-panel input[type=number]{min-height:48px;-moz-appearance:textfield}
.attraction-tool-panel input[type=number]::-webkit-outer-spin-button,.attraction-tool-panel input[type=number]::-webkit-inner-spin-button{opacity:1;height:44px;min-width:28px}
.attraction-tool-panel .button,.attraction-tool-panel button.button{min-height:48px;width:100%;max-width:24rem;font-size:1rem}
.attraction-eoi-climax .attraction-tool-panel,.attraction-eoi-climax #eoi-form{width:100%;max-width:none}
.attraction-eoi-climax label{width:100%;display:block;margin:0 0 .85rem}
.attraction-eoi-climax .eoi-field-grid{display:grid;gap:.85rem;margin:0 0 .85rem}
@media(min-width:720px){.attraction-eoi-climax .eoi-field-grid{grid-template-columns:1fr 1fr}}
.attraction-eoi-climax .eoi-field-grid label{margin:0}
.attraction-eoi-climax input,.attraction-eoi-climax textarea{min-height:48px;font-size:16px;padding:.75rem .85rem;width:100%;box-sizing:border-box}
.attraction-eoi-climax .button{width:100%;max-width:24rem;min-height:52px}
.persistent-care-actions--call-only .persistent-care-actions-inner{grid-template-columns:1fr}
.persistent-care-actions--call-only .persistent-care-call{
display:inline-flex;align-items:center;justify-content:center;min-height:48px;width:100%;
background:var(--attr-navy);color:#fff;border-radius:12px;font-weight:650;text-decoration:none;padding:.65rem 1rem
}
.on-this-page-shell{position:relative}
body[data-ev="true"] .on-this-page,
body[data-attraction-type] .on-this-page{align-items:center}
body[data-ev="true"] .on-this-page-links,
body[data-attraction-type] .on-this-page-links{display:flex;flex-wrap:wrap;gap:.5rem .75rem;align-items:center;scroll-padding-inline:16px;padding-right:2rem!important;-webkit-overflow-scrolling:touch}
body[data-ev="true"] .on-this-page a,
body[data-attraction-type] .on-this-page a{
display:inline-flex;align-items:center;min-height:44px;padding:.35rem .75rem;border:1px solid var(--attr-border,var(--line));border-radius:999px;background:#fff;color:var(--attr-navy,var(--navy));font-size:.875rem;font-weight:500;text-decoration:none;white-space:nowrap
}
body[data-ev="true"] .on-this-page a:hover,
body[data-attraction-type] .on-this-page a:hover{background:var(--attr-wash,var(--mist));text-decoration:none}
.attr-chip-scroll-hint{display:none;margin:.15rem 0 0;font-size:.75rem;color:var(--attr-muted);font-family:var(--attr-font-sans)}
.on-this-page-shell::after{
content:"";position:absolute;top:1.6rem;right:0;bottom:.35rem;width:2.5rem;pointer-events:none;z-index:1;
background:linear-gradient(90deg,rgba(255,255,255,0),#fff 72%);
}
@media(max-width:900px){
.attr-chip-scroll-hint{display:block}
body[data-attraction-type] .page-layout,body[data-attraction-surface=true] .page-layout,body[data-ev=true] .page-layout{
display:flex!important;flex-direction:column!important;gap:1rem!important
}
body[data-attraction-type] .page-layout>[data-ev-journey-nav=true],
body[data-attraction-surface=true] .page-layout>aside.page-nav[data-ev-journey-nav=true],
body[data-ev=true] .page-layout>aside.page-nav[data-ev-journey-nav=true]{
order:-1!important;position:static!important;display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;
align-items:center!important;gap:8px!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch;
padding:10px 28px 14px 4px!important;margin:0 0 .25rem!important;border:none!important;
border-bottom:1px solid var(--attr-border)!important;background:transparent!important;
grid-template-columns:none!important;scrollbar-width:thin
}
body[data-attraction-type] .page-layout>[data-ev-journey-nav=true] .nav-title,
body[data-attraction-surface=true] .page-layout>aside.page-nav[data-ev-journey-nav=true] .nav-title,
body[data-ev=true] .page-layout>aside.page-nav[data-ev-journey-nav=true] .nav-title{
display:flex!important;flex:0 0 auto!important;align-items:center!important;margin:0!important;padding:0 .35rem 0 0!important;
font-size:.75rem!important;letter-spacing:.05em!important;white-space:nowrap;color:var(--attr-muted)!important;border:none!important
}
body[data-attraction-type] .page-layout>[data-ev-journey-nav=true] .nav-group-title,
body[data-attraction-surface=true] .page-layout>aside.page-nav[data-ev-journey-nav=true] .nav-group-title,
body[data-ev=true] .page-layout>aside.page-nav[data-ev-journey-nav=true] .nav-group-title{display:none!important}
body[data-attraction-type] .page-layout>[data-ev-journey-nav=true] a,
body[data-attraction-surface=true] .page-layout>aside.page-nav[data-ev-journey-nav=true] a,
body[data-ev=true] .page-layout>aside.page-nav[data-ev-journey-nav=true] a{
flex:0 0 auto!important;display:inline-flex!important;align-items:center!important;min-height:44px!important;
padding:8px 12px!important;border:1px solid var(--attr-border)!important;border-radius:999px!important;
background:#fff!important;white-space:nowrap!important;font-size:.82rem!important;line-height:1.2!important;
border-bottom:1px solid var(--attr-border)!important;color:var(--attr-navy)!important
}
body[data-attraction-type] .page-layout>[data-ev-journey-nav=true] a.active,
body[data-attraction-surface=true] .page-layout>aside.page-nav[data-ev-journey-nav=true] a.active,
body[data-ev=true] .page-layout>aside.page-nav[data-ev-journey-nav=true] a.active{
background:var(--attr-navy)!important;color:#fff!important;border-color:var(--attr-navy)!important
}
body[data-attraction-type] .page-layout>.article,body[data-attraction-surface=true] .page-layout>.article,body[data-ev=true] .page-layout>.article{order:1!important;min-width:0!important}
.attraction-eoi-climax{padding:1.1rem .65rem}
.attraction-eoi-climax .attraction-tool-panel,.attraction-eoi-climax #eoi-form{padding:1rem .75rem;margin:.35rem 0 0;width:100%;max-width:none}
.attraction-eoi-climax .button{max-width:none;width:100%}
}
@media(min-width:768px) and (max-width:1024px){
.attraction-eoi-climax .attraction-tool-panel{max-width:34rem}
.attraction-tool-panel .button,.attraction-tool-panel button.button{max-width:20rem}
}
body.ev-eoi-page.has-persistent-care-actions{padding-bottom:88px}
</style>`;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type AttractionPageType = "story" | "tool" | "conversion";

const STORY_KEYS = new Set([
  "practice-experience.html",
  "community-catchment.html",
  "continuity-in-practice.html",
  "clinical-interests.html",
]);
const CONVERSION_KEYS = new Set([
  "join-our-team.html",
  "gp-opportunities.html",
  "opportunity-pack.html",
  "express-interest.html",
]);

export function attractionPageType(path: string): AttractionPageType {
  const key = attractionPageKey(path);
  if (STORY_KEYS.has(key)) return "story";
  if (CONVERSION_KEYS.has(key)) return "conversion";
  return "tool";
}

/**
 * Story chapter still. Employer Brand Integrity: omit non-WMC placeholder assets
 * and never render prototype/placeholder captions.
 */
export function renderStoryFigure(input: {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}): string {
  if (/\/assets\/attraction\/placeholders\//i.test(input.src)) return "";
  const caption =
    input.caption &&
    !/\b(placeholder|synthetic|prototype|replace with|consented)\b/i.test(input.caption)
      ? `<figcaption>${escapeHtml(input.caption)}</figcaption>`
      : "";
  return `<figure class="attraction-story-figure${input.className ? ` ${input.className}` : ""}"><img src="${escapeHtml(input.src)}" alt="${escapeHtml(input.alt)}" loading="lazy" decoding="async"/>${caption}</figure>`;
}

export type EvShellInput = {
  path: string;
  title: string;
  metaDescription: string;
  h1: string;
  lede: string;
  /** Question-led eyebrow above h1 — defaults to practice language */
  heroEyebrow?: string;
  honestyLine?: string;
  breadcrumb: ReadonlyArray<{ label: string; href?: string }>;
  navOwner: "about" | "join-team";
  sideNavHtml: string;
  onThisPageHtml?: string;
  articleHtml: string;
  origin?: string;
  ogImage?: string;
  bodyClass?: string;
  pageType?: AttractionPageType;
  extraHead?: string;
  extraScripts?: string;
};

function assetPrefix(path: string): string {
  return path.includes("/") ? "../" : "";
}

export function renderEvPageShell(input: EvShellInput): string {
  const origin = input.origin ?? "https://gabbamedicalcentre.com.au";
  const pageUrl = `${origin}/${input.path}`;
  const prefix = assetPrefix(input.path);
  const pageType = input.pageType ?? attractionPageType(input.path);
  const bodyClasses = [
    "has-persistent-care-actions",
    input.bodyClass ?? "ev-attraction-page",
    `ev-type-${pageType}`,
  ]
    .filter(Boolean)
    .join(" ");
  const medicalClinic = {
    "@type": ["MedicalClinic", "MedicalOrganization"],
    "@id": `${origin}/#medical-clinic`,
    name: "Woolloongabba Medical Centre",
    url: `${origin}/`,
    telephone: "+61 7 3217 3344",
    email: "reception@gabbamedicalcentre.com.au",
    address: {
      "@type": "PostalAddress",
      streetAddress: "468 Vulture Street",
      addressLocality: "Woolloongabba",
      addressRegion: "QLD",
      postalCode: "4102",
      addressCountry: "AU",
    },
  };
  const graph = {
    "@context": "schema.org",
    "@graph": [
      medicalClinic,
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: input.title,
        description: input.metaDescription,
        inLanguage: "en-AU",
        about: { "@id": `${origin}/#medical-clinic` },
      },
    ],
  };
  // Fix schema context
  (graph as { "@context": string })["@context"] = "https://schema.org";

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: input.breadcrumb.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.label,
      ...(crumb.href ? { item: crumb.href.startsWith("http") ? crumb.href : `${origin}/${crumb.href}` } : {}),
    })),
  };

  const crumbsHtml = input.breadcrumb
    .map((crumb, i, arr) => {
      if (i === arr.length - 1) {
        return `<li><span aria-current="page">${escapeHtml(crumb.label)}</span></li>`;
      }
      const link = crumb.href?.startsWith("../") || crumb.href?.startsWith("/")
        ? crumb.href
        : crumb.href
          ? `${prefix}${crumb.href}`
          : "#";
      return `<li><a href="${escapeHtml(link)}">${escapeHtml(crumb.label)}</a><span aria-hidden="true" class="breadcrumb-separator">›</span></li>`;
    })
    .join("");

  const onThisPage = input.onThisPageHtml
    ? `<div class="shell on-this-page-shell"><nav aria-label="On this page" class="on-this-page"><div class="on-this-page-title">On This Page</div><div class="on-this-page-links">${input.onThisPageHtml}</div></nav><p class="attr-chip-scroll-hint">Swipe sideways for more sections</p></div>`
    : "";

  // Public heroes: no honesty-note banner (kept in content models for CMS/schema only).
  const honesty = "";

  const navOwner = input.navOwner;
  const aboutCurrent = navOwner === "about" ? ' aria-current="location"' : "";
  const joinCurrent = navOwner === "join-team" ? ' aria-current="page"' : "";

  const eoiHref =
    input.path === "join-our-team.html"
      ? "join-our-team/express-interest.html"
      : input.path.startsWith("join-our-team/")
        ? "express-interest.html"
        : `${prefix}join-our-team/express-interest.html`;

  // Recruitment sticky: Express Interest + call on attraction surfaces.
  const isExpressInterestPage = input.path.endsWith("express-interest.html");
  const stickyEoiHref = isExpressInterestPage ? "#eoi-form" : eoiHref;
  const stickyNav =
    navOwner === "join-team" || input.path.startsWith("about-us/")
      ? `<nav aria-label="GP recruitment actions" class="persistent-care-actions persistent-care-actions--recruitment" data-audience="gp-attraction"><div class="persistent-care-actions-inner"><a class="persistent-care-book" href="${escapeHtml(stickyEoiHref)}">Express Interest</a><a aria-label="Call Woolloongabba Medical Centre about joining on (07) 3217 3344" class="persistent-care-call" href="tel:+61732173344">Call about joining</a></div></nav>`
      : `<nav aria-label="Appointment actions" class="persistent-care-actions"><div class="persistent-care-actions-inner"><a class="persistent-care-book wmc-book-appointment" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox">Book Appointment</a><a aria-label="Call Woolloongabba Medical Centre on (07) 3217 3344" class="persistent-care-call" href="tel:+61732173344">Call Clinic</a></div></nav>`;

  return `<!DOCTYPE html>
<html lang="en-AU" data-ev-surface="true">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width,initial-scale=1" name="viewport"/>
<title>${escapeHtml(input.title)}</title>
<meta content="${escapeHtml(input.metaDescription)}" name="description"/>
<link href="${prefix}assets/brand/wmc-brand-mark.webp" rel="icon"/>
<link href="${prefix}assets/brand/wmc-brand-mark.webp" rel="apple-touch-icon"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="${prefix}styles.css" rel="stylesheet"/>
${EV_BANNER_STYLE}
<link href="${pageUrl}" rel="canonical"/>
<meta content="noindex,nofollow" name="robots"/>
<meta content="website" property="og:type"/>
<meta content="${escapeHtml(input.title)}" property="og:title"/>
<meta content="${escapeHtml(input.metaDescription)}" property="og:description"/>
<meta content="${pageUrl}" property="og:url"/>
<meta content="Woolloongabba Medical Centre" property="og:site_name"/>
${input.ogImage ? `<meta content="${escapeHtml(input.ogImage)}" property="og:image"/>` : ""}
<script data-schema="medical-organization" type="application/ld+json">${JSON.stringify(medicalClinic)}</script>
<script data-schema="page" type="application/ld+json">${JSON.stringify(graph)}</script>
<script data-schema="navigation-breadcrumb" type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
${input.extraHead ?? ""}
</head>
<body class="${escapeHtml(bodyClasses)}" data-ev="true" data-attraction-type="${pageType}">
<a class="skip-link" href="#main">Skip to content</a>
<header>
<div class="shell header-inner">
<a aria-label="Woolloongabba Medical Centre home" class="brand" href="${prefix}index.html"><img alt="Healthcare Doctors — Woolloongabba Medical Centre" class="institution-logo-lockup" decoding="async" height="71" src="${prefix}assets/brand/healthcare-doctors-woolloongabba-logo.png" width="475"/></a>
<div aria-label="Quick actions" class="mobile-header-actions" role="group"><a aria-label="Call Woolloongabba Medical Centre" class="mobile-header-action mobile-header-call" href="tel:+61732173344">Call</a><a aria-label="Book Appointment" class="mobile-header-action mobile-header-book wmc-book-appointment" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox">Book Appointment</a></div>
<button aria-controls="primary-nav" aria-expanded="false" aria-label="Open navigation menu" class="menu-toggle" type="button">Menu</button>
<div class="header-cta">
<a class="header-phone" href="tel:+61732173344">(07) 3217 3344</a>
<a class="button wmc-book-appointment" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox">Book Appointment</a>
</div>
</div>
<div class="institution-navigation-row">
<nav aria-label="Primary navigation" class="shell" id="primary-nav" data-nav-owner="${navOwner}" data-nav-is-hub="${navOwner === "join-team" ? "true" : "false"}" data-nav-route="${escapeHtml(input.path)}"><a href="${prefix}services.html" data-nav-key="services">Services</a><a href="${prefix}team.html" data-nav-key="team">Our Team</a><a href="${prefix}about-us.html" data-nav-key="about"${aboutCurrent}>About Us</a><a href="${prefix}patient-information.html" data-nav-key="patient-info">Patient Information</a><a aria-label="Health Advice" href="${prefix}knowledge/index.html" data-nav-key="knowledge">Health Advice</a><a href="${prefix}updates/index.html" data-nav-key="updates">Updates</a><a href="${prefix}join-our-team.html" data-nav-key="join-team"${joinCurrent}>Join Our Team</a><a href="${prefix}contact.html" data-nav-key="contact">Contact</a></nav>
</div>
</header>
<main id="main" tabindex="-1">
${
    (() => {
      const heroEyebrow = escapeHtml(input.heroEyebrow ?? "For doctors considering joining");
      const heroCopy = `<p class="eyebrow">${heroEyebrow}</p>
<h1>${escapeHtml(input.h1)}</h1>
<p class="lede">${escapeHtml(input.lede)}</p>
${honesty}`;
      return input.path === "join-our-team.html"
        ? `<section class="page-hero page-hero--${pageType} careers-page-hero careers-employer-hero"><div class="shell page-hero-inner careers-employer-hero-inner">
<div class="careers-employer-hero-copy">
${heroCopy}
</div>
<figure class="careers-employer-hero-visual">
<!-- Temporary concept photography. Replace with approved WMC photography when available. -->
<img alt="Arriving into reception and the consult corridor at Woolloongabba Medical Centre" decoding="async" fetchpriority="high" height="675" loading="eager" src="${prefix}assets/attraction/journey/join-our-team-feature.jpg" width="1200"/>
</figure>
</div></section>`
        : `<section class="page-hero page-hero--${pageType}"><div class="shell page-hero-inner">
${heroCopy}
</div></section>`;
    })()
  }
<div class="breadcrumb-bar"><div class="shell"><nav aria-label="Breadcrumb" class="visible-breadcrumbs"><ol>${crumbsHtml}</ol></nav></div></div>
${onThisPage}
<section class="page-main"><div class="shell page-layout">
${input.sideNavHtml}
<article class="article" data-ev-article="true" data-content-class="practice">
${input.articleHtml}
</article>
</div></section>
</main>
${stickyNav}
<footer>
<div class="shell">
<div class="footer-grid attraction-footer-grid">
<div class="footer-identity">
<div class="footer-brand"><img alt="Healthcare Doctors — Woolloongabba Medical Centre" class="institution-logo-lockup institution-logo-lockup-footer" decoding="async" height="71" loading="lazy" src="${prefix}assets/brand/healthcare-doctors-woolloongabba-logo.png" width="475"/></div>
<p>A local practice shaped by continuity, familiarity and long-term relationships.</p>
<div class="footer-trust"><img alt="Accredited General Practice" data-local-asset="agpal-mark" src="${prefix}assets/brand/agpal-mark.webp" width="72" height="72" loading="lazy" decoding="async"/></div>
</div>
${attractionFooterNav(prefix)}
${attractionFooterVisit(prefix)}
</div>
<div class="footer-bottom"><span>© <span id="year"></span> Woolloongabba Medical Centre</span><nav class="footer-utility" aria-label="Policies"><a href="${prefix}privacy-confidentiality.html">Privacy &amp; Confidentiality</a><a href="${prefix}feedback-concerns.html">Feedback &amp; Complaints</a></nav></div>
</div>
</footer>
<script src="${prefix}site.js?v=wmc-attr-p0-clear-20261104" defer></script>
<script src="${prefix}attraction-track.js?v=wmc-attr-opp-20261105b" defer></script>
${input.extraScripts ?? ""}
</body>
</html>`;
}

function joinNavLink(
  href: string,
  label: string,
  active: string,
  opts: { cta?: boolean; accent?: boolean } = {},
): string {
  const file = href.split("/").pop() ?? "";
  const activeFile = active.split("/").pop() ?? active;
  const current =
    activeFile === file ||
    active === file ||
    active === href ||
    active.endsWith(`/${file}`) ||
    (file === "join-our-team.html" && (activeFile === "join-our-team.html" || active === ""));
  const cls = [
    current ? "active" : "",
    opts.cta ? "nav-cta-primary" : "",
    opts.accent ? "nav-cta-accent" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `<a href="${href}"${current ? ' aria-current="page"' : ""}${cls ? ` class="${cls}"` : ""}>${label}</a>`;
}

export function attractionPathPrefix(path: string): string {
  return path.includes("/") ? "../" : "";
}

export function attractionPageKey(path: string): string {
  return path.split("/").pop() || path;
}

/** Single join-journey side-rail — use on every Attraction URL. Groups frozen; labels are practice language. */
export const JOIN_ATTRACTION_NAV = (active: string, prefix = "../") => {
  const j = (path: string) => `${prefix}${path}`;
  const hold = isRecruitmentHoldActive();
  const onJoinHub = active === "join-our-team.html" && prefix === "";
  const readinessHref = hold
    ? onJoinHub
      ? "#gp-readiness-portal"
      : `${prefix}join-our-team.html#gp-readiness-portal`
    : j("join-our-team/doctor-readiness.html");
  const eoiHref = hold
    ? onJoinHub
      ? "#confidential-conversation"
      : `${prefix}join-our-team.html#confidential-conversation`
    : j("join-our-team/express-interest.html");
  const body = [
    joinNavLink(j("join-our-team.html"), "Join Our Team", active),
    `<div class="nav-group-title">Understand</div>`,
    joinNavLink(j("about-us/practice-experience.html"), "Practice Experience", active),
    joinNavLink(j("about-us/community-catchment.html"), "Community &amp; Catchment", active),
    joinNavLink(j("about-us/continuity-in-practice.html"), "Continuity in Practice", active),
    joinNavLink(j("about-us/clinical-interests.html"), "Clinical Interests", active),
    `<div class="nav-group-title">Explore</div>`,
    joinNavLink(j("join-our-team/gp-opportunities.html"), "GP Opportunities", active, {
      accent: true,
    }),
    joinNavLink(j("join-our-team/practice-support.html"), "Practice Support", active),
    joinNavLink(j("join-our-team/registrar-pathway.html"), "Registrar Pathway", active),
    `<div class="nav-group-title">Check readiness</div>`,
    joinNavLink(j("join-our-team/gp-faq.html"), "GP FAQ", active),
    joinNavLink(readinessHref, "Am I ready to talk?", active),
    joinNavLink(j("join-our-team/provider-number-readiness.html"), "Provider numbers", active),
    joinNavLink(j("join-our-team/dpa-navigator.html"), "DPA &amp; 19AB", active),
    joinNavLink(j("join-our-team/session-planner.html"), "Preferred days", active),
    `<div class="nav-group-title">Next step</div>`,
    joinNavLink(j("join-our-team/opportunity-pack.html"), "Pages to keep", active),
    joinNavLink(eoiHref, "Confidential conversation", active, {
      cta: true,
    }),
  ].join("");
  return `<aside aria-label="Pages for doctors considering joining" class="page-nav" id="related-pages" data-ev-journey-nav="true"><div class="nav-title">For doctors joining</div>${body}</aside>`;
};

/** @deprecated Use JOIN_ATTRACTION_NAV — kept for any non-Attraction About pages. */
export const ABOUT_ATTRACTION_NAV = JOIN_ATTRACTION_NAV;

export function attractionFooterContact(prefix = ""): string {
  return `<div class="footer-contact" aria-label="Practice contact and location">
<a href="mailto:reception@gabbamedicalcentre.com.au">reception@gabbamedicalcentre.com.au</a>
<a href="tel:+61732173344">Call (07) 3217 3344</a>
<span>Fax (07) 3189 4808</span>
<address>468 Vulture Street, Woolloongabba QLD 4102</address>
<div class="footer-contact-links"><a href="${prefix}contact.html">Contact &amp; Location</a><a href="https://www.google.com/maps/dir/?api=1&amp;destination=468+Vulture+Street+Woolloongabba+QLD+4102" target="_blank" rel="noopener noreferrer">Get Directions</a></div>
</div>`;
}

export function attractionFooterNav(prefix = "../"): string {
  return `<div class="footer-nav footer-nav-explore"><h3>Explore for GPs</h3><div class="footer-accordion-content"><a href="${prefix}join-our-team.html">Join Our Team</a><a href="${prefix}about-us/practice-experience.html">Practice Experience</a><a href="${prefix}join-our-team/gp-opportunities.html">GP Opportunities</a><a href="${prefix}join-our-team/practice-support.html">Practice Support</a><a href="${prefix}join-our-team/opportunity-pack.html">Pages to keep</a><a href="${prefix}join-our-team/gp-faq.html">GP FAQ</a></div></div>`;
}

export function attractionFooterVisit(prefix = "../"): string {
  const hold = isRecruitmentHoldActive();
  const nextStepHref = hold
    ? `${prefix}join-our-team.html#confidential-conversation`
    : `${prefix}join-our-team/express-interest.html`;
  const nextStepLabel = hold ? "Confidential conversation" : "Express Interest";
  return `<div class="footer-nav footer-nav-visit"><h3>Visit &amp; next step</h3><div class="footer-accordion-content">
${attractionFooterContact(prefix)}
<div aria-label="Practice opening hours" role="group" class="footer-hours"><strong>Opening hours</strong><span><b>Mon–Thu</b> 7:00 AM–7:00 PM</span><span><b>Friday</b> 8:00 AM–5:00 PM</span><span><b>Saturday</b> 9:00 AM–5:00 PM</span><span><b>Sunday</b> 9:00 AM–3:00 PM</span></div>
<a href="${nextStepHref}">${nextStepLabel}</a>
<a href="tel:+61732173344">Call about joining</a>
</div></div>`;
}

export type AttractionNextStep = {
  /** Page file key, e.g. practice-experience.html */
  pageKey: string;
  title: string;
  blurb: string;
  /** Primary recommendation — omit when endState */
  primaryLabel?: string;
  primaryHref?: string;
  /** Optional secondary pathway */
  secondaryLabel?: string;
  secondaryHref?: string;
  /** Journey complete — no outbound primary recommendation */
  endState?: boolean;
};

/**
 * Single source of truth for Recommended Next Step destinations.
 * Titles/blurbs are question-led (journey-questions.ts); hrefs/labels stay fixed.
 */
function journeyNext(pageKey: keyof typeof JOURNEY_BY_PAGE): Pick<AttractionNextStep, "title" | "blurb"> {
  const j = JOURNEY_BY_PAGE[pageKey];
  return {
    title: j.nextTitle,
    // Answered → next question → why that page (never a bare redirect)
    blurb: `${j.answered} ${j.nextQuestion} ${j.nextBlurb}`,
  };
}

export const ATTRACTION_NEXT_STEPS: AttractionNextStep[] = [
  {
    pageKey: "join-our-team.html",
    ...journeyNext("join-our-team.html"),
    primaryLabel: "Practice Experience",
    primaryHref: "about-us/practice-experience.html",
    secondaryLabel: "Express Interest",
    secondaryHref: "join-our-team/express-interest.html",
  },
  {
    pageKey: "practice-experience.html",
    ...journeyNext("practice-experience.html"),
    primaryLabel: "GP Opportunities",
    primaryHref: "join-our-team/gp-opportunities.html",
    secondaryLabel: "Express Interest",
    secondaryHref: "join-our-team/express-interest.html",
  },
  {
    pageKey: "community-catchment.html",
    ...journeyNext("community-catchment.html"),
    primaryLabel: "Continuity in Practice",
    primaryHref: "about-us/continuity-in-practice.html",
    secondaryLabel: "GP Opportunities",
    secondaryHref: "join-our-team/gp-opportunities.html",
  },
  {
    pageKey: "continuity-in-practice.html",
    ...journeyNext("continuity-in-practice.html"),
    primaryLabel: "GP Opportunities",
    primaryHref: "join-our-team/gp-opportunities.html",
    secondaryLabel: "Clinical Interests",
    secondaryHref: "about-us/clinical-interests.html",
  },
  {
    pageKey: "clinical-interests.html",
    ...journeyNext("clinical-interests.html"),
    primaryLabel: "GP Opportunities",
    primaryHref: "join-our-team/gp-opportunities.html",
    secondaryLabel: "Express Interest",
    secondaryHref: "join-our-team/express-interest.html",
  },
  {
    pageKey: "gp-opportunities.html",
    ...journeyNext("gp-opportunities.html"),
    primaryLabel: "Practice Support",
    primaryHref: "join-our-team/practice-support.html",
    secondaryLabel: "Pages to keep",
    secondaryHref: "join-our-team/opportunity-pack.html",
  },
  {
    pageKey: "practice-support.html",
    ...journeyNext("practice-support.html"),
    primaryLabel: "Preferred days",
    primaryHref: "join-our-team/session-planner.html",
    secondaryLabel: "Pages to keep",
    secondaryHref: "join-our-team/opportunity-pack.html",
  },
  {
    pageKey: "registrar-pathway.html",
    ...journeyNext("registrar-pathway.html"),
    primaryLabel: "Practice Support",
    primaryHref: "join-our-team/practice-support.html",
    secondaryLabel: "Express Interest",
    secondaryHref: "join-our-team/express-interest.html",
  },
  {
    pageKey: "gp-faq.html",
    ...journeyNext("gp-faq.html"),
    primaryLabel: "Am I ready to talk?",
    primaryHref: "join-our-team/doctor-readiness.html",
    secondaryLabel: "Express Interest",
    secondaryHref: "join-our-team/express-interest.html",
  },
  {
    pageKey: "doctor-readiness.html",
    ...journeyNext("doctor-readiness.html"),
    primaryLabel: "Pages to keep",
    primaryHref: "join-our-team/opportunity-pack.html",
    secondaryLabel: "Express Interest",
    secondaryHref: "join-our-team/express-interest.html",
  },
  {
    pageKey: "provider-number-readiness.html",
    ...journeyNext("provider-number-readiness.html"),
    primaryLabel: "DPA & 19AB",
    primaryHref: "join-our-team/dpa-navigator.html",
    secondaryLabel: "Am I ready to talk?",
    secondaryHref: "join-our-team/doctor-readiness.html",
  },
  {
    pageKey: "dpa-navigator.html",
    ...journeyNext("dpa-navigator.html"),
    primaryLabel: "Am I ready to talk?",
    primaryHref: "join-our-team/doctor-readiness.html",
    secondaryLabel: "GP FAQ",
    secondaryHref: "join-our-team/gp-faq.html",
  },
  {
    pageKey: "session-planner.html",
    ...journeyNext("session-planner.html"),
    primaryLabel: "Pages to keep",
    primaryHref: "join-our-team/opportunity-pack.html",
    secondaryLabel: "Express Interest",
    secondaryHref: "join-our-team/express-interest.html",
  },
  {
    pageKey: "opportunity-pack.html",
    ...journeyNext("opportunity-pack.html"),
    primaryLabel: "Express Interest",
    primaryHref: "join-our-team/express-interest.html",
    secondaryLabel: "Call about joining",
    secondaryHref: "tel:+61732173344",
  },
  {
    pageKey: "express-interest.html",
    ...journeyNext("express-interest.html"),
    endState: true,
    secondaryLabel: "Call about joining",
    secondaryHref: "tel:+61732173344",
  },
];

const NEXT_STEP_BY_PAGE: Record<string, AttractionNextStep> = Object.fromEntries(
  ATTRACTION_NEXT_STEPS.map((s) => [s.pageKey, s]),
);

function resolveAttractionHref(href: string, prefix: string, pagePath: string): string {
  if (href.startsWith("tel:") || href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:")) {
    return href;
  }
  if (pagePath.startsWith("join-our-team/") && href.startsWith("join-our-team/")) {
    return href.replace(/^join-our-team\//, "");
  }
  if (pagePath.startsWith("about-us/") && href.startsWith("about-us/")) {
    return href.replace(/^about-us\//, "");
  }
  if (pagePath === "join-our-team.html") {
    return href;
  }
  return `${prefix}${href}`;
}

/**
 * One Recommended Next Step band for every Attraction page.
 * Replaces generic peer-page cross-link strips.
 */
export function renderRecommendedNextBand(pagePath: string): string {
  const key = attractionPageKey(pagePath);
  const step = NEXT_STEP_BY_PAGE[key];
  if (!step) return "";
  const prefix = attractionPathPrefix(pagePath);
  const pageType = attractionPageType(pagePath);
  const isEnd = Boolean(step.endState);
  const towardEoi =
    !isEnd &&
    ((step.primaryHref?.includes("express-interest") ?? false) ||
      (step.secondaryHref?.includes("express-interest") ?? false));
  const mod = isEnd
    ? " attraction-next-step--end"
    : pageType === "conversion" && towardEoi
      ? " attraction-next-step--to-eoi"
      : pageType === "story" || pageType === "tool"
        ? " attraction-next-step--quiet"
        : "";
  const eyebrow = isEnd ? "When you are ready" : "A natural next question";
  const aria = isEnd ? "Conversation next step" : "A natural next question";
  const primary =
    !isEnd && step.primaryLabel && step.primaryHref
      ? `<a class="button" href="${escapeHtml(resolveAttractionHref(step.primaryHref, prefix, pagePath))}">${escapeHtml(step.primaryLabel)}</a>`
      : "";
  const secondary =
    step.secondaryLabel && step.secondaryHref
      ? `<a class="button-secondary" href="${escapeHtml(resolveAttractionHref(step.secondaryHref, prefix, pagePath))}">${escapeHtml(step.secondaryLabel)}</a>`
      : "";
  const actions =
    primary || secondary
      ? `<div class="attraction-next-step-actions">${primary}${secondary}</div>`
      : "";
  return `<section class="attraction-next-step${mod}" aria-label="${aria}" data-attraction-next="true" data-next-type="${pageType}"${isEnd ? ' data-next-end="true"' : ""}>
<p class="eyebrow">${eyebrow}</p>
<h2>${escapeHtml(step.title)}</h2>
<p>${escapeHtml(step.blurb)}</p>
${actions}
</section>`;
}

/** @deprecated Empty — peer cross-link strips removed; use renderRecommendedNextBand. */
export const CROSSLINKS = {
  pe: "",
  join: "",
};
