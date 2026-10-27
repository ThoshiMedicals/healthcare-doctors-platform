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
