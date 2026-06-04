---
name: Session cookies in the Replit iframe preview
description: Why cookie-session apps 401 after login in the preview, and the correct fix
---

# Session auth inside the Replit HTTPS iframe

Replit serves the app preview inside a cross-site HTTPS iframe. A cookie-session
app (express-session etc.) whose cookie is `SameSite=Lax`/`secure:false` will
appear to log in (200) but then **401 on every following request** — the browser
silently drops the cookie in the third-party iframe context. curl tests hide this
because curl ignores SameSite and you manage the jar manually.

## Correct fix (Express + express-session)
- `app.set("trust proxy", 1)` — the Replit proxy terminates TLS; without this,
  express-session sees the forwarded request as insecure and won't set a
  `secure` cookie.
- cookie: `{ httpOnly: true, secure: true, sameSite: "none", maxAge: ... }`.
  `SameSite=None` REQUIRES `Secure`, and only sets over HTTPS.

**Verify over `https://$REPLIT_DEV_DOMAIN`, never `localhost:80` (plain HTTP).**
Over plain HTTP the proxy forwards `X-Forwarded-Proto: http`, so a `secure` cookie
is never set and you'll wrongly think the fix failed. The Set-Cookie header should
read `HttpOnly; Secure; SameSite=None`.

## Mandatory companions (security)
`SameSite=None` cookies are sent cross-site, so the API must NOT use permissive
CORS or it becomes a cross-site credential-exfiltration hole:
- CORS: replace `origin:true` with an allowlist built from `REPLIT_DEV_DOMAIN` +
  `REPLIT_DOMAINS` (comma-separated prod domains), keep `credentials:true`.
- CSRF: gate state-changing methods (POST/PUT/PATCH/DELETE) with an Origin/Referer
  check against the same allowlist. **Allow requests with no Origin AND no Referer**
  — those are non-browser clients (e.g. ESP32 device ingestion) and cannot be CSRF
  vectors; blocking them breaks device/server-to-server posting.

**Why:** an architect review failed the first cookie-only fix because `cors({origin:true,credentials:true})` + `SameSite=None` lets any site make authenticated, readable requests. The allowlist + Origin CSRF guard is the minimal correct mitigation for cookie (non-token) auth.

## When the cookie fix is STILL not enough (the real-world failure)
Even a perfect `Secure; SameSite=None` cookie is blocked by modern browsers'
third-party-cookie restrictions when the app is embedded (workspace/canvas iframe),
so the user 401s after login while a first-party Playwright e2e and an
`https://$REPLIT_DEV_DOMAIN` curl both PASS. That divergence (works first-party,
fails embedded) is the fingerprint of third-party-cookie blocking — not a server bug.

**Robust fix = bearer-token fallback that reuses the SAME session store, zero route churn:**
- Login/signup also return a `token` = the signed session id (`"s:"+cookieSignature.sign(req.sessionID, SECRET)`), i.e. exactly the cookie value express-session would emit. Add `cookie-signature` (match express-session's version, e.g. ~1.0.7) as an explicit dep — pnpm won't resolve it transitively.
- Add a middleware BEFORE express-session that, when `Authorization: Bearer <token>` is present and no real session cookie exists, injects `req.headers.cookie = '<name>=' + encodeURIComponent(token)`. express-session then verifies/loads it identically to a cookie. No route reads change.
- Client stores the token (localStorage) and sends it on every call: register the generated client's `setAuthTokenGetter(() => token)` AND add the header to any hand-written auth fetches (`/auth/me`, login, logout, change-password). Clear it on logout.
- Call `req.session.save(cb)` before returning the token so it references a persisted row (avoids a fast-follow-up race).
- Factor cookie NAME + SECRET into one shared module so app.ts and the signer never drift.

**Tradeoff:** the token is script-readable (localStorage), so XSS now means session theft — keep it as a fallback alongside the HttpOnly cookie, don't drop the cookie path. CSRF guard + CORS allowlist still required (credentials still flow).
