import { prisma } from "@/db/prisma";
import {
  ACCOUNT_LOCK_AFTER,
  IP_LOCK_AFTER,
  type ThrottleSnapshot,
  nextFailureState,
  throttleDecision,
} from "@/auth/login-guard";

function snapshot(row: { failures: number; lockedUntil: Date | null; lastFailedAt: Date } | null): ThrottleSnapshot | null {
  if (!row) return null;
  return {
    failures: row.failures,
    lockedUntil: row.lockedUntil?.getTime() ?? null,
    lastFailedAt: row.lastFailedAt.getTime(),
  };
}

function subjectKey(kind: "user" | "ip", value: string): string {
  return `${kind}:${value.toLowerCase().slice(0, 80)}`;
}

export function clientIp(headerStore: Headers): string {
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || headerStore.get("x-real-ip") || "local";
  return ip.slice(0, 80);
}

export async function inspectLogin(username: string, ip: string, now = Date.now()) {
  const [account, network] = await Promise.all([
    prisma.loginThrottle.findUnique({ where: { subject: subjectKey("user", username) } }),
    prisma.loginThrottle.findUnique({ where: { subject: subjectKey("ip", ip) } }),
  ]);
  return throttleDecision({ now, account: snapshot(account), network: snapshot(network) });
}

export async function recordLoginFailure(username: string, ip: string, now = Date.now()) {
  await Promise.all([
    writeFailure(subjectKey("user", username), now, ACCOUNT_LOCK_AFTER),
    writeFailure(subjectKey("ip", ip), now, IP_LOCK_AFTER),
  ]);
}

export async function clearLoginFailures(username: string, ip: string) {
  await prisma.loginThrottle.deleteMany({
    where: { subject: { in: [subjectKey("user", username), subjectKey("ip", ip)] } },
  });
}

async function writeFailure(subject: string, now: number, lockAfter: number) {
  const current = await prisma.loginThrottle.findUnique({ where: { subject } });
  const next = nextFailureState(snapshot(current), now, lockAfter);
  await prisma.loginThrottle.upsert({
    where: { subject },
    create: {
      subject,
      failures: next.failures,
      lockedUntil: next.lockedUntil ? new Date(next.lockedUntil) : null,
      lastFailedAt: new Date(next.lastFailedAt),
    },
    update: {
      failures: next.failures,
      lockedUntil: next.lockedUntil ? new Date(next.lockedUntil) : null,
      lastFailedAt: new Date(next.lastFailedAt),
    },
  });
}
