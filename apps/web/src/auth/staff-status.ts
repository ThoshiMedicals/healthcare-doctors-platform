import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";

type DisabledRow = { disabled_at: Date | null };

export async function staffDisabled(userId: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<DisabledRow[]>(
    Prisma.sql`SELECT disabled_at FROM users WHERE id = ${userId}`,
  );
  return rows.length === 0 || rows[0]?.disabled_at != null;
}

export async function usernameDisabled(username: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<DisabledRow[]>(
    Prisma.sql`SELECT disabled_at FROM users WHERE username = ${username}`,
  );
  return rows.length > 0 && rows[0]?.disabled_at != null;
}

export async function setUserDisabled(userId: string, disabled: boolean): Promise<void> {
  if (disabled) {
    await prisma.$executeRaw(
      Prisma.sql`UPDATE users SET disabled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ${userId}`,
    );
    return;
  }
  await prisma.$executeRaw(
    Prisma.sql`UPDATE users SET disabled_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ${userId}`,
  );
}

export async function enabledSuperAdminCount(clinicId: string): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: number }>>(
    Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM clinic_memberships
      JOIN users ON users.id = clinic_memberships.user_id
      WHERE clinic_memberships.clinic_id = ${clinicId}
        AND clinic_memberships.role IN ('super_admin', 'network_admin')
        AND users.disabled_at IS NULL
    `,
  );
  return Number(rows[0]?.count ?? 0);
}

export async function disabledFlags(userIds: readonly string[]): Promise<Map<string, Date | null>> {
  if (userIds.length === 0) return new Map();
  const rows = await prisma.$queryRaw<Array<{ id: string; disabled_at: Date | null }>>(
    Prisma.sql`SELECT id, disabled_at FROM users WHERE id IN (${Prisma.join(userIds)})`,
  );
  return new Map(rows.map((row) => [row.id, row.disabled_at]));
}
