/**
 * My Preferred GP — device-local storage only (localStorage key wmc.preferredGp.v1).
 * No accounts, cookies, or server persistence.
 *
 * Mount target: #preferred-gp-panel (also observes late injection).
 * Logic twin: apps/web/src/documents/patient-preferred-gp.ts
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "wmc.preferredGp.v1";
  var CLINIC_TEL = "tel:+61732173344";
  var GOLNAR_HOTDOC =
    "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors/dr-golnar-mortezaei-5?wp=w_lightbox";

  var CATALOG = [
    { slug: "dr-anand-singh", name: "Dr Anand Singh", profilePath: "doctors/dr-anand-singh.html", bookingMode: "PROFILE", bookingCtaHref: null },
    { slug: "dr-debra-larkins", name: "Dr Debra Larkins", profilePath: "doctors/dr-debra-larkins.html", bookingMode: "PROFILE", bookingCtaHref: null },
    { slug: "dr-golnar-mortezaei", name: "Dr Golnar Mortezaei", profilePath: "doctors/dr-golnar-mortezaei.html", bookingMode: "ONLINE", bookingCtaHref: GOLNAR_HOTDOC },
    { slug: "dr-james", name: "Dr James Chanaka", profilePath: "doctors/dr-james.html", bookingMode: "PROFILE", bookingCtaHref: null },
    { slug: "dr-kooshyar-karimi", name: "Dr Kooshyar Karimi", profilePath: "doctors/dr-kooshyar-karimi.html", bookingMode: "PROFILE", bookingCtaHref: null },
    { slug: "dr-mary-abadir", name: "Dr Mary Abadir", profilePath: "doctors/dr-mary-abadir.html", bookingMode: "PHONE_ONLY", bookingCtaHref: CLINIC_TEL },
    { slug: "dr-nirupa-sivathasan", name: "Dr Nirupa Sivathasan", profilePath: "doctors/dr-nirupa-sivathasan.html", bookingMode: "PROFILE", bookingCtaHref: null },
    { slug: "dr-sambo-luon", name: "Dr Sambo Luon", profilePath: "doctors/dr-sambo-luon.html", bookingMode: "PROFILE", bookingCtaHref: null },
    { slug: "dr-steven-chang", name: "Dr Steven Chang", profilePath: "doctors/dr-steven-chang.html", bookingMode: "PROFILE", bookingCtaHref: null },
    { slug: "dr-sumita-singh", name: "Dr Sumita Singh", profilePath: "doctors/dr-sumita-singh.html", bookingMode: "PROFILE", bookingCtaHref: null },
    { slug: "dr-tanya-goodwill", name: "Dr Tanya Goodwill", profilePath: "doctors/dr-tanya-goodwill.html", bookingMode: "PROFILE", bookingCtaHref: null },
    { slug: "dr-usman-gul", name: "Dr Usman Gul", profilePath: "doctors/dr-usman-gul.html", bookingMode: "PROFILE", bookingCtaHref: null },
    { slug: "dr-wasantha-hettiarchchi", name: "Dr Wasantha Hettiarchchi", profilePath: "doctors/dr-wasantha-hettiarchchi.html", bookingMode: "PROFILE", bookingCtaHref: null },
    { slug: "dr-yamesha-ranatunga", name: "Dr Yamesha Ranatunga", profilePath: "doctors/dr-yamesha-ranatunga.html", bookingMode: "PROFILE", bookingCtaHref: null },
    { slug: "mr-samuel-stafford", name: "Mr Samuel Stafford", profilePath: "doctors/mr-samuel-stafford.html", bookingMode: "PROFILE", bookingCtaHref: null },
  ];

  function catalogBySlug(slug) {
    if (!slug) return null;
    var key = String(slug).toLowerCase();
    for (var i = 0; i < CATALOG.length; i += 1) {
      if (CATALOG[i].slug === key) return CATALOG[i];
    }
    return null;
  }

  function isValidRecord(obj) {
    if (!obj || typeof obj !== "object") return false;
    var entry = catalogBySlug(obj.slug);
    if (!entry) return false;
    if (typeof obj.name !== "string" || !obj.name.trim()) return false;
    if (typeof obj.profilePath !== "string" || !obj.profilePath.trim()) return false;
    if (typeof obj.updatedAt !== "string" || !obj.updatedAt.trim()) return false;
    return entry.profilePath === obj.profilePath && entry.name === obj.name;
  }

  function readStorage() {
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return isValidRecord(parsed) ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function writeStorage(record) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      return true;
    } catch (e) {
      return false;
    }
  }

  function removeStorage() {
    try {
      global.localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  function bookingCta(entry) {
    if (entry.bookingMode === "PHONE_ONLY" && entry.bookingCtaHref) {
      return { href: entry.bookingCtaHref, label: "Call reception to book", external: false, hotdoc: false };
    }
    if (entry.bookingMode === "ONLINE" && entry.bookingCtaHref) {
      return { href: entry.bookingCtaHref, label: "Book on HotDoc", external: true, hotdoc: true };
    }
    return { href: entry.profilePath, label: "View profile to book", external: false, hotdoc: false };
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var mountedRoots = new WeakSet();

  function renderPanel(root) {
    if (!root || mountedRoots.has(root)) return;
    mountedRoots.add(root);

    root.setAttribute("data-wmc-preferred-gp-mounted", "true");
    root.innerHTML = "";

    var stored = readStorage();
    var wrap = document.createElement("div");
    wrap.className = "patient-preferred-gp-panel";

    if (stored) {
      var entry = catalogBySlug(stored.slug);
      var cta = entry ? bookingCta(entry) : null;

      var summary = document.createElement("div");
      summary.className = "patient-preferred-gp-current";
      summary.innerHTML =
        '<p class="patient-preferred-gp-label">Your preferred GP on this device</p>' +
        '<p class="patient-preferred-gp-name"><strong>' +
        escapeHtml(stored.name) +
        "</strong></p>";

      var actions = document.createElement("div");
      actions.className = "patient-preferred-gp-actions";

      var profileLink = document.createElement("a");
      profileLink.className = "text-link";
      profileLink.href = stored.profilePath;
      profileLink.textContent = "View profile";
      actions.appendChild(profileLink);

      if (cta) {
        var bookLink = document.createElement("a");
        bookLink.className = "button wmc-book-appointment";
        bookLink.href = cta.href;
        bookLink.textContent = cta.label;
        if (cta.external) {
          bookLink.target = "_blank";
          bookLink.rel = "noopener noreferrer";
        }
        if (cta.hotdoc) {
          bookLink.setAttribute("data-hotdoc-button", "");
          bookLink.setAttribute("data-hotdoc-widget", "lightbox");
        }
        actions.appendChild(bookLink);
      }

      var changeBtn = document.createElement("button");
      changeBtn.type = "button";
      changeBtn.className = "text-link patient-preferred-gp-change";
      changeBtn.textContent = "Change";
      changeBtn.addEventListener("click", function () {
        renderPicker(root, stored.slug);
      });

      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "text-link patient-preferred-gp-remove";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", function () {
        removeStorage();
        renderPanel(root);
        try {
          global.dispatchEvent(new CustomEvent("wmc:preferred-gp-changed", { detail: null }));
        } catch (err) {
          /* noop */
        }
      });

      actions.appendChild(changeBtn);
      actions.appendChild(removeBtn);
      summary.appendChild(actions);
      wrap.appendChild(summary);
    } else {
      var empty = document.createElement("p");
      empty.className = "patient-preferred-gp-empty";
      empty.textContent = "Choose a GP you usually see — we will remember it on this device.";
      wrap.appendChild(empty);
      renderPicker(wrap, "", true);
    }

    root.appendChild(wrap);
  }

  function renderPicker(container, selectedSlug, inline) {
    var existing = container.querySelector(".patient-preferred-gp-picker");
    if (existing) existing.remove();

    var picker = document.createElement("form");
    picker.className = "patient-preferred-gp-picker";
    picker.setAttribute("novalidate", "novalidate");

    var label = document.createElement("label");
    label.className = "patient-preferred-gp-picker-label";
    label.setAttribute("for", "wmc-preferred-gp-select");
    label.textContent = inline ? "Select your preferred GP" : "Choose a different GP";

    var select = document.createElement("select");
    select.id = "wmc-preferred-gp-select";
    select.name = "preferredGp";
    select.required = true;

    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a GP…";
    placeholder.disabled = true;
    placeholder.selected = !selectedSlug;
    select.appendChild(placeholder);

    for (var i = 0; i < CATALOG.length; i += 1) {
      var opt = document.createElement("option");
      opt.value = CATALOG[i].slug;
      opt.textContent = CATALOG[i].name;
      if (selectedSlug && CATALOG[i].slug === selectedSlug) {
        opt.selected = true;
        placeholder.selected = false;
      }
      select.appendChild(opt);
    }

    var save = document.createElement("button");
    save.type = "submit";
    save.className = "button";
    save.textContent = "Save on this device";

    picker.appendChild(label);
    picker.appendChild(select);
    picker.appendChild(save);

    picker.addEventListener("submit", function (event) {
      event.preventDefault();
      var slug = select.value;
      var entry = catalogBySlug(slug);
      if (!entry) return;
      var record = {
        slug: entry.slug,
        name: entry.name,
        profilePath: entry.profilePath,
        updatedAt: new Date().toISOString(),
      };
      if (!writeStorage(record)) return;
      var panelRoot = container.id === "preferred-gp-panel" ? container : container.closest("#preferred-gp-panel");
      if (!panelRoot) panelRoot = document.getElementById("preferred-gp-panel");
      if (panelRoot) {
        mountedRoots.delete(panelRoot);
        renderPanel(panelRoot);
      }
      try {
        global.dispatchEvent(new CustomEvent("wmc:preferred-gp-changed", { detail: record }));
      } catch (err) {
        /* noop */
      }
    });

    container.appendChild(picker);
  }

  function mount(root) {
    var target = root;
    if (!target) target = document.getElementById("preferred-gp-panel");
    if (!target) return false;
    renderPanel(target);
    return true;
  }

  function observePanel() {
    if (typeof MutationObserver === "undefined") return;
    var observer = new MutationObserver(function () {
      var panel = document.getElementById("preferred-gp-panel");
      if (panel && !panel.getAttribute("data-wmc-preferred-gp-mounted")) {
        mount(panel);
      }
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener(
        "DOMContentLoaded",
        function () {
          observer.observe(document.body, { childList: true, subtree: true });
        },
        { once: true },
      );
    }
  }

  function init() {
    mount();
    observePanel();
  }

  global.WmcPreferredGp = {
    STORAGE_KEY: STORAGE_KEY,
    catalog: CATALOG.slice(),
    get: readStorage,
    set: function setPreferredGp(slug) {
      var entry = catalogBySlug(slug);
      if (!entry) return false;
      var record = {
        slug: entry.slug,
        name: entry.name,
        profilePath: entry.profilePath,
        updatedAt: new Date().toISOString(),
      };
      var ok = writeStorage(record);
      if (ok) {
        try {
          global.dispatchEvent(new CustomEvent("wmc:preferred-gp-changed", { detail: record }));
        } catch (e) {
          /* noop */
        }
      }
      return ok;
    },
    clear: function clearPreferredGp() {
      var ok = removeStorage();
      if (ok) {
        try {
          global.dispatchEvent(new CustomEvent("wmc:preferred-gp-changed", { detail: null }));
        } catch (e) {
          /* noop */
        }
      }
      return ok;
    },
    getCatalogEntry: catalogBySlug,
    bookingCta: bookingCta,
    mount: mount,
    init: init,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
