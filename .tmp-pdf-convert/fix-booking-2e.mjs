import fs from "fs";
import path from "path";

const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html";
const CLINIC =
  "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox";
const BASE =
  "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors/";

const hotdoc = (name, slug) =>
  `<a class="button wmc-book-appointment wmc-book-practitioner" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="${BASE}${slug}" rel="noopener">Book with ${name}</a>`;

const phoneAbadir = `<a aria-label="Call reception to book with Dr Mary Abadir" class="button wmc-book-appointment" href="tel:+61732173344">Call Reception for Dr Abadir</a>`;

const notice = (text) =>
  text
    ? `<p class="practitioner-booking-notice"><strong>Booking note:</strong> ${text}</p>`
    : "";

const clinicFallback = `<div class="service-clinic-booking"><p class="service-booking-kicker">Clinic booking list</p><div class="service-cta-actions"><a class="button wmc-book-appointment" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="${CLINIC}">Book Appointment</a><a class="text-link" href="tel:+61732173344">Call (07) 3217 3344</a></div></div>`;

function section({ heading = "Book Appointment.", intro, leadsHtml, noticesHtml = "" }) {
  return `<section class="article-section service-booking-cta" id="book"><p class="eyebrow">Appointments</p><h2>${heading}</h2><p>${intro}</p><div class="service-intelligent-booking"><div class="service-lead-booking"><p class="service-booking-kicker">Published lead</p><div class="service-cta-actions">${leadsHtml}</div>${noticesHtml}</div>${clinicFallback}</div></section>`;
}

const pages = {
  "services/chronic-disease-care.html": section({
    intro:
      "Start with the published diabetes and chronic-care lead, or open the clinic list if you prefer another GP.",
    leadsHtml: hotdoc("Dr Wasantha Hettiarchchi", "dr-wasantha-hettiarachchi-1?wp=w_lightbox"),
  }),
  "services/mental-health.html": section({
    intro:
      "Start with the published mental health lead, or open the clinic list if you prefer another GP.",
    leadsHtml: hotdoc(
      "Dr Sumita Singh",
      "dr-sumita-singh-does-not-bulk-bill-for-insurance-patients?wp=w_lightbox"
    ),
    noticesHtml: notice("Dr Sumita Singh does not bulk bill for insurance patients."),
  }),
  "services/skin-checks.html": section({
    intro:
      "Start with the published dermatology lead for skin checks, or open the clinic list if you prefer another GP.",
    leadsHtml: hotdoc(
      "Dr Anand Singh",
      "dr-anand-singh-does-not-bulk-bill-for-insurance-patients?wp=w_lightbox"
    ),
    noticesHtml: notice("Dr Anand Singh does not bulk bill for insurance patients."),
  }),
  "services/womens-health.html": section({
    intro:
      "Start with specialist women’s health booking through reception for Dr Mary Abadir, or open the clinic list for GP women’s health appointments.",
    leadsHtml: phoneAbadir,
    noticesHtml: notice(
      "Dr Mary Abadir is booked by calling reception. HotDoc is not used for this specialist pathway."
    ),
  }),
  "services/antenatal-postnatal-care.html": section({
    heading: "Ready to book?",
    intro:
      "Start with specialist antenatal booking through reception for Dr Mary Abadir, or open the clinic list for GP shared antenatal care.",
    leadsHtml: phoneAbadir,
    noticesHtml: notice(
      "Dr Mary Abadir is booked by calling reception. HotDoc is not used for this specialist pathway."
    ),
  }),
  "services/allied-health.html": section({
    intro:
      "Start with the published allied health leads, or open the clinic list if you need help choosing an appointment.",
    leadsHtml:
      hotdoc("Dr Steven Chang", "dr-steven-chang-1?wp=w_lightbox") +
      hotdoc("Mr Samuel Stafford", "samuel-stafford-physiotherapist?wp=w_lightbox"),
  }),
};

const bookRe =
  /<section class="article-section service-booking-cta" id="book">[\s\S]*?<\/section>/;

for (const [rel, html] of Object.entries(pages)) {
  const full = path.join(root, rel);
  const text = fs.readFileSync(full, "utf8");
  if (!bookRe.test(text)) throw new Error("No booking CTA on " + rel);
  fs.writeFileSync(full, text.replace(bookRe, html));
  console.log("updated", rel);
}

// CSS for intelligent booking layout
const cssPath = path.join(root, "styles.css");
const marker = "/* Intelligent service booking pathways */";
let css = fs.readFileSync(cssPath, "utf8");
if (!css.includes(marker)) {
  css += `
${marker}
.service-intelligent-booking{
  display:grid;
  gap:22px;
  margin-top:22px;
}
.service-booking-kicker{
  margin:0 0 10px;
  color:#315f83;
  font-size:12.5px;
  font-weight:700;
  letter-spacing:.04em;
  text-transform:uppercase;
}
.service-lead-booking .service-cta-actions,
.service-clinic-booking .service-cta-actions{
  margin-top:0;
  flex-wrap:wrap;
}
.service-lead-booking .practitioner-booking-notice{
  margin-top:12px!important;
  max-width:42rem;
}
@media(max-width:700px){
  .service-intelligent-booking{gap:18px}
  .service-lead-booking .service-cta-actions,
  .service-clinic-booking .service-cta-actions{width:100%}
}
`;
  fs.writeFileSync(cssPath, css);
  console.log("updated styles.css");
}
