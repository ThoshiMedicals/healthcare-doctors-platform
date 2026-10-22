import { Prisma, type MembershipRole } from "@prisma/client";
import { clearAccountLock } from "@/auth/login-throttle";
import { hashPassword, passwordProblems } from "@/auth/password";
import { isCreatableStaffRole } from "@/auth/permissions";
import { enabledSuperAdminCount, setUserDisabled } from "@/auth/staff-status";
import { writeAuditLog } from "@/cms/audit";
import { staffCreateProblems, type StaffCreateIssue } from "@/cms/staff-create";
import { staffDisableDecision, staffGrantDecision, staffRoleDecision } from "@/cms/user-lifecycle";
import { prisma } from "@/db/prisma";

export async function createStaffAccount(input: {
  actorId: string;
  clinicId: string;
  name: string;
  username: string;
  password: string;
  confirmation: string;
  role: string;
}): Promise<{ ok: true; userId: string } | { ok: false; issue: StaffCreateIssue | "failed" }> {
  const username = input.username.trim().toLowerCase();
  const problem = staffCreateProblems({
    name: input.name,
    username,
    password: input.password,
    confirmation: input.confirmation,
    roleAllowed: isCreatableStaffRole(input.role),
  });
  if (problem) return { ok: false, issue: problem };
  const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (existing) return { ok: false, issue: "duplicate" };
  let created;
  try {
    created = await prisma.user.create({
      data: {
        username,
        name: input.name.trim(),
        passwordHash: await hashPassword(input.password),
        memberships: { create: { clinicId: input.clinicId, role: input.role as MembershipRole } },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, issue: "duplicate" };
    }
    return { ok: false, issue: "failed" };
  }
  await writeAuditLog({
    clinicId: input.clinicId,
    actorId: input.actorId,
    action: "user.created",
    entityType: "user",
    entityId: created.id,
    metadata: { username, role: input.role },
  });
  return { ok: true, userId: created.id };
}

export async function grantSuperAdminAccount(input: {
  actorId: string;
  clinicId: string;
  targetUserId: string;
}): Promise<{ ok: true; previousRole: MembershipRole; role: "super_admin"; at: Date } | { ok: false }> {
  const membership = await prisma.clinicMembership.findFirst({
    where: { clinicId: input.clinicId, userId: input.targetUserId },
    select: { id: true, role: true, user: { select: { username: true } } },
  });
  const username = membership?.user.username;
  if (!membership || !username) return { ok: false };
  const decision = staffGrantDecision({
    actorId: input.actorId,
    targetId: input.targetUserId,
    currentRole: membership.role,
  });
  if (decision !== "ok") return { ok: false };
  await prisma.clinicMembership.update({
    where: { id: membership.id },
    data: { role: "super_admin" },
  });
  const audit = await prisma.auditLog.create({
    data: {
      clinicId: input.clinicId,
      actorId: input.actorId,
      action: "user.super_admin_granted",
      entityType: "user",
      entityId: input.targetUserId,
      metadata: { username, previousRole: membership.role, role: "super_admin" },
    },
  });
  return { ok: true, previousRole: membership.role, role: "super_admin", at: audit.createdAt };
}

export async function resetOtherStaffPassword(input: {
  actorId: string;
  clinicId: string;
  targetUserId: string;
  password: string;
  confirmation: string;
}): Promise<"ok" | "password"> {
  if (input.targetUserId === input.actorId || passwordProblems(input.password, input.confirmation)) return "password";
  const membership = await prisma.clinicMembership.findFirst({
    where: { clinicId: input.clinicId, userId: input.targetUserId },
    select: { user: { select: { username: true } } },
  });
  const username = membership?.user.username;
  if (!username) return "password";
  await prisma.user.update({
    where: { id: input.targetUserId },
    data: { passwordHash: await hashPassword(input.password) },
  });
  await clearAccountLock(username);
  await writeAuditLog({
    clinicId: input.clinicId,
    actorId: input.actorId,
    action: "user.password_reset",
    entityType: "user",
    entityId: input.targetUserId,
    metadata: { username },
  });
  return "ok";
}

export async function setOtherStaffEnabled(input: {
  actorId: string;
  clinicId: string;
  targetUserId: string;
  enabled: boolean;
}): Promise<"enabled" | "disabled" | "lifecycle"> {
  const membership = await prisma.clinicMembership.findFirst({
    where: { clinicId: input.clinicId, userId: input.targetUserId },
    select: { role: true, user: { select: { username: true } } },
  });
  const username = membership?.user.username;
  if (!membership || !username) return "lifecycle";
  if (!input.enabled) {
    const decision = staffDisableDecision({
      actorId: input.actorId,
      targetId: input.targetUserId,
      targetRole: membership.role,
      enabledSuperAdminCount: await enabledSuperAdminCount(input.clinicId),
    });
    if (decision !== "ok") return "lifecycle";
  }
  await setUserDisabled(input.targetUserId, !input.enabled);
  await writeAuditLog({
    clinicId: input.clinicId,
    actorId: input.actorId,
    action: input.enabled ? "user.enabled" : "user.disabled",
    entityType: "user",
    entityId: input.targetUserId,
    metadata: { username },
  });
  return input.enabled ? "enabled" : "disabled";
}

export async function setOtherStaffRole(input: {
  actorId: string;
  clinicId: string;
  targetUserId: string;
  nextRole: MembershipRole;
}): Promise<"ok" | "role"> {
  const membership = await prisma.clinicMembership.findFirst({
    where: { clinicId: input.clinicId, userId: input.targetUserId },
    select: { id: true, role: true, user: { select: { username: true } } },
  });
  const username = membership?.user.username;
  if (!membership || !username) return "role";
  const decision = staffRoleDecision({
    actorId: input.actorId,
    targetId: input.targetUserId,
    currentRole: membership.role,
    nextRole: input.nextRole,
    enabledSuperAdminCount: await enabledSuperAdminCount(input.clinicId),
  });
  if (decision !== "ok") return "role";
  await prisma.clinicMembership.update({
    where: { id: membership.id },
    data: { role: input.nextRole },
  });
  await writeAuditLog({
    clinicId: input.clinicId,
    actorId: input.actorId,
    action: "user.role_changed",
    entityType: "user",
    entityId: input.targetUserId,
    metadata: { username, previousRole: membership.role, role: input.nextRole },
  });
  return "ok";
}
