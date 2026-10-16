export const ACCOUNT_LOCK_AFTER = 5;
export const IP_LOCK_AFTER = 20;
export const LOCK_MS = 15 * 60 * 1000;
export const FAILURE_WINDOW_MS = 15 * 60 * 1000;

export type ThrottleSnapshot = {
  failures: number;
  lockedUntil: number | null;
  lastFailedAt: number;
};

export function backoffMs(failures: number): number {
  if (failures < 3) return 0;
  return Math.min(1000 * 2 ** (failures - 3), 4000);
}

export function freshFailures(state: ThrottleSnapshot | null, now: number): number {
  if (!state) return 0;
  if (now - state.lastFailedAt > FAILURE_WINDOW_MS) return 0;
  return state.failures;
}

export function isThrottleLocked(state: ThrottleSnapshot | null, now: number): boolean {
  return state?.lockedUntil != null && state.lockedUntil > now;
}

export function throttleDecision(input: {
  now: number;
  account: ThrottleSnapshot | null;
  network: ThrottleSnapshot | null;
}): { allowed: boolean; backoffMs: number } {
  if (isThrottleLocked(input.account, input.now) || isThrottleLocked(input.network, input.now)) {
    return { allowed: false, backoffMs: 0 };
  }
  const accountFailures = freshFailures(input.account, input.now);
  const networkFailures = freshFailures(input.network, input.now);
  if (accountFailures >= ACCOUNT_LOCK_AFTER || networkFailures >= IP_LOCK_AFTER) {
    return { allowed: false, backoffMs: 0 };
  }
  return { allowed: true, backoffMs: backoffMs(accountFailures) };
}

export function nextFailureState(state: ThrottleSnapshot | null, now: number, lockAfter: number): ThrottleSnapshot {
  const failures = freshFailures(state, now) + 1;
  return {
    failures,
    lockedUntil: failures >= lockAfter ? now + LOCK_MS : null,
    lastFailedAt: now,
  };
}
