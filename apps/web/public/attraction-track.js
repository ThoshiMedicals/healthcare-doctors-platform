/**
 * GP Attraction analytics beacon — anonymous session only.
 * Does not send AHPRA / provider numbers / CV text.
 * Advisory product analytics — not decision automation.
 */
(function () {
  var KEY = "wmc_attr_sid";
  function sid() {
    try {
      var v = localStorage.getItem(KEY);
      if (v) return v;
      v =
        "sess_" +
        Math.random().toString(36).slice(2) +
        Date.now().toString(36);
      localStorage.setItem(KEY, v);
      return v;
    } catch (e) {
      return "sess_ephemeral";
    }
  }

  function clinicSlug() {
    var el = document.documentElement;
    return (el && el.getAttribute("data-clinic-slug")) || "woolloongabba";
  }

  function deviceClass() {
    var w = window.innerWidth || 0;
    if (w < 768) return "mobile";
    if (w < 1024) return "tablet";
    return "desktop";
  }

  function utmParams() {
    try {
      var params = new URLSearchParams(location.search || "");
      return {
        source: (params.get("utm_source") || "").slice(0, 80),
        medium: (params.get("utm_medium") || "").slice(0, 80),
        campaign: (params.get("utm_campaign") || "").slice(0, 80),
      };
    } catch (e) {
      return { source: "", medium: "", campaign: "" };
    }
  }

  function inferChannel() {
    try {
      var params = new URLSearchParams(location.search || "");
      var medium = (params.get("utm_medium") || "").toLowerCase();
      var source = (params.get("utm_source") || "").toLowerCase();
      if (medium === "email" || source === "email") return "email";
      if (
        medium === "social" ||
        /facebook|linkedin|twitter|instagram|tiktok/.test(source)
      )
        return "social";
      if (medium === "organic" || medium === "seo") return "organic_search";
      if (medium === "referral") return "referral";
      if (medium === "cpc" || medium === "paid") return "referral";

      var ref = document.referrer || "";
      if (!ref) return "direct";
      var host = "";
      try {
        host = new URL(ref).hostname.toLowerCase();
      } catch (e) {
        return "unknown";
      }
      if (/google\.|bing\.|duckduckgo\.|yahoo\./.test(host)) return "organic_search";
      if (/facebook\.|linkedin\.|twitter\.|x\.com|instagram\./.test(host)) return "social";
      if (host && host !== location.hostname) return "referral";
      return "direct";
    } catch (e) {
      return "unknown";
    }
  }

  function attributionSource(channel) {
    var utm = utmParams();
    if (utm.source) return utm.source;
    try {
      var ref = document.referrer || "";
      if (!ref) return channel === "direct" ? "direct" : "unknown";
      var host = new URL(ref).hostname.toLowerCase().replace(/^www\./, "");
      if (/google\./.test(host)) return "google";
      if (/bing\./.test(host)) return "bing";
      return host || "referral";
    } catch (e) {
      return "unknown";
    }
  }

  function opportunityProps(extra) {
    var channel = inferChannel();
    var utm = utmParams();
    var base = {
      clinicSlug: clinicSlug(),
      opportunityId: "page",
      opportunityType: "practice_fit",
      channel: channel,
      source: attributionSource(channel),
      medium: utm.medium || channel,
      campaign: utm.campaign || "",
      sessionId: sid(),
      timestamp: new Date().toISOString(),
    };
    if (!extra) return base;
    for (var k in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, k) && extra[k] != null) {
        base[k] = extra[k];
      }
    }
    base.sessionId = base.sessionId || sid();
    base.timestamp = base.timestamp || new Date().toISOString();
    return base;
  }

  function emitGpOpportunitiesView(reason) {
    if (window.__wmcGpOppViewSent) return;
    window.__wmcGpOppViewSent = true;
    send({
      name: "gp_opportunities_view",
      surface: "gp_opportunities",
      path: path || location.pathname,
      referrerPath: document.referrer || undefined,
      ctaId: "page",
      props: opportunityProps({
        opportunityId: "page",
        opportunityType: "practice_fit",
        viewReason: reason || "page_entry",
      }),
    });
  }

  function send(event) {
    event.anonymousSessionId = event.anonymousSessionId || sid();
    event.deviceClass = event.deviceClass || deviceClass();
    if (!event.channel) event.channel = inferChannel();
    try {
      fetch("/api/attraction-analytics/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clinicSlug: clinicSlug(), event: event }),
        keepalive: true,
      }).catch(function () {});
    } catch (e) {}
  }

  window.WmcAttractionTrack = { send: send, sid: sid };

  var path = (location.pathname || "").replace(/^\//, "");
  var surface = null;
  var toolId = null;
  // Surfaces must match Prisma GpAttractionSurface enum.
  if (/practice-experience/i.test(path)) surface = "practice_experience";
  else if (/community-catchment|continuity-in-practice|clinical-interests/i.test(path))
    surface = "practice_experience";
  else if (/gp-opportunities/i.test(path)) surface = "gp_opportunities";
  else if (/gp-faq/i.test(path)) surface = "gp_faq";
  else if (/doctor-readiness/i.test(path)) {
    surface = "doctor_readiness";
    toolId = "doctor-readiness";
  } else if (/opportunity-pack/i.test(path)) surface = "opportunity_pack";
  else if (/express-interest/i.test(path)) surface = "gp_eoi";
  else if (/dpa-navigator/i.test(path)) surface = "dpa_19ab_navigator";
  else if (/session-planner/i.test(path)) {
    surface = "gp_session_planner";
    toolId = "gp-session-planner";
  } else if (/provider-number/i.test(path)) {
    surface = "provider_number_readiness";
    toolId = "provider-number-readiness";
  } else if (/registrar-pathway/i.test(path)) surface = "join_our_team";
  else if (/practice-support/i.test(path)) surface = "practice_support_matrix";
  else if (/join-our-team\.html$/i.test(path) || /\/join-our-team\/?$/i.test(path))
    surface = "join_our_team";
  else if (/join-our-team/i.test(path)) surface = "join_our_team";

  if (surface) {
    send({
      name: "page_view",
      surface: surface,
      toolId: toolId || undefined,
      path: path || location.pathname,
      referrerPath: document.referrer || undefined,
    });
    if (toolId) {
      send({
        name: "tool_start",
        surface: surface,
        toolId: toolId,
        path: path || location.pathname,
      });
    }
  }

  if (surface === "gp_opportunities") {
    // Direct page entry — also re-armed by IntersectionObserver on first section visibility.
    emitGpOpportunitiesView("direct_entry");
    var observeTargets = function () {
      var nodes = document.querySelectorAll(
        "[data-gp-opportunities-section], #current-opportunities, #practice-fit-pillars, #main",
      );
      if (!nodes.length || typeof IntersectionObserver !== "function") return;
      var io = new IntersectionObserver(
        function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting && entries[i].intersectionRatio > 0) {
              emitGpOpportunitiesView("section_visibility");
              io.disconnect();
              break;
            }
          }
        },
        { threshold: 0.2 },
      );
      nodes.forEach(function (n) {
        io.observe(n);
      });
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", observeTargets);
    } else {
      observeTargets();
    }
  }

  if (surface === "gp_eoi") {
    send({
      name: "eoi_start",
      surface: "gp_eoi",
      path: path || location.pathname,
    });
  }

  if (surface === "practice_experience") {
    document.querySelectorAll("[data-pe-module], section[id]").forEach(function (el) {
      var id = el.getAttribute("data-pe-module") || el.id;
      if (!id) return;
      send({
        name: "module_view",
        surface: "practice_experience",
        moduleId: id,
        path: path,
      });
    });
  }

  document.addEventListener(
    "toggle",
    function (ev) {
      var t = ev.target;
      if (!t || t.tagName !== "DETAILS" || !t.open) return;

      if (t.classList && t.classList.contains("careers-vacancy-card")) {
        var oid =
          t.getAttribute("data-opportunity-id") ||
          t.getAttribute("data-vacancy-id") ||
          "unknown";
        var otype =
          t.getAttribute("data-opportunity-type") ||
          t.getAttribute("data-role-category") ||
          "GP";
        var props = opportunityProps({
          opportunityId: oid,
          opportunityType: otype,
        });
        send({
          name: "job_card_open",
          surface: "gp_opportunities",
          path: path,
          ctaId: oid,
          props: props,
        });
        send({
          name: "job_detail_view",
          surface: "gp_opportunities",
          path: path,
          ctaId: oid,
          moduleId: "vacancy-detail-" + oid,
          props: props,
        });
        return;
      }

      var faqId =
        t.getAttribute("data-faq-id") ||
        t.id ||
        (t.querySelector("summary") && t.querySelector("summary").textContent
          ? t.querySelector("summary").textContent.trim().slice(0, 80)
          : null);
      if (!faqId) return;
      send({
        name: "faq_open",
        surface: "gp_faq",
        faqId: String(faqId).toLowerCase().replace(/\s+/g, "-").slice(0, 80),
        path: path,
      });
    },
    true,
  );

  document.addEventListener("click", function (ev) {
    var pack = ev.target && ev.target.closest
      ? ev.target.closest("[data-track-pack-download]")
      : null;
    if (pack) {
      send({
        name: "pack_download",
        surface: "opportunity_pack",
        packId: pack.getAttribute("data-pack-id") || "gp-opportunity-pack",
        ctaId: "opportunity_pack_download",
        path: path,
      });
      return;
    }

    var oppCta =
      ev.target && ev.target.closest
        ? ev.target.closest("[data-track-opportunity-cta]")
        : null;
    if (!oppCta) return;
    var kind = (oppCta.getAttribute("data-track-opportunity-cta") || "").toLowerCase();
    var card =
      oppCta.closest(".careers-vacancy-card") ||
      oppCta.closest("[data-opportunity-id]");
    var oid =
      oppCta.getAttribute("data-opportunity-id") ||
      (card &&
        (card.getAttribute("data-opportunity-id") ||
          card.getAttribute("data-vacancy-id"))) ||
      "page";
    var otype =
      oppCta.getAttribute("data-opportunity-type") ||
      (card &&
        (card.getAttribute("data-opportunity-type") ||
          card.getAttribute("data-role-category"))) ||
      "practice_fit";
    var eventName =
      kind === "pack"
        ? "opportunity_to_pack"
        : kind === "eoi"
          ? "opportunity_to_eoi"
          : kind === "contact"
            ? "opportunity_to_contact"
            : null;
    if (!eventName) return;
    send({
      name: eventName,
      surface: "gp_opportunities",
      path: path,
      ctaId: oid,
      props: opportunityProps({
        opportunityId: oid,
        opportunityType: otype,
      }),
    });
  });
})();
