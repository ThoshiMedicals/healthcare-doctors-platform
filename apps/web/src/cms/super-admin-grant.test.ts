import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function loadDatabaseUrl(): void {
  if (process.env.DATABASE_URL) return;
  const envFile = readFileSync(new URL("../../.env", import.meta.url), "utf8");
  for (const line of envFile.split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^"|"$/g, "");
  }
}

function secret(): string {
  return randomBytes(18).toString("base64url");
}

describe("super admin grant workflow", () => {
  it("keeps Grant Super Admin off the promote and demote actions", () => {
    const page = readFileSync(new URL("../app/admin/(dashboard)/users/page.tsx", import.meta.url), "utf8");
    assert.match(page, /action=\{grantSuperAdmin\}/);
    assert.match(page, /Grant Super Admin/);
    assert.match(page, /Promote to Clinic Admin/);
    assert.match(page, /Demote to Content Editor/);
    assert.match(page, /action=\{setStaffRole\}/);
  });

  it("creates a deputy, grants Super Admin, and removes the trial accounts", async () => {
    loadDatabaseUrl();
    const { prisma } = await import("@/db/prisma");
    const { verifyPassword } = await import("@/auth/password");
    const { isSuperAdmin, roleAllows } = await import("@/auth/permissions");
    const { enabledSuperAdminCount, usernameDisabled } = await import("@/auth/staff-status");
    const { staffDisableDecision } = await import("./user-lifecycle");
    const {
      createStaffAccount,
      grantSuperAdminAccount,
      resetOtherStaffPassword,
      setOtherStaffEnabled,
      setOtherStaffRole,
    } = await import("./staff-accounts");
    const clinic = await prisma.clinic.findUnique({ where: { slug: "woolloongabba" }, select: { id: true } });
    const admin = await prisma.user.findUnique({
      where: { username: "admin" },
      select: { id: true, memberships: { select: { role: true, clinicId: true } } },
    });
    const practiceManager = await prisma.user.findUnique({
      where: { username: "pm.audit" },
      select: { id: true, memberships: { select: { role: true } } },
    });
    assert.ok(clinic);
    assert.ok(admin);
    assert.equal(admin.memberships.some((membership) => membership.role === "super_admin" && membership.clinicId === clinic.id), true);
    const practiceManagerRole = practiceManager?.memberships[0]?.role ?? null;
    const before = await enabledSuperAdminCount(clinic.id);
    assert.equal(before >= 1, true);

    const stamp = Date.now().toString(36);
    const deputyName = `gw.deputy.${stamp}`;
    const directName = `gw.direct.${stamp}`;
    const editorName = `gw.editor.${stamp}`;
    const deputyPassword = secret();
    const directPassword = secret();
    const editorPassword = secret();
    const replacement = secret();
    const createdIds: string[] = [];

    try {
      const editor = await createStaffAccount({
        actorId: admin.id,
        clinicId: clinic.id,
        name: "Workflow editor",
        username: editorName,
        password: editorPassword,
        confirmation: editorPassword,
        role: "content_editor",
      });
      assert.equal(editor.ok, true);
      if (!editor.ok) return;
      createdIds.push(editor.userId);

      const lastRefusal = staffDisableDecision({
        actorId: editor.userId,
        targetId: admin.id,
        targetRole: "super_admin",
        enabledSuperAdminCount: before,
      });
      if (lastRefusal === "ok") {
        throw new Error("The last Super Admin refusal was not tested because more than one is already active.");
      }
      assert.equal(
        await setOtherStaffEnabled({
          actorId: editor.userId,
          clinicId: clinic.id,
          targetUserId: admin.id,
          enabled: false,
        }),
        "lifecycle",
      );
      assert.equal(
        await setOtherStaffEnabled({
          actorId: editor.userId,
          clinicId: clinic.id,
          targetUserId: editor.userId,
          enabled: false,
        }),
        "lifecycle",
      );

      const deputy = await createStaffAccount({
        actorId: admin.id,
        clinicId: clinic.id,
        name: "Workflow deputy",
        username: deputyName,
        password: deputyPassword,
        confirmation: deputyPassword,
        role: "content_editor",
      });
      assert.equal(deputy.ok, true);
      if (!deputy.ok) return;
      createdIds.push(deputy.userId);
      assert.equal(
        await setOtherStaffRole({
          actorId: admin.id,
          clinicId: clinic.id,
          targetUserId: deputy.userId,
          nextRole: "super_admin",
        }),
        "role",
      );
      assert.deepEqual(
        await grantSuperAdminAccount({ actorId: deputy.userId, clinicId: clinic.id, targetUserId: deputy.userId }),
        { ok: false },
      );
      const granted = await grantSuperAdminAccount({
        actorId: admin.id,
        clinicId: clinic.id,
        targetUserId: deputy.userId,
      });
      assert.equal(granted.ok, true);
      if (!granted.ok) return;
      assert.equal(granted.previousRole, "content_editor");
      assert.equal(granted.role, "super_admin");
      assert.ok(granted.at instanceof Date);
      const grantAudit = await prisma.auditLog.findFirst({
        where: { entityId: deputy.userId, action: "user.super_admin_granted" },
        orderBy: { createdAt: "desc" },
      });
      assert.equal(grantAudit?.actorId, admin.id);
      assert.deepEqual(grantAudit?.metadata, {
        username: deputyName,
        previousRole: "content_editor",
        role: "super_admin",
      });
      assert.equal(
        await setOtherStaffRole({
          actorId: admin.id,
          clinicId: clinic.id,
          targetUserId: deputy.userId,
          nextRole: "content_editor",
        }),
        "role",
      );

      const direct = await createStaffAccount({
        actorId: admin.id,
        clinicId: clinic.id,
        name: "Workflow direct",
        username: directName,
        password: directPassword,
        confirmation: directPassword,
        role: "super_admin",
      });
      assert.equal(direct.ok, true);
      if (!direct.ok) return;
      createdIds.push(direct.userId);
      const createdAudit = await prisma.auditLog.findFirst({
        where: { entityId: direct.userId, action: "user.created" },
      });
      assert.equal(createdAudit?.actorId, admin.id);
      assert.deepEqual(createdAudit?.metadata, { username: directName, role: "super_admin" });
      assert.ok(createdAudit?.createdAt instanceof Date);
      assert.deepEqual(
        await createStaffAccount({
          actorId: admin.id,
          clinicId: clinic.id,
          name: "Not a role",
          username: `gw.refused.${stamp}`,
          password: editorPassword,
          confirmation: editorPassword,
          role: "network_admin",
        }),
        { ok: false, issue: "role" },
      );

      for (const [username, password] of [
        [deputyName, deputyPassword],
        [directName, directPassword],
      ] as const) {
        const account = await prisma.user.findUnique({
          where: { username },
          include: { memberships: { select: { role: true } } },
        });
        assert.equal(account?.memberships[0]?.role, "super_admin");
        assert.equal(await verifyPassword(password, account?.passwordHash ?? ""), true);
        assert.equal(await usernameDisabled(username), false);
        assert.equal(isSuperAdmin("super_admin"), true);
        assert.equal(roleAllows("super_admin", "create_users"), true);
      }
      assert.equal(isSuperAdmin("clinic_admin"), false);
      assert.equal(roleAllows("clinic_admin", "create_users"), false);

      assert.equal(
        await resetOtherStaffPassword({
          actorId: deputy.userId,
          clinicId: clinic.id,
          targetUserId: editor.userId,
          password: replacement,
          confirmation: replacement,
        }),
        "ok",
      );
      const editorAccount = await prisma.user.findUnique({ where: { username: editorName } });
      assert.equal(await verifyPassword(replacement, editorAccount?.passwordHash ?? ""), true);
      assert.equal(await verifyPassword(editorPassword, editorAccount?.passwordHash ?? ""), false);
      assert.equal(
        await resetOtherStaffPassword({
          actorId: deputy.userId,
          clinicId: clinic.id,
          targetUserId: deputy.userId,
          password: replacement,
          confirmation: replacement,
        }),
        "password",
      );

      assert.equal(
        await setOtherStaffEnabled({
          actorId: deputy.userId,
          clinicId: clinic.id,
          targetUserId: editor.userId,
          enabled: false,
        }),
        "disabled",
      );
      assert.equal(await usernameDisabled(editorName), true);
      assert.equal(await enabledSuperAdminCount(clinic.id) >= before + 2, true);
    } finally {
      if (createdIds.length > 0) {
        await prisma.auditLog.deleteMany({ where: { entityId: { in: createdIds } } });
        await prisma.user.deleteMany({ where: { id: { in: createdIds } } });
      }
      const after = await enabledSuperAdminCount(clinic!.id);
      assert.equal(after, before);
      const adminAfter = await prisma.user.findUnique({
        where: { id: admin!.id },
        select: { disabledAt: true, memberships: { select: { role: true } } },
      });
      assert.equal(adminAfter?.disabledAt, null);
      assert.equal(adminAfter?.memberships.some((membership) => membership.role === "super_admin"), true);
      if (practiceManager) {
        const managerAfter = await prisma.user.findUnique({
          where: { id: practiceManager.id },
          include: { memberships: { select: { role: true } } },
        });
        assert.equal(managerAfter?.memberships[0]?.role, practiceManagerRole);
      }
    }
  });
});
