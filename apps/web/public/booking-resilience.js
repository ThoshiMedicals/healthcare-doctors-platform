/* Woolloongabba Medical Centre — HotDoc booking resilience.
   Preserves the official HotDoc Lightbox when operational; provides direct
   practitioner-specific HotDoc and phone alternatives when it cannot open. */
(() => {
  'use strict';
  const HOTDOC_HOST = 'www.hotdoc.com.au';
  const CALL_HREF = 'tel:+61732173344';
  const WIDGET_PATTERN = 'hotdoc-widgets.min.js';
  const source = Array.from(document.scripts).find(s => (s.src || '').includes(WIDGET_PATTERN));
  let scriptState = 'loading';
  let activeLink = null;
  let returnFocus = null;
  let launchId = 0;
  let timer = null;

  const completeLoad = () => { scriptState = 'ready'; };
  const failLoad = () => { scriptState = 'failed'; };
  if (source) {
    source.addEventListener('load', completeLoad, { once: true });
    source.addEventListener('error', failLoad, { once: true });
  } else {
    scriptState = 'failed';
  }
  // A firewall or content blocker may leave the script pending without an error.
  window.setTimeout(() => { if (scriptState === 'loading') scriptState = 'unavailable'; }, 12000);

  const panel = document.createElement('section');
  panel.className = 'wmc-booking-recovery';
  panel.id = 'wmc-booking-recovery';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'wmc-booking-recovery-title');
  panel.setAttribute('aria-describedby', 'wmc-booking-recovery-description');
  panel.setAttribute('tabindex', '-1');
  panel.innerHTML = `
    <div class="wmc-booking-recovery-card">
      <button type="button" class="wmc-booking-recovery-close" aria-label="Close booking assistance">Close</button>
      <h2 id="wmc-booking-recovery-title">Need help booking?</h2>
      <p id="wmc-booking-recovery-description">HotDoc booking did not open in this page. You can continue securely on HotDoc, or call our reception team.</p>
      <div class="wmc-booking-recovery-actions">
        <a class="wmc-booking-recovery-online" href="#" target="_blank" rel="noopener noreferrer">Book Appointment</a>
        <a class="wmc-booking-recovery-call" href="${CALL_HREF}">Call Clinic</a>
      </div>
      <p class="wmc-booking-recovery-note">The Book Appointment option opens HotDoc in a separate tab only when the in-page booking cannot open.</p>
    </div>`;
  document.body.appendChild(panel);
  const online = panel.querySelector('.wmc-booking-recovery-online');
  const close = panel.querySelector('.wmc-booking-recovery-close');
  const body = panel.querySelector('.wmc-booking-recovery-card');
  let inertSnapshot = [];
  const isolateDialog = () => {
    inertSnapshot = [...document.body.children].filter(el => el !== panel && el.tagName !== 'SCRIPT').map(el => [el, el.inert]);
    inertSnapshot.forEach(([el]) => { el.inert = true; });
  };
  const restorePage = () => { inertSnapshot.forEach(([el, previous]) => { if (el.isConnected) el.inert = previous; }); inertSnapshot = []; };

  function safeDirectUrl(link) {
    try {
      const url = new URL(link.href);
      if (url.protocol !== 'https:' || url.hostname !== HOTDOC_HOST ||
          !url.pathname.startsWith('/medical-centres/')) return null;
      url.searchParams.delete('wp');
      url.hash = '';
      return url.href;
    } catch (_) { return null; }
  }
  const clinicUrl = 'https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors';

  function closePanel() {
    panel.hidden = true;
    document.body.classList.remove('wmc-booking-recovery-open');
    restorePage();
    const target = returnFocus;
    returnFocus = null;
    if (target && target.isConnected && !target.closest('[aria-hidden="true"]') &&
        typeof target.focus === 'function') target.focus({ preventScroll: true });
  }
  function showFallback(link) {
    if (timer) { clearTimeout(timer); timer = null; }
    activeLink = link;
    returnFocus = link.closest('.digital-reception-panel') ? document.querySelector('.digital-reception-launcher') : link;
    online.href = safeDirectUrl(link) || clinicUrl;
    // Digital Reception has its own focus trap; close it before the fallback dialog.
    const reception = document.querySelector('.digital-reception-panel.is-open .digital-reception-close');
    if (reception) reception.click();
    panel.hidden = false;
    document.body.classList.add('wmc-booking-recovery-open');
    isolateDialog();
    online.focus({ preventScroll: true });
  }
  document.addEventListener('focusin', e => {
    if (!panel.hidden && !panel.contains(e.target)) online.focus({ preventScroll: true });
  });
  close.addEventListener('click', closePanel);
  panel.addEventListener('click', e => { if (e.target === panel) closePanel(); });
  panel.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); closePanel(); return; }
    if (e.key !== 'Tab') return;
    const items = [close, online, panel.querySelector('.wmc-booking-recovery-call')];
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  function bookingOverlayIsVisible() {
    // The provider's booking UI is presented in a large embedded frame or dialog.
    const candidates = document.querySelectorAll('iframe, [role="dialog"], [class*="hotdoc"], [id*="hotdoc"]');
    for (const node of candidates) {
      if (panel.contains(node) || node.closest('.wmc-booking-recovery')) continue;
      const tag = node.tagName.toLowerCase();
      if (tag === 'iframe' && !/hotdoc/i.test(node.src || '')) continue;
      // Only an actual HotDoc surface proves the booking experience opened.
      // An unrelated fixed dialog must not suppress the booking recovery actions.
      if (tag !== 'iframe' && !/hotdoc/i.test((node.className || '') + ' ' + (node.id || '')) &&
          !node.querySelector('iframe[src*="hotdoc"], [class*="hotdoc"], [id*="hotdoc"]')) continue;
      if (node.closest('.digital-reception-panel')) continue;
      if (tag !== 'iframe') {
        let el = node, overlayLike = false;
        while (el && el !== document.body) {
          if (getComputedStyle(el).position === 'fixed' || (el.matches('dialog[open]'))) { overlayLike = true; break; }
          el = el.parentElement;
        }
        if (!overlayLike) continue;
      }
      const r = node.getBoundingClientRect();
      if (r.width >= 180 && r.height >= 160 && getComputedStyle(node).visibility !== 'hidden' &&
          getComputedStyle(node).display !== 'none') return true;
    }
    return false;
  }

  // Capture click before navigation but allow the official HotDoc handler to run.
  // This also covers buttons inserted dynamically by Digital Reception.
  document.addEventListener('click', e => {
    const link = e.target.closest('a[data-hotdoc-button][data-hotdoc-widget="lightbox"]');
    if (!link) return;
    const direct = safeDirectUrl(link);
    activeLink = link;
    if (!direct) { e.preventDefault(); e.stopImmediatePropagation(); showFallback(link); return; }
    // Don't let a missing provider handler redirect a patient unexpectedly.
    e.preventDefault();
    launchId += 1;
    const thisLaunch = launchId;
    if (timer) { clearTimeout(timer); timer = null; }
    if (scriptState !== 'ready') {
      e.stopImmediatePropagation();
      showFallback(link);
      return;
    }
    // If the provider loads but its popup does not appear, offer a secure recovery.
    timer = window.setTimeout(() => {
      if (thisLaunch === launchId && !bookingOverlayIsVisible()) showFallback(link);
      timer = null;
    }, 5500);
  }, true);

  // External provider errors can be surfaced instantly while a booking is pending.
  if (source) source.addEventListener('error', () => {
    if (activeLink && !panel.hidden) return;
    if (timer) { const link = activeLink; if (link) showFallback(link); }
  });
  // Success feedback must never be inferred from clicking a booking CTA or from
  // merely opening HotDoc. Its verified completion callback is not exposed by
  // the current third-party lightbox; retain this hook for an authorised future
  // integration which can confirm that a booking has genuinely completed.
  let confirmationShown = false;
  function showVerifiedConfirmation() {
    if (confirmationShown) return false;
    confirmationShown = true;
    const notice = document.createElement('div');
    notice.className = 'wmc-booking-confirmation';
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    notice.textContent = 'Your appointment booking has been confirmed.';
    document.body.appendChild(notice);
    // This confirmation appears once, and never starts an animation loop.
    window.setTimeout(() => { notice.remove(); }, 6000);
    return true;
  }
  window.WMCBookingResilience = Object.freeze({
    getStatus: () => scriptState,
    getFallbackOpen: () => !panel.hidden,
    // Invoke only after a provider-verified booking completion callback.
    showVerifiedConfirmation
  });
})();
