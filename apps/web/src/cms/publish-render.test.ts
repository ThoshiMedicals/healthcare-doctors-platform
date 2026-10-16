import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { goldenHtmlRoot } from "@/importer/golden-root";
import { applyAccessibilityClosure } from "@/documents/accessibility";
import { applyPracticeDocument, practiceLinkProblems, readPracticeDocument } from "@/cms/practice-document";
import { applyServiceDocument, readServiceDocument, serviceLinkProblems } from "@/cms/service-document";
import { applyArticleDocument, articleLinkProblems, readArticleDocument } from "@/cms/article-document";
import { applyOverlay, applyReceptionIndex, applyRepeatBinding, readGoldenContact, readLede, readPractitionerSlots, readSharedHotdoc, readTitle } from "@/cms/overlay";
import { bookingUrlProblems, matchVerifiedUpload, portraitProblems } from "@/cms/practitioner-media";
import { comparePublishedPages, tagSignature } from "@/cms/publish-check";
import { pageRegions } from "@/regression/regions";

const doctorPath = path.join(goldenHtmlRoot(), "doctors/dr-anand-singh.html");
const doctorHtml = fs.readFileSync(doctorPath, "utf8");

test("an unchanged published practitioner matches the approved page", () => {
  const slots = readPractitionerSlots(doctorHtml);
  const result = applyOverlay(doctorHtml, { practitioner: slots });
  assert.deepEqual(result.errors, []);
  assert.equal(result.html, doctorHtml);
});

test("a published biography changes the biography text and leaves the design in place", () => {
  const slots = readPractitionerSlots(doctorHtml);
  const published = "Dr Anand Singh continues to provide general practice care in Woolloongabba. Published biography check.";
  const result = applyOverlay(doctorHtml, { practitioner: { ...slots, biography: published } });
  assert.deepEqual(result.errors, []);
  assert.equal(result.html.includes(published), true);
  assert.equal(result.html.includes(slots.biography), false);
  const comparison = comparePublishedPages(doctorHtml, result.html);
  assert.equal(comparison.ok, true, comparison.reasons.join(" "));
  const before = pageRegions(doctorHtml);
  const after = pageRegions(result.html);
  assert.equal(before.navigation, after.navigation);
  assert.equal(before.footer, after.footer);
  assert.deepEqual(before.schema, after.schema);
  assert.equal(before.skipLink, after.skipLink);
  assert.equal(before.mainOpen, after.mainOpen);
  assert.equal(tagSignature(doctorHtml), tagSignature(result.html));
});

test("a draft overlay is not applied when no published payload is supplied", () => {
  const result = applyOverlay(doctorHtml, {});
  assert.equal(result.html, doctorHtml);
});

test("an interest list with a different length is refused", () => {
  const slots = readPractitionerSlots(doctorHtml);
  const result = applyOverlay(doctorHtml, {
    practitioner: { ...slots, areasOfCare: ["One item only"] },
  });
  assert.equal(result.errors.some((error) => error.includes("Areas of interest")), true);
  assert.equal(result.html.includes("One item only"), false);
});

test("published opening hours change the footer text and keep the footer layout", () => {
  const contact = readGoldenContact(doctorHtml);
  const result = applyOverlay(doctorHtml, {
    clinic: {
      ...contact,
      openingHours: [
        { dayOfWeek: "monday", opens: "08:00", closes: "18:00" },
        { dayOfWeek: "tuesday", opens: "08:00", closes: "18:00" },
        { dayOfWeek: "wednesday", opens: "08:00", closes: "18:00" },
        { dayOfWeek: "thursday", opens: "08:00", closes: "18:00" },
        { dayOfWeek: "friday", opens: "08:00", closes: "17:00" },
        { dayOfWeek: "saturday", opens: "09:00", closes: "17:00" },
        { dayOfWeek: "sunday", opens: "09:00", closes: "15:00" },
      ],
    },
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.html.includes("8:00 AM\u20136:00 PM"), true);
  const comparison = comparePublishedPages(doctorHtml, result.html);
  assert.equal(comparison.ok, true, comparison.reasons.join(" "));
});

test("a published About page summary changes the lede and keeps the page structure", () => {
  const about = fs.readFileSync(path.join(goldenHtmlRoot(), "about-us.html"), "utf8");
  const result = applyOverlay(about, {
    practice: { title: "About Woolloongabba Medical Centre", summary: "A local healthcare practice. Published summary check." },
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.html.includes("Published summary check."), true);
  const comparison = comparePublishedPages(about, result.html);
  assert.equal(comparison.ok, true, comparison.reasons.join(" "));
});

test("a published photo and HotDoc URL update the profile and card without changing the layout", () => {
  const slots = readPractitionerSlots(doctorHtml);
  const teamHtml = fs.readFileSync(path.join(goldenHtmlRoot(), "team-general-practitioners.html"), "utf8");
  const nextBooking =
    "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors/dr-debra-larkins-2?wp=w_lightbox";
  const content = {
    ...slots,
    qualifications: ["MBBS", "FRACGP"],
    languages: ["English", "Hindi"],
    portraitFile: "dr-debra-larkins.webp",
    sourcePortraitFile: "dr-anand-singh.webp",
    bookingUrl: nextBooking,
    sourceBookingUrl:
      "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors/dr-anand-singh-3?wp=w_lightbox",
  };
  const profile = applyOverlay(doctorHtml, { practitioner: content });
  const card = applyOverlay(teamHtml, { practitioner: { ...content, profileText: false } });
  assert.deepEqual(profile.errors, []);
  assert.deepEqual(card.errors, []);
  assert.equal(profile.html.includes("dr-debra-larkins.webp"), true);
  assert.equal(profile.html.includes("dr-anand-singh.webp"), false);
  assert.equal(profile.html.includes(nextBooking), true);
  assert.equal(profile.html.includes('width="800"'), true);
  assert.equal(profile.html.includes('height="1000"'), true);
  assert.equal(profile.html.includes('data-practitioner-image="true"'), true);
  assert.equal(profile.html.includes('data-hotdoc-widget="lightbox"'), true);
  assert.equal(profile.html.includes("hotdoc-widgets.min.js"), true);
  const anandCard = card.html.slice(card.html.indexOf('alt="Dr Anand Singh"') - 80, card.html.indexOf('alt="Dr Anand Singh"') + 900);
  assert.equal(anandCard.includes("dr-anand-singh.webp"), false);
  assert.equal(anandCard.includes("dr-debra-larkins.webp"), true);
  assert.equal(anandCard.includes('width="800"'), true);
  assert.equal(anandCard.includes('height="1000"'), true);
  assert.equal(card.html.includes("doctors?wp=w_lightbox"), true);
  assert.equal(card.html.includes("dr-debra-larkins-2?wp=w_lightbox"), true);
  const profileComparison = comparePublishedPages(doctorHtml, profile.html);
  const cardComparison = comparePublishedPages(teamHtml, card.html);
  assert.equal(profileComparison.ok, true, profileComparison.reasons.join(" "));
  assert.equal(cardComparison.ok, true, cardComparison.reasons.join(" "));
  assert.equal(tagSignature(doctorHtml), tagSignature(profile.html));
  assert.equal(tagSignature(teamHtml), tagSignature(card.html));
});

test("an unverified photo or a non-lightbox booking link is refused", () => {
  const slots = readPractitionerSlots(doctorHtml);
  const photo = applyOverlay(doctorHtml, {
    practitioner: {
      ...slots,
      portraitFile: "not-a-practitioner.webp",
      sourcePortraitFile: "dr-anand-singh.webp",
    },
  });
  assert.equal(photo.errors.some((error) => error.includes("verified practitioner image")), true);
  assert.equal(photo.html, doctorHtml);
  const booking = applyOverlay(doctorHtml, {
    practitioner: {
      ...slots,
      bookingUrl: "https://example.com/book",
      sourceBookingUrl:
        "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors/dr-anand-singh-3?wp=w_lightbox",
    },
  });
  assert.equal(booking.errors.length > 0, true);
  assert.equal(booking.html, doctorHtml);
  assert.equal(bookingUrlProblems("javascript:alert(1)").length > 0, true);
  assert.equal(portraitProblems("dr-anand-singh.webp", "../secrets.webp").length > 0, true);
  const upload = matchVerifiedUpload(Buffer.from("not an image"), "dr-anand-singh.webp");
  assert.equal(upload.file, null);
  const approved = fs.readFileSync(path.join(process.cwd(), "public/assets/team/dr-debra-larkins.webp"));
  const matched = matchVerifiedUpload(approved, "dr-anand-singh.webp");
  assert.equal(matched.file, "dr-debra-larkins.webp");
});

test("an unchanged Knowledge Centre article matches the approved page", () => {
  const pagePath = "knowledge/articles/why-skin-checks-matter-in-australia.html";
  const html = fs.readFileSync(path.join(goldenHtmlRoot(), pagePath), "utf8");
  const document = readArticleDocument(html, pagePath);
  const result = applyArticleDocument(html, document, pagePath);
  assert.deepEqual(result.errors, []);
  assert.equal(result.html, html);
});

test("a published article body changes the text and keeps the Knowledge Centre layout", () => {
  const pagePath = "knowledge/articles/why-skin-checks-matter-in-australia.html";
  const html = fs.readFileSync(path.join(goldenHtmlRoot(), pagePath), "utf8");
  const document = readArticleDocument(html, pagePath);
  const introduction = document.sections.find((section) => section.id === "introduction");
  const signs = document.sections.find((section) => section.id === "signs-symptoms-situations");
  const faqs = document.sections.find((section) => section.id === "frequently-asked-questions");
  assert.ok(introduction && signs && faqs);
  introduction.paragraphs[0] = "Published article body check.";
  introduction.heading = "Introduction";
  signs.takeaways[0] = "Published takeaway check.";
  faqs.faqs[0].answer = "Published answer check.";
  document.updated = "2026-10-12";
  const result = applyArticleDocument(html, document, pagePath);
  assert.deepEqual(result.errors, []);
  assert.equal(result.html.includes("Published article body check."), true);
  assert.equal(result.html.includes("Published takeaway check."), true);
  assert.equal(result.html.includes("Published answer check."), true);
  assert.equal(result.html.includes("Updated 2026-10-12"), true);
  const comparison = comparePublishedPages(html, result.html);
  assert.equal(comparison.ok, true, comparison.reasons.join(" "));
  assert.equal(tagSignature(html), tagSignature(result.html));
  const known = new Set(
    [...result.html.matchAll(/\bhref="([^"]+)"/g)].flatMap((match) => {
      const href = match[1];
      if (href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return [];
      const resolved = href.split("/").filter((part) => part !== "." && part !== "..");
      return [resolved.join("/")];
    }),
  );
  const service = document.sections.find((section) => section.id === "related-services");
  assert.ok(service);
  service.services[0].href = "services/does-not-exist.html";
  const broken = applyArticleDocument(html, document, pagePath);
  assert.equal(articleLinkProblems(broken.html, pagePath, known).some((problem) => problem.includes("does-not-exist")), true);
});

test("approved related service links include the services index and published patient pages", () => {
  const root = goldenHtmlRoot();
  const known = new Set<string>();
  const collect = (directory: string, prefix: string) => {
    for (const name of fs.readdirSync(directory)) {
      const full = path.join(directory, name);
      const relative = prefix ? `${prefix}/${name}` : name;
      if (fs.statSync(full).isDirectory()) collect(full, relative);
      else if (name.endsWith(".html")) known.add(relative.replaceAll("\\", "/"));
    }
  };
  collect(root, "");
  const articles = [...known].filter((page) => page.startsWith("knowledge/articles/"));
  const problems = articles.flatMap((pagePath) => {
    const html = fs.readFileSync(path.join(root, pagePath), "utf8");
    return articleLinkProblems(html, pagePath, known)
      .filter((problem) => problem.startsWith("Related service"))
      .map((problem) => `${pagePath}: ${problem}`);
  });
  assert.deepEqual(problems, []);
  const adhd = fs.readFileSync(path.join(root, "knowledge/articles/adhd-assessment-pathways.html"), "utf8");
  const services = readArticleDocument(adhd, "knowledge/articles/adhd-assessment-pathways.html").sections.find(
    (section) => section.id === "related-services",
  );
  assert.equal(services?.services.some((link) => link.href === "services.html"), true);
});

test("accessibility closure labels the footer contact group and corrects the 404 heading level", () => {
  const home = fs.readFileSync(path.join(goldenHtmlRoot(), "index.html"), "utf8");
  const closedHome = applyAccessibilityClosure(home, "index.html");
  assert.equal(closedHome.includes('<div class="footer-contact" role="group" aria-label="Practice contact and location">'), true);
  assert.equal(closedHome.includes("<h3 aria-level"), false);
  assert.equal(pageRegions(home).navigation, pageRegions(closedHome).navigation);
  assert.equal(pageRegions(home).header, pageRegions(closedHome).header);
  const notFound = fs.readFileSync(path.join(goldenHtmlRoot(), "404.html"), "utf8");
  const closedNotFound = applyAccessibilityClosure(notFound, "404.html");
  const footer = closedNotFound.match(/<footer\b[\s\S]*<\/footer>/i)?.[0] ?? "";
  assert.equal(footer.includes('<h3 aria-level="2">About the Practice</h3>'), true);
  assert.equal(footer.includes('<h3 aria-level="2">Patient Information</h3>'), true);
  assert.equal(footer.includes('<h3 aria-level="2">Healthcare &amp; Learning</h3>'), true);
  assert.equal(closedNotFound.includes("<h1>We couldn’t find that page.</h1>"), true);
  assert.equal(tagSignature(notFound), tagSignature(closedNotFound));
  assert.equal(pageRegions(notFound).navigation, pageRegions(closedNotFound).navigation);
});

test("an unchanged About or Patient Information page matches the approved page", () => {
  const root = goldenHtmlRoot();
  const files = fs
    .readdirSync(root)
    .filter((file) => file.endsWith(".html"))
    .filter((file) => {
      const html = fs.readFileSync(path.join(root, file), "utf8");
      return /data-nav-owner="(?:about|patient-info)"/.test(html);
    });
  assert.ok(files.includes("about-us.html"));
  assert.ok(files.includes("faqs.html"));
  assert.ok(files.includes("fees-billing.html"));
  for (const file of files) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    const result = applyPracticeDocument(html, readPracticeDocument(html));
    assert.deepEqual(result.errors, [], file);
    assert.equal(result.html, html, file);
  }
  const philosophy = fs.readFileSync(path.join(root, "philosophy-of-care.html"), "utf8");
  const about = readPracticeDocument(philosophy);
  about.summary = "Published philosophy summary check.";
  about.sections[0].paragraphs[0] = "Published philosophy introduction check.";
  const publishedAbout = applyPracticeDocument(philosophy, about);
  assert.deepEqual(publishedAbout.errors, []);
  assert.equal(publishedAbout.html.includes("Published philosophy summary check."), true);
  assert.equal(publishedAbout.html.includes("Published philosophy introduction check."), true);
  const aboutComparison = comparePublishedPages(philosophy, publishedAbout.html);
  assert.equal(aboutComparison.ok, true, aboutComparison.reasons.join(" "));
  assert.equal(tagSignature(philosophy), tagSignature(publishedAbout.html));
  const fees = fs.readFileSync(path.join(root, "fees-billing.html"), "utf8");
  const patient = readPracticeDocument(fees);
  const faqSection = patient.sections.find((section) => section.faqs.length > 0);
  assert.ok(faqSection);
  faqSection.faqs[0].answer = "Published billing answer check.";
  const publishedFees = applyPracticeDocument(fees, patient);
  assert.deepEqual(publishedFees.errors, []);
  assert.equal(publishedFees.html.includes("Published billing answer check."), true);
  const known = new Set<string>();
  const walk = (directory: string, prefix = "") => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(path.join(directory, entry.name), relative);
      else if (entry.name.endsWith(".html")) known.add(relative.replaceAll("\\", "/"));
    }
  };
  walk(root);
  assert.deepEqual(practiceLinkProblems(fees, publishedFees.html, "fees-billing.html", known), []);
  const footer = publishedFees.html.match(/<footer\b[\s\S]*<\/footer>/i)?.[0] ?? "";
  assert.equal(footer.includes('href="new-patients.html"'), true);
  assert.equal(footer, fees.match(/<footer\b[\s\S]*<\/footer>/i)?.[0]);
});

test("an unchanged service page matches the approved page", () => {
  const pagePath = "services/skin-checks.html";
  const html = fs.readFileSync(path.join(goldenHtmlRoot(), pagePath), "utf8");
  const document = readServiceDocument(html, pagePath);
  const result = applyServiceDocument(html, document, pagePath);
  assert.deepEqual(result.errors, []);
  assert.equal(result.html, html);
  const introduction = document.sections.find((section) => section.id === "introduction");
  assert.ok(introduction);
  introduction.paragraphs[0] = "Published service introduction check.";
  document.summary = "Published service summary check.";
  const faqs = document.sections.find((section) => section.id === "faqs");
  assert.ok(faqs && faqs.faqs.length > 0);
  faqs.faqs[0].answer = "Published service answer check.";
  const published = applyServiceDocument(html, document, pagePath);
  assert.deepEqual(published.errors, []);
  assert.equal(published.html.includes("Published service introduction check."), true);
  assert.equal(published.html.includes("Published service summary check."), true);
  assert.equal(published.html.includes("Published service answer check."), true);
  const comparison = comparePublishedPages(html, published.html);
  assert.equal(comparison.ok, true, comparison.reasons.join(" "));
  assert.equal(tagSignature(html), tagSignature(published.html));
  const practitioners = document.sections.find((section) => section.id === "related-practitioners");
  assert.ok(practitioners && practitioners.practitioners.length > 0);
  practitioners.practitioners[0].href = "services/not-a-doctor.html";
  const broken = applyServiceDocument(html, document, pagePath);
  const known = new Set(["services/skin-checks.html"]);
  assert.equal(serviceLinkProblems(broken.errors.length > 0 ? html : broken.html, pagePath, known).some((problem) => problem.includes("practitioner")), true);
});

test("clinic settings update the shared booking link and schema without moving a doctor booking link", () => {
  const contact = readGoldenContact(doctorHtml);
  const shared = readSharedHotdoc(doctorHtml);
  const doctorBooking = doctorHtml.match(/doctors\/dr-anand-singh[^"']+/)?.[0] ?? "";
  const nextHotdoc = "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox&published=1";
  const result = applyOverlay(doctorHtml, {
    clinic: {
      ...contact,
      phoneDisplay: "(07) 3000 0000",
      phoneTel: "+61730000000",
      suburb: "East Brisbane",
      hotdocUrl: nextHotdoc,
      openingHours: [
        { dayOfWeek: "monday", opens: "08:00", closes: "18:00" },
        { dayOfWeek: "tuesday", opens: "08:00", closes: "18:00" },
        { dayOfWeek: "wednesday", opens: "08:00", closes: "18:00" },
        { dayOfWeek: "thursday", opens: "08:00", closes: "18:00" },
        { dayOfWeek: "friday", opens: "08:00", closes: "17:00" },
        { dayOfWeek: "saturday", opens: "09:00", closes: "17:00" },
        { dayOfWeek: "sunday", opens: "09:00", closes: "15:00" },
      ],
    },
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.html.includes(nextHotdoc), true);
  assert.equal(result.html.includes(shared), false);
  assert.equal(result.html.includes(doctorBooking), true);
  assert.equal(result.html.includes('"telephone":"+61 7 3000 0000"'), true);
  assert.equal(result.html.includes('"addressLocality":"East Brisbane"'), true);
  const home = fs.readFileSync(path.join(goldenHtmlRoot(), "index.html"), "utf8");
  const homeResult = applyOverlay(home, {
    clinic: {
      ...readGoldenContact(home),
      openingHours: [
        { dayOfWeek: "monday", opens: "08:00", closes: "18:00" },
        { dayOfWeek: "tuesday", opens: "08:00", closes: "18:00" },
        { dayOfWeek: "wednesday", opens: "08:00", closes: "18:00" },
        { dayOfWeek: "thursday", opens: "08:00", closes: "18:00" },
        { dayOfWeek: "friday", opens: "08:00", closes: "17:00" },
        { dayOfWeek: "saturday", opens: "09:00", closes: "17:00" },
        { dayOfWeek: "sunday", opens: "09:00", closes: "15:00" },
      ],
    },
  });
  assert.deepEqual(homeResult.errors, []);
  assert.equal(homeResult.html.includes('"dayOfWeek":["Monday","Tuesday","Wednesday","Thursday"],"opens":"08:00","closes":"18:00"'), true);
  const comparison = comparePublishedPages(doctorHtml, result.html);
  assert.equal(comparison.ok, true, comparison.reasons.join(" "));
  assert.equal(comparePublishedPages(home, homeResult.html).ok, true);
});

test("a practitioner name updates the profile heading and the team card", () => {
  const slots = readPractitionerSlots(doctorHtml);
  const teamHtml = fs.readFileSync(path.join(goldenHtmlRoot(), "team-general-practitioners.html"), "utf8");
  const content = { ...slots, name: "Dr Published Name", sourceName: "Dr Anand Singh" };
  const profile = applyOverlay(doctorHtml, { practitioner: content });
  const card = applyOverlay(teamHtml, { practitioner: { ...content, profileText: false } });
  assert.deepEqual(profile.errors, []);
  assert.deepEqual(card.errors, []);
  assert.equal(profile.html.includes("<h1>Dr Published Name</h1>"), true);
  assert.equal(profile.html.includes('alt="Dr Published Name"'), true);
  assert.equal(card.html.includes("Dr Published Name"), true);
  assert.equal(card.html.includes(">Dr Anand Singh<"), false);
  const profileComparison = comparePublishedPages(doctorHtml, profile.html);
  assert.equal(profileComparison.ok, true, profileComparison.reasons.join(" "));
  const cardComparison = comparePublishedPages(teamHtml, card.html);
  assert.equal(cardComparison.ok, true, cardComparison.reasons.join(" "));
});

test("a knowledge topic title and summary update the topic page and a navigation link", () => {
  const topicPath = "knowledge/adhd.html";
  const topicHtml = fs.readFileSync(path.join(goldenHtmlRoot(), topicPath), "utf8");
  const articleHtml = fs.readFileSync(path.join(goldenHtmlRoot(), "knowledge/articles/when-should-i-seek-adhd-assessment.html"), "utf8");
  const binding = {
    pagePath: topicPath,
    title: "Published ADHD topic",
    sourceTitle: readTitle(topicHtml),
    summary: "Published topic introduction.",
    sourceSummary: readLede(topicHtml),
    author: "",
    sourceAuthor: "",
    topicPage: true,
  };
  const topic = applyRepeatBinding(topicHtml, binding);
  const linked = applyRepeatBinding(articleHtml, binding);
  assert.equal(topic.includes("<h1>Published ADHD topic</h1>"), true);
  assert.equal(topic.includes("Published topic introduction."), true);
  assert.equal(linked.includes(">Published ADHD topic<"), true);
  assert.equal(comparePublishedPages(topicHtml, topic).ok, true);
  assert.equal(comparePublishedPages(articleHtml, linked).ok, true);
});

test("an update author and a repeated card title stay inside the existing card", () => {
  const updateHtml = fs.readFileSync(path.join(goldenHtmlRoot(), "updates/new-patients-welcome.html"), "utf8");
  const published = applyOverlay(updateHtml, {
    update: { title: readTitle(updateHtml), summary: "Published update summary.", author: "Reception", sourceAuthor: "Practice Team" },
  });
  assert.equal(published.html.includes("Published update summary."), true);
  assert.equal(published.html.includes("By Reception"), true);
  const indexHtml = fs.readFileSync(path.join(goldenHtmlRoot(), "updates/index.html"), "utf8");
  const card = applyRepeatBinding(indexHtml, {
    pagePath: "updates/new-patients-welcome.html",
    title: "Published welcome title",
    sourceTitle: "New patients are welcome",
    summary: "Published card summary.",
    sourceSummary: "A clear guide to booking your first appointment, what to bring and what to expect when you arrive.",
    author: "Reception",
    sourceAuthor: "Practice Team",
    topicPage: false,
  });
  assert.equal(card.includes("Published welcome title"), true);
  assert.equal(card.includes("By Reception"), true);
  assert.equal(card.includes("By Practice Team"), false);
  assert.equal(card.includes("current-billing-information.html"), true);
  const index = applyReceptionIndex(
    'window.WMC_DIGITAL_RECEPTION_INDEX = [{"title":"New patients are welcome","h1":"New patients are welcome","url":"updates/new-patients-welcome.html","description":"A clear guide to booking your first appointment, what to bring and what to expect when you arrive.","text":"New patients are welcome"}];',
    [
      {
        pagePath: "updates/new-patients-welcome.html",
        title: "Published welcome title",
        sourceTitle: "New patients are welcome",
        summary: "Published card summary.",
        sourceSummary: "A clear guide to booking your first appointment, what to bring and what to expect when you arrive.",
        author: "",
        sourceAuthor: "",
        topicPage: false,
      },
    ],
  );
  assert.equal(index.includes("Published welcome title"), true);
  assert.equal(index.includes("Published card summary."), true);
  assert.equal(comparePublishedPages(indexHtml, card).ok, true);
});

test("removing a class fails the publish comparison", () => {
  const broken = doctorHtml.replace('class="doctor-role"', 'class="changed-role"');
  const comparison = comparePublishedPages(doctorHtml, broken);
  assert.equal(comparison.ok, false);
});
