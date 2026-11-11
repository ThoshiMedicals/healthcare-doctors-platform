import { articleDocumentFrom } from "@/cms/article-document";
import { serviceDocumentFrom } from "@/cms/service-document";
import { practiceDocumentFrom } from "@/cms/practice-document";
import { publishedRepeats } from "@/cms/repeat-bindings";
import { applyOverlay, applyRepeatBinding, practitionerFromPayload, type ClinicContent, type HourRow, type TextContent } from "@/cms/overlay";
import { prisma } from "@/db/prisma";
import { injectCareersVacancies } from "@/cms/careers-vacancies";
import { brandingFromClinic } from "@/clinics/branding";
import { applyAccessibilityClosure } from "@/documents/accessibility";
import { optimiseHomepageDelivery } from "@/documents/performance";
import { applyFaviconLinks } from "@/documents/favicon";
import { applyPublicUxRefinements } from "@/documents/public-ux";
import { injectCmsPractitionersIntoTeamHtml } from "@/documents/inject-cms-practitioners";
import { injectCmsPractitionersIntoServiceHtml } from "@/documents/inject-cms-service-practitioners";
import {
  injectCmsUpdatesIntoIndexHtml,
  injectProfileWelcomeUpdateLink,
  injectWelcomeUpdateAuthorityLinks,
  PROFILE_WELCOME_UPDATE,
} from "@/documents/inject-cms-updates";
import { alignPhoneOnlyBookingProse } from "@/documents/phone-only-booking";
import {
  injectPractitionerGrowth,
  withPractitionerGrowthStyle,
} from "@/documents/inject-practitioner-growth";
import { Prisma } from "@prisma/client";
import {
  canServeRecruitmentPathPublicly,
  isRecruitmentHoldActive,
  mustNoIndexRecruitmentPath,
} from "@/importer/recruitment-hold";
import { applyAuthoritySeoRefinements } from "@/seo/authority-refinements";
import { applyLaunchSeoRefinements } from "@/seo/launch-refinements";
import { applyStagingNoIndexMeta } from "@/seo/staging-noindex";
import { applyPageSeoToHtml } from "@/documents/page-seo";

export type PublishedDocument = {
  path: string;
  template: string;
  html: string;
};

export type RenderedPage = {
  status: number;
  html: string;
  path: string;
  /** Stage timings in ms for Server-Timing (no secrets). */
  timings?: Record<string, number>;
};

export type RenderClinicContext = {
  slug: string;
  practiceName: string;
  profile: {
    phoneDisplay: string;
    phoneTel: string;
    email: string;
    streetAddress: string;
    suburb: string;
    state: string;
    postcode: string;
    hotdocUrl: string | null;
    logoPath: string | null;
  } | null;
};

/**
 * Returns the approved HTML for a published path, with published content values overlaid.
 * Draft content is ignored. Classes, IDs, and the stored golden revision stay in place.
 */
export async function getPublishedDocument(
  clinicId: string,
  path: string,
  timings?: Record<string, number>,
): Promise<PublishedDocument | null> {
  const pageStarted = Date.now();
  const page = await prisma.page.findUnique({
    where: { clinicId_path: { clinicId, path } },
    include: {
      publishedRevision: true,
      practitioner: true,
      service: true,
      knowledgeArticle: true,
      practiceUpdate: true,
      practicePage: true,
      clinic: { include: { profile: true } },
    },
  });
  if (timings) mark(timings, "page", pageStarted);

  if (!page || page.status !== "published" || page.publishedRevision?.html == null) return null;
  if (!page.publishedRevision.immutable) return null;

  // Recruitment HOLD: DB rows may exist, but child Attraction paths must not be publicly served.
  if (!canServeRecruitmentPathPublicly(path)) return null;

  // Experience Validation PageRevisions are authoritative HTML — do not re-apply
  // golden PracticePage title/lede overlays that would undo journey hub copy.
  const revisionBody = page.publishedRevision.body;
  const isExperienceValidation =
    !!revisionBody &&
    typeof revisionBody === "object" &&
    !Array.isArray(revisionBody) &&
    (revisionBody as { source?: string }).source === "attraction-experience-validation";

  const overlaid = isExperienceValidation
    ? { html: page.publishedRevision.html, errors: [] as string[] }
    : applyOverlay(page.publishedRevision.html, {
        practitioner: practitionerFromPayload(page.practitioner?.publishedPayload),
        service: textContent(page.service?.publishedPayload, page.path),
        article: textContent(page.knowledgeArticle?.publishedPayload, page.path),
        update: textContent(page.practiceUpdate?.publishedPayload),
        practice: textContent(page.practicePage?.publishedPayload, page.path),
        clinic: clinicContent(page.clinic.profile?.publishedPayload),
      });
  const mediaStarted = Date.now();
  const withMedia = isExperienceValidation
    ? overlaid.html
    : await applyOtherPractitionerMedia(clinicId, page.practitioner?.id ?? null, overlaid.html);
  if (timings) mark(timings, "media", mediaStarted);
  // Careers vacancy inject runs once in renderStoredPage after public UX (Join Our Team
  // rebuilds <main> and would wipe an earlier inject).
  const repeatsStarted = Date.now();
  const html = isExperienceValidation
    ? withMedia
    : await applyStoredRepeats(clinicId, withMedia);
  if (timings) mark(timings, "repeats", repeatsStarted);

  // Serve-time SEO from published Page columns (draft seoDraft is ignored until publish).
  const withSeo = applyPageSeoToHtml(html, {
    title: page.title,
    description: page.description,
    canonicalPath: page.canonicalPath,
    robots: page.robots,
    indexable: page.indexable,
    openGraph: page.openGraph,
  });

  const heldHtml = mustNoIndexRecruitmentPath(page.path) ? applyStagingNoIndexMeta(withSeo) : withSeo;

  return {
    path: page.path,
    template: page.template,
    html: heldHtml,
  };
}

async function applyOtherPractitionerMedia(clinicId: string, ownerId: string | null, html: string): Promise<string> {
  if (!html.includes("data-practitioner-image") && !html.includes("www.hotdoc.com.au")) return html;
  const others = await prisma.practitioner.findMany({
    where: {
      clinicId,
      publishedPayload: { not: Prisma.DbNull },
      ...(ownerId ? { id: { not: ownerId } } : {}),
    },
    select: { publishedPayload: true },
  });
  let next = html;
  for (const other of others) {
    const content = practitionerFromPayload(other.publishedPayload);
    if (!content) continue;
    const mentionsPortrait = content.sourcePortraitFile ? next.includes(content.sourcePortraitFile) : false;
    const mentionsBooking = content.sourceBookingUrl ? next.includes(content.sourceBookingUrl) : false;
    if (!mentionsPortrait && !mentionsBooking) continue;
    const applied = applyOverlay(next, { practitioner: { ...content, profileText: false } });
    if (applied.errors.length === 0) next = applied.html;
  }
  return next;
}

function record(value: Prisma.JsonValue | null | undefined): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function textContent(value: Prisma.JsonValue | null | undefined, pagePath = ""): TextContent | null {
  const data = record(value);
  if (!data) return null;
  const service = serviceDocumentFrom(data);
  if (service) return { title: service.title, summary: service.summary, serviceDocument: service, pagePath };
  const practice = practiceDocumentFrom(data);
  if (practice) return { title: practice.title, summary: practice.summary, practiceDocument: practice, pagePath };
  const document = articleDocumentFrom(data);
  return {
    title: document?.title ?? String(data.title ?? ""),
    summary: document?.summary ?? String(data.summary ?? ""),
    introduction: document
      ? document.sections.find((section) => section.id === "introduction")?.paragraphs[0]
      : data.introduction
        ? String(data.introduction)
        : undefined,
    author: data.author ? String(data.author) : undefined,
    sourceAuthor: data.sourceAuthor ? String(data.sourceAuthor) : undefined,
    document: document ?? undefined,
    pagePath,
  };
}

function clinicContent(value: Prisma.JsonValue | null | undefined): ClinicContent | null {
  const data = record(value);
  if (!data) return null;
  const hours = Array.isArray(data.openingHours) ? data.openingHours : [];
  return {
    phoneDisplay: String(data.phoneDisplay ?? ""),
    phoneTel: String(data.phoneTel ?? ""),
    email: String(data.email ?? ""),
    streetAddress: String(data.streetAddress ?? ""),
    suburb: String(data.suburb ?? ""),
    state: String(data.state ?? ""),
    postcode: String(data.postcode ?? ""),
    openingHours: hours.flatMap((hour) => {
      if (!hour || typeof hour !== "object") return [];
      const row = hour as Record<string, unknown>;
      return [{ dayOfWeek: String(row.dayOfWeek ?? ""), opens: String(row.opens ?? ""), closes: String(row.closes ?? "") } satisfies HourRow];
    }),
    hotdocUrl: data.hotdocUrl ? String(data.hotdocUrl) : "",
  };
}

async function applyStoredRepeats(clinicId: string, html: string): Promise<string> {
  const bindings = await publishedRepeats(clinicId);
  return bindings.reduce((current, binding) => applyRepeatBinding(current, binding), html);
}

async function welcomeBookingHref(clinicId: string, pagePath: string): Promise<string | null> {
  const profilePath =
    PROFILE_WELCOME_UPDATE[pagePath] != null
      ? pagePath
      : Object.entries(PROFILE_WELCOME_UPDATE).find(([, welcome]) => welcome === pagePath)?.[0];
  if (!profilePath) return null;
  const slug = profilePath.replace(/^doctors\//, "").replace(/\.html$/, "");
  const row = await prisma.practitioner.findFirst({
    where: { clinicId, slug },
    select: { bookingUrl: true, publishedPayload: true },
  });
  if (!row) return null;
  const fromPayload = practitionerFromPayload(row.publishedPayload)?.bookingUrl;
  return fromPayload || row.bookingUrl || null;
}

function mark(timings: Record<string, number>, key: string, started: number): void {
  timings[key] = Math.max(0, Date.now() - started);
}

/** Serves a stored page. Unknown paths receive the approved 404.html document with status 404. */
export async function renderStoredPage(
  clinicId: string,
  storagePath: string,
  clinicContext?: RenderClinicContext | null,
): Promise<RenderedPage | null> {
  const timings: Record<string, number> = {};
  const renderStarted = Date.now();

  let clinic = clinicContext ?? null;
  if (!clinic) {
    const clinicStarted = Date.now();
    clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        slug: true,
        practiceName: true,
        profile: {
          select: {
            phoneDisplay: true,
            phoneTel: true,
            email: true,
            streetAddress: true,
            suburb: true,
            state: true,
            postcode: true,
            hotdocUrl: true,
            logoPath: true,
          },
        },
      },
    });
    mark(timings, "clinic", clinicStarted);
  }

  const branding = clinic
    ? brandingFromClinic(clinic)
    : brandingFromClinic({
        slug: process.env.DEFAULT_CLINIC_SLUG || "woolloongabba",
        practiceName: "Woolloongabba Medical Centre",
        profile: null,
      });
  const uxOptions = { clinicSlug: branding.clinicSlug, branding };

  const documentStarted = Date.now();
  const document = await getPublishedDocument(clinicId, storagePath, timings);
  mark(timings, "document", documentStarted);

  if (document) {
    const injectStarted = Date.now();
    // Vacancy inject runs after public UX: Join Our Team rebuilds <main> and would
    // otherwise wipe careers-vacancies markers inserted before UX refinements.
    const withImportedTeam = await injectCmsPractitionersIntoTeamHtml(
      clinicId,
      document.path,
      document.html,
    );
    const withServiceDoctors = await injectCmsPractitionersIntoServiceHtml(
      clinicId,
      document.path,
      withImportedTeam,
    );
    const withUpdatesIndex = await injectCmsUpdatesIntoIndexHtml(
      clinicId,
      document.path,
      withServiceDoctors,
    );
    const welcomeBooking =
      document.path in PROFILE_WELCOME_UPDATE || document.path.startsWith("updates/welcome-dr-")
        ? await welcomeBookingHref(clinicId, document.path)
        : null;
    const withWelcomeProse =
      document.path.startsWith("updates/welcome-dr-")
        ? alignPhoneOnlyBookingProse(withUpdatesIndex, welcomeBooking)
        : withUpdatesIndex;
    const withWelcomeLinks = injectWelcomeUpdateAuthorityLinks(
      document.path,
      withWelcomeProse,
      welcomeBooking,
    );
    const withProfileWelcome = injectProfileWelcomeUpdateLink(
      document.path,
      withWelcomeLinks,
      PROFILE_WELCOME_UPDATE[document.path] ?? null,
    );
    const withGrowth = withPractitionerGrowthStyle(
      await injectPractitionerGrowth(clinicId, document.path, withProfileWelcome),
    );
    mark(timings, "inject", injectStarted);

    const uxStarted = Date.now();
    const refined = applyFaviconLinks(
      applyPublicUxRefinements(
        optimiseHomepageDelivery(applyAccessibilityClosure(withGrowth, document.path), document.path),
        document.path,
        uxOptions,
      ),
    );
    // Careers vacancy inject can reintroduce EOI hrefs — apply SEO/HOLD + EEAT hygiene last.
    const withVacancies = await injectCareersVacancies(refined, document.path, clinicId);
    const html = applyAuthoritySeoRefinements(
      applyLaunchSeoRefinements(withVacancies, document.path, {
        recruitmentHoldActive: isRecruitmentHoldActive(),
      }),
      document.path,
    );
    mark(timings, "ux", uxStarted);
    mark(timings, "total", renderStarted);

    return {
      status: 200,
      html,
      path: document.path,
      timings,
    };
  }

  if (storagePath === "404.html") return null;
  const notFoundStarted = Date.now();
  const notFound = await getPublishedDocument(clinicId, "404.html");
  mark(timings, "document404", notFoundStarted);
  if (!notFound) return null;
  mark(timings, "total", renderStarted);
  return {
    status: 404,
    html: applyFaviconLinks(
      applyPublicUxRefinements(applyAccessibilityClosure(notFound.html, "404.html"), "404.html", uxOptions),
    ),
    path: "404.html",
    timings,
  };
}
