import type { MembershipRole } from "@prisma/client";
import { roleAllows, type CmsAction } from "@/auth/permissions";

export type CmsNavGroup = "content" | "insights" | "governance";

export const CMS_NAV_GROUPS: ReadonlyArray<{ id: CmsNavGroup; label: string }> = [
  { id: "content", label: "Content" },
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

  // Insights — practice-friendly labels (C10); analytics stay separate from editing
  { href: "/admin", label: "Practice briefing", action: "manage_settings", group: "insights" },
  { href: "/admin/executive", label: "Website overview", action: "manage_settings", group: "insights" },
  { href: "/admin/digital-reception", label: "Online search", action: "manage_settings", group: "insights" },
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
  return CMS_MODULES.filter((module) => roleAllows(role, module.action));
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
  "join-our-team.html",
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
