import type { MembershipRole } from "@prisma/client";
import { roleAllows, type CmsAction } from "@/auth/permissions";

export const CMS_MODULES: ReadonlyArray<{ href: string; label: string; action: CmsAction }> = [
  { href: "/admin/settings", label: "Clinic Settings", action: "manage_settings" },
  { href: "/admin/practitioners", label: "Practitioners", action: "edit" },
  { href: "/admin/services", label: "Services", action: "edit" },
  { href: "/admin/knowledge", label: "Knowledge Centre", action: "edit" },
  { href: "/admin/updates", label: "Updates", action: "edit" },
  { href: "/admin/patient-information", label: "Patient Information", action: "edit" },
  { href: "/admin/about", label: "About Us", action: "edit" },
  { href: "/admin/navigation", label: "Navigation Ownership", action: "edit" },
  { href: "/admin/governance", label: "Governance Review", action: "clinical_signoff" },
  { href: "/admin/image-governance", label: "Image governance", action: "clinical_signoff" },
];

export function visibleModules(role: MembershipRole | null) {
  if (!role) return [];
  return CMS_MODULES.filter((module) => roleAllows(role, module.action));
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
