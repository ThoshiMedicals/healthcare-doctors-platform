export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const ACTIVITY_COOKIE = "wmc.admin.activity";

export function idleExpired(lastActivity: number | null, now: number): boolean {
  if (lastActivity == null || !Number.isFinite(lastActivity)) return true;
  return now - lastActivity > SESSION_IDLE_MS;
}

export function activityCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure,
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
