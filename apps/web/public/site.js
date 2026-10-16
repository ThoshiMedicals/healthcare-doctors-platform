(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav');
  const header = document.querySelector('header');
  const quickActions = document.querySelector('.mobile-header-actions');
  if (quickActions && !quickActions.hasAttribute('role')) quickActions.setAttribute('role', 'group');

  const isCompactNavigation = () => window.innerWidth <= 767;
  const firstNavLink = () => nav ? nav.querySelector('a[href]') : null;

  const setMenuState = (open, restoreFocus = false) => {
    if (!toggle || !nav) return;
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    toggle.textContent = open ? 'Close' : 'Menu';
    document.body.classList.toggle('navigation-open', open && isCompactNavigation());
    if (restoreFocus) toggle.focus({ preventScroll: true });
  };

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const opening = !nav.classList.contains('open');
      setMenuState(opening);
      if (opening && isCompactNavigation()) {
        const first = firstNavLink();
        if (first) requestAnimationFrame(() => first.focus({ preventScroll: true }));
      }
    });

    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenuState(false)));

    document.addEventListener('keydown', event => {
      if (!nav.classList.contains('open')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuState(false, true);
      }
    });

    document.addEventListener('pointerdown', event => {
      if (!nav.classList.contains('open') || !isCompactNavigation()) return;
      if (!nav.contains(event.target) && !toggle.contains(event.target)) setMenuState(false);
    });

    // A disclosure navigation should not trap keyboard focus. Close it when
    // keyboard focus moves beyond the header so focused content is never obscured.
    document.addEventListener('focusin', event => {
      if (!nav.classList.contains('open') || !isCompactNavigation() || !header) return;
      if (!header.contains(event.target)) setMenuState(false);
    });

    window.addEventListener('resize', () => {
      if (!isCompactNavigation() && nav.classList.contains('open')) setMenuState(false);
    }, { passive: true });
  }

  // Progressive enhancement only. The build-time navigation-ownership.json
  // manifest stamps the canonical section and initial aria-current into HTML.
  // Runtime reads those stamped values; it does not carry a second route map.
  if (nav) {
    const owner = nav.dataset.navOwner || '';
    const state = nav.dataset.navIsHub === 'true' ? 'page' : 'location';
    nav.querySelectorAll('a[data-nav-key]').forEach(link => {
      const expected = owner && link.dataset.navKey === owner ? state : null;
      if (expected && link.getAttribute('aria-current') !== expected) {
        link.setAttribute('aria-current', expected);
      } else if (!expected && link.hasAttribute('aria-current')) {
        link.removeAttribute('aria-current');
      }
    });
  }

  // Ensure all telephone actions announce their purpose even when the visible
  // label is only a number.
  document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    if (!link.hasAttribute('aria-label')) {
      const visible = link.textContent.trim().replace(/\s+/g, ' ');
      link.setAttribute('aria-label', visible ? `Call ${visible}` : 'Call the practice');
    }
  });



  // Clinical and institutional review statements have one controlled source.
  // No independent meta-tag shortcut may publish a review claim.

  // Local image fallbacks: preserve verified imagery when online, but fail safely without a broken-image state.
  document.querySelectorAll('img[data-local-fallback]').forEach(img => {
    img.addEventListener('error', () => {
      const fallback = img.dataset.localFallback;
      if (fallback && img.src !== fallback) {
        img.removeAttribute('srcset');
        img.src = fallback;
      }
    }, { once: true });
  });
  // Practitioner image resilience: prefer a verified local copy when available, otherwise retain the current verified source until photography is migrated.
  document.querySelectorAll('img[data-local-team-src]').forEach(img => {
    const localSrc = img.dataset.localTeamSrc;
    if (!localSrc) return;
    let resolvedLocal;
    try { resolvedLocal = new URL(localSrc, document.baseURI).href; }
    catch (_) { return; }
    if (img.src === resolvedLocal) return;
    fetch(resolvedLocal, { method: 'HEAD', cache: 'force-cache' }).then(response => {
      if (!response.ok || !(response.headers.get('content-type') || '').toLowerCase().startsWith('image/')) return;
      img.src = resolvedLocal;
      img.removeAttribute('referrerpolicy');
      img.dataset.imageSource = 'local';
    }).catch(() => {});
  });

  document.querySelectorAll('img[data-practitioner-image="true"]').forEach(img => {
    img.addEventListener('error', () => {
      const parent = img.parentElement;
      if (!parent) return;
      parent.classList.add('practitioner-photo-unavailable');
      img.remove();
      const span = document.createElement('span');
      span.textContent = 'Practitioner photo temporarily unavailable';
      parent.appendChild(span);
    }, { once: true });
  });

  // FAQ search keeps the approved category structure and filters only within it.
  const faqSearch = document.querySelector('[data-faq-search]');
  if (faqSearch && !document.querySelector('[data-faq-filters]')) {
    const groups = [...document.querySelectorAll('.faq-authority-group')];
    const status = document.querySelector('[data-faq-search-status]');
    const empty = document.querySelector('[data-faq-search-empty]');
    const normalize = value => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const filterFaqs = () => {
      const query = normalize(faqSearch.value);
      let matches = 0;
      groups.forEach(group => {
        let groupMatches = 0;
        group.querySelectorAll('details').forEach(detail => {
          const hit = !query || normalize(detail.textContent).includes(query);
          detail.hidden = !hit;
          if (hit) { groupMatches += 1; matches += 1; }
        });
        group.hidden = !!query && groupMatches === 0;
      });
      if (status) status.textContent = query ? `${matches} answer${matches === 1 ? '' : 's'} found` : '';
      if (empty) empty.hidden = !query || matches > 0;
    };
    faqSearch.addEventListener('input', filterFaqs);
    faqSearch.addEventListener('search', filterFaqs);
  }


  // HEALTHCARE INSTITUTION PRODUCTION HARDENING
  // Keep persistent appointment access available without duplicating the contextual CTA or covering the footer.
  const persistentCare = document.querySelector('.persistent-care-actions');
  if (persistentCare && 'IntersectionObserver' in window) {
    const suppressTargets = [...document.querySelectorAll('.service-booking-cta, footer')];
    const states = new Map(suppressTargets.map(el => [el, false]));
    const updatePersistent = () => persistentCare.classList.toggle('is-suppressed', [...states.values()].some(Boolean));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => states.set(entry.target, entry.isIntersecting));
      updatePersistent();
    }, { threshold: 0.08 });
    suppressTargets.forEach(el => observer.observe(el));
  }

  // Static-site form requests collect administrative contact details only and open the patient's email client.
  // Clinical information is deliberately excluded from this workflow.
  const formRequest = document.querySelector('[data-patient-form-request]');
  if (formRequest) {
    const status = formRequest.querySelector('[data-patient-form-status]');
    const fields = {
      name: formRequest.querySelector('[name="name"]'),
      email: formRequest.querySelector('[name="email"]'),
      phone: formRequest.querySelector('[name="phone"]'),
      type: formRequest.querySelector('[name="form_type"]'),
      delivery: formRequest.querySelector('[name="delivery"]'),
      consent: formRequest.querySelector('[name="privacy_confirm"]')
    };
    // Pair a shared live status with field-specific errors so a screen reader
    // announces what needs correcting when the visitor returns to a field.
    const setInvalid = (field, invalid, message = '') => {
      if (!field) return;
      const errorId = 'wmc-form-error-' + field.name;
      let error = document.getElementById(errorId);
      const described = new Set((field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
      if (invalid) {
        if (!error) {
          error = document.createElement('span');
          error.id = errorId;
          error.className = 'wmc-visually-hidden';
          (field.closest('.form-field,.form-consent') || field.parentElement).appendChild(error);
        }
        error.textContent = message || 'Please check this field.';
        described.add(errorId);
        if (status && status.id) described.add(status.id);
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-errormessage', errorId);
      } else {
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-errormessage');
        described.delete(errorId);
        if (status && status.id) described.delete(status.id);
        if (error) error.remove();
      }
      if (described.size) field.setAttribute('aria-describedby', [...described].join(' '));
      else field.removeAttribute('aria-describedby');
    };
    if (fields.consent) {
      const described = (fields.consent.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
      if (!described.includes('form-request-privacy')) described.push('form-request-privacy');
      fields.consent.setAttribute('aria-describedby', described.join(' '));
    }
    Object.values(fields).filter(Boolean).forEach(field => {
      const clear = () => { if (field.getAttribute('aria-invalid') === 'true') setInvalid(field, false); };
      field.addEventListener('input', clear);
      field.addEventListener('change', clear);
    });
    formRequest.addEventListener('submit', event => {
      event.preventDefault();
      Object.values(fields).forEach(f => setInvalid(f, false));
      const missing = [];
      const note = (field, reason) => { if (field) missing.push([field, reason]); };
      if (!fields.name?.value.trim()) note(fields.name, 'Enter your full name.');
      if (!fields.type?.value.trim()) note(fields.type, 'Choose the form you need.');
      if (!fields.email?.value.trim() && !fields.phone?.value.trim()) {
        note(fields.email, 'Enter an email address or telephone number.');
        note(fields.phone, 'Enter a telephone number or email address.');
      } else if (fields.email?.value.trim() && !fields.email.validity.valid) {
        note(fields.email, 'Enter a valid email address or remove it and provide a phone number.');
      }
      if (!fields.consent?.checked) note(fields.consent, 'Confirm that you will not include clinical or sensitive health information.');
      if (missing.length) {
        missing.forEach(([field, message]) => setInvalid(field, true, message));
        if (status) {
          status.setAttribute('role', 'alert');
          status.textContent = 'Please correct the highlighted fields before opening the email request.';
        }
        missing[0][0].focus({ preventScroll: true });
        missing[0][0].scrollIntoView({ block: 'center', behavior: 'instant' });
        return;
      }
      if (status) status.setAttribute('role', 'status');
      const subject = `Patient form request - ${fields.type.value.trim()}`;
      const body = [
        'Patient form request',
        '',
        `Name: ${fields.name.value.trim()}`,
        `Form requested: ${fields.type.value.trim()}`,
        `Preferred delivery: ${fields.delivery?.value.trim() || 'Not specified'}`,
        `Email: ${fields.email?.value.trim() || 'Not provided'}`,
        `Phone: ${fields.phone?.value.trim() || 'Not provided'}`,
        '',
        'No clinical information has been entered in this request.'
      ].join('\n');
      if (status) status.textContent = 'Your email application is opening with an administrative request prepared. Nothing has been submitted by this website. Review the email before sending it.';
      window.location.href = `mailto:reception@gabbamedicalcentre.com.au?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }



  // FAQ category filtering complements text search without changing the FAQ hierarchy.
  const faqFilters = document.querySelector('[data-faq-filters]');
  if (faqFilters) {
    const buttons = [...faqFilters.querySelectorAll('[data-faq-filter]')];
    const groups = [...document.querySelectorAll('.faq-authority-group[id]')];
    const searchInput = document.querySelector('[data-faq-search]');
    const searchStatus = document.querySelector('[data-faq-search-status]');
    const emptyState = document.querySelector('[data-faq-search-empty]');
    let activeCategory = 'all';
    const normalizeFaq = value => (value || '').toLowerCase().replace(/\s+/g,' ').trim();
    const applyFaqFilters = () => {
      const term = normalizeFaq(searchInput?.value || '');
      let visibleQuestions = 0;
      groups.forEach(group => {
        const categoryMatch = activeCategory === 'all' || group.id === activeCategory;
        let groupVisible = false;
        group.querySelectorAll('details').forEach(detail => {
          const textMatch = !term || normalizeFaq(detail.textContent).includes(term);
          const show = categoryMatch && textMatch;
          detail.hidden = !show;
          if (show) { groupVisible = true; visibleQuestions += 1; }
        });
        group.hidden = !groupVisible;
      });
      if (searchStatus) {
        const categoryLabel = buttons.find(b => b.dataset.faqFilter === activeCategory)?.textContent?.trim() || 'All';
        searchStatus.textContent = `${visibleQuestions} answer${visibleQuestions === 1 ? '' : 's'} shown${activeCategory === 'all' ? '' : ` in ${categoryLabel}`}.`;
      }
      if (emptyState) emptyState.hidden = visibleQuestions !== 0;
    };
    buttons.forEach(button => button.addEventListener('click', () => {
      activeCategory = button.dataset.faqFilter || 'all';
      buttons.forEach(b => { const on=b===button; b.classList.toggle('is-active',on); b.setAttribute('aria-pressed', String(on)); });
      applyFaqFilters();
    }));
    searchInput?.addEventListener('input', applyFaqFilters);
    applyFaqFilters();
  }


  // Evidence-controlled governance presentation. The published registry is generated
  // from approved records by cms/tools/build_clinical_governance.py, never from page dates.
  const governanceHost = document.querySelector('[data-governance-review][data-governance-page]');
  if (governanceHost) {
    const pageKey = governanceHost.getAttribute('data-governance-page');
    const records = window.WMC_APPROVED_GOVERNANCE;
    const record = records && Object.prototype.hasOwnProperty.call(records, pageKey) ? records[pageKey] : null;
    governanceHost.hidden = true;
    governanceHost.replaceChildren();
    governanceHost.classList.remove('governance-review');
    if (record && record.status === 'approved' &&
        [record.reviewedBy, record.lastReviewed, record.nextReview, record.contentOwner].every(x => typeof x === 'string' && x.trim())) {
      const isISO = s => /^\d{4}-\d{2}-\d{2}$/.test(s) &&
        !Number.isNaN(Date.parse(s)) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
      // Prevent a previously approved public bundle from displaying an outdated
      // review as current after the next review due date has passed in Brisbane.
      const brisbaneParts = new Intl.DateTimeFormat('en-AU', {
        timeZone: 'Australia/Brisbane', year: 'numeric', month: '2-digit', day: '2-digit'
      }).formatToParts(new Date());
      const datePart = name => brisbaneParts.find(part => part.type === name)?.value || '';
      const todayInBrisbane = `${datePart('year')}-${datePart('month')}-${datePart('day')}`;
      if (isISO(record.lastReviewed) && isISO(record.nextReview) &&
          record.nextReview > record.lastReviewed && record.nextReview >= todayInBrisbane) {
        const formatDate = iso => new Intl.DateTimeFormat('en-AU', {
          day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
        }).format(new Date(iso + 'T00:00:00Z'));
        const fields = [
          ['Reviewed by', record.reviewedBy],
          ['Last Reviewed', formatDate(record.lastReviewed)],
          ['Next Review Due', formatDate(record.nextReview)],
          ['Content Owner', record.contentOwner]
        ];
        fields.forEach(([label, value]) => {
          const wrapper = document.createElement('div');
          const dl = document.createElement('dl');
          const dt = document.createElement('dt');
          const dd = document.createElement('dd');
          dt.textContent = label;
          dd.textContent = value;
          dl.append(dt, dd);
          wrapper.appendChild(dl);
          governanceHost.appendChild(wrapper);
        });
        // Place the approved review statement within the existing content column,
        // rather than beneath the page layout at full viewport width.
        const article = document.querySelector('main .article');
        const serviceHubContent = document.querySelector('main .services-page-main .shell');
        const location = article || serviceHubContent;
        if (article && article.querySelector('.knowledge-byline')) {
          article.querySelector('.knowledge-byline').insertAdjacentElement('afterend', governanceHost);
        } else if (location && !location.contains(governanceHost)) {
          location.appendChild(governanceHost);
        }
        governanceHost.classList.add('governance-review');
        governanceHost.setAttribute('aria-label', 'Content governance and review information');
        governanceHost.hidden = false;
      }
    }
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.welcome-visual img,.hotdoc-visual img,.portrait img').forEach(img => {
      img.addEventListener('mouseenter', () => img.classList.add('image-active'));
      img.addEventListener('mouseleave', () => img.classList.remove('image-active'));
    });
  }
})();


/* MOTION REFINEMENT — FAQ height transition with native <details> semantics.
 * Only intercept a summary activation when animation is supported and requested.
 * Keyboard-generated click works; reduced motion keeps the native behaviour. */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches || typeof Element.prototype.animate !== 'function') return;
  const faqs = [...document.querySelectorAll('.faq details')];
  if (!faqs.length) return;
  document.documentElement.classList.add('wmc-motion-ready');
  const running = new WeakMap();
  for (const detail of faqs) {
    const summary = detail.querySelector(':scope > summary');
    if (!summary) continue;
    summary.addEventListener('click', event => {
      if (reduce.matches) return;
      if (event.target.closest('a,button,input,select,textarea')) return;
      event.preventDefault();
      const prior = running.get(detail);
      const currentlyOpen = prior ? prior.targetOpen : detail.open;
      const nextOpen = !currentlyOpen;
      const currentHeight = detail.getBoundingClientRect().height;
      if (prior) { prior.animation.onfinish = null; prior.animation.cancel(); running.delete(detail); }
      // Keep details content available while animating; close only after it ends.
      if (nextOpen) detail.open = true;
      const styles = getComputedStyle(detail);
      const collapsed = summary.getBoundingClientRect().height +
        parseFloat(styles.paddingTop || 0) + parseFloat(styles.paddingBottom || 0) +
        parseFloat(styles.borderTopWidth || 0) + parseFloat(styles.borderBottomWidth || 0);
      const expanded = detail.scrollHeight +
        parseFloat(styles.borderTopWidth || 0) + parseFloat(styles.borderBottomWidth || 0);
      const from = Math.max(0,currentHeight);
      const to = nextOpen ? Math.max(expanded,collapsed) : collapsed;
      if (Math.abs(from-to)<1) { detail.open=nextOpen; return; }
      const animation = detail.animate(
        [{height:`${from}px`},{height:`${to}px`}],
        {duration:230,easing:'cubic-bezier(.22,1,.36,1)'}
      );
      running.set(detail,{animation,targetOpen:nextOpen});
      animation.onfinish = () => {
        if (running.get(detail)?.animation!==animation) return;
        if (!nextOpen) detail.open=false;
        running.delete(detail);
      };
      // Preference can change while a disclosure is moving.
      const stop = () => {
        if (reduce.matches && running.get(detail)?.animation===animation) {
          animation.onfinish=null; animation.cancel(); detail.open=nextOpen;
          running.delete(detail);
        }
        reduce.removeEventListener('change',stop);
      };
      reduce.addEventListener('change',stop);
      animation.addEventListener('finish',()=>reduce.removeEventListener('change',stop),{once:true});
      animation.addEventListener('cancel',()=>reduce.removeEventListener('change',stop),{once:true});
    });
  }

})();

  // Optional preference: start mobile native footer disclosures collapsed.
  // All links and <details>/<summary> remain accessible when JavaScript is disabled.
  (() => {
    const accordions = [...document.querySelectorAll('footer .footer-nav > details.footer-accordion-native')];
    if (!accordions.length) return;
    const mobile = window.matchMedia('(max-width:700px)');
    const adjust = () => {
      for (const details of accordions) details.open = !mobile.matches;
    };
    adjust();
    if (mobile.addEventListener) mobile.addEventListener('change', adjust);
    else if (mobile.addListener) mobile.addListener(adjust);
  })();
