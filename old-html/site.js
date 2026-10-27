/* === WMC_MEASUREMENT_EMBED_START === */
/* Phase 1 website measurement (PROMPT 2G).
   Records conversion and Digital Reception events with page_group classification.
   Search dashboards receive intent_bucket + result metadata only — not raw queries.
   Raw query text may be kept in a restricted local debug store for 14 days. */
(function (root) {
  'use strict';

  if (root.WMCMeasurement) return;

  var CLINIC_TEL = 'tel:+61732173344';
  var DEBUG_KEY = 'wmc_measurement_debug_queries';
  var EVENT_LOG_KEY = 'wmc_measurement_event_log';
  var DEBUG_TTL_MS = 14 * 24 * 60 * 60 * 1000;
  var EVENT_LOG_TTL_MS = 14 * 24 * 60 * 60 * 1000;
  var EVENT_LOG_MAX = 2500;
  var VERSION = '2G';

  var PAGE_GROUPS = [
    'home',
    'practitioner',
    'service',
    'advice_hub',
    'advice_article',
    'patient_information',
    'team',
    'booking',
    'other'
  ];

  /* Fixed list only. Digits are stripped before matching. */
  var INTENT_BUCKETS = [
    'appointment_booking',
    'fees_billing',
    'referral',
    'repeat_script',
    'new_patient',
    'hotdoc_message',
    'test_results',
    'parking_access',
    'after_hours',
    'telehealth',
    'diabetes',
    'mental_health',
    'skin_check',
    'womens_health',
    'mens_health',
    'child_health',
    'pregnancy',
    'vaccination',
    'practitioner',
    'emergency',
    'clinical_symptom',
    'practice_info',
    'other',
    'unmatched'
  ];

  var INTENT_RULES = [
    [/^(000|triple zero|lifeline|hello home doctor|emergency)\b/, 'emergency'],
    [/\b(book|booking|appointment|hotdoc)\b/, 'appointment_booking'],
    [/\b(fee|fees|cost|pricing|billing|bulk bill)\b/, 'fees_billing'],
    [/\b(referral|referrals|refer)\b/, 'referral'],
    [/\b(repeat script|repeat scripts|repeat prescription|script renewal)\b/, 'repeat_script'],
    [/\b(new patient|new patients|register|enrol|enroll|new here)\b/, 'new_patient'],
    [/\b(hotdoc message|hotdoc messages|hotdoc sms|hotdoc text|hotdoc scam)\b/, 'hotdoc_message'],
    [/\b(test results?|pathology|blood test)\b/, 'test_results'],
    [/\b(parking|car park|wheelchair|accessib)\b/, 'parking_access'],
    [/\b(after hours|after-hours|closed|hello home)\b/, 'after_hours'],
    [/\b(telehealth|video call|phone consult|virtual appointment)\b/, 'telehealth'],
    [/\b(diabetes|diabetic|hba1c|blood sugar|glucose)\b/, 'diabetes'],
    [/\b(mental health|anxiety|depression|stress|burnout)\b/, 'mental_health'],
    [/\b(skin check|skin cancer|melanoma|mole)\b/, 'skin_check'],
    [/\b(women'?s health|cervical|pap smear|menopause|contraception)\b/, 'womens_health'],
    [/\b(men'?s health|prostate|psa)\b/, 'mens_health'],
    [/\b(child|children|kids?|paediatric|pediatric)\b/, 'child_health'],
    [/\b(pregnancy|pregnant|antenatal|maternity|postnatal)\b/, 'pregnancy'],
    [/\b(vaccine|vaccines|vaccination|immunisation|immunization|flu shot|flu jab)\b/, 'vaccination'],
    [/\b(dr |doctor |gp )\b/, 'practitioner'],
    [/\b(about us|opening hours|contact|location|agpal|privacy)\b/, 'practice_info'],
    [/\b(headache|migraine|cough|fever|pain|rash|sleep|tired|asthma|blood pressure|cholesterol)\b/, 'clinical_symptom']
  ];

  var PATIENT_INFO_PAGES = {
    'patient-information.html': 1,
    'new-patients.html': 1,
    'fees.html': 1,
    'fees-billing.html': 1,
    'medicare.html': 1,
    'bulk-billing.html': 1,
    'test-results.html': 1,
    'repeat-scripts.html': 1,
    'referrals.html': 1,
    'patient-forms.html': 1,
    'after-hours-care.html': 1,
    'faqs.html': 1,
    'recalls-and-reminders.html': 1,
    'identifying-hotdoc-scam-messages.html': 1,
    'privacy-confidentiality.html': 1,
    'feedback-complaints.html': 1,
    'contact.html': 1,
    'parking-and-accessibility.html': 1,
    'opening-hours.html': 1
  };

  function pathFromLocation() {
    try {
      var path = String(root.location && root.location.pathname || '').replace(/\\/g, '/');
      path = path.replace(/\/+/g, '/');
      if (path.endsWith('/')) path += 'index.html';
      var marker = '/apps/web/public/';
      var idx = path.toLowerCase().indexOf(marker);
      if (idx !== -1) path = path.slice(idx + marker.length);
      path = path.replace(/^\/+/, '');
      if (!path || path === 'index.html') return 'index.html';
      return path;
    } catch (_) {
      return 'index.html';
    }
  }

  function pageGroup(pathname) {
    var path = String(pathname || pathFromLocation()).replace(/^\/+/, '').toLowerCase();
    if (!path || path === 'index.html') return 'home';
    if (path.indexOf('doctors/') === 0) return 'practitioner';
    if (path === 'book-appointment.html' || path.indexOf('book-appointment') === 0) return 'booking';
    if (path === 'team.html' || path.indexOf('team-') === 0 || path === 'team-general-practitioners.html' || path === 'team-allied-health.html') return 'team';
    if (path.indexOf('knowledge/articles/') === 0) return 'advice_article';
    if (path.indexOf('knowledge/') === 0) return 'advice_hub';
    if (path === 'services.html' || path.indexOf('services/') === 0) return 'service';
    var leaf = path.split('/').pop();
    if (PATIENT_INFO_PAGES[leaf] || path.indexOf('patient-information') === 0) return 'patient_information';
    return 'other';
  }

  function stripDigits(value) {
    return String(value || '').replace(/\d+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function normaliseQuery(value) {
    return stripDigits(value).toLowerCase().normalize('NFKD')
      .replace(/[^a-z\s']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function intentBucket(rawQuery) {
    var text = normaliseQuery(rawQuery);
    if (!text) return 'unmatched';
    for (var i = 0; i < INTENT_RULES.length; i++) {
      if (INTENT_RULES[i][0].test(text)) return INTENT_RULES[i][1];
    }
    return 'other';
  }

  function sessionId() {
    try {
      var key = 'wmc_measurement_sid';
      var existing = root.sessionStorage && root.sessionStorage.getItem(key);
      if (existing) return existing;
      var id = 's_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      if (root.sessionStorage) root.sessionStorage.setItem(key, id);
      return id;
    } catch (_) {
      return 's_anon';
    }
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function purgeDebugStore(entries) {
    var cutoff = Date.now() - DEBUG_TTL_MS;
    return (entries || []).filter(function (entry) {
      return entry && typeof entry.ts === 'number' && entry.ts >= cutoff;
    });
  }

  function readDebugStore() {
    try {
      if (!root.localStorage) return [];
      var raw = root.localStorage.getItem(DEBUG_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return purgeDebugStore(Array.isArray(parsed) ? parsed : []);
    } catch (_) {
      return [];
    }
  }

  function writeDebugStore(entries) {
    try {
      if (!root.localStorage) return;
      var kept = purgeDebugStore(entries);
      root.localStorage.setItem(DEBUG_KEY, JSON.stringify(kept));
    } catch (_) {
      /* Debug retention is best-effort and must never break the page. */
    }
  }

  function purgeEventLog(entries) {
    var cutoff = Date.now() - EVENT_LOG_TTL_MS;
    return (entries || []).filter(function (entry) {
      if (!entry || typeof entry !== 'object') return false;
      var ts = Date.parse(String(entry.ts || '')) || 0;
      return ts >= cutoff;
    });
  }

  function readEventLog() {
    try {
      if (!root.localStorage) return [];
      var raw = root.localStorage.getItem(EVENT_LOG_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return purgeEventLog(Array.isArray(parsed) ? parsed : []);
    } catch (_) {
      return [];
    }
  }

  function writeEventLog(entries) {
    try {
      if (!root.localStorage) return;
      var kept = purgeEventLog(entries).slice(-EVENT_LOG_MAX);
      root.localStorage.setItem(EVENT_LOG_KEY, JSON.stringify(kept));
    } catch (_) {
      /* Warehouse buffer is best-effort and must never break the page. */
    }
  }

  function appendEventLog(payload) {
    if (!payload || typeof payload !== 'object') return;
    var copy = {};
    Object.keys(payload).forEach(function (key) {
      if (key === 'query' || key === 'raw_query') return;
      copy[key] = payload[key];
    });
    var entries = readEventLog();
    entries.push(copy);
    writeEventLog(entries);
  }

  /* Restricted debug only. Never send raw queries to the dashboard payload. */
  function retainDebugQuery(rawQuery, meta) {
    var text = String(rawQuery || '').trim();
    if (!text) return;
    var entries = readDebugStore();
    entries.push({
      ts: Date.now(),
      expires_at: Date.now() + DEBUG_TTL_MS,
      query: text.slice(0, 240),
      intent_bucket: meta && meta.intent_bucket || intentBucket(text),
      result_type: meta && meta.result_type || '',
      result_count: meta && typeof meta.result_count === 'number' ? meta.result_count : null,
      page_group: meta && meta.page_group || pageGroup(),
      event: meta && meta.event || 'digital_reception_search'
    });
    writeDebugStore(entries);
  }

  function pushDataLayer(payload) {
    try {
      root.dataLayer = root.dataLayer || [];
      root.dataLayer.push(payload);
    } catch (_) {}
  }

  function record(eventName, fields) {
    var name = String(eventName || '').trim();
    if (!name) return null;
    var payload = Object.assign({
      event: name,
      measurement_version: VERSION,
      ts: nowIso(),
      session_id: sessionId(),
      page_path: pathFromLocation(),
      page_group: pageGroup()
    }, fields || {});
    /* Hard privacy rule: never leave a raw query on the outbound event. */
    if (Object.prototype.hasOwnProperty.call(payload, 'query')) delete payload.query;
    if (Object.prototype.hasOwnProperty.call(payload, 'raw_query')) delete payload.raw_query;
    pushDataLayer(payload);
    appendEventLog(payload);
    try {
      if (typeof root.dispatchEvent === 'function') {
        root.dispatchEvent(new CustomEvent('wmc:measurement', { detail: payload }));
      }
    } catch (_) {}
    return payload;
  }

  function placementFor(node) {
    if (!node || !node.closest) return 'unknown';
    if (node.closest('.digital-reception-panel') || node.closest('.digital-reception-actions')) return 'digital_reception';
    if (node.closest('.persistent-care-actions')) return 'dock';
    if (node.closest('.doctor-profile-actions')) return 'profile';
    if (node.closest('.hero-actions-polished') || node.closest('.hero')) return 'hero';
    if (node.closest('.mobile-header-actions') || node.classList.contains('mobile-header-book') || node.classList.contains('mobile-header-call')) return 'mobile_header';
    if (node.closest('.header-cta') || node.closest('header')) return 'header';
    if (node.closest('#book') || node.closest('.booking-fallback')) return 'in_page';
    if (node.closest('footer')) return 'footer';
    return 'in_page';
  }

  function practitionerFromPage() {
    var path = pathFromLocation();
    if (path.indexOf('doctors/') !== 0) return '';
    return path.replace(/^doctors\//, '').replace(/\.html$/, '');
  }

  function bookingDestination(link) {
    try {
      var url = new URL(link.href, root.location.href);
      if (url.hostname !== 'www.hotdoc.com.au') return 'external';
      if (/\/doctors\/?$/.test(url.pathname)) return 'clinic_list';
      return 'practitioner';
    } catch (_) {
      return 'unknown';
    }
  }

  function taskNameFromLink(link) {
    var href = String(link.getAttribute('href') || '').toLowerCase();
    var label = String(link.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (/new-patient/.test(href) || label.indexOf('new patient') !== -1) return 'new_patient';
    if (/repeat-script/.test(href) || label.indexOf('repeat script') !== -1) return 'repeat_script';
    if (/test-result/.test(href) || label.indexOf('test result') !== -1) return 'test_results';
    if (/referral/.test(href) || label === 'referral' || label === 'referrals') return 'referral';
    if (/skin-check/.test(href) || label.indexOf('skin check') !== -1) return 'skin_check';
    if (/hotdoc|scam/.test(href) || label.indexOf('hotdoc') !== -1) return 'hotdoc_message';
    return label.replace(/\s+/g, '_') || 'unknown';
  }

  function taskSurface(link) {
    if (link.closest('.patient-hub-task-grid')) return 'patient_hub';
    if (link.closest('#primary-nav') && root.matchMedia && root.matchMedia('(max-width: 767px)').matches) return 'mobile_menu';
    if (link.closest('.patient-tasks')) return 'header';
    return 'other';
  }

  function isVisibleControl(node) {
    if (!node) return false;
    if (node.hidden || node.getAttribute('aria-hidden') === 'true') return false;
    if (node.style && node.style.display === 'none') return false;
    return true;
  }

  function bindDocumentClicks() {
    if (!root.document || root.document.documentElement.dataset.wmcMeasurementClicks === 'true') return;
    root.document.documentElement.dataset.wmcMeasurementClicks = 'true';
    root.document.addEventListener('click', function (event) {
      var target = event.target && event.target.closest ? event.target.closest('a, button') : null;
      if (!target) return;

      if (target.matches('a.wmc-book-appointment, a.persistent-care-book, a[data-hotdoc-button]')) {
        if (!isVisibleControl(target)) return;
        record('book_appointment_click', {
          placement: placementFor(target),
          destination: bookingDestination(target),
          practitioner: practitionerFromPage() || undefined
        });
        return;
      }

      if (target.matches('a[href^="tel:"]')) {
        var href = String(target.getAttribute('href') || '').replace(/\s+/g, '');
        if (href.toLowerCase() !== CLINIC_TEL) return;
        record('call_clinic_click', {
          placement: placementFor(target),
          practitioner: practitionerFromPage() || undefined
        });
        return;
      }

      if (target.matches('.patient-tasks a, .patient-hub-task-grid a')) {
        record('task_shortcut_click', {
          task: taskNameFromLink(target),
          surface: taskSurface(target)
        });
      }
    }, true);
  }

  function recordPageView() {
    if (root.document && root.document.documentElement.dataset.wmcPageView === 'true') return;
    if (root.document) root.document.documentElement.dataset.wmcPageView = 'true';
    record('page_view', {
      page_group: pageGroup(),
      page_path: pathFromLocation()
    });
  }

  function init() {
    bindDocumentClicks();
    recordPageView();
    writeDebugStore(readDebugStore());
  }

  root.WMCMeasurement = {
    version: VERSION,
    pageGroups: PAGE_GROUPS.slice(),
    intentBuckets: INTENT_BUCKETS.slice(),
    pageGroup: pageGroup,
    intentBucket: intentBucket,
    pathFromLocation: pathFromLocation,
    record: record,
    retainDebugQuery: retainDebugQuery,
    readDebugStore: readDebugStore,
    purgeDebugStore: function () { writeDebugStore([]); return []; },
    readEventLog: readEventLog,
    exportEventLog: function () {
      return {
        measurement_version: VERSION,
        exported_at: nowIso(),
        source: 'browser_event_log',
        events: readEventLog()
      };
    },
    purgeEventLog: function () { writeEventLog([]); return []; },
    placementFor: placementFor,
    init: init
  };

  if (root.document && root.document.readyState === 'loading') {
    root.document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
/* === WMC_MEASUREMENT_EMBED_END === */

(() => {
  /* Header Find Information strip removed from chrome (Patient Information hub / Digital Reception remain). */
  document.querySelectorAll('header .patient-tasks, #primary-nav > .patient-tasks').forEach((el) => el.remove());

  const homeLink = document.querySelector('header a.brand');
  document.querySelectorAll('.footer-brand').forEach(brand => {
    if (!homeLink || brand.querySelector('a')) return;
    const image = brand.querySelector('img');
    if (!image) return;
    const link = document.createElement('a');
    link.href = homeLink.getAttribute('href');
    link.setAttribute('aria-label', 'Woolloongabba Medical Centre home');
    brand.insertBefore(link, image);
    link.append(image);
  });

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav');
  const header = document.querySelector('header');
  const quickActions = document.querySelector('.mobile-header-actions');
  if (quickActions && !quickActions.hasAttribute('role')) quickActions.setAttribute('role', 'group');

  const isCompactNavigation = () => window.innerWidth <= 767;
  const firstNavLink = () => nav ? nav.querySelector('a[href]') : null;

  const setMenuState = (open, restoreFocus = false) => {
    if (!toggle || !nav) return;
    if (open && isCompactNavigation() && window.WMCDigitalReception) window.WMCDigitalReception.close();
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

    window.WMCNavigation = {
      closeCompact() {
        if (isCompactNavigation() && nav.classList.contains('open')) setMenuState(false);
      },
    };
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


  // The bottom care dock stays visible. Page padding keeps the footer and
  // in-page actions above it, so the dock is not hidden as those regions scroll in.

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

  // One booking destination at a time. Practitioner links stay on that
  // practitioner. Clinic links share one label. The bottom dock stays on
  // screen, and steps aside only while Digital Reception or HotDoc is open.
  (() => {
    const CLINIC_LABELS = new Set(['Book', 'Book Online', 'Book Now', 'Book an Appointment', 'Book an appointment', 'Book appointment', 'Book with HotDoc', 'Book GP Appointment', 'Book Follow-up']);
    const compact = window.matchMedia('(max-width: 767px)');

    const destination = link => {
      const raw = link.getAttribute('href') || '';
      if (raw.startsWith('tel:')) return raw.split('?')[0];
      try {
        const url = new URL(link.href);
        if (url.hostname === 'www.hotdoc.com.au') {
          url.searchParams.delete('wp');
          url.hash = '';
          return url.origin + url.pathname.replace(/\/$/, '');
        }
        return url.href;
      } catch (_) {
        return raw;
      }
    };

    const isClinicList = link => {
      try {
        const url = new URL(link.href);
        return url.hostname === 'www.hotdoc.com.au' && /\/doctors\/?$/.test(url.pathname);
      } catch (_) {
        return false;
      }
    };

    const controls = () => [...document.querySelectorAll('a.wmc-book-appointment, a.persistent-care-book, a[data-hotdoc-button]')];

    const standardise = () => {
      controls().forEach(link => {
        if (!isClinicList(link)) return;
        const label = link.textContent.replace(/\s+/g, ' ').trim();
        if (CLINIC_LABELS.has(label)) link.textContent = 'Book Appointment';
      });
    };

    const isChromePair = link => link.closest('.header-cta') || link.classList.contains('mobile-header-book');

    const keeper = () => {
      const profile = document.querySelector('.doctor-profile-actions a.wmc-book-appointment');
      if (profile) return profile;
      const card = document.querySelector('.booking-fallback a.wmc-book-appointment, .booking-fallback a[data-hotdoc-button]');
      if (card) return card;
      if (compact.matches) return document.querySelector('.mobile-header-book');
      return document.querySelector('.header-cta a.wmc-book-appointment, .header-cta a[data-hotdoc-button]');
    };

    const hideControl = link => {
      link.hidden = true;
      link.setAttribute('tabindex', '-1');
      link.setAttribute('aria-hidden', 'true');
      link.style.setProperty('display', 'none', 'important');
    };

    const showControl = link => {
      link.hidden = false;
      link.removeAttribute('aria-hidden');
      if (link.getAttribute('tabindex') === '-1') link.removeAttribute('tabindex');
      link.style.removeProperty('display');
    };

    const placeRestriction = () => {
      const notice = document.querySelector('.practitioner-booking-notice');
      const bar = document.querySelector('.persistent-care-actions');
      const inner = document.querySelector('.persistent-care-actions-inner');
      if (!notice || !bar || !inner || inner.querySelector('.persistent-care-restriction')) return;
      const copy = notice.cloneNode(true);
      copy.classList.add('persistent-care-restriction');
      inner.prepend(copy);
      bar.classList.add('has-restriction');
    };

    const applyDuplicates = () => {
      standardise();
      const keep = keeper();
      const keepKey = keep ? destination(keep) : '';
      controls().forEach(link => {
        if (link.classList.contains('persistent-care-book')) return;
        if (link.closest('.digital-reception-actions') || link.classList.contains('digital-reception-journey-book')) return;
        if (link.closest('.hero-actions-polished')) return;
        // Mid-page conversion bands keep their Book CTA — they are the in-content next step.
        if (link.closest('.conversion-band, .critical-action-band')) {
          showControl(link);
          return;
        }
        if (link.closest('#book')) {
          showControl(link);
          return;
        }
        if (!keep || link === keep) {
          if (link === keep) showControl(link);
          return;
        }
        if (isChromePair(keep) && isChromePair(link)) return;
        if (destination(link) === keepKey) hideControl(link);
      });
    };

    const sync = () => {
      applyDuplicates();
      const bar = document.querySelector('.persistent-care-actions');
      if (!bar) return;
      const journey = document.body.classList.contains('digital-reception-open') || document.body.classList.contains('booking-journey-held');
      const suppress = journey;
      bar.hidden = suppress;
      if (suppress) bar.style.setProperty('display', 'none', 'important');
      else bar.style.removeProperty('display');
    };

    placeRestriction();
    applyDuplicates();
    sync();
    document.addEventListener('scroll', sync, { passive: true, capture: true });
    window.addEventListener('resize', sync, { passive: true });
    if (compact.addEventListener) compact.addEventListener('change', sync);
    window.WMCBookingArchitecture = Object.freeze({ sync });
  })();

  /* 4C — Reusable mid-page conversion bands.
     Extends the new-patients critical-action-band pattern onto long pages. */
  (() => {
    const CLINIC_BOOK = 'https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox';
    const TEL = 'tel:+61732173344';
    const path = (location.pathname || '').replace(/\\/g, '/');

    document.querySelectorAll('.critical-action-band:not(.conversion-band)').forEach(band => {
      band.classList.add('conversion-band', 'conversion-band--book');
    });

    // Pages that already author a critical band (e.g. new-patients) keep that
    // as the conversion surface — do not inject a second mid-page band.
    if (document.querySelector('.conversion-band--mid, .critical-action-band')) return;

    const skip = /(^|\/)(index|team|team-general-practitioners|team-allied-health|services|patient-information|knowledge\/index|updates\/index|about-us|contact|community|story|philosophy-of-care|agpal-accreditation|medical-centre-network|join-our-team|accessibility|privacy-confidentiality|feedback-concerns|404)\.html?$/i;
    if (skip.test(path)) return;

    const article = document.querySelector('article.article, main .article, .doctor-authority-article');
    if (!article) return;

    const sections = [...article.querySelectorAll(':scope > .article-section')].filter(section => {
      if (section.classList.contains('faq')) return false;
      if (section.id === 'book' || section.classList.contains('service-booking-cta')) return false;
      return true;
    });
    if (sections.length < 3) return;

    const insertAfter = sections[Math.min(2, Math.max(1, sections.length - 2))];
    if (!insertAfter || !insertAfter.parentNode) return;

    const root = path.includes('/knowledge/articles/')
      ? '../../'
      : (path.includes('/doctors/') || path.includes('/services/') || /\/knowledge\/[^/]+\.html$/i.test(path))
        ? '../'
        : '';

    const practitionerBook = document.querySelector(
      'a.wmc-book-practitioner, .doctor-profile-actions a.wmc-book-appointment, a.persistent-care-book.wmc-book-practitioner'
    );
    const relatedService = document.querySelector(
      '#related-services a.resource-link, .topic-wayfinding a, a.service-title-link'
    );
    const h1 = (document.querySelector('h1')?.textContent || '').replace(/\s+/g, ' ').trim();

    let type = 'next';
    let title = 'Ready for the next step?';
    let support = 'Book Appointment, or call reception if you would prefer to speak with the team.';
    let links = [];

    if (path.includes('/doctors/')) {
      type = 'practitioner';
      title = h1 ? `Ready to book with ${h1}?` : 'Ready to book with this practitioner?';
      support = 'Use online booking for this practitioner, or call reception for help choosing an appointment.';
      const bookHref = practitionerBook?.getAttribute('href') || CLINIC_BOOK;
      links = [
        { href: bookHref, label: 'Book Appointment', primary: true, book: true, practitioner: !!practitionerBook },
        { href: TEL, label: 'Call Reception', call: true }
      ];
      const firstService = document.querySelector('#related-services a.resource-link, #areas-of-care a.service-title-link');
      if (firstService) {
        links.push({ href: firstService.getAttribute('href'), label: 'Related Service', related: true });
      }
    } else if (path.includes('/services/')) {
      type = 'service';
      title = 'Next step for this service';
      support = 'Book an appointment, call reception, or read a related patient guide.';
      links = [
        { href: CLINIC_BOOK, label: 'Book Appointment', primary: true, book: true },
        { href: TEL, label: 'Call Reception', call: true }
      ];
      const guide = document.querySelector('.topic-wayfinding a, #patient-guides a.resource-link');
      if (guide) links.push({ href: guide.getAttribute('href'), label: 'Related Guide', related: true });
      else if (relatedService) links.push({ href: relatedService.getAttribute('href'), label: 'Related Service', related: true });
    } else if (path.includes('/knowledge/articles/') || path.includes('/knowledge/')) {
      type = 'next';
      title = 'Next step';
      support = 'If this guide raises questions for your care, book a GP appointment or call reception.';
      links = [
        { href: CLINIC_BOOK, label: 'Book Appointment', primary: true, book: true },
        { href: TEL, label: 'Call Reception', call: true }
      ];
      const service = document.querySelector('#related-services a.resource-link');
      if (service) {
        const label = (service.querySelector('strong')?.textContent || service.textContent || 'Related Service')
          .replace(/\s+/g, ' ').trim().replace(/→.*$/, '').trim() || 'Related Service';
        links.splice(1, 0, { href: service.getAttribute('href'), label: label.slice(0, 28), related: true });
      }
    } else {
      type = 'book';
      title = 'Need help with the next step?';
      support = 'Book Appointment online, or call reception if you would prefer a conversation.';
      links = [
        { href: CLINIC_BOOK, label: 'Book Appointment', primary: true, book: true },
        { href: TEL, label: 'Call Reception', call: true }
      ];
      if (path.includes('new-patients') || path.includes('patient')) {
        links.push({ href: `${root}patient-information.html`, label: 'Patient Information', related: true });
      }
    }

    const band = document.createElement('section');
    band.className = `conversion-band conversion-band--mid conversion-band--${type} critical-action-band`;
    band.setAttribute('aria-label', title);
    band.setAttribute('data-conversion-band', type);

    const actions = document.createElement('div');
    actions.className = 'critical-actions';

    const copy = document.createElement('div');
    copy.className = 'critical-actions-copy';
    const strong = document.createElement('strong');
    strong.textContent = title;
    const span = document.createElement('span');
    span.textContent = support;
    copy.append(strong, span);

    const linkRow = document.createElement('div');
    linkRow.className = 'critical-action-links';

    links.forEach(item => {
      if (!item.href) return;
      const a = document.createElement('a');
      a.className = 'critical-action-link';
      if (item.primary) a.classList.add('critical-action-primary');
      else if (item.related) a.classList.add('critical-action-related');
      else a.classList.add('critical-action-secondary');
      if (item.book) {
        a.classList.add('wmc-book-appointment');
        if (item.practitioner) a.classList.add('wmc-book-practitioner');
        a.setAttribute('data-hotdoc-button', '');
        a.setAttribute('data-hotdoc-widget', 'lightbox');
      }
      if (item.call) a.setAttribute('aria-label', 'Call Woolloongabba Medical Centre on (07) 3217 3344');
      a.href = item.href;
      a.textContent = item.label;
      linkRow.append(a);
    });

    actions.append(copy, linkRow);
    band.append(actions);
    insertAfter.insertAdjacentElement('afterend', band);
  })();

  /* L3 — Mid-journey trust strip removed (AGPAL / bulk billing / open 7 days bar). */
  document.querySelectorAll('aside.trust-strip, .trust-strip[data-trust-strip]').forEach((node) => node.remove());

/* 4D — Restrained motion helpers.
   Marks conversion / critical bands when they enter the viewport so CSS
   can run a one-shot enter (prefers-reduced-motion skips entirely). */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches || typeof IntersectionObserver !== 'function') return;

  document.documentElement.classList.add('wmc-motion-ready');

  const mark = node => {
    if (!node || node.classList.contains('wmc-inview')) return;
    node.classList.add('wmc-inview');
  };

  const targets = [
    ...document.querySelectorAll('.conversion-band--mid, .critical-action-band'),
  ];
  if (!targets.length) return;

  const io = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        mark(entry.target);
        io.unobserve(entry.target);
      }
    },
    { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.35 }
  );

  targets.forEach(node => io.observe(node));
})();

/* 4E — Practitioner authority visibility.
   Peer recommendations use the published related-service graph only.
   No availability, suitability, or clinical ranking claims. */
(() => {
  const PEERS = {"generated":"2026-10-26","source":"search-index/doctors.json + services.json (shared service links only)","disclaimer":"Peer links are based on publicly listed related services on practitioner profiles. They do not indicate availability, clinical suitability, or a recommendation of one practitioner over another.","practitioners":{"doctors/dr-anand-singh.html":{"name":"Dr Anand Singh","expertise":["Family Health","Children’s Health","Skin Checks","Women’s Health","Skin Cancer Care","Preventive Healthcare"],"peers":[{"url":"doctors/dr-tanya-goodwill.html","name":"Dr Tanya Goodwill","shared":["Family Health","Children’s Health","Skin Checks"],"count":5},{"url":"doctors/dr-wasantha-hettiarchchi.html","name":"Dr Wasantha Hettiarchchi","shared":["Family Health","Skin Checks","Women’s Health"],"count":5},{"url":"doctors/dr-debra-larkins.html","name":"Dr Debra Larkins","shared":["Family Health","Women’s Health","Preventive Healthcare"],"count":3},{"url":"doctors/dr-kooshyar-karimi.html","name":"Dr Kooshyar Karimi","shared":["Family Health","Skin Checks","Skin Cancer Care"],"count":3}]},"doctors/dr-debra-larkins.html":{"name":"Dr Debra Larkins","expertise":["Family Health","Antenatal & Postnatal Care","Women’s Health","Preventive Healthcare"],"peers":[{"url":"doctors/dr-wasantha-hettiarchchi.html","name":"Dr Wasantha Hettiarchchi","shared":["Family Health","Antenatal & Postnatal Care","Women’s Health"],"count":4},{"url":"doctors/dr-anand-singh.html","name":"Dr Anand Singh","shared":["Family Health","Women’s Health","Preventive Healthcare"],"count":3},{"url":"doctors/dr-mary-abadir.html","name":"Dr Mary Abadir, Gynaecologist","shared":["Family Health","Antenatal & Postnatal Care","Women’s Health"],"count":3},{"url":"doctors/dr-tanya-goodwill.html","name":"Dr Tanya Goodwill","shared":["Family Health","Antenatal & Postnatal Care","Women’s Health"],"count":3}]},"doctors/dr-gemunu-suresh-ranawake.html":{"name":"Dr Gemunu Suresh Ranawake","expertise":["Family Health","Children’s Health","Mental Health Care","Chronic Disease Care","Allied Health","Men’s Health"],"peers":[{"url":"doctors/dr-tanya-goodwill.html","name":"Dr Tanya Goodwill","shared":["Family Health","Children’s Health","Mental Health Care"],"count":5},{"url":"doctors/dr-usman-gul.html","name":"Dr Usman Gul","shared":["Family Health","Men’s Health","Telehealth"],"count":3},{"url":"doctors/dr-wasantha-hettiarchchi.html","name":"Dr Wasantha Hettiarchchi","shared":["Family Health","Chronic Disease Care","Men’s Health"],"count":3},{"url":"doctors/dr-anand-singh.html","name":"Dr Anand Singh","shared":["Family Health","Children’s Health"],"count":2}]},"doctors/dr-kooshyar-karimi.html":{"name":"Dr Kooshyar Karimi","expertise":["Family Health","Chronic Disease Care","Medical Procedures","Skin Checks","Skin Cancer Care"],"peers":[{"url":"doctors/dr-tanya-goodwill.html","name":"Dr Tanya Goodwill","shared":["Family Health","Chronic Disease Care","Medical Procedures"],"count":5},{"url":"doctors/dr-wasantha-hettiarchchi.html","name":"Dr Wasantha Hettiarchchi","shared":["Family Health","Chronic Disease Care","Medical Procedures"],"count":5},{"url":"doctors/dr-anand-singh.html","name":"Dr Anand Singh","shared":["Family Health","Skin Checks","Skin Cancer Care"],"count":3},{"url":"doctors/dr-gemunu-suresh-ranawake.html","name":"Dr Gemunu Suresh Ranawake","shared":["Family Health","Chronic Disease Care"],"count":2}]},"doctors/dr-mary-abadir.html":{"name":"Dr Mary Abadir, Gynaecologist","expertise":["Pre-Pregnancy Care","Women’s Health","Antenatal & Postnatal Care","Cervical Screening","Family Health","IUD Insertion & Removal"],"peers":[{"url":"doctors/dr-debra-larkins.html","name":"Dr Debra Larkins","shared":["Women’s Health","Antenatal & Postnatal Care","Family Health"],"count":3},{"url":"doctors/dr-tanya-goodwill.html","name":"Dr Tanya Goodwill","shared":["Women’s Health","Antenatal & Postnatal Care","Family Health"],"count":3},{"url":"doctors/dr-wasantha-hettiarchchi.html","name":"Dr Wasantha Hettiarchchi","shared":["Women’s Health","Antenatal & Postnatal Care","Family Health"],"count":3},{"url":"doctors/dr-anand-singh.html","name":"Dr Anand Singh","shared":["Women’s Health","Family Health"],"count":2}]},"doctors/dr-nirupa-sivathasan.html":{"name":"Dr Nirupa Sivathasan","expertise":["Family Health","Preventive Healthcare","Chronic Disease Care"],"peers":[{"url":"doctors/dr-wasantha-hettiarchchi.html","name":"Dr Wasantha Hettiarchchi","shared":["Family Health","Preventive Healthcare","Chronic Disease Care"],"count":3},{"url":"doctors/dr-anand-singh.html","name":"Dr Anand Singh","shared":["Family Health","Preventive Healthcare"],"count":2},{"url":"doctors/dr-debra-larkins.html","name":"Dr Debra Larkins","shared":["Family Health","Preventive Healthcare"],"count":2},{"url":"doctors/dr-gemunu-suresh-ranawake.html","name":"Dr Gemunu Suresh Ranawake","shared":["Family Health","Chronic Disease Care"],"count":2}]},"doctors/dr-sambo-luon.html":{"name":"Dr Sambo Luon","expertise":["Family Health","Preventive Healthcare","Vaccinations"],"peers":[{"url":"doctors/dr-wasantha-hettiarchchi.html","name":"Dr Wasantha Hettiarchchi","shared":["Family Health","Preventive Healthcare","Vaccinations"],"count":3},{"url":"doctors/dr-anand-singh.html","name":"Dr Anand Singh","shared":["Family Health","Preventive Healthcare"],"count":2},{"url":"doctors/dr-debra-larkins.html","name":"Dr Debra Larkins","shared":["Family Health","Preventive Healthcare"],"count":2},{"url":"doctors/dr-nirupa-sivathasan.html","name":"Dr Nirupa Sivathasan","shared":["Family Health","Preventive Healthcare"],"count":2}]},"doctors/dr-steven-chang.html":{"name":"Dr Steven Chang, Chiropractor","expertise":["Allied Health"],"peers":[{"url":"doctors/dr-gemunu-suresh-ranawake.html","name":"Dr Gemunu Suresh Ranawake","shared":["Allied Health"],"count":1},{"url":"doctors/dr-tanya-goodwill.html","name":"Dr Tanya Goodwill","shared":["Allied Health"],"count":1},{"url":"doctors/mr-samuel-stafford.html","name":"Samuel Stafford, Physio","shared":["Allied Health"],"count":1}]},"doctors/dr-sumita-singh.html":{"name":"Dr Sumita Singh","expertise":["Family Health","Women’s Health","Mental Health Care"],"peers":[{"url":"doctors/dr-tanya-goodwill.html","name":"Dr Tanya Goodwill","shared":["Family Health","Women’s Health","Mental Health Care"],"count":3},{"url":"doctors/dr-anand-singh.html","name":"Dr Anand Singh","shared":["Family Health","Women’s Health"],"count":2},{"url":"doctors/dr-debra-larkins.html","name":"Dr Debra Larkins","shared":["Family Health","Women’s Health"],"count":2},{"url":"doctors/dr-gemunu-suresh-ranawake.html","name":"Dr Gemunu Suresh Ranawake","shared":["Family Health","Mental Health Care"],"count":2}]},"doctors/dr-tanya-goodwill.html":{"name":"Dr Tanya Goodwill","expertise":["Family Health","Women’s Health","Children’s Health","Chronic Disease Care","Skin Checks","Mental Health Care"],"peers":[{"url":"doctors/dr-wasantha-hettiarchchi.html","name":"Dr Wasantha Hettiarchchi","shared":["Family Health","Women’s Health","Chronic Disease Care"],"count":7},{"url":"doctors/dr-anand-singh.html","name":"Dr Anand Singh","shared":["Family Health","Women’s Health","Children’s Health"],"count":5},{"url":"doctors/dr-gemunu-suresh-ranawake.html","name":"Dr Gemunu Suresh Ranawake","shared":["Family Health","Children’s Health","Chronic Disease Care"],"count":5},{"url":"doctors/dr-kooshyar-karimi.html","name":"Dr Kooshyar Karimi","shared":["Family Health","Chronic Disease Care","Skin Checks"],"count":5}]},"doctors/dr-usman-gul.html":{"name":"Dr Usman Gul","expertise":["Family Health","Men’s Health","Telehealth"],"peers":[{"url":"doctors/dr-gemunu-suresh-ranawake.html","name":"Dr Gemunu Suresh Ranawake","shared":["Family Health","Men’s Health","Telehealth"],"count":3},{"url":"doctors/dr-wasantha-hettiarchchi.html","name":"Dr Wasantha Hettiarchchi","shared":["Family Health","Men’s Health"],"count":2},{"url":"doctors/dr-anand-singh.html","name":"Dr Anand Singh","shared":["Family Health"],"count":1},{"url":"doctors/dr-debra-larkins.html","name":"Dr Debra Larkins","shared":["Family Health"],"count":1}]},"doctors/dr-wasantha-hettiarchchi.html":{"name":"Dr Wasantha Hettiarchchi","expertise":["Family Health","Chronic Disease Care","Men’s Health","Medical Procedures","Antenatal & Postnatal Care","Skin Checks"],"peers":[{"url":"doctors/dr-tanya-goodwill.html","name":"Dr Tanya Goodwill","shared":["Family Health","Chronic Disease Care","Medical Procedures"],"count":7},{"url":"doctors/dr-anand-singh.html","name":"Dr Anand Singh","shared":["Family Health","Skin Checks","Women’s Health"],"count":5},{"url":"doctors/dr-kooshyar-karimi.html","name":"Dr Kooshyar Karimi","shared":["Family Health","Chronic Disease Care","Medical Procedures"],"count":5},{"url":"doctors/dr-debra-larkins.html","name":"Dr Debra Larkins","shared":["Family Health","Antenatal & Postnatal Care","Women’s Health"],"count":4}]},"doctors/mr-samuel-stafford.html":{"name":"Samuel Stafford, Physio","expertise":["Allied Health"],"peers":[{"url":"doctors/dr-gemunu-suresh-ranawake.html","name":"Dr Gemunu Suresh Ranawake","shared":["Allied Health"],"count":1},{"url":"doctors/dr-steven-chang.html","name":"Dr Steven Chang, Chiropractor","shared":["Allied Health"],"count":1},{"url":"doctors/dr-tanya-goodwill.html","name":"Dr Tanya Goodwill","shared":["Allied Health"],"count":1}]}}};

  const path = (location.pathname || '').replace(/\\/g, '/');
  const depth = (path.match(/\/(doctors|services|knowledge)\//) || path.includes('/knowledge/articles/'))
    ? (path.includes('/knowledge/articles/') ? 2 : 1)
    : 0;
  const root = depth === 2 ? '../../' : depth === 1 ? '../' : '';

  const escapeHtml = value =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  document.querySelectorAll('#related-practitioners').forEach(section => {
    section.classList.add('authority-related-practitioners');
    const hasProvenance = [...section.querySelectorAll('p')].some(p =>
      /published|publicly|profile|verified|availability|suitability/i.test(p.textContent || '')
    );
    if (!hasProvenance && !section.querySelector('.authority-signal-note')) {
      const note = document.createElement('p');
      note.className = 'authority-signal-note';
      note.textContent =
        'Shown from published profile links for this topic. This is not a clinical ranking or availability guarantee.';
      const heading = section.querySelector('h2');
      if (heading) heading.after(note);
      else section.prepend(note);
    }
  });

  document
    .querySelectorAll('#related-services, #patient-guides, #areas-of-care, #professional-interests')
    .forEach(section => {
      section.classList.add('authority-signal-section');
    });

  document.querySelectorAll('.practitioner-care-highlights').forEach(list => {
    list.classList.add('authority-expertise-list');
    const wrap = list.closest('.practitioner-care-overview');
    if (wrap && !wrap.querySelector('.authority-expertise-caption')) {
      const caption = document.createElement('p');
      caption.className = 'authority-expertise-caption';
      caption.textContent = 'Published areas of care from this profile';
      const label = wrap.querySelector('.practitioner-care-label');
      if (label) label.after(caption);
      else wrap.prepend(caption);
    }
  });

  const doctorMatch = path.match(/\/doctors\/(dr-[^/]+?|mr-[^/]+?)\.html/i);
  if (!doctorMatch || document.querySelector('[data-authority-peers]')) return;

  const doctorUrl = 'doctors/' + doctorMatch[1].toLowerCase() + '.html';
  const node = PEERS.practitioners && PEERS.practitioners[doctorUrl];
  if (!node || !node.peers || !node.peers.length) return;

  const insertAfter =
    document.querySelector('#related-services') ||
    document.querySelector('#professional-interests') ||
    document.querySelector('#areas-of-care') ||
    document.querySelector('#patient-guides');
  if (!insertAfter || !insertAfter.parentNode) return;

  const cards = node.peers
    .slice(0, 4)
    .map(peer => {
      const shared = (peer.shared || []).slice(0, 3).map(escapeHtml).join(' · ');
      return (
        '<a class="authority-peer-card" href="' +
        escapeHtml(root + peer.url) +
        '">' +
        '<strong>' +
        escapeHtml(peer.name) +
        '</strong>' +
        '<span class="authority-peer-shared">Shared published care areas: ' +
        (shared || 'Related services') +
        '</span>' +
        '<em>View profile →</em></a>'
      );
    })
    .join('');

  const section = document.createElement('section');
  section.className = 'article-section authority-peer-band';
  section.id = 'related-practitioners';
  section.setAttribute('data-authority-peers', 'graph');
  section.setAttribute('aria-label', 'Other practitioners in related care areas');
  section.innerHTML =
    '<p class="eyebrow">Related practitioners</p>' +
    '<h2>Other practitioners in related care areas</h2>' +
    '<p class="authority-signal-note">' +
    escapeHtml(
      PEERS.disclaimer ||
        'Peer links are based on publicly listed related services on practitioner profiles. They do not indicate availability or clinical suitability.'
    ) +
    '</p>' +
    '<div class="authority-peer-grid">' +
    cards +
    '</div>' +
    '<p class="service-inline-action"><a class="text-link" href="' +
    escapeHtml(root) +
    'team.html">Meet Our Team →</a></p>';

  insertAfter.insertAdjacentElement('afterend', section);

  const toc = document.querySelector('.on-this-page-links, .long-page-nav-list, [data-long-page-nav]');
  if (toc && !toc.querySelector('a[href="#related-practitioners"]')) {
    const a = document.createElement('a');
    a.href = '#related-practitioners';
    a.textContent = 'Related practitioners';
    toc.append(a);
  }
})();

/* 4F — Service hub presentation
   Marks Hub / Developing / Thin services from the authority graph and
   standardises a destination pathway rail (guides · practitioners · book). */
(() => {
  const TIERS = {"generated":"2026-10-26","counts":{"Hub":4,"Developing":10,"Thin":15},"services":[{"url":"services/family-health.html","title":"Family Health","tier":"Hub","authority_score":106.5,"related_practitioners":9,"related_knowledge":11,"related_services":7,"inbound_article_links":36,"inbound_practitioner_links":11,"knowledge":[{"url":"knowledge/articles/back-pain-when-should-i-see-a-gp.html","title":"Back Pain: When to See a GP"},{"url":"knowledge/articles/is-my-sore-throat-viral-or-bacterial.html","title":"Viral or Bacterial Sore Throat?"},{"url":"knowledge/articles/migraine-or-headache-how-do-i-tell-the-difference.html","title":"Migraine or Headache? How to Tell the Difference"},{"url":"knowledge/articles/sore-throat-when-should-i-see-a-doctor.html","title":"Sore Throat: When Should I See A Doctor?"}],"practitioners":[{"url":"doctors/dr-anand-singh.html","title":"Dr Anand Singh"},{"url":"doctors/dr-debra-larkins.html","title":"Dr Debra Larkins"},{"url":"doctors/dr-gemunu-suresh-ranawake.html","title":"Dr Gemunu Suresh Ranawake"},{"url":"doctors/dr-kooshyar-karimi.html","title":"Dr Kooshyar Karimi"}]},{"url":"services/preventive-healthcare.html","title":"Preventive Healthcare","tier":"Hub","authority_score":81.5,"related_practitioners":4,"related_knowledge":11,"related_services":7,"inbound_article_links":32,"inbound_practitioner_links":5,"knowledge":[{"url":"knowledge/articles/cholesterol-explained.html","title":"Cholesterol Explained"},{"url":"knowledge/articles/health-assessments-explained.html","title":"GP Health Assessments"},{"url":"knowledge/articles/healthy-ageing-prevention-falls-vaccination-reviews.html","title":"Healthy Ageing: Falls, Vaccines & GP Reviews"},{"url":"knowledge/articles/heart-health-checks.html","title":"Heart Health Checks"}],"practitioners":[{"url":"doctors/dr-sambo-luon.html","title":"Dr Sambo Luon"},{"url":"doctors/dr-debra-larkins.html","title":"Dr Debra Larkins"},{"url":"doctors/dr-nirupa-sivathasan.html","title":"Dr Nirupa Sivathasan"},{"url":"doctors/dr-wasantha-hettiarchchi.html","title":"Dr Wasantha Hettiarchchi"}]},{"url":"services/chronic-disease-care.html","title":"Chronic Disease Care","tier":"Hub","authority_score":56.5,"related_practitioners":3,"related_knowledge":13,"related_services":6,"inbound_article_links":16,"inbound_practitioner_links":5,"knowledge":[{"url":"knowledge/articles/blood-pressure-explained.html","title":"Blood Pressure Explained: GP Checks"},{"url":"knowledge/articles/diabetes-care-plans-explained.html","title":"Diabetes Care Plans Explained"},{"url":"knowledge/articles/diabetes-monitoring-explained.html","title":"Diabetes Monitoring Explained"},{"url":"knowledge/articles/living-with-diabetes.html","title":"Living With Diabetes"}],"practitioners":[{"url":"doctors/dr-gemunu-suresh-ranawake.html","title":"Dr Gemunu Suresh Ranawake"},{"url":"doctors/dr-tanya-goodwill.html","title":"Dr Tanya Goodwill"},{"url":"doctors/dr-wasantha-hettiarchchi.html","title":"Dr Wasantha Hettiarchchi"}]},{"url":"services/womens-health.html","title":"Women’s Health","tier":"Hub","authority_score":56,"related_practitioners":6,"related_knowledge":10,"related_services":10,"inbound_article_links":10,"inbound_practitioner_links":6,"knowledge":[{"url":"knowledge/articles/breast-health-changes-screening-when-to-see-a-gp.html","title":"Breast Changes & Screening: When to See a GP"},{"url":"knowledge/articles/hrt-discussions-with-your-gp.html","title":"HRT Discussions With Your GP"},{"url":"knowledge/articles/menopause-symptoms-explained.html","title":"Menopause Symptoms Explained"},{"url":"knowledge/articles/mental-health-and-menopause.html","title":"Mental Health & Menopause"}],"practitioners":[{"url":"doctors/dr-sumita-singh.html","title":"Dr Sumita Singh"},{"url":"doctors/dr-tanya-goodwill.html","title":"Dr Tanya Goodwill"},{"url":"doctors/dr-wasantha-hettiarchchi.html","title":"Dr Wasantha Hettiarchchi"},{"url":"doctors/dr-anand-singh.html","title":"Dr Anand Singh"}]},{"url":"services/mental-health.html","title":"Mental Health Care","tier":"Developing","authority_score":39.5,"related_practitioners":3,"related_knowledge":10,"related_services":4,"inbound_article_links":10,"inbound_practitioner_links":3,"knowledge":[{"url":"knowledge/articles/anxiety-vs-stress-what-is-the-difference.html","title":"Anxiety vs Stress"},{"url":"knowledge/articles/how-can-a-gp-support-depression.html","title":"How a GP Can Help With Depression"},{"url":"knowledge/articles/what-happens-during-a-mental-health-care-plan.html","title":"Mental Health Care Plans"},{"url":"knowledge/articles/when-should-i-seek-help-for-burnout.html","title":"Burnout: When to Seek Help"}],"practitioners":[{"url":"doctors/dr-sumita-singh.html","title":"Dr Sumita Singh"},{"url":"doctors/dr-tanya-goodwill.html","title":"Dr Tanya Goodwill"},{"url":"doctors/dr-gemunu-suresh-ranawake.html","title":"Dr Gemunu Suresh Ranawake"}]},{"url":"services/vaccinations.html","title":"Vaccinations","tier":"Developing","authority_score":37,"related_practitioners":2,"related_knowledge":9,"related_services":3,"inbound_article_links":12,"inbound_practitioner_links":2,"knowledge":[{"url":"knowledge/articles/childhood-vaccinations-explained.html","title":"Childhood Vaccinations"},{"url":"knowledge/articles/childrens-preventive-healthcare.html","title":"Children's Preventive Care"},{"url":"knowledge/articles/healthy-ageing-prevention-falls-vaccination-reviews.html","title":"Healthy Ageing: Falls, Vaccines & GP Reviews"},{"url":"knowledge/articles/influenza-vaccination-who-should-consider-it.html","title":"Influenza Vaccination: Who Needs a Flu Shot?"}],"practitioners":[{"url":"doctors/dr-sambo-luon.html","title":"Dr Sambo Luon"},{"url":"doctors/dr-wasantha-hettiarchchi.html","title":"Dr Wasantha Hettiarchchi"}]},{"url":"services/childrens-health.html","title":"Children’s Health","tier":"Developing","authority_score":36.5,"related_practitioners":3,"related_knowledge":8,"related_services":6,"inbound_article_links":8,"inbound_practitioner_links":3,"knowledge":[{"url":"knowledge/articles/childhood-vaccinations-explained.html","title":"Childhood Vaccinations"},{"url":"knowledge/articles/childrens-preventive-healthcare.html","title":"Children's Preventive Care"},{"url":"knowledge/articles/common-childhood-illnesses.html","title":"Childhood Illness Guide"},{"url":"knowledge/articles/managing-winter-respiratory-illness.html","title":"Managing Winter Respiratory Illness"}],"practitioners":[{"url":"doctors/dr-tanya-goodwill.html","title":"Dr Tanya Goodwill"},{"url":"doctors/dr-gemunu-suresh-ranawake.html","title":"Dr Gemunu Suresh Ranawake"},{"url":"doctors/dr-anand-singh.html","title":"Dr Anand Singh"}]},{"url":"services/skin-checks.html","title":"Skin Checks","tier":"Developing","authority_score":32.5,"related_practitioners":4,"related_knowledge":6,"related_services":5,"inbound_article_links":5,"inbound_practitioner_links":4,"knowledge":[{"url":"knowledge/articles/protecting-your-skin-from-the-queensland-sun.html","title":"Queensland Sun Protection"},{"url":"knowledge/articles/telehealth-vs-face-to-face-appointments.html","title":"Telehealth or Face-to-Face GP?"},{"url":"knowledge/articles/understanding-skin-cancer-risks.html","title":"Skin Cancer Risks"},{"url":"knowledge/articles/when-should-i-book-a-skin-check.html","title":"When to Book a Skin Check"}],"practitioners":[{"url":"doctors/dr-tanya-goodwill.html","title":"Dr Tanya Goodwill"},{"url":"doctors/dr-anand-singh.html","title":"Dr Anand Singh"},{"url":"doctors/dr-wasantha-hettiarchchi.html","title":"Dr Wasantha Hettiarchchi"},{"url":"doctors/dr-kooshyar-karimi.html","title":"Dr Kooshyar Karimi"}]},{"url":"services/mens-health.html","title":"Men’s Health","tier":"Developing","authority_score":30,"related_practitioners":3,"related_knowledge":7,"related_services":5,"inbound_article_links":5,"inbound_practitioner_links":3,"knowledge":[{"url":"knowledge/articles/health-checks-every-man-should-consider.html","title":"Men’s Health Checks"},{"url":"knowledge/articles/healthy-ageing-for-men.html","title":"Healthy Ageing For Men"},{"url":"knowledge/articles/heart-health-for-men.html","title":"Heart Health For Men"},{"url":"knowledge/articles/understanding-prostate-health.html","title":"Prostate Health Guide"}],"practitioners":[{"url":"doctors/dr-wasantha-hettiarchchi.html","title":"Dr Wasantha Hettiarchchi"},{"url":"doctors/dr-gemunu-suresh-ranawake.html","title":"Dr Gemunu Suresh Ranawake"},{"url":"doctors/dr-usman-gul.html","title":"Dr Usman Gul"}]},{"url":"services/skin-cancer-care.html","title":"Skin Cancer Care","tier":"Developing","authority_score":30,"related_practitioners":4,"related_knowledge":6,"related_services":4,"inbound_article_links":4,"inbound_practitioner_links":4,"knowledge":[{"url":"knowledge/articles/protecting-your-skin-from-the-queensland-sun.html","title":"Queensland Sun Protection"},{"url":"knowledge/articles/understanding-skin-cancer-risks.html","title":"Skin Cancer Risks"},{"url":"knowledge/articles/when-should-i-book-a-skin-check.html","title":"When to Book a Skin Check"},{"url":"knowledge/articles/why-skin-checks-matter-in-australia.html","title":"Why Skin Checks Matter"}],"practitioners":[{"url":"doctors/dr-tanya-goodwill.html","title":"Dr Tanya Goodwill"},{"url":"doctors/dr-anand-singh.html","title":"Dr Anand Singh"},{"url":"doctors/dr-wasantha-hettiarchchi.html","title":"Dr Wasantha Hettiarchchi"},{"url":"doctors/dr-kooshyar-karimi.html","title":"Dr Kooshyar Karimi"}]},{"url":"services/medical-procedures.html","title":"Medical Procedures","tier":"Developing","authority_score":28.5,"related_practitioners":4,"related_knowledge":3,"related_services":17,"inbound_article_links":2,"inbound_practitioner_links":3,"knowledge":[{"url":"knowledge/articles/when-should-i-book-a-skin-check.html","title":"When to Book a Skin Check"},{"url":"knowledge/articles/why-skin-checks-matter-in-australia.html","title":"Why Skin Checks Matter"},{"url":"knowledge/index.html","title":"Health Knowledge Centre"}],"practitioners":[{"url":"doctors/dr-tanya-goodwill.html","title":"Dr Tanya Goodwill"},{"url":"doctors/dr-wasantha-hettiarchchi.html","title":"Dr Wasantha Hettiarchchi"},{"url":"doctors/dr-mary-abadir.html","title":"Dr Mary Abadir, Gynaecologist"},{"url":"doctors/dr-kooshyar-karimi.html","title":"Dr Kooshyar Karimi"}]},{"url":"services/allied-health.html","title":"Allied Health","tier":"Developing","authority_score":24,"related_practitioners":2,"related_knowledge":5,"related_services":3,"inbound_article_links":4,"inbound_practitioner_links":4,"knowledge":[{"url":"knowledge/articles/back-pain-when-should-i-see-a-gp.html","title":"Back Pain: When to See a GP"},{"url":"knowledge/articles/understanding-neck-pain.html","title":"Neck Pain: When to See a GP"},{"url":"knowledge/articles/understanding-gp-chronic-disease-care-plans.html","title":"GP Chronic Care Plans Explained"},{"url":"knowledge/articles/understanding-muscle-and-joint-pain.html","title":"Muscle & Joint Pain Explained"}],"practitioners":[{"url":"doctors/dr-steven-chang.html","title":"Dr Steven Chang, Chiropractor"},{"url":"doctors/mr-samuel-stafford.html","title":"Samuel Stafford, Physio"}]},{"url":"services/telehealth.html","title":"Telehealth","tier":"Developing","authority_score":23,"related_practitioners":0,"related_knowledge":7,"related_services":4,"inbound_article_links":6,"inbound_practitioner_links":2,"knowledge":[{"url":"knowledge/articles/how-telehealth-works.html","title":"How GP Telehealth Works"},{"url":"knowledge/articles/telehealth-vs-face-to-face-appointments.html","title":"Telehealth or Face-to-Face GP?"},{"url":"knowledge/articles/what-happens-during-a-mental-health-care-plan.html","title":"Mental Health Care Plans"},{"url":"knowledge/articles/when-can-i-use-telehealth.html","title":"When Can I Use Telehealth?"}],"practitioners":[]},{"url":"services/antenatal-postnatal-care.html","title":"Antenatal & Postnatal Care","tier":"Developing","authority_score":22.5,"related_practitioners":2,"related_knowledge":5,"related_services":3,"inbound_article_links":3,"inbound_practitioner_links":4,"knowledge":[{"url":"knowledge/articles/planning-a-pregnancy.html","title":"Planning A Pregnancy"},{"url":"knowledge/articles/what-happens-during-antenatal-care.html","title":"What Happens During Antenatal Care?"},{"url":"knowledge/articles/your-first-pregnancy-gp-appointment.html","title":"First Pregnancy GP Appointment"},{"url":"knowledge/index.html","title":"Health Knowledge Centre"}],"practitioners":[{"url":"doctors/dr-debra-larkins.html","title":"Dr Debra Larkins"},{"url":"doctors/dr-mary-abadir.html","title":"Dr Mary Abadir, Gynaecologist"}]},{"url":"services/implanon-insertion-removal.html","title":"Implanon Insertion & Removal","tier":"Thin","authority_score":12.5,"related_practitioners":1,"related_knowledge":3,"related_services":3,"inbound_article_links":2,"inbound_practitioner_links":1,"knowledge":[{"url":"knowledge/articles/preventive-womens-healthcare.html","title":"Women's Preventive Care"},{"url":"knowledge/articles/womens-health-checks-at-different-stages-of-life.html","title":"Women's Health by Age"},{"url":"knowledge/index.html","title":"Health Knowledge Centre"}],"practitioners":[{"url":"doctors/dr-mary-abadir.html","title":"Dr Mary Abadir, Gynaecologist"}]},{"url":"services/ecg.html","title":"ECG (Electrocardiogram)","tier":"Thin","authority_score":11.5,"related_practitioners":0,"related_knowledge":4,"related_services":3,"inbound_article_links":3,"inbound_practitioner_links":0,"knowledge":[],"practitioners":[]},{"url":"services/pre-pregnancy-care.html","title":"Pre-Pregnancy Care","tier":"Thin","authority_score":11.5,"related_practitioners":0,"related_knowledge":4,"related_services":3,"inbound_article_links":2,"inbound_practitioner_links":1,"knowledge":[{"url":"knowledge/articles/planning-a-pregnancy.html","title":"Planning A Pregnancy"},{"url":"knowledge/articles/your-first-pregnancy-gp-appointment.html","title":"First Pregnancy GP Appointment"},{"url":"knowledge/index.html","title":"Health Knowledge Centre"},{"url":"knowledge/pregnancy.html","title":"Pregnancy & Antenatal Care"}],"practitioners":[]},{"url":"services/iud-insertion-removal.html","title":"IUD Insertion & Removal","tier":"Thin","authority_score":10,"related_practitioners":1,"related_knowledge":2,"related_services":3,"inbound_article_links":1,"inbound_practitioner_links":1,"knowledge":[{"url":"knowledge/articles/preventive-womens-healthcare.html","title":"Women's Preventive Care"},{"url":"knowledge/index.html","title":"Health Knowledge Centre"}],"practitioners":[{"url":"doctors/dr-mary-abadir.html","title":"Dr Mary Abadir, Gynaecologist"}]},{"url":"services/breast-check.html","title":"Breast Check","tier":"Thin","authority_score":9,"related_practitioners":0,"related_knowledge":3,"related_services":3,"inbound_article_links":2,"inbound_practitioner_links":0,"knowledge":[{"url":"knowledge/articles/breast-health-changes-screening-when-to-see-a-gp.html","title":"Breast Changes & Screening: When to See a GP"},{"url":"knowledge/articles/womens-health-checks-at-different-stages-of-life.html","title":"Women's Health by Age"},{"url":"knowledge/index.html","title":"Health Knowledge Centre"}],"practitioners":[]},{"url":"services/nebulising.html","title":"Nebulising","tier":"Thin","authority_score":9,"related_practitioners":0,"related_knowledge":3,"related_services":3,"inbound_article_links":2,"inbound_practitioner_links":0,"knowledge":[{"url":"knowledge/articles/what-causes-a-persistent-cough.html","title":"What Causes a Persistent Cough?"},{"url":"knowledge/articles/managing-asthma.html","title":"Managing Asthma: GP Reviews & Action Plans"},{"url":"knowledge/index.html","title":"Health Knowledge Centre"}],"practitioners":[]},{"url":"services/prostate-care.html","title":"Prostate Care","tier":"Thin","authority_score":9,"related_practitioners":0,"related_knowledge":3,"related_services":3,"inbound_article_links":2,"inbound_practitioner_links":0,"knowledge":[{"url":"knowledge/articles/health-checks-every-man-should-consider.html","title":"Men’s Health Checks"},{"url":"knowledge/articles/understanding-prostate-health.html","title":"Prostate Health Guide"},{"url":"knowledge/index.html","title":"Health Knowledge Centre"}],"practitioners":[]},{"url":"services/spirometry.html","title":"Spirometry","tier":"Thin","authority_score":9,"related_practitioners":0,"related_knowledge":3,"related_services":3,"inbound_article_links":2,"inbound_practitioner_links":0,"knowledge":[{"url":"knowledge/articles/what-causes-a-persistent-cough.html","title":"What Causes a Persistent Cough?"},{"url":"knowledge/articles/managing-asthma.html","title":"Managing Asthma: GP Reviews & Action Plans"},{"url":"knowledge/index.html","title":"Health Knowledge Centre"}],"practitioners":[]},{"url":"services/pap-smear-cervical-screening.html","title":"Cervical Screening","tier":"Thin","authority_score":8,"related_practitioners":0,"related_knowledge":2,"related_services":3,"inbound_article_links":1,"inbound_practitioner_links":1,"knowledge":[{"url":"knowledge/articles/when-should-i-have-a-cervical-screening-test.html","title":"Cervical Screening Guide"},{"url":"knowledge/index.html","title":"Health Knowledge Centre"}],"practitioners":[]},{"url":"services/pathology.html","title":"Pathology","tier":"Thin","authority_score":8,"related_practitioners":0,"related_knowledge":3,"related_services":2,"inbound_article_links":2,"inbound_practitioner_links":0,"knowledge":[],"practitioners":[]},{"url":"services/pharmacy.html","title":"Pharmacy","tier":"Thin","authority_score":8,"related_practitioners":0,"related_knowledge":3,"related_services":2,"inbound_article_links":2,"inbound_practitioner_links":0,"knowledge":[{"url":"knowledge/articles/managing-asthma.html","title":"Managing Asthma: GP Reviews & Action Plans"},{"url":"knowledge/articles/understanding-gp-chronic-disease-care-plans.html","title":"GP Chronic Care Plans Explained"},{"url":"knowledge/index.html","title":"Health Knowledge Centre"}],"practitioners":[]},{"url":"services/radiology.html","title":"Radiology","tier":"Thin","authority_score":8,"related_practitioners":0,"related_knowledge":3,"related_services":2,"inbound_article_links":2,"inbound_practitioner_links":0,"knowledge":[],"practitioners":[]},{"url":"services/ear-care-ear-syringing.html","title":"Ear Care & Ear Syringing","tier":"Thin","authority_score":6.5,"related_practitioners":0,"related_knowledge":2,"related_services":3,"inbound_article_links":1,"inbound_practitioner_links":0,"knowledge":[{"url":"knowledge/articles/common-childhood-illnesses.html","title":"Childhood Illness Guide"},{"url":"knowledge/index.html","title":"Health Knowledge Centre"}],"practitioners":[]},{"url":"services/iron-infusions.html","title":"Iron Infusions","tier":"Thin","authority_score":6.5,"related_practitioners":0,"related_knowledge":2,"related_services":3,"inbound_article_links":1,"inbound_practitioner_links":0,"knowledge":[{"url":"knowledge/articles/why-am-i-always-tired.html","title":"Why Am I Always Tired?"},{"url":"knowledge/index.html","title":"Health Knowledge Centre"}],"practitioners":[]},{"url":"services/wound-dressings.html","title":"Wound Dressings","tier":"Thin","authority_score":6.5,"related_practitioners":0,"related_knowledge":2,"related_services":3,"inbound_article_links":1,"inbound_practitioner_links":0,"knowledge":[{"url":"knowledge/articles/preventing-diabetes-complications.html","title":"Preventing Diabetes Complications"},{"url":"knowledge/index.html","title":"Health Knowledge Centre"}],"practitioners":[]}]};

  const pathName = (location.pathname || '').replace(/\\/g, '/');
  const serviceMatch = pathName.match(/\/services\/([^/]+?\.html)/i);
  const isDirectory = /\/services(\.html)?$/i.test(pathName) || /\/services\/?$/i.test(pathName);

  const escapeHtml = value =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const depth = pathName.includes('/services/') ? 1 : 0;
  const root = depth ? '../' : '';

  const byUrl = Object.fromEntries((TIERS.services || []).map(s => [s.url, s]));

  const tierLabel = tier =>
    tier === 'Hub' ? 'Service hub' : tier === 'Developing' ? 'Connected service' : 'Focused service';
  const tierClass = tier =>
    tier === 'Hub' ? 'service-tier-hub' : tier === 'Developing' ? 'service-tier-developing' : 'service-tier-thin';

  // Directory listing: mark rows by tier for visual scanning.
  if (isDirectory) {
    document.body.classList.add('services-directory-page');
    document.querySelectorAll('a.service-directory-row[href]').forEach(a => {
      const href = (a.getAttribute('href') || '').replace(/\\/g, '/');
      const key = href.replace(/^\.\//, '').replace(/^\//, '');
      const row = byUrl[key] || byUrl['services/' + key.replace(/^services\//, '')];
      if (!row) return;
      a.classList.add('service-tier-link', tierClass(row.tier));
      a.setAttribute('data-service-tier', row.tier.toLowerCase());
      if (!a.querySelector('.service-tier-chip')) {
        const chip = document.createElement('span');
        chip.className = 'service-tier-chip';
        chip.textContent = tierLabel(row.tier);
        const strong = a.querySelector('strong');
        if (strong) strong.append(chip);
        else a.prepend(chip);
      }
    });
    return;
  }

  if (!serviceMatch) return;
  const serviceUrl = 'services/' + serviceMatch[1].toLowerCase();
  const row = byUrl[serviceUrl];
  if (!row) return;

  document.body.classList.add('service-authority-page', tierClass(row.tier));
  document.body.setAttribute('data-service-tier', row.tier.toLowerCase());
  document.body.setAttribute('data-service-score', String(row.authority_score));

  const article =
    document.querySelector('article.service-authority-article, article.article, main .article') ||
    document.querySelector('main');
  if (article) {
    article.classList.add('service-authority-article', tierClass(row.tier));
    article.setAttribute('data-service-tier', row.tier.toLowerCase());
  }

  // Hero chip — patient-facing labels, not internal scores.
  const hero =
    document.querySelector('.service-authority-hero .page-hero-inner, .page-hero .page-hero-inner, .page-hero');
  if (hero && !hero.querySelector('.service-tier-chip')) {
    const chip = document.createElement('p');
    chip.className = 'service-tier-chip service-tier-chip--hero';
    chip.textContent = tierLabel(row.tier);
    chip.setAttribute('title', 'Based on published links across guides, practitioners and related services.');
    const eyebrow = hero.querySelector('.eyebrow');
    if (eyebrow) eyebrow.after(chip);
    else hero.prepend(chip);
  }

  // Wayfinding for hubs missing Knowledge links.
  if (!document.querySelector('.topic-wayfinding') && (row.knowledge || []).length) {
    const nav = document.createElement('nav');
    nav.className = 'topic-wayfinding';
    nav.setAttribute('aria-label', 'Related topic');
    nav.innerHTML =
      '<div class="shell">' +
      row.knowledge
        .slice(0, 2)
        .map(
          item =>
            '<a href="' +
            escapeHtml(root + item.url) +
            '">Read about ' +
            escapeHtml(String(item.title || '').replace(/\.$/, '')) +
            '.</a>'
        )
        .join('') +
      '</div>';
    const heroEl = document.querySelector('.page-hero, .service-authority-hero');
    const crumbs = document.querySelector('.breadcrumb-bar');
    if (heroEl) heroEl.insertAdjacentElement('afterend', nav);
    else if (crumbs) crumbs.insertAdjacentElement('beforebegin', nav);
  }

  if (document.querySelector('[data-service-pathways]')) return;

  const guideSection = document.querySelector('#patient-guides');
  const practitionerSection = document.querySelector('#related-practitioners');
  const bookSection = document.querySelector('#book, .service-booking-cta');
  const bookHref =
    document.querySelector('#book a.wmc-book-appointment, .service-booking-cta a.wmc-book-appointment, a.wmc-book-appointment')?.getAttribute('href') ||
    'https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox';

  const guideLinks = [
    ...document.querySelectorAll('#patient-guides a.resource-link, #patient-guides a.knowledge-article-card'),
  ]
    .slice(0, 3)
    .map(a => ({
      href: a.getAttribute('href'),
      label: (a.querySelector('span,strong')?.textContent || a.textContent || 'Guide')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/→.*$/, '')
        .trim(),
    }))
    .filter(x => x.href);

  if (!guideLinks.length && row.knowledge?.length) {
    row.knowledge.slice(0, 3).forEach(item => {
      guideLinks.push({ href: root + item.url, label: item.title });
    });
  }

  const practitionerLinks = [
    ...document.querySelectorAll('#related-practitioners a.resource-link, #related-practitioners a.practitioner-knowledge-link'),
  ]
    .slice(0, 3)
    .map(a => ({
      href: a.getAttribute('href'),
      label: (a.querySelector('strong,span')?.textContent || a.textContent || 'Practitioner')
        .replace(/\s+/g, ' ')
        .trim()
        .split(/Skin|Dermatology|Chronic|Diabetes|Mental|Women|Men|Child|Procedural|General/)[0]
        .trim() || (a.querySelector('strong,span')?.textContent || 'Practitioner').trim(),
    }))
    .filter(x => x.href);

  if (!practitionerLinks.length && row.practitioners?.length) {
    row.practitioners.slice(0, 3).forEach(item => {
      practitionerLinks.push({ href: root + item.url, label: item.title });
    });
  }

  const listHtml = (items, empty) =>
    items.length
      ? '<ul class="service-hub-pathways__list">' +
        items
          .map(
            item =>
              '<li><a href="' +
              escapeHtml(item.href) +
              '">' +
              escapeHtml(item.label) +
              '</a></li>'
          )
          .join('') +
        '</ul>'
      : '<p class="service-hub-pathways__empty">' + escapeHtml(empty) + '</p>';

  const rail = document.createElement('section');
  rail.className = 'service-hub-pathways';
  rail.setAttribute('data-service-pathways', row.tier.toLowerCase());
  rail.setAttribute('aria-label', 'Guides, practitioners, and booking');
  rail.innerHTML =
    '<div class="shell service-hub-pathways__inner">' +
    '<div class="service-hub-pathways__intro">' +
    '<p class="eyebrow">Continue in this care area</p>' +
    '<h2>Guides, practitioners, and booking</h2>' +
    '<p>Move between Health Advice, this service, and published practitioner profiles — then book when you are ready.</p>' +
    '</div>' +
    '<div class="service-hub-pathways__grid">' +
    '<article class="service-hub-pathways__card">' +
    '<p class="service-hub-pathways__kicker">Related guides</p>' +
    '<h3>Health Advice</h3>' +
    listHtml(guideLinks, 'Browse Health Advice from the Knowledge Centre.') +
    (guideSection
      ? '<a class="service-hub-pathways__more" href="#patient-guides">All related guides →</a>'
      : '<a class="service-hub-pathways__more" href="' +
        escapeHtml(root) +
        'knowledge/index.html">Health Advice →</a>') +
    '</article>' +
    '<article class="service-hub-pathways__card">' +
    '<p class="service-hub-pathways__kicker">Related practitioners</p>' +
    '<h3>Published profiles</h3>' +
    listHtml(
      practitionerLinks,
      'Ask reception which practitioner is available for this service.'
    ) +
    (practitionerSection
      ? '<a class="service-hub-pathways__more" href="#related-practitioners">All related practitioners →</a>'
      : '<a class="service-hub-pathways__more" href="' +
        escapeHtml(root) +
        'team.html">Meet Our Team →</a>') +
    '</article>' +
    '<article class="service-hub-pathways__card service-hub-pathways__card--book">' +
    '<p class="service-hub-pathways__kicker">Booking pathway</p>' +
    '<h3>Book this service</h3>' +
    '<p class="service-hub-pathways__empty">Online booking opens HotDoc. Reception can help if you are unsure which appointment type to choose.</p>' +
    '<div class="service-hub-pathways__actions">' +
    '<a class="button wmc-book-appointment" data-hotdoc-button data-hotdoc-widget="lightbox" href="' +
    escapeHtml(bookHref) +
    '">Book Appointment</a>' +
    '<a class="button button-secondary" href="tel:+61732173344">Call reception</a>' +
    '</div>' +
    (bookSection ? '<a class="service-hub-pathways__more" href="#book">Booking details on this page →</a>' : '') +
    '</article>' +
    '</div></div>';

  // Prefer after breadcrumb so the page chrome stays: hero → topics → crumbs → pathways.
  const insertAfter =
    document.querySelector('.breadcrumb-bar') ||
    document.querySelector('.topic-wayfinding') ||
    document.querySelector('.page-hero, .service-authority-hero');
  if (insertAfter) insertAfter.insertAdjacentElement('afterend', rail);
  else if (article) article.insertAdjacentElement('afterbegin', rail);

  // Mark existing destination sections for standardised hub styling.
  guideSection?.classList.add('service-hub-destination', 'service-hub-destination--guides');
  practitionerSection?.classList.add('service-hub-destination', 'service-hub-destination--practitioners');
  bookSection?.classList.add('service-hub-destination', 'service-hub-destination--book');
})();
