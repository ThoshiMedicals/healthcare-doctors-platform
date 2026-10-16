/* Knowledge Centre reading UX: accessible mobile section discovery.
 * Enhances the original On This Page links without duplicating or removing them.
 * With JavaScript disabled the complete navigation remains visible.
 */
(() => {
  'use strict';
  const nav = document.querySelector('main .on-this-page');
  if (!nav || !document.querySelector('article.kc-ux-page')) return;
  const title = nav.querySelector('.on-this-page-title');
  const links = nav.querySelector('.on-this-page-links');
  if (!title || !links || nav.dataset.kcReadingReady === 'true') return;
  const anchors = Array.from(links.querySelectorAll('a[href^="#"]'));
  if (!anchors.length) return;
  nav.dataset.kcReadingReady = 'true';
  const mobile = window.matchMedia('(max-width: 700px)');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'kc-section-toggle';
  button.setAttribute('aria-controls', 'kc-reading-sections');
  links.id = 'kc-reading-sections';
  button.textContent = `Browse ${anchors.length} sections`;
  title.insertAdjacentElement('afterend',button);
  const setOpen = (open) => {
    links.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.textContent = open ? 'Hide page sections' : `Browse ${anchors.length} sections`;
  };
  const updateLayout = () => {
    button.hidden = !mobile.matches;
    // Desktop retains the original fully visible in-page navigation.
    setOpen(!mobile.matches);
  };
  button.addEventListener('click', () => setOpen(links.hidden));
  anchors.forEach(link => link.addEventListener('click', () => {
    if (mobile.matches) setOpen(false);
  }));
  nav.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobile.matches && !links.hidden) {
      setOpen(false);
      button.focus({preventScroll:true});
    }
  });
  if (mobile.addEventListener) mobile.addEventListener('change',updateLayout);
  else mobile.addListener(updateLayout);
  updateLayout();
})();
