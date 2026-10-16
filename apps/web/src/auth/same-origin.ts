/** True when a state-changing request presents a foreign Origin. */
export function foreignOrigin(method: string, origin: string | null, host: string | null): boolean {
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return false;
  if (!origin) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return true;
  }
  const expected = (host ?? "").split(",")[0]?.trim() ?? "";
  return originHost !== expected;
}
