# WMC — Phase C2 Auth.js staging hostname repair plan

**Date:** 2026-11-13  
**Re-verified live:** yes (this pass)  
**Auth stack:** Auth.js / NextAuth v5 + Credentials (not Supabase Auth)  
**No env change, secret rotation, or deploy in this pass.**

| Host | Role |
| --- | --- |
| `https://staging.gabbamedicalcentre.com.au` | Custom staging (staff UAT priority) |
| `https://mediumslateblue-eagle-960503.hostingersite.com` | Temporary Hostinger preview |

---

## 1. Exact cause (confirmed)

1. Hostinger Node env includes **`AUTH_URL`** (key present; value masked).  
2. Live proof — custom domain:

```text
GET https://staging.gabbamedicalcentre.com.au/api/auth/signin
→ 302 Location: /admin/login?callbackUrl=https%3A%2F%2Fmediumslateblue-eagle-960503.hostingersite.com
```

3. Preview host `callbackUrl` matches hostingersite (consistent with pinned `AUTH_URL`).  
4. Code already sets `trustHost: true` (`apps/web/src/auth/auth.config.ts`). Env also has `AUTH_TRUST_HOST`.  
5. Production redirect callback uses `developmentRequestOrigin(...)`, which **returns `null` when `NODE_ENV === "production"`** (`apps/web/src/clinics/host.ts`), so absolute redirects fall back to Auth.js `baseUrl` derived from **`AUTH_URL`**.

**Not caused by:** Supabase Auth, cookies alone, HotDoc, public clinic host routing, or missing `AUTH_TRUST_HOST`.

**Also present (healthy):** `/api/auth/csrf` 200, `/api/auth/session` 200, `/admin` → `/admin/login` 307, `/api/health` database up on both hosts. Cookie policy for `__Host-` / `__Secure-` remains appropriate once callback host matches request host.

---

## 2. Env keys on staging (names only)

From Hostinger list (values masked — **do not copy into replace**):

`STAGING_NOINDEX`, `PRIVATE_OBJECT_STORE`, `DATABASE_URL`, `AUTH_SECRET`, **`AUTH_URL`**, `AUTH_TRUST_HOST`, `DEFAULT_CLINIC_SLUG`

---

## 3. Minimal safe correction

### Approach A — recommended (dual-host)

**Remove `AUTH_URL`** from Hostinger env; keep **`AUTH_TRUST_HOST=true`**. Auth.js infers origin per request from forwarded host headers.

| Impact | Result |
| --- | --- |
| Custom staging | `callbackUrl` should use `staging.gabbamedicalcentre.com.au` |
| Preview host | Continues to work on its own origin |
| Code deploy | **None** |
| Risk | If Hostinger omitted `X-Forwarded-Host` / `Host`, inference could fail — smoke tests below catch this; rollback by restoring `AUTH_URL` |

### Approach B — custom-domain pin only

Set `AUTH_URL=https://staging.gabbamedicalcentre.com.au`. Fixes custom host; may break preview-host admin callbacks.

### Approach C — code allowlist (optional later)

Extend production `redirect` / origin helper to allowlist both staging hosts. Requires rebuild + archive deploy — **not** minimal.

**Choose A** for C2 staff UAT unless smoke proves header inference broken.

---

## 4. Owner-executed repair steps (Approach A)

1. Written approval: “Remove Hostinger `AUTH_URL` for dual-host Auth.js.”  
2. Export full real env values from the operator secret store (never from masked API).  
3. hPanel → Node.js env for the staging Web App → remove `AUTH_URL` **or** full-replace via API with complete set **excluding** `AUTH_URL`.  
4. Confirm `AUTH_TRUST_HOST=true`, `AUTH_SECRET` unchanged, `DATABASE_URL` unchanged.  
5. Process restart (env save). No Git deploy required for A/B.  
6. Run smoke matrix §5.  
7. Rollback: re-add previous `AUTH_URL` value from secret store if inference fails.

---

## 5. Tests (pre / post)

| # | Test | Pre-change (2026-11-13) | Post-change expect |
| --- | --- | --- | --- |
| T1 | `GET …/api/auth/signin` on **custom** (no follow) | **FAIL** — callbackUrl → hostingersite | **PASS** — callbackUrl host = staging.gabba… |
| T2 | Same on **preview** host | PASS (matches preview) | PASS (matches preview) |
| T3 | `/admin` → login both hosts | PASS | PASS |
| T4 | csrf / session 200 | PASS | PASS |
| T5 | Staff sign-in on custom host → `/admin` same host | Not run (no credentials in-agent) | **Owner** |
| T6 | Session refresh + sign-out on custom host | Not run | **Owner** |
| T7 | Optional: preview host full login | Not run | **Owner** if dual-host required |

---

## 6. Gate status implication

| Item | Status |
| --- | --- |
| Diagnosis complete | **PASS** |
| Repair plan ready | **PASS** |
| Env correction applied | **BLOCKED** — owner approval + hPanel action |
| C2-P04 overall | Remains **BLOCKED** until T1+T5 evidence attached |

---

## 7. Explicit non-actions (this pass)

No credential changes, no secret rotation, no `hosting_nodejs_replace-environment-variables`, no Auth.js code deploy, no DNS changes.
