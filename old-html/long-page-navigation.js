/* Woolloongabba Medical Centre — long-page navigation enhancement.
 * Adds navigation affordances, not educational content or approval claims.
 * Loaded only by targeted authority pages; gracefully inert without section anchors.
 */
(() => {
  'use strict';
  const sectionNav = document.querySelector('main .on-this-page');
  if (!sectionNav || document.body.classList.contains('home-page')) return;

  const sectionLinks = [...sectionNav.querySelectorAll('.on-this-page-links a[href^="#"]')]
    .map(link => ({ link, id: decodeURIComponent(link.hash.slice(1)), target: document.getElementById(decodeURIComponent(link.hash.slice(1))) }))
    .filter(entry => entry.target);
  if (sectionLinks.length < 3) return;

  document.body.classList.add('wmc-long-page');
  const header = document.querySelector('header');
  const main = document.querySelector('main');
  const content = main.querySelector('.page-main') || main;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  sectionLinks.forEach(({ target }) => target.classList.add('wmc-read-target'));

  const progress = document.createElement('div');
  progress.className = 'wmc-reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  const fill = document.createElement('span');
  fill.className = 'wmc-reading-progress-fill';
  progress.appendChild(fill);
  document.body.appendChild(progress);

  // A compact section chooser is available after the existing On This Page bar
  // scrolls out of view. It never replaces that bar or obscures booking controls.
  const chooser = document.createElement('div');
  chooser.className = 'wmc-section-chooser';
  chooser.hidden = true;
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'wmc-section-trigger';
  trigger.setAttribute('aria-controls', 'wmc-section-chooser-list');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.textContent = 'Sections';
  const panel = document.createElement('nav');
  panel.id = 'wmc-section-chooser-list';
  panel.className = 'wmc-section-list';
  panel.setAttribute('aria-label', 'Jump to a section of this page');
  panel.hidden = true;
  const panelHead = document.createElement('div');
  panelHead.className = 'wmc-section-list-head';
  const panelHeading = document.createElement('span');
  panelHeading.textContent = 'On This Page';
  const panelClose = document.createElement('button');
  panelClose.type = 'button';
  panelClose.className = 'wmc-section-list-close';
  panelClose.textContent = 'Close';
  panelClose.setAttribute('aria-label', 'Close section navigation');
  panelHead.append(panelHeading, panelClose);
  const list = document.createElement('ol');
  list.className = 'wmc-section-list-items';
  const popupLinks = sectionLinks.map(({ link, id }, index) => {
    const item = document.createElement('li');
    const cloned = document.createElement('a');
    cloned.href = `#${encodeURIComponent(id)}`;
    // Reuse the approved, human-edited section labels verbatim.
    cloned.textContent = link.textContent.trim();
    const number = document.createElement('span');
    number.className = 'wmc-section-number';
    number.textContent = String(index + 1).padStart(2, '0');
    number.setAttribute('aria-hidden', 'true');
    cloned.prepend(number);
    item.appendChild(cloned);
    list.appendChild(item);
    return cloned;
  });
  panel.append(panelHead, list);
  chooser.append(trigger, panel);
  document.body.appendChild(chooser);
  let isPanelOpen = false;
  let activeIndex = -1;

  const closePanel = (restoreFocus = false) => {
    if (!isPanelOpen) return;
    isPanelOpen = false;
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus && !chooser.hidden) trigger.focus({ preventScroll: true });
  };
  const openPanel = () => {
    if (chooser.hidden) return;
    isPanelOpen = true;
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    const current = popupLinks[Math.max(0, activeIndex)];
    if (current) {
      current.focus({ preventScroll: true });
      // Scroll the inner list, not the underlying content.
      const containerTop = list.scrollTop;
      const offset = current.parentElement.offsetTop - list.offsetTop;
      if (offset < containerTop || offset > containerTop + list.clientHeight - current.offsetHeight) {
        list.scrollTop = Math.max(0, offset - list.clientHeight / 3);
      }
    }
  };
  trigger.addEventListener('click', () => isPanelOpen ? closePanel(true) : openPanel());
  panelClose.addEventListener('click', () => closePanel(true));
  document.addEventListener('keydown', event => {
    if (isPanelOpen && event.key === 'Escape') {
      event.preventDefault();
      closePanel(true);
    }
  });
  document.addEventListener('pointerdown', event => {
    if (isPanelOpen && !chooser.contains(event.target)) closePanel();
  });
  chooser.addEventListener('focusout', event => {
    if (isPanelOpen && event.relatedTarget && !chooser.contains(event.relatedTarget)) closePanel();
  });

  const revealFaqTargetIfFiltered = (target) => {
    if (!document.querySelector('[data-faq-filters]') || !target.closest('.faq-authority-group')) return;
    if (!target.closest('.faq-authority-group').hidden) return;
    const all = document.querySelector('[data-faq-filter="all"]');
    const search = document.querySelector('[data-faq-search]');
    if (all) all.click();
    if (search && search.value) {
      search.value = '';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };
  // Keep the browser's actual fragment links, including back/forward history.
  // After navigation, move keyboard focus to the heading's section for context.
  const followAnchor = event => {
    const link = event.currentTarget;
    const id = decodeURIComponent(link.hash.slice(1));
    const target = document.getElementById(id);
    if (!target) return;
    revealFaqTargetIfFiltered(target);
    closePanel();
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    window.setTimeout(() => target.focus({ preventScroll: true }), 65);
  };
  sectionLinks.forEach(({ link }) => link.addEventListener('click', followAnchor));
  popupLinks.forEach(link => link.addEventListener('click', followAnchor));

  const compute = () => {
    const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 76;
    document.body.style.setProperty('--wmc-reader-offset', (headerHeight + 20) + 'px');
    const navBounds = sectionNav.getBoundingClientRect();
    const contentBounds = content.getBoundingClientRect();
    const reachedReading = navBounds.bottom < headerHeight + 8;
    const insideReading = contentBounds.bottom > headerHeight + 50;
    const show = reachedReading && insideReading;
    chooser.hidden = !show;
    progress.hidden = !show;
    if (!show) closePanel(false);

    // Whole-reading-area progress, not the scroll position of a particular heading.
    const startY = contentBounds.top + window.scrollY;
    const endY = contentBounds.bottom + window.scrollY;
    const journey = Math.max(1, endY - startY - window.innerHeight * 0.45);
    const percent = Math.max(0, Math.min(1, (window.scrollY - startY + window.innerHeight * 0.2) / journey));
    fill.style.transform = `scaleX(${percent})`;

    let visibleIndex = -1;
    const threshold = headerHeight + 45;
    sectionLinks.forEach(({ target }, index) => {
      if (target.getClientRects().length && target.getBoundingClientRect().top <= threshold) visibleIndex = index;
    });
    const selectedIndex = Math.max(0, visibleIndex);
    if (activeIndex !== selectedIndex) {
      activeIndex = selectedIndex;
      sectionLinks.forEach(({ link }, index) => {
        link.classList.toggle('wmc-section-active', index === activeIndex);
        if (index === activeIndex) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      popupLinks.forEach((link, index) => {
        link.classList.toggle('wmc-section-active', index === activeIndex);
        if (index === activeIndex) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      trigger.textContent = `Sections · ${activeIndex + 1}/${sectionLinks.length}`;
      trigger.setAttribute('aria-label', `Browse page sections; section ${activeIndex + 1} of ${sectionLinks.length}`);
    }
  };
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => { scheduled = false; compute(); });
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('hashchange', schedule);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
  // Respect reduced-motion through native anchor behaviour; the enhancement
  // does not add scroll animation of its own.
  if (prefersReducedMotion.matches) chooser.classList.add('wmc-reduced-motion');
})();
