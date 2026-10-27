import fs from "node:fs";

const env = Object.fromEntries(
  fs
    .readFileSync("apps/web/.env", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const base = "http://127.0.0.1:3000";
const jar = new Map();
const merge = (set) => {
  for (const raw of set || []) {
    const p = String(raw).split(";")[0];
    const eq = p.indexOf("=");
    if (eq > 0) jar.set(p.slice(0, eq), p.slice(eq + 1));
  }
};
const hdr = () => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
const getSet = (r) =>
  typeof r.headers.getSetCookie === "function"
    ? r.headers.getSetCookie()
    : r.headers.get("set-cookie")
      ? [r.headers.get("set-cookie")]
      : [];

const csrfRes = await fetch(`${base}/api/auth/csrf`);
merge(getSet(csrfRes));
const { csrfToken } = await csrfRes.json();
const loginRes = await fetch(`${base}/api/auth/callback/credentials`, {
  method: "POST",
  redirect: "manual",
  headers: {
    "content-type": "application/x-www-form-urlencoded",
    cookie: hdr(),
    origin: base,
  },
  body: new URLSearchParams({
    csrfToken,
    username: env.SEED_ADMIN_USERNAME,
    password: env.SEED_ADMIN_PASSWORD,
    callbackUrl: `${base}/admin`,
    json: "true",
  }),
});
merge(getSet(loginRes));
const res = await fetch(`${base}/admin`, { headers: { cookie: hdr() } });
const html = await res.text();
const nav = html.match(/aria-label="CMS modules"[\s\S]*?<\/nav>/)?.[0] || "";
const hrefs = [...nav.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
const labels = [...nav.matchAll(/>([^<]+)</g)].map((m) => m[1].trim()).filter(Boolean);
console.log("status", res.status);
console.log("hrefs:\n" + hrefs.join("\n"));
console.log("labels:\n" + labels.join("\n"));
