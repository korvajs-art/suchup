import { sha256Hex, randomToken } from "./crypto.js";

const COOKIE_NAME = "suchup_session";
const SESSION_DAYS = 7;

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    out[key] = decodeURIComponent(val);
  }
  return out;
}

export function sessionCookieHeader(token, maxAgeSeconds, secure = true) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookieHeader(secure = true) {
  const parts = [`${COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (secure) parts.splice(3, 0, "Secure");
  return parts.join("; ");
}

export async function createSession(env, adminId, secure = true) {
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const expiresAt = expires.toISOString();

  await env.DB.prepare(
    "INSERT INTO sessions (token_hash, admin_id, expires_at) VALUES (?, ?, ?)"
  )
    .bind(tokenHash, adminId, expiresAt)
    .run();

  return {
    token,
    cookie: sessionCookieHeader(token, SESSION_DAYS * 24 * 60 * 60, secure),
  };
}

export async function destroySession(env, request) {
  const cookies = parseCookies(request.headers.get("Cookie"));
  const token = cookies[COOKIE_NAME];
  if (token) {
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
  }
}

export async function requireAdmin(env, request) {
  const cookies = parseCookies(request.headers.get("Cookie"));
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT s.id AS session_id, s.expires_at, a.id AS admin_id, a.username
     FROM sessions s
     JOIN admins a ON a.id = s.admin_id
     WHERE s.token_hash = ?`
  )
    .bind(tokenHash)
    .first();

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(row.session_id).run();
    return null;
  }

  return { id: row.admin_id, username: row.username };
}

export async function cleanupExpiredSessions(env) {
  await env.DB.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
}
