/**
 * Wire Mr Samuel Stafford's approved portrait into the published profile page.
 * Does NOT invent biography/qualifications. Does NOT edit old-html/.
 *
 * - Expects public/assets/team/mr-samuel-stafford.webp (+ -640) already generated
 * - Updates PageRevision HTML (photo hero) + Practitioner.portraitPath/publishedPayload
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const prisma = new PrismaClient();

const PAGE_PATH = "doctors/mr-samuel-stafford.html";
const PORTRAIT = "mr-samuel-stafford.webp";
const PORTRAIT_REL = `../assets/team/${PORTRAIT}`;
const THUMB_REL = "../assets/team/mr-samuel-stafford-640.webp";
const NAME = "Mr Samuel Stafford";

function fingerprint(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function injectPortrait(html) {
  if (/data-practitioner-image="true"/i.test(html)) {
    return html.replace(
      /<img\b[^>]*data-practitioner-image="true"[^>]*>/i,
      `<img alt="${NAME}" data-local-team-src="${PORTRAIT_REL}" data-practitioner-image="true" decoding="async" fetchpriority="high" height="1000" loading="eager" src="${PORTRAIT_REL}" width="800" srcset="${THUMB_REL} 640w, ${PORTRAIT_REL} 1122w" sizes="(min-width: 1025px) 420px, (min-width: 768px) 250px, 176px"/>`,
    );
  }

  // No-photo hero: single-column shell → restore two-column layout with photo.
  const photoBlock = `<div class="doctor-profile-photo" data-photo-fallback="${NAME} photo temporarily unavailable"><img alt="${NAME}" data-local-team-src="${PORTRAIT_REL}" data-practitioner-image="true" decoding="async" fetchpriority="high" height="1000" loading="eager" src="${PORTRAIT_REL}" width="800" srcset="${THUMB_REL} 640w, ${PORTRAIT_REL} 1122w" sizes="(min-width: 1025px) 420px, (min-width: 768px) 250px, 176px"/></div>`;

  let next = html.replace(
    /<div class="shell doctor-profile-hero"[^>]*>\s*<div class="doctor-profile-heading">/i,
    `<div class="shell doctor-profile-hero">${photoBlock}<div class="doctor-profile-heading">`,
  );

  // Prefer portrait for social previews once available.
  const absPortrait = `https://gabbamedicalcentre.com.au/assets/team/${PORTRAIT}`;
  next = next.replace(
    /(<meta content=")https:\/\/gabbamedicalcentre\.com\.au\/assets\/hero-final-desktop\.webp(" property="og:image"\/>)/i,
    `$1${absPortrait}$2`,
  );
  next = next.replace(
    /(<meta content=")https:\/\/gabbamedicalcentre\.com\.au\/assets\/hero-final-desktop\.webp(" name="twitter:image"\/>)/i,
    `$1${absPortrait}$2`,
  );
  next = next.replace(
    /(<meta content=")1672(" property="og:image:width"\/>)/i,
    `$1800$2`,
  );
  next = next.replace(
    /(<meta content=")941(" property="og:image:height"\/>)/i,
    `$11000$2`,
  );

  // Person schema image when missing.
  if (!/"image":"https:\/\/gabbamedicalcentre\.com\.au\/assets\/team\/mr-samuel-stafford\.webp"/.test(next)) {
    next = next.replace(
      /("jobTitle":"Physiotherapist")/,
      `$1,"image":"${absPortrait}"`,
    );
  }

  return next;
}

async function main() {
  await readFile(path.join(webRoot, "public", "assets", "team", PORTRAIT));

  const page = await prisma.page.findFirst({
    where: { path: PAGE_PATH },
    include: { publishedRevision: true, clinic: { select: { id: true, slug: true } } },
  });
  if (!page?.publishedRevision) {
    throw new Error(`Published page not found for ${PAGE_PATH}`);
  }

  const html = injectPortrait(page.publishedRevision.html);
  if (html === page.publishedRevision.html) {
    console.log("HTML unchanged (portrait already present with same markup).");
  }

  const contentSha256 = fingerprint(html);
  let revision = await prisma.pageRevision.findFirst({
    where: { pageId: page.id, contentSha256, immutable: true },
  });
  if (!revision) {
    revision = await prisma.pageRevision.create({
      data: {
        pageId: page.id,
        html,
        body: page.publishedRevision.body,
        contentSha256,
        immutable: true,
      },
    });
  }
  if (page.publishedRevisionId !== revision.id) {
    await prisma.page.update({
      where: { id: page.id },
      data: { publishedRevisionId: revision.id, status: "published" },
    });
  }

  const portraitPath = PORTRAIT_REL;
  const practitioner = await prisma.practitioner.findFirst({
    where: {
      clinicId: page.clinicId,
      OR: [{ slug: "mr-samuel-stafford" }, { name: { contains: "Samuel Stafford" } }],
    },
  });

  if (practitioner) {
    const publishedPayload = {
      ...(practitioner.publishedPayload && typeof practitioner.publishedPayload === "object"
        ? practitioner.publishedPayload
        : {}),
      portraitFile: PORTRAIT,
      sourcePortraitFile: PORTRAIT,
    };
    await prisma.practitioner.update({
      where: { id: practitioner.id },
      data: {
        portraitPath,
        publishedPayload,
      },
    });
    console.log(`Updated practitioner ${practitioner.slug} portraitPath=${portraitPath}`);
  } else {
    console.warn("Practitioner row not found; page revision updated only.");
  }

  console.log(
    JSON.stringify({
      pageId: page.id,
      revisionId: revision.id,
      hasPhoto: /doctor-profile-photo/i.test(html) && /mr-samuel-stafford\.webp/.test(html),
      contentSha256: contentSha256.slice(0, 16),
    }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
