import fs from "fs";

const pages = [
  ["services/chronic-disease-care.html", "Dr Wasantha Hettiarchchi", "hettiarachchi"],
  ["services/mental-health.html", "Dr Sumita Singh", "does-not-bulk-bill"],
  ["services/skin-checks.html", "Dr Anand Singh", "does-not-bulk-bill"],
  ["services/womens-health.html", "Call Reception for Dr Abadir", "tel:+61732173344"],
  ["services/antenatal-postnatal-care.html", "Call Reception for Dr Abadir", "Booking note"],
  ["services/allied-health.html", "Dr Steven Chang", "Samuel Stafford"],
];

for (const [file, lead, extra] of pages) {
  const html = fs.readFileSync("old-html/" + file, "utf8");
  const book = html.match(
    /<section class="article-section service-booking-cta" id="book">[\s\S]*?<\/section>/
  )[0];
  const leadAt = book.indexOf("service-lead-booking");
  const clinicAt = book.indexOf("service-clinic-booking");
  const clinicHref = book.indexOf("doctors?wp=w_lightbox");
  const leadLabelAt = book.indexOf(lead);
  console.log(
    file,
    "leadBeforeClinic=",
    leadAt >= 0 && clinicAt > leadAt,
    "hasLead=",
    leadLabelAt >= 0,
    "hasExtra=",
    book.includes(extra),
    "hasClinicFallback=",
    clinicHref >= 0
  );
}
