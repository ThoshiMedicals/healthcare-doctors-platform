/**
 * Code-only refinements for install-wmc-app.html (Phase B1).
 * Corrects overclaims and adds older-patient help without CMS republish.
 */

const MARKER = "wmc-install-landing-b1";

/**
 * Idempotent presentation fixes for the install landing page.
 */
export function refineInstallWmcAppLanding(html: string, pagePath: string): string {
  if (pagePath !== "install-wmc-app.html") return html;
  let next = html;

  // Remove internal phase jargon from patient-facing copy.
  next = next.replace(
    /Phase 3A patient hub features, optimised for your phone\./gi,
    "Tools from the Patient Hub, organised for your phone.",
  );

  // Digital Reception is practice Q&A / next-step help — not messaging staff.
  next = next.replace(
    /Message our team without waiting on hold when supported\./gi,
    "Find answers to common practice questions and the next step for your visit.",
  );

  // Older-patient assist block (once).
  if (!new RegExp(`data-${MARKER}=["']1["']`, "i").test(next)) {
    const help =
      `<aside class="patient-install-panel" data-${MARKER}="1" aria-labelledby="wmc-install-help-title">` +
      `<h3 id="wmc-install-help-title">Need help installing?</h3>` +
      `<p>These steps work best with larger text and a quiet moment. Reception can help you at the clinic, or call ` +
      `<a href="tel:+61732173344">(07) 3217 3344</a>.</p>` +
      `<p>This is the Woolloongabba Medical Centre Patient App (Home Screen shortcut). ` +
      `It is separate from the HotDoc app in the App Store or Google Play.</p>` +
      `</aside>`;

    if (/id=["']wmc-install-mobile["']/i.test(next)) {
      next = next.replace(
        /(<div\b[^>]*\bid=["']wmc-install-mobile["'][^>]*>)/i,
        `${help}$1`,
      );
    } else if (/id=["']patient-install-handoff["']/i.test(next)) {
      next = next.replace(
        /(<\/section>\s*)(?=<div class="breadcrumb-bar"|<section class="page-main")/i,
        `${help}$1`,
      );
    } else if (/<\/main>/i.test(next)) {
      next = next.replace(/<\/main>/i, `${help}</main>`);
    }
  }

  return next;
}
