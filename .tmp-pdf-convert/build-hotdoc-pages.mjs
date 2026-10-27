import fs from "fs";
import path from "path";

const ROOT = path.resolve("C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html");
const HOTDOC =
  "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox";
const CANONICAL_BASE = "https://gabbamedicalcentre.com.au";

const NAV_LINKS = [
  ["patient-information.html", "Patient Information"],
  ["book-appointment.html", "Booking &amp; HotDoc"],
  ["identifying-hotdoc-scam-messages.html", "HotDoc Message Safety"],
  ["new-patients.html", "New Patients"],
  ["new-patient-prescribing-policy.html", "New Patient Prescribing"],
  ["fees-billing.html", "Fees &amp; Billing"],
  ["bulk-billing.html", "Bulk Billing"],
  ["assignment-of-benefit.html", "Assignment of Benefit"],
  ["medicare.html", "Medicare"],
  ["medicare-exclusions.html", "Medicare Exclusions"],
  ["test-results.html", "Test Results"],
  ["recalls-and-reminders.html", "Recalls &amp; Reminders"],
  ["repeat-scripts.html", "Repeat Scripts"],
  ["telehealth.html", "Telehealth"],
  ["referrals.html", "Referrals"],
  ["patient-forms.html", "Patient Forms"],
  ["practice-information.html", "Practice Information"],
  ["patient-code-of-conduct.html", "Patient Code of Conduct"],
  ["faqs.html", "FAQs"],
  ["after-hours-care.html", "After Hours Care"],
];

function pageNav(active) {
  const links = NAV_LINKS.map(([href, label]) => {
    if (href === active) {
      return `<a aria-current="page" class="active" href="${href}">${label}</a>`;
    }
    return `<a href="${href}">${label}</a>`;
  }).join("");
  return `<aside aria-label="Patient information" class="page-nav" id="related-pages"><div class="nav-title">Patient Information</div>${links}</aside>`;
}

function clinicSchema() {
  return {
    "@type": ["MedicalClinic", "MedicalOrganization"],
    "@id": `${CANONICAL_BASE}/#medical-clinic`,
    name: "Woolloongabba Medical Centre",
    url: `${CANONICAL_BASE}/`,
    telephone: "+61 7 3217 3344",
    email: "reception@gabbamedicalcentre.com.au",
    address: {
      "@type": "PostalAddress",
      streetAddress: "468 Vulture Street",
      addressLocality: "Woolloongabba",
      addressRegion: "QLD",
      postalCode: "4102",
      addressCountry: "AU",
    },
    areaServed: [
      "Woolloongabba",
      "East Brisbane",
      "South Brisbane",
      "Kangaroo Point",
      "Greenslopes",
      "Stones Corner",
      "Dutton Park",
    ],
    logo: `${CANONICAL_BASE}/assets/brand/healthcare-doctors-woolloongabba-logo.png`,
    image: `${CANONICAL_BASE}/assets/hero-final-desktop.webp`,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
        opens: "07:00",
        closes: "19:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Friday",
        opens: "08:00",
        closes: "17:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "09:00",
        closes: "17:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Sunday",
        opens: "09:00",
        closes: "15:00",
      },
    ],
    faxNumber: "+61 7 3189 4808",
    slogan: "Care that knows your story.",
    isAcceptingNewPatients: true,
    medicalSpecialty: "https://schema.org/PrimaryCare",
    hasMap:
      "https://www.google.com/maps/search/?api=1&query=468+Vulture+Street+Woolloongabba+QLD+4102",
  };
}

function publisherRef() {
  return {
    "@id": `${CANONICAL_BASE}/#medical-clinic`,
    faxNumber: "+61 7 3189 4808",
    slogan: "Care that knows your story.",
    isAcceptingNewPatients: true,
    medicalSpecialty: "https://schema.org/PrimaryCare",
    hasMap:
      "https://www.google.com/maps/search/?api=1&query=468+Vulture+Street+Woolloongabba+QLD+4102",
    email: "reception@gabbamedicalcentre.com.au",
    logo: `${CANONICAL_BASE}/assets/brand/healthcare-doctors-woolloongabba-logo.png`,
    image: `${CANONICAL_BASE}/assets/hero-final-desktop.webp`,
    areaServed: [
      "Woolloongabba",
      "East Brisbane",
      "South Brisbane",
      "Kangaroo Point",
      "Greenslopes",
      "Stones Corner",
      "Dutton Park",
    ],
  };
}

function graphSchema({ file, title, description, faqs }) {
  const url = `${CANONICAL_BASE}/${file}`;
  const graph = [
    clinicSchema(),
    {
      "@type": "WebPage",
      "@id": url,
      url,
      name: title,
      description,
      isPartOf: {
        "@type": "WebSite",
        name: "Woolloongabba Medical Centre",
        url: `${CANONICAL_BASE}/`,
        publisher: publisherRef(),
      },
      provider: publisherRef(),
    },
  ];
  if (faqs?.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

function breadcrumbSchema(file, label) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${CANONICAL_BASE}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Patient Information",
        item: `${CANONICAL_BASE}/patient-information.html`,
      },
      { "@type": "ListItem", position: 3, name: label, item: `${CANONICAL_BASE}/${file}` },
    ],
  });
}

function shell({
  file,
  seoTitle,
  metaDescription,
  h1,
  lede,
  breadcrumbLabel,
  criticalTitle,
  criticalText,
  articleHtml,
  faqs,
  navRoute,
}) {
  const title = seoTitle;
  const description = metaDescription;
  return `<!DOCTYPE html>

<html lang="en-AU">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width,initial-scale=1" name="viewport"/>
<title>${title}</title>
<meta content="${description}" name="description"/>
<link href="assets/brand/wmc-brand-mark.webp" rel="icon"/>
<link href="assets/brand/wmc-brand-mark.webp" rel="apple-touch-icon"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="styles.css" rel="stylesheet"/>
<meta content="index,follow,max-image-preview:large" name="robots"/><link href="${CANONICAL_BASE}/${file}" rel="canonical"/><meta content="website" property="og:type"/><meta content="${title}" property="og:title"/><meta content="${description}" property="og:description"/><meta content="${CANONICAL_BASE}/${file}" property="og:url"/><meta content="Woolloongabba Medical Centre" property="og:site_name"/><script type="application/ld+json">${graphSchema({ file, title, description, faqs })}</script><meta content="en_AU" property="og:locale"/><meta content="${CANONICAL_BASE}/assets/hero-final-desktop.webp" property="og:image"/><meta content="Woolloongabba Medical Centre on Vulture Street, Woolloongabba" property="og:image:alt"/><meta content="1672" property="og:image:width"/><meta content="941" property="og:image:height"/><meta content="summary_large_image" name="twitter:card"/><meta content="${title}" name="twitter:title"/><meta content="${description}" name="twitter:description"/><meta content="${CANONICAL_BASE}/assets/hero-final-desktop.webp" name="twitter:image"/><meta content="Woolloongabba Medical Centre on Vulture Street, Woolloongabba" name="twitter:image:alt"/><script data-schema="navigation-breadcrumb" type="application/ld+json">${breadcrumbSchema(file, breadcrumbLabel)}</script></head>
<body class="has-persistent-care-actions">
<a class="skip-link" href="#main">Skip to content</a>
<header>
<div class="shell header-inner">
<a aria-label="Woolloongabba Medical Centre home" class="brand" href="index.html"><img alt="Healthcare Doctors — Woolloongabba Medical Centre" class="institution-logo-lockup" decoding="async" height="71" src="assets/brand/healthcare-doctors-woolloongabba-logo.png" width="475"/></a>
<div aria-label="Quick actions" role="group" class="mobile-header-actions"><a aria-label="Call Woolloongabba Medical Centre" class="mobile-header-action mobile-header-call" href="tel:+61732173344">Call</a><a aria-label="Book Appointment" class="mobile-header-action mobile-header-book wmc-book-appointment" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="${HOTDOC}">Book Appointment</a></div><button aria-controls="primary-nav" aria-expanded="false" aria-label="Open navigation menu" class="menu-toggle" type="button">Menu</button>

<div class="header-cta">
<a class="header-phone" href="tel:+61732173344">(07) 3217 3344</a>
<a class="button wmc-book-appointment" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="${HOTDOC}">Book Appointment</a>
</div>
</div>
<div class="institution-navigation-row">
<nav aria-label="Primary navigation" id="primary-nav" class="shell" data-nav-owner="patient-info" data-nav-is-hub="false" data-nav-route="${navRoute}"><a href="services.html" data-nav-key="services">Services</a><a href="team.html" data-nav-key="team">Our Team</a><a href="about-us.html" data-nav-key="about">About Us</a><a href="patient-information.html" data-nav-key="patient-info" aria-current="location">Patient Information</a><a href="knowledge/index.html" aria-label="Healthcare Knowledge Centre" data-nav-key="knowledge">Knowledge Centre</a><a href="updates/index.html" data-nav-key="updates">Updates</a><a href="contact.html" data-nav-key="contact">Contact</a></nav>
</div>
</header>
<main id="main" tabindex="-1">
<section class="page-hero">
<div class="shell page-hero-inner">
<p class="eyebrow">Patient Information</p>
<h1>${h1}</h1>
<p class="lede">${lede}</p>
</div>
</section><div class="breadcrumb-bar"><div class="shell"><nav aria-label="Breadcrumb" class="visible-breadcrumbs"><ol><li><a href="index.html">Home</a><span aria-hidden="true" class="breadcrumb-separator">›</span></li><li><a href="patient-information.html">Patient Information</a><span aria-hidden="true" class="breadcrumb-separator">›</span></li><li><span aria-current="page">${breadcrumbLabel}</span></li></ol></nav><a class="breadcrumb-explore-link" href="#related-pages">Explore related pages</a></div></div><section aria-label="${criticalTitle}" class="critical-action-band"><div class="shell critical-actions"><div class="critical-actions-copy"><strong>${criticalTitle}</strong><span>${criticalText}</span></div><div class="critical-action-links"><a class="critical-action-link critical-action-primary" href="tel:+61732173344">Call Clinic</a><a class="critical-action-link wmc-book-appointment" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="${HOTDOC}">Book Appointment</a></div></div></section>
<section class="page-main">
<div class="shell page-layout">
${pageNav(file)}
<article class="article">
${articleHtml}
</article>
</div>
</section>
<div data-governance-review data-governance-page="${file}" hidden></div></main>
<nav aria-label="Appointment actions" class="persistent-care-actions"><div class="persistent-care-actions-inner"><a class="persistent-care-book wmc-book-appointment" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="${HOTDOC}">Book Appointment</a><a aria-label="Call Woolloongabba Medical Centre on (07) 3217 3344" class="persistent-care-call" href="tel:+61732173344">Call Clinic</a></div></nav><footer>
<div class="shell">
<div class="footer-grid">
<div class="footer-identity">
<div class="footer-brand"><img alt="Healthcare Doctors — Woolloongabba Medical Centre" class="institution-logo-lockup institution-logo-lockup-footer" decoding="async" height="71" loading="lazy" src="assets/brand/healthcare-doctors-woolloongabba-logo.png" width="475"/></div>
<p>A local practice shaped by continuity, familiarity and long-term relationships.</p>
<div class="footer-trust"><img alt="Accredited General Practice" data-local-asset="agpal-mark" src="assets/brand/agpal-mark.webp"/><img alt="Medicare Bulk Billing Practice" src="assets/brand/bulk-billing-practice.png"/></div>
<div aria-label="Practice opening hours" role="group" class="footer-hours"><strong>Opening hours</strong><span><b>Mon–Thu</b> 7:00 AM–7:00 PM</span><span><b>Friday</b> 8:00 AM–5:00 PM</span><span><b>Saturday</b> 9:00 AM–5:00 PM</span><span><b>Sunday</b> 9:00 AM–3:00 PM</span></div>
<div class="footer-contact" aria-label="Practice contact and location">
<a href="tel:+61732173344">Call (07) 3217 3344</a>
<address>468 Vulture Street, Woolloongabba QLD 4102</address>
<div class="footer-contact-links"><a href="contact.html">Contact &amp; Location</a><a href="https://www.google.com/maps/dir/?api=1&amp;destination=468+Vulture+Street+Woolloongabba+QLD+4102" target="_blank" rel="noopener noreferrer">Get Directions</a></div>
</div>
</div>
<div class="footer-nav footer-nav-about-the-practice">
<h3>About the Practice</h3>
<details class="footer-accordion-native" open>
<summary>About the Practice</summary>
<div class="footer-accordion-content">
<a href="about-us.html">About Us</a><a href="philosophy-of-care.html">Our Philosophy</a><a href="story.html">Our Story</a><a href="community.html">Our Community</a><a href="agpal-accreditation.html">AGPAL Accreditation</a><a href="medical-centre-network.html">Medical Centre Network</a><a href="join-our-team.html">Careers</a>
</div></details></div><div class="footer-nav footer-nav-patient-information">
<h3>Patient Information</h3>
<details class="footer-accordion-native" open>
<summary>Patient Information</summary>
<div class="footer-accordion-content">
<a href="new-patients.html">New Patients</a><a href="fees-billing.html">Fees &amp; Billing</a><a href="medicare.html">Medicare</a><a href="bulk-billing.html">Bulk Billing</a><a href="assignment-of-benefit.html">Assignment of Benefit</a><a href="test-results.html">Test Results</a><a href="recalls-and-reminders.html">Recalls &amp; Reminders</a><a href="identifying-hotdoc-scam-messages.html">HotDoc Message Safety</a><a href="repeat-scripts.html">Repeat Scripts</a><a href="referrals.html">Referrals</a><a href="patient-forms.html">Patient Forms</a><a href="after-hours-care.html">After Hours Care</a><a href="faqs.html">FAQs</a>
</div></details></div><div class="footer-nav footer-nav-healthcare-learning">
<h3>Healthcare &amp; Learning</h3>
<details class="footer-accordion-native" open>
<summary>Healthcare &amp; Learning</summary>
<div class="footer-accordion-content">
<a href="services.html">Services</a><a href="team.html">Our Team</a><a href="knowledge/index.html">Knowledge Centre</a><a href="updates/index.html">Updates</a>
</div></details></div>
</div>
<div class="footer-bottom">
<span>© <span id="year"></span> Woolloongabba Medical Centre</span>
<nav class="footer-utility" aria-label="Policies and feedback"><a href="privacy-confidentiality.html">Privacy &amp; Confidentiality</a><a href="feedback-concerns.html">Feedback &amp; Complaints</a></nav>
</div>
</div>
</footer>
<script defer src="governance-published.js"></script><script defer="" src="site.js"></script><script defer="" src="digital-reception.js"></script>
<script defer="" src="booking-resilience.js"></script><script defer="" charset="utf-8" src="https://cdn.hotdoc.com.au/static/assets/js/hotdoc-widgets.min.js"></script></body>
</html>
`;
}

const pages = [
  {
    file: "identifying-hotdoc-scam-messages.html",
    seoTitle: "Identifying HotDoc Scam Messages | Woolloongabba Medical Centre",
    metaDescription:
      "How to recognise genuine HotDoc appointment, recall, correspondence and consent messages from Woolloongabba Medical Centre — and what to do if unsure.",
    h1: "Identifying scam messages from authentic messages we send via HotDoc",
    lede: "Woolloongabba Medical Centre uses HotDoc as an approved platform for patient communications. This page helps you recognise legitimate messages and respond safely if something looks suspicious.",
    breadcrumbLabel: "HotDoc Message Safety",
    criticalTitle: "Unsure about a message?",
    criticalText: "Call the clinic before you click, reply or share personal details.",
    faqs: [
      {
        q: "Does Woolloongabba Medical Centre use HotDoc?",
        a: "Yes. We use HotDoc as an approved communication and booking platform for appointment reminders, recalls, correspondence notifications, consent requests and online booking.",
      },
      {
        q: "What do legitimate HotDoc messages look like?",
        a: "Legitimate messages usually name our practice, relate to your care, and use HotDoc domains such as hotdoc.com.au, hotdocmail.com.au or short links on htd.io. They may ask you to verify your last name and date of birth before viewing a health message. They never ask for passwords or banking details.",
      },
      {
        q: "What should I do if I am unsure about a message?",
        a: "Do not click the link or reply with personal or financial details. Call Woolloongabba Medical Centre on (07) 3217 3344 and ask reception to confirm whether a message was sent.",
      },
      {
        q: "Will you ever ask for my banking password?",
        a: "No. We will never ask for passwords, banking logins, or one-time codes for bank accounts by SMS, email or HotDoc. Treat any such request as suspicious.",
      },
    ],
    articleHtml: `<figure class="institutional-editorial-visual"><img alt="HotDoc guide showing how to confirm authentic emails and links from hotdoc.com.au, hotdocmail.com.au or htd.io" decoding="async" loading="eager" src="assets/patient-information/hotdoc-scam-identification-poster.webp" width="1200" height="1600"/></figure>
<section class="article-section">
<h2>Why you may receive messages from us</h2>
<p>We may contact you about appointments, reminders, recalls for results or follow-up, specialist or other correspondence that needs your attention, and Medicare bulk billing consent (Assignment of Benefit) requests. Messages can arrive as SMS, email or HotDoc app notifications, depending on the situation and your contact preferences.</p>
</section>
<section class="article-section hotdoc-communication-note"><p class="eyebrow">Approved platform</p><h2>We use HotDoc to reach you securely.</h2><p>Woolloongabba Medical Centre uses HotDoc as an approved patient communication partner. A HotDoc message may ask you to verify your identity before you view a health message or complete a consent request. That verification is usually limited to details such as your last name and date of birth.</p></section>
<section class="article-section">
<h2>Examples of legitimate messages</h2>
<ul>
<li><strong>Appointment reminders</strong> — prompts to confirm, change or cancel an upcoming appointment, including HotDoc app push notifications.</li>
<li><strong>Recall messages</strong> — requests to book follow-up after test results, correspondence or recommended care.</li>
<li><strong>Correspondence notifications</strong> — alerts that a letter or report needs review with your doctor.</li>
<li><strong>Consent requests</strong> — short SMS or email links so Medicare bulk billing consent can be completed when required.</li>
</ul>
<p>Legitimate HotDoc emails typically come from <strong>hotdoc.com.au</strong> or <strong>hotdocmail.com.au</strong>. Legitimate links usually open <strong>hotdoc.com.au</strong> or short links on <strong>htd.io</strong>. Content often includes your name, our practice name and appointment or care details already known to the clinic.</p>
</section>
<section class="article-section">
<h2>Warning signs of suspicious messages</h2>
<ul>
<li>Requests for passwords, banking details, credit card numbers or one-time banking codes.</li>
<li>Urgent threats, prizes, or pressure to act immediately without a clear clinical reason.</li>
<li>Links that do not go to hotdoc.com.au or htd.io, or email addresses that only look similar to HotDoc.</li>
<li>Poor spelling, unexpected attachments, or messages that do not mention Woolloongabba Medical Centre or your known care.</li>
</ul>
<div class="callout"><strong>If you are unsure</strong><p>Call the clinic on <a class="inline-link" href="tel:+61732173344">(07) 3217 3344</a> before responding. Never provide passwords or banking details in reply to a message claiming to be from us or HotDoc.</p></div>
</section>
<section class="article-section faq page-context-faq" id="hotdoc-message-faqs"><h2>HotDoc message questions</h2>
<details><summary>Does Woolloongabba Medical Centre use HotDoc?</summary><p>Yes. We use HotDoc as an approved communication and booking platform for appointment reminders, recalls, correspondence notifications, consent requests and online booking.</p><p class="faq-link"><a href="book-appointment.html">Booking &amp; HotDoc →</a></p></details>
<details><summary>What do legitimate HotDoc messages look like?</summary><p>Legitimate messages usually name our practice, relate to your care, and use HotDoc domains such as hotdoc.com.au, hotdocmail.com.au or short links on htd.io. They may ask you to verify your last name and date of birth before viewing a health message. They never ask for passwords or banking details.</p></details>
<details><summary>What should I do if I am unsure about a message?</summary><p>Do not click the link or reply with personal or financial details. Call Woolloongabba Medical Centre on (07) 3217 3344 and ask reception to confirm whether a message was sent.</p><p class="faq-link"><a href="contact.html">Contact the clinic →</a></p></details>
<details><summary>Will you ever ask for my banking password?</summary><p>No. We will never ask for passwords, banking logins, or one-time codes for bank accounts by SMS, email or HotDoc. Treat any such request as suspicious.</p></details>
</section>
<section class="article-section patient-related-links"><h2>Related information</h2><div class="resource-links"><a class="resource-link" href="book-appointment.html"><span>Booking &amp; HotDoc</span><span>→</span></a><a class="resource-link" href="recalls-and-reminders.html"><span>Recalls &amp; Reminders</span><span>→</span></a><a class="resource-link" href="contact.html"><span>Contact</span><span>→</span></a></div></section>
<p class="knowledge-disclaimer">This page provides general patient information about practice communications. It is not legal, financial or cybersecurity advice. If you believe you have shared sensitive details with a suspicious message, contact your bank or relevant provider and call the clinic if the message appeared to relate to your care.</p>`,
  },
  {
    file: "recalls-and-reminders.html",
    seoTitle: "Recalls and Reminders | Woolloongabba Medical Centre",
    metaDescription:
      "How Woolloongabba Medical Centre uses recalls and reminders for results, correspondence, follow-up and preventive care — including HotDoc messages.",
    h1: "Recalls and reminders",
    lede: "When follow-up is needed, we may recall you for review or send a reminder about upcoming care. Keeping your contact details current helps us reach you.",
    breadcrumbLabel: "Recalls &amp; Reminders",
    criticalTitle: "Received a recall?",
    criticalText: "Book the recommended follow-up, or call reception if you are unsure what is needed.",
    faqs: [
      {
        q: "What is the difference between a recall and a reminder?",
        a: "A reminder usually supports an appointment or preventive task you already know about, such as confirming an upcoming visit. A recall asks you to return or book because follow-up is clinically appropriate — for example after results, correspondence or recommended care.",
      },
      {
        q: "When might I receive a recall?",
        a: "You may receive a recall after test results, specialist or other correspondence, follow-up care recommended by your doctor, or preventive care that is due. The exact reason depends on your clinical record.",
      },
      {
        q: "Will recalls come through HotDoc?",
        a: "Yes, HotDoc may be used to deliver recall and reminder messages by SMS, email or app notification. You can also contact the clinic directly if you prefer to book by phone.",
      },
      {
        q: "Why do you need my current contact details?",
        a: "Accurate phone, email and address details help the team reach you when follow-up is required. Update your details with reception or when completing patient forms.",
      },
    ],
    articleHtml: `<figure class="institutional-editorial-visual"><img alt="HotDoc patient journey showing click, verify and book steps for clinic health messages and recalls" decoding="async" loading="eager" src="assets/patient-information/hotdoc-recalls-poster.webp" width="1600" height="900"/></figure>
<section class="article-section">
<h2>Recall or reminder — what is the difference?</h2>
<p><strong>Reminders</strong> help you keep an existing appointment or preventive task on track — for example confirming or cancelling a booking. <strong>Recalls</strong> ask you to return or book because follow-up is needed for your care. Both support continuity; a recall is more likely when something in your record needs review.</p>
</section>
<section class="article-section">
<h2>When patients may receive a recall</h2>
<ul>
<li><strong>Test results</strong> — when a result should be discussed with a doctor or follow-up is advised.</li>
<li><strong>Specialist correspondence</strong> — when a letter or report needs review and a next step.</li>
<li><strong>Follow-up care</strong> — when your doctor has recommended review after treatment, procedures or ongoing concerns.</li>
<li><strong>Preventive care reminders</strong> — when screening, immunisation or other preventive care is due for discussion.</li>
</ul>
<p>Not every result or letter leads to a call. If your doctor asked you to return, please book even if you have not been contacted.</p>
</section>
<section class="article-section">
<figure class="institutional-editorial-visual"><img alt="HotDoc app push notification for an appointment reminder asking the patient to confirm or cancel" decoding="async" loading="lazy" src="assets/patient-information/hotdoc-appointment-reminders.webp" width="1600" height="900"/></figure>
<h2>How HotDoc may deliver these messages</h2>
<p>Woolloongabba Medical Centre may use HotDoc to send appointment reminders and health messages. Depending on your settings, you may receive an SMS, email or app notification. Some messages ask you to verify your identity before viewing details or booking.</p>
<p>For help recognising legitimate HotDoc messages, see <a class="inline-link" href="identifying-hotdoc-scam-messages.html">Identifying HotDoc scam messages</a>.</p>
</section>
<section class="article-section">
<h2>Keep your contact details up to date</h2>
<p>Please keep your mobile number, email and address current so the team can reach you when follow-up is required. Tell reception when details change, or update them when you complete patient forms.</p>
<div class="callout"><strong>Your responsibility</strong><p>If you were asked to return for results or follow-up, make the appointment even if we have not contacted you.</p></div>
</section>
<section class="article-section faq page-context-faq" id="recalls-reminders-faqs"><h2>Recall and reminder questions</h2>
<details><summary>What is the difference between a recall and a reminder?</summary><p>A reminder usually supports an appointment or preventive task you already know about, such as confirming an upcoming visit. A recall asks you to return or book because follow-up is clinically appropriate — for example after results, correspondence or recommended care.</p></details>
<details><summary>When might I receive a recall?</summary><p>You may receive a recall after test results, specialist or other correspondence, follow-up care recommended by your doctor, or preventive care that is due. The exact reason depends on your clinical record.</p><p class="faq-link"><a href="test-results.html">Test results →</a></p></details>
<details><summary>Will recalls come through HotDoc?</summary><p>Yes, HotDoc may be used to deliver recall and reminder messages by SMS, email or app notification. You can also contact the clinic directly if you prefer to book by phone.</p><p class="faq-link"><a data-hotdoc-button="" data-hotdoc-widget="lightbox" href="${HOTDOC}">Book Appointment</a></p></details>
<details><summary>Why do you need my current contact details?</summary><p>Accurate phone, email and address details help the team reach you when follow-up is required. Update your details with reception or when completing patient forms.</p><p class="faq-link"><a href="new-patients.html">New patients →</a></p></details>
</section>
<section class="article-section patient-related-links"><h2>Related information</h2><div class="resource-links"><a class="resource-link" href="contact.html"><span>Contact</span><span>→</span></a><a class="resource-link" href="new-patients.html"><span>New Patients</span><span>→</span></a><a class="resource-link" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="${HOTDOC}"><span>Book Appointment</span><span>→</span></a></div></section>
<p class="knowledge-disclaimer">This page provides general information about practice recall and reminder processes. It does not replace individual medical advice. If you are worried about symptoms or a result, book review or call the clinic.</p>`,
  },
  {
    file: "assignment-of-benefit.html",
    seoTitle: "Assignment of Benefit (AOB) | Woolloongabba Medical Centre",
    metaDescription:
      "Plain-English explanation of Assignment of Benefit and Medicare bulk billing consent at Woolloongabba Medical Centre, including HotDoc requests.",
    h1: "Assignment of Benefit (AOB) and bulk billing consent",
    lede: "For eligible Medicare bulk billed services, patients assign their Medicare benefit to the practice. You may be asked to confirm that consent by HotDoc message, email or notification.",
    breadcrumbLabel: "Assignment of Benefit",
    criticalTitle: "Received a consent request?",
    criticalText: "Respond promptly so bulk billing for an eligible consult can be completed.",
    faqs: [
      {
        q: "What does Assignment of Benefit mean?",
        a: "Assignment of Benefit means you agree that Medicare can pay the benefit for an eligible service directly to the practice, instead of paying you first. That is how bulk billing usually works for Medicare-eligible GP consultations at our clinic.",
      },
      {
        q: "Why is consent required?",
        a: "Medicare requires patient consent (Assignment of Benefit) so the practice can claim the Medicare benefit for an eligible bulk billed service. Without consent, the claim pathway for that service may not be completed.",
      },
      {
        q: "How will I receive an AOB or consent request?",
        a: "You may receive a short HotDoc SMS or email, or a HotDoc notification, asking you to confirm your details for Medicare consent. Requests can arrive before or after an appointment.",
      },
      {
        q: "What should I do when I get a request?",
        a: "Open the legitimate HotDoc link and complete the consent steps promptly. If you are unsure the message is genuine, call the clinic before responding. We will not ask for banking passwords.",
      },
    ],
    articleHtml: `<figure class="institutional-editorial-visual"><img alt="HotDoc bulk billing consent graphic explaining Medicare consent messages by SMS or email" decoding="async" loading="eager" src="assets/patient-information/hotdoc-aob-bulk-billing-consent.webp" width="1600" height="900"/></figure>
<section class="article-section">
<h2>What Assignment of Benefit means</h2>
<p>Assignment of Benefit (AOB) is the Medicare process where you agree that the Medicare benefit for an eligible service is paid to the practice. In plain terms, it is the consent that lets bulk billing work for that consultation or service when Medicare rules allow it.</p>
<p>This page explains practice process only. It is not financial or legal advice, and Medicare rules can change.</p>
</section>
<section class="article-section">
<h2>Why consent is required</h2>
<p>Medicare expects patient consent before a bulk billed claim can be lodged for an eligible service. Completing AOB confirms your details and your agreement that the benefit is assigned to the practice for that care.</p>
<p>Woolloongabba Medical Centre provides 100% Medicare bulk billing for standard Medicare-eligible general practice consultations for patients with a valid Medicare card. Some services sit outside standard Medicare billing — see <a class="inline-link" href="bulk-billing.html">Bulk Billing</a> and <a class="inline-link" href="medicare.html">Medicare</a>.</p>
</section>
<section class="article-section">
<figure class="institutional-editorial-visual"><img alt="HotDoc poster explaining bulk billing consent managed by SMS or email through HotDoc" decoding="async" loading="lazy" src="assets/patient-information/hotdoc-aob-bulk-billing-consent-a3.webp" width="1200" height="1600"/></figure>
<h2>How you may receive an AOB request</h2>
<ul>
<li>After an appointment, or sometimes before, you may receive a consent request.</li>
<li>Requests may be sent via HotDoc as SMS or email.</li>
<li>You may also see HotDoc app notifications related to consent.</li>
</ul>
<p>Please respond promptly so billing for an eligible bulk billed service can be completed. A legitimate request asks you to confirm consent details — it does not ask for banking passwords or account logins.</p>
<div class="callout"><strong>If a message looks wrong</strong><p>Call <a class="inline-link" href="tel:+61732173344">(07) 3217 3344</a> before completing anything. See <a class="inline-link" href="identifying-hotdoc-scam-messages.html">Identifying HotDoc scam messages</a> for domain and safety checks.</p></div>
</section>
<section class="article-section faq page-context-faq" id="aob-faqs"><h2>Assignment of Benefit questions</h2>
<details><summary>What does Assignment of Benefit mean?</summary><p>Assignment of Benefit means you agree that Medicare can pay the benefit for an eligible service directly to the practice, instead of paying you first. That is how bulk billing usually works for Medicare-eligible GP consultations at our clinic.</p></details>
<details><summary>Why is consent required?</summary><p>Medicare requires patient consent (Assignment of Benefit) so the practice can claim the Medicare benefit for an eligible bulk billed service. Without consent, the claim pathway for that service may not be completed.</p><p class="faq-link"><a href="bulk-billing.html">Bulk billing →</a></p></details>
<details><summary>How will I receive an AOB or consent request?</summary><p>You may receive a short HotDoc SMS or email, or a HotDoc notification, asking you to confirm your details for Medicare consent. Requests can arrive before or after an appointment.</p></details>
<details><summary>What should I do when I get a request?</summary><p>Open the legitimate HotDoc link and complete the consent steps promptly. If you are unsure the message is genuine, call the clinic before responding. We will not ask for banking passwords.</p><p class="faq-link"><a data-hotdoc-button="" data-hotdoc-widget="lightbox" href="${HOTDOC}">Book Appointment</a></p></details>
</section>
<section class="article-section patient-related-links"><h2>Related information</h2><div class="resource-links"><a class="resource-link" href="bulk-billing.html"><span>Bulk Billing</span><span>→</span></a><a class="resource-link" href="medicare.html"><span>Medicare</span><span>→</span></a><a class="resource-link" href="book-appointment.html"><span>Booking &amp; HotDoc</span><span>→</span></a></div></section>
<p class="knowledge-disclaimer">This page provides general information about Medicare bulk billing consent at our practice. It is not financial or legal advice. For your personal Medicare entitlements, check with Services Australia or ask reception about our current billing pathways.</p>`,
  },
];

for (const page of pages) {
  const html = shell({ ...page, navRoute: page.file, faqs: page.faqs });
  fs.writeFileSync(path.join(ROOT, page.file), html, "utf8");
  console.log("wrote", page.file, html.length);
}

console.log("pages done");
