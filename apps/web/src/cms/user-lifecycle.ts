import type { MembershipRole } from "@prisma/client";

const SUPER_ADMIN_ROLES = new Set<MembershipRole>(["super_admin", "network_admin"]);
const ROLE_STEP = new Set<MembershipRole>(["content_editor", "clinic_admin"]);

export function staffDisableDecision(input: {
  actorId: string;
  targetId: string;
  targetRole: MembershipRole;
  enabledSuperAdminCount: number;
}): "ok" | "self" | "last_super_admin" {
  if (input.actorId === input.targetId) return "self";
  if (SUPER_ADMIN_ROLES.has(input.targetRole) && input.enabledSuperAdminCount <= 1) return "last_super_admin";
  return "ok";
}

export function staffRoleDecision(input: {
  actorId: string;
  targetId: string;
  currentRole: MembershipRole;
  nextRole: MembershipRole;
  enabledSuperAdminCount: number;
}): "ok" | "self" | "last_super_admin" | "forbidden" | "unchanged" {
  if (input.actorId === input.targetId) return "self";
  const currentIsSuper = SUPER_ADMIN_ROLES.has(input.currentRole);
  const nextIsSuper = SUPER_ADMIN_ROLES.has(input.nextRole);
  if (currentIsSuper && input.enabledSuperAdminCount <= 1) return "last_super_admin";
  if (currentIsSuper || nextIsSuper || !ROLE_STEP.has(input.currentRole) || !ROLE_STEP.has(input.nextRole)) {
    return "forbidden";
  }
  if (input.currentRole === input.nextRole) return "unchanged";
  return "ok";
}

export function staffGrantDecision(input: {
  actorId: string;
  targetId: string;
  currentRole: MembershipRole;
}): "ok" | "self" | "unchanged" | "forbidden" {
  if (input.actorId === input.targetId) return "self";
  if (SUPER_ADMIN_ROLES.has(input.currentRole)) return "unchanged";
  if (!ROLE_STEP.has(input.currentRole)) return "forbidden";
  return "ok";
}
