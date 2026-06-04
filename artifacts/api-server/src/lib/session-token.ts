/**
 * Session token helpers.
 *
 * The frontend often runs inside a cross-site iframe (the Replit workspace /
 * canvas preview) where browsers block third-party cookies. In that context the
 * session cookie set on login is never sent back, so every authenticated
 * request would 401. To stay robust regardless of the browser's cookie policy
 * we ALSO hand the client a signed token on login. The client stores it and
 * sends it as `Authorization: Bearer <token>`; a middleware then injects it as
 * the session cookie before express-session runs, so the existing PostgreSQL
 * session store is reused with no route changes.
 *
 * The token is exactly the value express-session would put in the cookie:
 * `s:<sessionId>.<hmac>` signed with the same secret, so express-session can
 * verify and resolve it identically to a real cookie.
 */
import signature from "cookie-signature";

export const SESSION_COOKIE_NAME = "agroguard.sid";

export const SESSION_SECRET =
  process.env["SESSION_SECRET"] || "dev-secret-change-in-production";

/** Produce the signed cookie value for a session id (mirrors express-session). */
export function signSessionId(sessionId: string): string {
  return "s:" + signature.sign(sessionId, SESSION_SECRET);
}
