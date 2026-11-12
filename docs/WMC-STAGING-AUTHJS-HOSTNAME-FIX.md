# WMC — Auth.js custom staging hostname fix

**Date:** 2026-11-12  
**Scope:** Targeted Auth.js v5 callback-host investigation for dual staging hostnames.  
**No env change / no deploy in this pass** (owner approval required).  
**Auth stack:** Auth.js (NextAuth v5) + Credentials — **not** Supabase Auth.  
**DB / practitioners / booking:** no changes required.

| Host | Role |
| --- | --- |
| `https://staging.gabbamedicalcentre.com.au` | Custom staging (priority) |
| `https://mediumslateblue-eagle-960503.hostingersite.com` | Temporary Hostinger preview (preserve if possible) |

---

## Root cause

1. Hostinger Node env has a **pinned `AUTH_URL`** (key present; value masked — empirically the temporary Hostinger origin).
2. Auth.js v5 uses that canonical URL for absolute `callbackUrl` / base URL construction when `AUTH_URL` is set.
3. Live evidence — request to **custom** staging:

   `GET https://staging.gabbamedicalcentre.com.au/api/auth/signin`  
   → `302`  
   → `/admin/login?callbackUrl=https%3A%2F%2Fmediumslateblue-eagle-960503.hostingersite.com`

4. Code already sets `trustHost: true` in `apps/web/src/auth/auth.config.ts`, and `AUTH_TRUST_HOST` is present in Hostinger env. That is correct for a reverse proxy, but **does not override a pinned `AUTH_URL`**.
5. Production `redirect` callback in `apps/web/src/auth/index.ts` calls `developmentRequestOrigin(...)`, which **returns `null` when `NODE_ENV === "production"`**, so it falls back to Auth.js `baseUrl` (= `AUTH_URL`). Relative post-login targets therefore resolve against the temporary hostname in production.

**Not caused by:** Supabase, practitioner data, booking policies, or public-page hostname routing (those already pass on the custom domain).

---

## Recommended minimal correction

### Prefer configuration-only (dual-host safe)

Per Auth.js v5 deployment guidance: for **one app, multiple hostnames**, **omit `AUTH_URL`** and keep **`AUTH_TRUST_HOST=true`** so the origin is inferred per request from `X-Forwarded-Host` / `Host` + `X-Forwarded-Proto`.

WMC already hardcodes `trustHost: true`. Credentials sign-in does not need OAuth provider callback allowlists.

| Approach | Effect on custom staging | Effect on temporary hostname | Code change | Deploy |
| --- | --- | --- | --- | --- |
| **A. Remove `AUTH_URL`** (recommended) | Callback/origin follow request host | Same | None | Env replace + app restart only |
| **B. Pin `AUTH_URL=https://staging.gabbamedicalcentre.com.au`** | Fixed | Cross-host callback risk mirrored onto preview host | None | Env replace + restart |
| **C. Allowlisted request-host in code** | Explicit dual-host | Explicit dual-host | Small | Rebuild + deploy |

**Choose A** unless Hostinger fails to forward host headers (then verify headers, or fall back to B for custom-domain priority).

### Optional later hardening (not required for the config fix)

Allowlist production/staging hosts inside the Auth.js `redirect` callback so even with `trustHost` only known WMC hosts are accepted. Only needed if operator wants defense-in-depth beyond Hostinger’s edge. **Requires code + deploy — not the minimal path.**

---

## Required environment or code changes

### Environment (hPanel — owner only)

**Do not copy masked `********` values from “List environment variables” into a replace call.** Replace is a **full replace**: every key must be resent with real values from the operator’s secret store.

**Exact hPanel instructions (Approach A):**

1. Open **Hostinger hPanel** → the Node.js site for `mediumslateblue-eagle-960503.hostingersite.com` (parked: `staging.gabbamedicalcentre.com.au`).
2. Open **Environment variables** (Node.js / Web App).
3. Note every existing **key** (values stay in your password manager / prior export — API masks them).
4. Prepare the **full** set again with real values, then either:
   - **UI:** delete the `AUTH_URL` row and save, **or**
   - **API/CLI equivalent:** `hosting_nodejs_replace-environment-variables` with the complete `env_vars` array **excluding** `AUTH_URL`.
5. Confirm these keys remain (names only):
   - `DATABASE_URL`
   - `AUTH_SECRET` (unchanged)
   - `AUTH_TRUST_HOST` = `true`
   - `DEFAULT_CLINIC_SLUG`
   - `STAGING_NOINDEX` = `true`
   - `PRIVATE_OBJECT_STORE` (as currently used)
   - any other keys already on the site
6. Saving env **restarts** the Node process. No Git deploy and no `npm run build` required for Approach A (runtime env only; Auth.js reads `AUTH_URL` at process start).
7. Smoke-test (below). Keep a rollback: re-add `AUTH_URL=https://mediumslateblue-eagle-960503.hostingersite.com` if inference fails.

**Approach B (if A is rejected):** set  
`AUTH_URL=https://staging.gabbamedicalcentre.com.au`  
(same full-replace discipline). Prioritises custom domain; preview-host admin may again show a mismatched `callbackUrl`.

### Code

**None required** for Approach A or B.

### Database / clinical

**None.** No Supabase Auth. No practitioner or booking policy changes.

---

## Verification results (this pass — pre-change)

| Check | Custom staging | Temporary hostname |
| --- | --- | --- |
| `/admin` → `/admin/login` | PASS (307) | PASS (307) |
| `/admin/login` 200 | PASS | PASS |
| `/api/auth/signin` `callbackUrl` host | **FAIL** → hostingersite | Matches hostingersite |
| `/api/auth/csrf` / `session` | 200 | 200 |
| Auth cookies `__Host-` / `__Secure-` Secure HttpOnly | Present | Present |
| Full login / session / logout with staff credentials | **Not executed** (no credentials in-agent) | Same |

**Post-change smoke (owner):**

1. On `https://staging.gabbamedicalcentre.com.au/api/auth/signin` (no follow): `Location` must use `callbackUrl=https://staging.gabbamedicalcentre.com.au` (or relative equivalent), **not** hostingersite.
2. Open `/admin/login` on custom domain → sign in → land on `/admin` **on the same host**.
3. Refresh `/admin` → session persists; cookies remain `__Host-` / `__Secure-` on that host.
4. Sign out → return to `/admin/login` on the same host; `/admin` redirects to login.
5. Optionally repeat on the temporary hostname (Approach A should work on both; Approach B may not).

---

## Deployment requirement

| Correction | Deploy needed? |
| --- | --- |
| Approach A — remove `AUTH_URL` | **No** code deploy — env save + process restart only |
| Approach B — retarget `AUTH_URL` | **No** code deploy — env save + restart |
| Approach C — allowlisted redirect code | **Yes** — build + Hostinger deploy after approval |

---

## Remaining authentication risks

| Risk | Notes |
| --- | --- |
| Host-header trust | `trustHost: true` trusts proxy-forwarded host. Hostinger must set/overwrite `X-Forwarded-Host` / `Host` (not client-spoofable). If inference looks wrong after removing `AUTH_URL`, inspect forwarded headers before adding code. |
| Dual-host sessions | `__Host-` cookies are **host-bound**. A session on staging.gabba is not sent to hostingersite (and vice versa). Expected; not a bug. |
| Open redirect | Existing `redirect` callback rejects foreign origins vs `origin`/`baseUrl`. After unsetting `AUTH_URL`, `baseUrl` should track the request host — still relative `redirectTo: "/admin"` from login. Avoid accepting unvalidated absolute external `callbackUrl` query values. |
| Pinning one `AUTH_URL` | Always breaks the other hostname’s absolute callbacks. Fine for single-canonical production later (`AUTH_URL=https://gabbamedicalcentre.com.au`). |
| Temporary hostname `/robots.txt` | **Known Hostinger CDN limitation** (`hcdn` serves permissive `Allow: /` for `User-agent: *` while HTML still has `noindex`). Custom domain robots are correct. **Not a mandatory production launch blocker.** |

---

## Summary

| Item | Finding |
| --- | --- |
| Root cause | Pinned staging `AUTH_URL` → temporary Hostinger origin forces cross-host `callbackUrl` on the custom domain |
| Minimal fix | Remove `AUTH_URL`; keep `AUTH_TRUST_HOST=true` (already + `trustHost: true` in code) |
| Code / DB | None for minimal path |
| Deploy | Not required for env-only fix |
| Owner action | hPanel full env replace without `AUTH_URL`, then smoke login on `staging.gabbamedicalcentre.com.au` |
