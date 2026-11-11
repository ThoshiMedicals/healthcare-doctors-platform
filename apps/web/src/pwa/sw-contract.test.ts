/**
 * Executes the real `public/sw.js` source inside a sandboxed service-worker
 * global, against fake Cache/fetch/event objects, so the behaviour described
 * in its header comment is actually verified — not just asserted in prose.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import {
  NEVER_CACHE_PATTERNS,
  NEVER_CACHE_PREFIXES,
  OFFLINE_FALLBACK_PATH,
  SHELL_ALLOWLIST,
} from "./cache-policy";

const swPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../public/sw.js");
const swSource = readFileSync(swPath, "utf8");
const ORIGIN = "https://next.gabbamedicalcentre.com.au";

function absoluteUrl(pathname: string): string {
  return new URL(pathname, ORIGIN).href;
}

// ---------------------------------------------------------------------------
// Part 1: the literal policy mirror embedded in sw.js must match cache-policy.ts
// byte-for-byte (a classic service worker script cannot `import` the TS module).
// ---------------------------------------------------------------------------

function extractMirrorBlock(source: string): string {
  const start = source.indexOf("// --- BEGIN CACHE_POLICY_MIRROR");
  const end = source.indexOf("// --- END CACHE_POLICY_MIRROR");
  assert.notEqual(start, -1, "sw.js must contain a BEGIN CACHE_POLICY_MIRROR marker");
  assert.notEqual(end, -1, "sw.js must contain an END CACHE_POLICY_MIRROR marker");
  assert.ok(end > start, "END marker must follow BEGIN marker");
  return source.slice(start, end);
}

function evalMirrorBlock(block: string): {
  NEVER_CACHE_PREFIXES: string[];
  NEVER_CACHE_PATTERNS: RegExp[];
  OFFLINE_FALLBACK_PATH: string;
  SHELL_ALLOWLIST: string[];
} {
  // Evaluated with `new Function` (current realm) rather than vm.runInNewContext
  // so the extracted arrays are ordinary same-realm Arrays — a cross-realm
  // Array (from a vm sandbox) fails Node's deepStrictEqual even when every
  // element matches, which would make this check a false negative.
  // eslint-disable-next-line no-new-func
  const factory = new Function(
    `${block}\nreturn { NEVER_CACHE_PREFIXES: NEVER_CACHE_PREFIXES, NEVER_CACHE_PATTERNS: NEVER_CACHE_PATTERNS, OFFLINE_FALLBACK_PATH: OFFLINE_FALLBACK_PATH, SHELL_ALLOWLIST: SHELL_ALLOWLIST };`,
  );
  return factory();
}

test("sw.js embeds a byte-identical mirror of the cache-policy.ts deny/allow lists", () => {
  const mirror = evalMirrorBlock(extractMirrorBlock(swSource));
  assert.deepEqual(mirror.NEVER_CACHE_PREFIXES, NEVER_CACHE_PREFIXES);
  assert.deepEqual(
    mirror.NEVER_CACHE_PATTERNS.map((r) => [r.source, r.flags]),
    NEVER_CACHE_PATTERNS.map((r) => [r.source, r.flags]),
  );
  assert.equal(mirror.OFFLINE_FALLBACK_PATH, OFFLINE_FALLBACK_PATH);
  assert.deepEqual(mirror.SHELL_ALLOWLIST, SHELL_ALLOWLIST);
});

// ---------------------------------------------------------------------------
// Part 2: run the real sw.js logic against a fake service-worker environment.
// ---------------------------------------------------------------------------

type FakeResponse = {
  status: number;
  ok: boolean;
  type: string;
  body: string;
  headers: { has(name: string): boolean; get(name: string): string | null };
  clone(): FakeResponse;
};

function makeResponse(
  body: string,
  opts: { status?: number; headers?: Record<string, string>; type?: string } = {},
): FakeResponse {
  const status = opts.status ?? 200;
  const headerMap = new Map(Object.entries(opts.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
  const response: FakeResponse = {
    status,
    ok: status >= 200 && status < 300,
    type: opts.type ?? "basic",
    body,
    headers: {
      has: (name: string) => headerMap.has(name.toLowerCase()),
      get: (name: string) => headerMap.get(name.toLowerCase()) ?? null,
    },
    clone(): FakeResponse {
      return makeResponse(body, opts);
    },
  };
  return response;
}

function makeRequest(pathOrUrl: string, opts: { method?: string; mode?: string } = {}) {
  return {
    url: pathOrUrl.startsWith("http") ? pathOrUrl : absoluteUrl(pathOrUrl),
    method: opts.method ?? "GET",
    mode: opts.mode,
  };
}

type FetchHandler = (request: ReturnType<typeof makeRequest>) => Promise<FakeResponse>;

function makeFakeCaches() {
  const store = new Map<string, Map<string, FakeResponse>>();
  let fetchHandler: FetchHandler = async () => {
    throw new Error("unexpected network call in test");
  };

  function keyFor(reqOrUrl: { url: string } | string): string {
    return typeof reqOrUrl === "string" ? absoluteUrl(reqOrUrl) : reqOrUrl.url;
  }

  const caches = {
    __setFetchHandler(handler: FetchHandler) {
      fetchHandler = handler;
    },
    __bucket(name: string) {
      return store.get(name);
    },
    async open(name: string) {
      if (!store.has(name)) store.set(name, new Map());
      const bucket = store.get(name)!;
      return {
        async add(pathname: string) {
          const res = await fetchHandler(makeRequest(pathname));
          if (!res.ok) throw new Error(`add failed for ${pathname}`);
          bucket.set(keyFor(pathname), res);
        },
        async put(request: { url: string }, response: FakeResponse) {
          bucket.set(keyFor(request), response);
        },
        async match(request: { url: string } | string) {
          return bucket.get(keyFor(request));
        },
      };
    },
    async keys() {
      return [...store.keys()];
    },
    async delete(name: string) {
      return store.delete(name);
    },
    async match(request: { url: string } | string) {
      for (const bucket of store.values()) {
        const hit = bucket.get(keyFor(request));
        if (hit) return hit;
      }
      return undefined;
    },
  };
  return { caches, setFetchHandler: caches.__setFetchHandler, fetchSpy: (req: ReturnType<typeof makeRequest>) => fetchHandler(req) };
}

type ListenerMap = Record<string, Array<(event: unknown) => unknown>>;

function createSandbox() {
  const listeners: ListenerMap = {};
  let skipWaitingCalls = 0;
  let claimCalls = 0;

  const { caches, setFetchHandler } = makeFakeCaches();

  const fakeSelf = {
    location: new URL(ORIGIN + "/"),
    addEventListener(type: string, handler: (event: unknown) => unknown) {
      (listeners[type] ??= []).push(handler);
    },
    skipWaiting() {
      skipWaitingCalls += 1;
    },
    clients: {
      async claim() {
        claimCalls += 1;
      },
    },
  };

  let fetchHandler: FetchHandler = async () => {
    throw new Error("unexpected network call in test");
  };
  const fetchSpy = async (request: ReturnType<typeof makeRequest>) => fetchHandler(request);
  setFetchHandler((request) => fetchHandler(request));

  const context = vm.createContext({
    self: fakeSelf,
    caches,
    fetch: fetchSpy,
    URL,
    console,
  });
  vm.runInContext(swSource, context);

  async function dispatch(type: string, eventPayload: Record<string, unknown>) {
    const handlers = listeners[type] ?? [];
    let respondWithPromise: Promise<unknown> | null = null;
    let respondWithCalled = false;
    const waitUntilPromises: Array<Promise<unknown>> = [];
    const event = {
      ...eventPayload,
      respondWith(promise: Promise<unknown>) {
        respondWithCalled = true;
        respondWithPromise = promise;
      },
      waitUntil(promise: Promise<unknown>) {
        waitUntilPromises.push(promise);
      },
    };
    for (const handler of handlers) handler(event);
    await Promise.all(waitUntilPromises);
    const response = respondWithCalled ? await respondWithPromise : undefined;
    return { respondWithCalled, response: response as FakeResponse | undefined };
  }

  return {
    dispatch,
    setFetchHandler: (handler: FetchHandler) => {
      fetchHandler = handler;
    },
    getSkipWaitingCalls: () => skipWaitingCalls,
    getClaimCalls: () => claimCalls,
    caches,
  };
}

test("sw.js fetch handler never intercepts (respondWith) admin, auth, admin-api, or clinic submission paths", async () => {
  const sandbox = createSandbox();
  sandbox.setFetchHandler(async () => {
    throw new Error("SW must not even attempt a network fetch for excluded paths");
  });

  const excludedGetPaths = [
    "/admin",
    "/admin/login",
    "/admin/pages",
    "/admin/preview/token-abc",
    "/admin/operations/patient-requests",
    "/api/auth/session",
    "/api/admin/gp-pipeline/eoi",
    "/api/clinics/woolloongabba/form-requests",
    "/api/clinics/woolloongabba/career-applications",
    "/api/clinics/woolloongabba/gp-pipeline/eoi",
    "/api/clinics/woolloongabba/gp-pipeline/readiness",
    "/api/clinics/woolloongabba/gp-pipeline/readiness-package",
    "/api/clinics/woolloongabba/search-signals",
    "/", // ordinary CMS page: SW must not intercept at all
    "/doctors/dr-example.html",
  ];

  for (const pathname of excludedGetPaths) {
    const { respondWithCalled } = await sandbox.dispatch("fetch", { request: makeRequest(pathname) });
    assert.equal(respondWithCalled, false, `GET ${pathname} must not be intercepted`);
  }
});

test("sw.js fetch handler never intercepts any non-GET request, even to a shell asset", async () => {
  const sandbox = createSandbox();
  sandbox.setFetchHandler(async () => {
    throw new Error("SW must not fetch for a non-GET request");
  });

  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    const { respondWithCalled } = await sandbox.dispatch("fetch", {
      request: makeRequest("/manifest.webmanifest", { method }),
    });
    assert.equal(respondWithCalled, false, `${method} /manifest.webmanifest must not be intercepted`);
  }
});

test("sw.js fetch handler never intercepts cross-origin requests", async () => {
  const sandbox = createSandbox();
  sandbox.setFetchHandler(async () => {
    throw new Error("SW must not fetch cross-origin");
  });
  const { respondWithCalled } = await sandbox.dispatch("fetch", {
    request: makeRequest("https://www.hotdoc.com.au/clinic"),
  });
  assert.equal(respondWithCalled, false);
});

test("sw.js serves a shell asset network-first and caches only safe 200 responses", async () => {
  const sandbox = createSandbox();
  sandbox.setFetchHandler(async () =>
    makeResponse("favicon-bytes", { headers: { "cache-control": "public, max-age=60" } }),
  );

  const { respondWithCalled, response } = await sandbox.dispatch("fetch", {
    request: makeRequest("/favicon.ico"),
  });
  assert.equal(respondWithCalled, true);
  assert.equal(response?.body, "favicon-bytes");

  const bucket = sandbox.caches.__bucket("wmc-shell-v1");
  assert.ok(bucket, "shell cache bucket should exist after a successful fetch");
  assert.ok(bucket!.has(absoluteUrl("/favicon.ico")), "safe 200 response should be cached");
});

test("sw.js never caches a response carrying Set-Cookie or Authorization, even for a shell asset", async () => {
  const sandbox = createSandbox();
  sandbox.setFetchHandler(async () =>
    makeResponse("body", { headers: { "set-cookie": "authjs.session-token=leak" } }),
  );
  await sandbox.dispatch("fetch", { request: makeRequest("/manifest.webmanifest") });
  const bucket = sandbox.caches.__bucket("wmc-shell-v1");
  assert.equal(bucket?.has(absoluteUrl("/manifest.webmanifest")) ?? false, false);

  const sandbox2 = createSandbox();
  sandbox2.setFetchHandler(async () =>
    makeResponse("body", { headers: { authorization: "Bearer leaked-token" } }),
  );
  await sandbox2.dispatch("fetch", { request: makeRequest("/manifest.webmanifest") });
  const bucket2 = sandbox2.caches.__bucket("wmc-shell-v1");
  assert.equal(bucket2?.has(absoluteUrl("/manifest.webmanifest")) ?? false, false);
});

test("sw.js falls back to the offline shell page only for a failed navigation, not for admin content", async () => {
  const sandbox = createSandbox();
  // Pre-seed the offline page in the cache, as install() would have done.
  const offlineCache = await sandbox.caches.open("wmc-shell-v1");
  await offlineCache.put(makeRequest(OFFLINE_FALLBACK_PATH), makeResponse("<html>offline</html>"));

  sandbox.setFetchHandler(async () => {
    throw new Error("offline");
  });

  // A navigation to a shell asset path that fails falls back to offline.html.
  const navResult = await sandbox.dispatch("fetch", {
    request: makeRequest("/offline.html", { mode: "navigate" }),
  });
  assert.equal(navResult.respondWithCalled, true);
  assert.equal(navResult.response?.body, "<html>offline</html>");

  // Admin pages are never intercepted in the first place, so there is no
  // "offline fallback" for them at all — the browser's own offline handling
  // applies, confirming the fallback never substitutes for admin/personalised
  // content.
  const adminResult = await sandbox.dispatch("fetch", {
    request: makeRequest("/admin/pages", { mode: "navigate" }),
  });
  assert.equal(adminResult.respondWithCalled, false);
});

test("sw.js install() precaches the shell allow-list and calls skipWaiting", async () => {
  const sandbox = createSandbox();
  sandbox.setFetchHandler(async (request) => makeResponse(`body:${request.url}`));

  await sandbox.dispatch("install", {});
  assert.equal(sandbox.getSkipWaitingCalls(), 1);

  const bucket = sandbox.caches.__bucket("wmc-shell-v1");
  assert.ok(bucket);
  for (const shellPath of SHELL_ALLOWLIST) {
    assert.ok(bucket!.has(absoluteUrl(shellPath)), `install() should precache ${shellPath}`);
  }
});

test("sw.js install() tolerates one shell asset failing to fetch (e.g. manifest.webmanifest not landed yet)", async () => {
  const sandbox = createSandbox();
  sandbox.setFetchHandler(async (request) => {
    if (request.url.endsWith("/manifest.webmanifest")) return makeResponse("", { status: 404 });
    return makeResponse(`body:${request.url}`);
  });

  // Must not throw.
  await sandbox.dispatch("install", {});
  const bucket = sandbox.caches.__bucket("wmc-shell-v1");
  assert.ok(bucket!.has(absoluteUrl("/favicon.ico")));
  assert.equal(bucket!.has(absoluteUrl("/manifest.webmanifest")), false);
});

test("sw.js activate() claims clients and deletes stale wmc-shell caches, but does not touch unrelated cache names", async () => {
  const sandbox = createSandbox();
  // Simulate a stale cache from a previous version, plus an unrelated cache name.
  await sandbox.caches.open("wmc-shell-v0");
  await sandbox.caches.open("some-other-app-cache");
  await sandbox.caches.open("wmc-shell-v1");

  await sandbox.dispatch("activate", {});
  assert.equal(sandbox.getClaimCalls(), 1);

  const keys = await sandbox.caches.keys();
  assert.equal(keys.includes("wmc-shell-v0"), false);
  assert.equal(keys.includes("some-other-app-cache"), true);
  assert.equal(keys.includes("wmc-shell-v1"), true);
});

test("sw.js 'SW must not claim admin': admin traffic is identical whether or not clients.claim() has run", async () => {
  const sandbox = createSandbox();
  await sandbox.dispatch("activate", {});
  assert.equal(sandbox.getClaimCalls(), 1);

  sandbox.setFetchHandler(async () => {
    throw new Error("must not fetch for admin");
  });
  const { respondWithCalled } = await sandbox.dispatch("fetch", { request: makeRequest("/admin/login") });
  assert.equal(respondWithCalled, false, "admin page fetch must remain untouched even after clients.claim()");
});
