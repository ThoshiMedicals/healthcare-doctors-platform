import type { MembershipRole } from "@prisma/client";

export type CmsAction =
  | "edit"
  | "submit_for_review"
  | "clinical_signoff"
  | "practice_approve"
  | "publish"
  | "manage_settings"
  | "create_users"
  | "rollback"
  | "switch_clinic";

const SUPER_ADMIN: MembershipRole[] = ["super_admin", "network_admin"];
const CLINIC_ADMIN: MembershipRole[] = [...SUPER_ADMIN, "clinic_admin"];
const EDITOR: MembershipRole[] = [...CLINIC_ADMIN, "content_editor", "editor"];

const ACTION_ROLES: Record<CmsAction, readonly MembershipRole[]> = {
  edit: EDITOR,
  submit_for_review: EDITOR,
  clinical_signoff: CLINIC_ADMIN,
  practice_approve: CLINIC_ADMIN,
  publish: CLINIC_ADMIN,
  manage_settings: CLINIC_ADMIN,
  create_users: SUPER_ADMIN,
  rollback: CLINIC_ADMIN,
  switch_clinic: SUPER_ADMIN,
};

export function isSuperAdmin(role: MembershipRole): boolean {
  return SUPER_ADMIN.includes(role);
}

export function roleAllows(role: MembershipRole, action: CmsAction): boolean {
  return ACTION_ROLES[action].includes(role);
}

export class PermissionDeniedError extends Error {
  constructor(action: CmsAction) {
    super(`This role cannot ${action.replaceAll("_", " ")}.`);
    this.name = "PermissionDeniedError";
  }
}

export function assertRole(role: MembershipRole, action: CmsAction): void {
  if (!roleAllows(role, action)) {
    throw new PermissionDeniedError(action);
  }
}

type MembershipRef = { clinicId: string; role: MembershipRole };

export function canAccessClinic(memberships: readonly MembershipRef[], clinicId: string): boolean {
  return memberships.some(
    (membership) => isSuperAdmin(membership.role) || membership.clinicId === clinicId,
  );
}

export function highestRoleForClinic(
  memberships: readonly MembershipRef[],
  clinicId: string,
): MembershipRole | null {
  const match = memberships.find((membership) => membership.clinicId === clinicId);
  if (match && !isSuperAdmin(match.role)) return match.role;
  const network = memberships.find((membership) => isSuperAdmin(membership.role));
  return network?.role ?? match?.role ?? null;
}

export const ROLE_LABEL: Record<MembershipRole, string> = {
  super_admin: "Super Admin",
  network_admin: "Super Admin",
  clinic_admin: "Clinic Admin",
  content_editor: "Content Editor",
  editor: "Content Editor",
  clinical_reviewer: "Reviewer",
  practice_approver: "Approver",
  publisher: "Publisher",
};

export const ASSIGNABLE_ROLES = ["clinic_admin", "content_editor"] as const;
