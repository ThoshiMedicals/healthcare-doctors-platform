import type { MembershipRole } from "@prisma/client";
import { roleAllows, type CmsAction } from "@/auth/permissions";
import { isEngagementC1PrototypeBuildEnabled } from "@/engagement-c1/prototype-gate";

export type CmsNavGroup = "content" | "operations" | "insights" | "governance";

export const CMS_NAV_GROUPS: ReadonlyArray<{ id: CmsNavGroup; label: string }> = [
  { id: "content", label: "Content" },
  { id: "operations", label: "Operations" },
  { id: "insights", label: "Insights" },
  { id: "governance", label: "Governance" },
];

export type CmsModule = {
  href: string;
  label: string;
  action: CmsAction;
  group: CmsNavGroup;
};

export const CMS_MODULES: ReadonlyArray<CmsModule> = [
  // Content — editing surfaces (page types open from Pages hub)
  { href: "/admin/pages", label: "Pages", action: "edit", group: "content" },
  { href: "/admin/practitioners", label: "Practitioners", action: "edit", group: "content" },
  { href: "/admin/services", label: "Services", action: "edit", group: "content" },
  { href: "/admin/careers/vacancies", label: "Vacancies", action: "edit", group: "content" },
  { href: "/admin/careers/applications", label: "Applications", action: "edit", group: "content" },
  {
    href: "/admin/practice-experience",
    label: "Practice Experience",
    action: "edit",
    group: "content",
  },
  {
    href: "/admin/attraction",
    label: "Attraction CMS",
    action: "edit",
    group: "content",
  },
  {
    href: "/admin/story-capture",
    label: "Story Capture",
    action: "edit",
    group: "content",
  },
  {
    href: "/admin/asset-library",
    label: "Asset Library",
    action: "edit",
    group: "content",
  },
  {
    href: "/admin/gp-pipeline",
    label: "GP Pipeline",
    action: "edit",
    group: "operations",
  },
  {
    href: "/admin/recruitment/gp-readiness",
    label: "GP Readiness Ops",
    action: "edit",
    group: "operations",
  },
  { href: "/admin/media", label: "Media Library", action: "edit", group: "content" },

  // Operations — reception / admin patient request inbox
  {
    href: "/admin/operations/patient-requests",
    label: "Patient Requests",
    action: "edit",
    group: "operations",
  },
  // Phase C1 UI lab — gated; not live messaging operations
  ...(isEngagementC1PrototypeBuildEnabled()
    ? [
        {
          href: "/admin/engagement-lab",
          label: "Engagement lab (demo)",
          action: "edit" as CmsAction,
          group: "operations" as CmsNavGroup,
        },
      ]
    : []),

  // Insights — practice-friendly labels (C10); analytics stay separate from editing
  { href: "/admin", label: "Practice briefing", action: "manage_settings", group: "insights" },
  {
    href: "/admin/attraction-analytics",
    label: "Attraction Analytics",
    action: "manage_settings",
    group: "insights",
  },
  { href: "/admin/executive", label: "Website overview", action: "manage_settings", group: "insights" },
  { href: "/admin/digital-reception", label: "Online search", action: "manage_settings", group: "insights" },
  {
    href: "/admin/search-opportunities",
    label: "Search & content opportunities",
    action: "manage_settings",
    group: "insights",
  },
  {
    href: "/admin/practitioner-authority",
    label: "Doctor profiles",
    action: "manage_settings",
    group: "insights",
  },
  { href: "/admin/service-authority", label: "Service pages", action: "manage_settings", group: "insights" },
  {
    href: "/admin/conversion-intelligence",
    label: "Booking journey",
    action: "manage_settings",
    group: "insights",
  },

  // Governance — clinical review, separate from editing and analytics
  { href: "/admin/governance", label: "Content reviews", action: "clinical_signoff", group: "governance" },
  {
    href: "/admin/governance/management",
    label: "Review board",
    action: "clinical_signoff",
    group: "governance",
  },
  {
    href: "/admin/governance/expiry",
    label: "Review due dates",
    action: "clinical_signoff",
    group: "governance",
  },
  { href: "/admin/image-governance", label: "Image reviews", action: "clinical_signoff", group: "governance" },
];

export function visibleModules(role: MembershipRole | null) {
  if (!role) return [];
  return CMS_MODULES.filter((module) => {
    if (roleAllows(role, module.action)) return true;
    // Shared governance board for clinical reviewers, practice approvers, and publishers.
    if (
      module.group === "governance" &&
      (roleAllows(role, "clinical_signoff") ||
        roleAllows(role, "practice_approve") ||
        roleAllows(role, "publish"))
    ) {
      return true;
    }
    // Publishers need the Pages hub for take-down / restore / SEO publish.
    if (module.href === "/admin/pages" && roleAllows(role, "unpublish_page")) return true;
    return false;
  });
}

export function visibleNavGroups(role: MembershipRole | null) {
  const modules = visibleModules(role);
  return CMS_NAV_GROUPS.map((group) => ({
    ...group,
    modules: modules.filter((module) => module.group === group.id),
  })).filter((group) => group.modules.length > 0);
}

export const ABOUT_PATHS = [
  "about-us.html",
  "philosophy-of-care.html",
  "story.html",
  "community.html",
  "local-healthcare-access.html",
  "agpal-accreditation.html",
  "medical-centre-network.html",
  "about-us/practice-experience.html",
  "about-us/community-catchment.html",
  "about-us/continuity-in-practice.html",
  "about-us/clinical-interests.html",
  "join-our-team.html",
  "join-our-team/gp-opportunities.html",
  "join-our-team/gp-faq.html",
  "join-our-team/practice-support.html",
  "join-our-team/doctor-readiness.html",
  "join-our-team/provider-number-readiness.html",
  "join-our-team/dpa-navigator.html",
  "join-our-team/session-planner.html",
  "join-our-team/registrar-pathway.html",
  "join-our-team/opportunity-pack.html",
  "join-our-team/express-interest.html",
  "why-team-based-care-matters.html",
];

export const KNOWLEDGE_STATUS_LABEL = {
  drafting: "Draft",
  clinical_review: "Under Review",
  approved: "Approved",
  published: "Published",
} as const;

export function publicationLabel(status: string): string {
  return KNOWLEDGE_STATUS_LABEL[status as keyof typeof KNOWLEDGE_STATUS_LABEL] ?? status.replaceAll("_", " ");
}

export function editorText(status: string, publishedPayload: unknown, stored: string, live: string): string {
  if (publishedPayload || status !== "published") return stored || live;
  return live || stored;
}

export function editorList(status: string, publishedPayload: unknown, stored: readonly string[], live: readonly string[]): string {
  if (publishedPayload || status !== "published") return (stored.length > 0 ? stored : live).join(", ");
  return (live.length > 0 ? live : stored).join(", ");
}
