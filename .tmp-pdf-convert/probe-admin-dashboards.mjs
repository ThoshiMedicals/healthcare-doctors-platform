import fs from "node:fs";
import path from "node:path";

const root = path.resolve("apps/web");
const envText = fs.readFileSync(path.join(root, ".env"), "utf8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    }),
);

const base = "http://127.0.0.1:3000";
const username = env.SEED_ADMIN_USERNAME;
const password = env.SEED_ADMIN_PASSWORD;
if (!username || !password) {
  console.error("Missing SEED_ADMIN credentials");
  process.exit(1);
}

function cookieJar(setCookies = []) {
  const map = new Map();
  for (const raw of setCookies) {
    const part = String(raw).split(";")[0];
    const eq = part.indexOf("=");
    if (eq > 0) map.set(part.slice(0, eq), part.slice(eq + 1));
  }
  return map;
}

function mergeCookies(jar, setCookies = []) {
  for (const raw of setCookies) {
    const part = String(raw).split(";")[0];
    const eq = part.indexOf("=");
    if (eq > 0) jar.set(part.slice(0, eq), part.slice(eq + 1));
  }
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function getSetCookies(res) {
  if (typeof res.headers.getSetCookie === "function") return res.headers.getSetCookie();
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

const jar = new Map();

const csrfRes = await fetch(`${base}/api/auth/csrf`, { headers: { cookie: cookieHeader(jar) } });
mergeCookies(jar, getSetCookies(csrfRes));
const { csrfToken } = await csrfRes.json();

const body = new URLSearchParams({
  csrfToken,
  username,
  password,
  callbackUrl: `${base}/admin`,
  json: "true",
});

const loginRes = await fetch(`${base}/api/auth/callback/credentials`, {
  method: "POST",
  redirect: "manual",
  headers: {
    "content-type": "application/x-www-form-urlencoded",
    cookie: cookieHeader(jar),
    origin: base,
  },
  body,
});
mergeCookies(jar, getSetCookies(loginRes));

const sessionRes = await fetch(`${base}/api/auth/session`, {
  headers: { cookie: cookieHeader(jar) },
});
mergeCookies(jar, getSetCookies(sessionRes));
const session = await sessionRes.json();
console.log(
  "session:",
  session?.user
    ? `ok user=${session.user.name || session.user.email || session.user.id}`
    : `FAIL status=${loginRes.status} loc=${loginRes.headers.get("location") || ""}`,
);

const routes = [
  "/admin/executive",
  "/admin/digital-reception",
  "/admin/practitioner-authority",
  "/admin/service-authority",
  "/admin/conversion-intelligence",
  "/admin/governance/management",
  "/admin/this-dashboard-does-not-exist-xyz",
];

for (const route of routes) {
  const res = await fetch(`${base}${route}`, {
    redirect: "manual",
    headers: { cookie: cookieHeader(jar) },
  });
  mergeCookies(jar, getSetCookies(res));
  let html = "";
  if (res.status === 200) html = await res.text();
  else if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get("location");
    // follow one hop for Next redirects that still carry cookies
    if (loc) {
      const abs = loc.startsWith("http") ? loc : `${base}${loc}`;
      const follow = await fetch(abs, { redirect: "manual", headers: { cookie: cookieHeader(jar) } });
      mergeCookies(jar, getSetCookies(follow));
      if (follow.status === 200) html = await follow.text();
      console.log(
        `${route} -> ${res.status} loc=${loc} then ${follow.status} bytes=${html.length} hasNav=${html.includes("Executive Dashboard")} titleHint=${(html.match(/<h1[^>]*>([^<]+)/) || [])[1] || ""}`,
      );
      continue;
    }
  }
  const navHits = [
    "Executive Dashboard",
    "Digital Reception Dashboard",
    "Practitioner Authority Dashboard",
    "Service Authority Dashboard",
    "Conversion Intelligence",
    "Governance Management",
  ].filter((label) => html.includes(label));
  console.log(
    `${route} -> ${res.status} loc=${res.headers.get("location") || ""} bytes=${html.length} navLabels=${navHits.length} h1=${(html.match(/<h1[^>]*>([^<]+)/) || [])[1] || ""}`,
  );
}
