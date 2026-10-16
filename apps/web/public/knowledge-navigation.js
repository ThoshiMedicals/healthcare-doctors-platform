/* Healthcare Knowledge Centre topic navigation.
 * Keep complete static links available without JavaScript. Once enhanced:
 * one topic group opens at a time; small screens get a compact topic toggle.
 */
(() => {
  'use strict';
  const nav = document.querySelector('aside.knowledge-unified-nav[data-knowledge-nav="unified"]');
  if (!nav || nav.dataset.knowledgeEnhanced === 'true') return;
  const groups = [...nav.querySelectorAll('details.knowledge-nav-group')];
  const home = nav.querySelector('a.knowledge-nav-home');
  const groupList = nav.querySelector('.knowledge-nav-groups');
  if (groups.length !== 4 || !home || !groupList) return;
  nav.dataset.knowledgeEnhanced = 'true';
  const layout = nav.closest('.page-layout');
  if (layout) layout.classList.add('knowledge-topics-ready');

  const desktop = window.matchMedia('(min-width: 1025px)');
  const mobile = window.matchMedia('(max-width: 700px)');
  const content = document.createElement('div');
  const toggle = document.createElement('button');
  content.className = 'knowledge-topics-content';
  content.id = 'knowledge-topics-content';
  toggle.className = 'knowledge-topics-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-controls', content.id);
  toggle.textContent = 'Browse topics';
  nav.insertBefore(toggle, home);
  nav.insertBefore(content, home);
  content.append(home, groupList);

  function chooseInitialGroup() {
    const current = groups.find(group => group.dataset.currentGroup === 'true');
    const chosen = current || (desktop.matches ? groups[0] : null);
    groups.forEach(group => { group.open = group === chosen; });
  }

  // Native <details>/<summary> supplies keyboard and screen-reader semantics.
  groups.forEach(group => group.addEventListener('toggle', () => {
    if (!group.open) return;
    groups.forEach(other => {
      if (other !== group && other.open) other.open = false;
    });
  }));

  function setMobileExpanded(expanded) {
    content.hidden = !expanded;
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.setAttribute('aria-label', (expanded ? 'Hide' : 'Show') + ' Knowledge Centre topics');
  }

  toggle.addEventListener('click', () => setMobileExpanded(content.hidden));

  function setMode() {
    chooseInitialGroup();
    toggle.hidden = !mobile.matches;
    if (mobile.matches) {
      // Let the user open topics intentionally. On all larger screens, show links.
      setMobileExpanded(false);
    } else {
      setMobileExpanded(true);
    }
  }
  setMode();
  for (const query of [desktop, mobile]) {
    if (query.addEventListener) query.addEventListener('change', setMode);
    else if (query.addListener) query.addListener(setMode);
  }
})();
