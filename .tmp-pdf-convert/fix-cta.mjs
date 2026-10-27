import fs from "fs";

const HOTDOC =
  "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox";

const pages = [
  [
    "identifying-hotdoc-scam-messages.html",
    "Unsure about a message?",
    "Call the clinic before you click, reply or share personal details.",
  ],
  [
    "recalls-and-reminders.html",
    "Received a recall?",
    "Book the recommended follow-up, or call reception if you are unsure what is needed.",
  ],
  [
    "assignment-of-benefit.html",
    "Received a consent request?",
    "Respond promptly so bulk billing for an eligible consult can be completed.",
  ],
];

for (const [file, title, text] of pages) {
  const path = `old-html/${file}`;
  let html = fs.readFileSync(path, "utf8");
  const band = `<section aria-label="${title}" class="critical-action-band"><div class="shell critical-actions"><div class="critical-actions-copy"><strong>${title}</strong><span>${text}</span></div><div class="critical-action-links"><a class="critical-action-link critical-action-primary wmc-book-appointment" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="${HOTDOC}">Book Appointment</a><a class="critical-action-link" href="tel:+61732173344">Call Clinic</a></div></div></section>`;
  html = html.replace(
    /<section aria-label="[^"]+" class="critical-action-band">[\s\S]*?<\/section>/,
    band
  );
  fs.writeFileSync(path, html);
  console.log("fixed", file);
}
