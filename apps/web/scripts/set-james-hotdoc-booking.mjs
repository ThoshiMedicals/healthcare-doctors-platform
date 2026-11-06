/**
 * Set Dr James Chanaka HotDoc booking URL on Practitioner + publishedPayload,
 * and restore HotDoc lightbox CTAs on the imported profile revision HTML.
 * Does not touch old-html/.
 */
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SLUG = "dr-james";
const BOOKING_URL =
  "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors/dr-james-chanaka-1?wp=w_lightbox";
const PHONE_TEL = "tel:+61732173344";
const PHONE_DISPLAY = "(07) 3217 3344";

function fingerprintContent(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function hotdocAnchor(className, title) {
  const titleAttr = title
    ? ` title="${title}"`
    : "";
  return `<a class="${className}" href="${BOOKING_URL}"${titleAttr} target="_blank" rel="noopener" data-hotdoc-button="" data-hotdoc-widget="lightbox">Book Appointment</a>`;
}

function restoreHotdocBooking(html, doctorName) {
  let next = html;

  // Replace phone-only practitioner booking anchors with HotDoc lightbox CTAs.
  next = next.replace(
    /<a\b([^>]*\bclass="([^"]*\bwmc-book-appointment\b[^"]*)"[^>]*)>[\s\S]*?<\/a>/gi,
    (match, _attrs, cls) => {
      if (!match.includes(PHONE_TEL) && !/Call Reception to Book/i.test(match)) {
        // Already HotDoc or other — force James URL onto lightbox book buttons.
        if (/data-hotdoc-widget="lightbox"/i.test(match) || /hotdoc\.com\.au/i.test(match)) {
          return hotdocAnchor(cls);
        }
        return match;
      }
      return hotdocAnchor(cls);
    },
  );

  // Any remaining bare tel booking anchors that still say Call Reception.
  next = next.replace(
    new RegExp(
      `<a\\b[^>]*href="${PHONE_TEL.replace("+", "\\+")}"[^>]*>\\s*Call Reception to Book\\s*</a>`,
      "gi",
    ),
    hotdocAnchor("button wmc-book-appointment wmc-book-practitioner"),
  );

  // Schema PotentialAction urlTemplate.
  next = next.replace(
    new RegExp(`"urlTemplate":"${PHONE_TEL.replace("+", "\\+")}"`, "g"),
    `"urlTemplate":"${BOOKING_URL}"`,
  );
  next = next.replace(
    /"urlTemplate":"https:\/\/www\.hotdoc\.com\.au[^"]*"/g,
    `"urlTemplate":"${BOOKING_URL}"`,
  );

  // Book section copy.
  next = next.replace(
    /(<section\b[^>]*\bid="book"[^>]*>[\s\S]*?<h2>)([\s\S]*?)(<\/h2>\s*<p>)([\s\S]*?)(<\/p>)/i,
    `$1Book with ${doctorName}.$3Use the Book Appointment button to open ${doctorName}’s current online booking destination, or call Woolloongabba Medical Centre on ${PHONE_DISPLAY} if you need help choosing an appointment type.$5`,
  );

  // FAQ booking answer.
  next = next.replace(
    /(<details><summary>How do I book an appointment with [^<]+\?<\/summary><p>)([\s\S]*?)(<\/p><\/details>)/i,
    `$1Use the Book Appointment button to open ${doctorName}’s HotDoc booking page, or call reception on ${PHONE_DISPLAY} if you need help choosing an appointment type.$3`,
  );

  // Insurance / phone-only notice leftovers from import.
  next = next.replace(
    new RegExp(
      `Appointments with ${doctorName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} are booked by telephone via reception\\.`,
      "g",
    ),
    `Book online with ${doctorName} through HotDoc, or call reception on ${PHONE_DISPLAY}.`,
  );
  next = next.replace(
    new RegExp(
      `Appointments with ${doctorName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} are booked by telephone\\. Please call reception on ${PHONE_DISPLAY.replace(/[()]/g, "\\$&")}\\.`,
      "g",
    ),
    `Use the Book Appointment button to open ${doctorName}’s HotDoc booking page, or call reception on ${PHONE_DISPLAY}.`,
  );

  // Ensure HotDoc widget script is present once (template already has it for Debra).
  if (!/hotdoc-widgets\.min\.js/i.test(next)) {
    next = next.replace(
      /<\/body>/i,
      `<script async src="https://cdn.hotdoc.com.au/static/assets/js/hotdoc-widgets.min.js" charset="utf-8"></script>\n</body>`,
    );
  }

  return next;
}

async function main() {
  const clinic =
    (await prisma.clinic.findFirst({ where: { slug: "woolloongabba" } })) ||
    (await prisma.clinic.findFirst());
  if (!clinic) throw new Error("No clinic found");

  const practitioner = await prisma.practitioner.findUnique({
    where: { clinicId_slug: { clinicId: clinic.id, slug: SLUG } },
    include: {
      page: { include: { publishedRevision: true } },
    },
  });
  if (!practitioner?.page?.publishedRevision) {
    throw new Error(`Practitioner ${SLUG} or published revision missing`);
  }

  const doctorName = practitioner.name || "Dr James Chanaka";
  const prevHtml = practitioner.page.publishedRevision.html;
  const nextHtml = restoreHotdocBooking(prevHtml, doctorName);
  const contentSha256 = fingerprintContent(nextHtml);

  const payload =
    practitioner.publishedPayload &&
    typeof practitioner.publishedPayload === "object" &&
    !Array.isArray(practitioner.publishedPayload)
      ? { ...practitioner.publishedPayload }
      : {};

  payload.bookingUrl = BOOKING_URL;
  payload.sourceBookingUrl = BOOKING_URL;

  const revision = await prisma.pageRevision.create({
    data: {
      pageId: practitioner.pageId,
      html: nextHtml,
      body: {
        ...(practitioner.page.publishedRevision.body &&
        typeof practitioner.page.publishedRevision.body === "object" &&
        !Array.isArray(practitioner.page.publishedRevision.body)
          ? practitioner.page.publishedRevision.body
          : {}),
        source: "practitioner_import",
        bookingUrlUpdatedAt: new Date().toISOString(),
        bookingUrl: BOOKING_URL,
      },
      contentSha256,
      immutable: true,
    },
  });

  await prisma.page.update({
    where: { id: practitioner.pageId },
    data: { publishedRevisionId: revision.id, status: "published" },
  });

  await prisma.practitioner.update({
    where: { id: practitioner.id },
    data: {
      bookingUrl: BOOKING_URL,
      publishedPayload: payload,
      status: "published",
    },
  });

  const sample = [...nextHtml.matchAll(/<a\b[^>]*wmc-book-appointment[^>]*>[\s\S]*?<\/a>/gi)]
    .map((m) => m[0].replace(/\s+/g, " ").slice(0, 220));

  console.log(
    JSON.stringify(
      {
        ok: true,
        slug: SLUG,
        bookingUrl: BOOKING_URL,
        revisionId: revision.id,
        htmlChanged: prevHtml !== nextHtml,
        bookAnchors: sample,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
