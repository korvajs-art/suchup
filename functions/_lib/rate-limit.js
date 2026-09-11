import { sha256Hex } from "./crypto.js";
import {
  LOGIN_MAX_ATTEMPTS,
  LOGIN_WINDOW_MS,
  clientIp,
} from "./security.js";

async function ensureLoginAttemptsTable(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS login_attempts (
      ip_hash TEXT PRIMARY KEY,
      fail_count INTEGER NOT NULL DEFAULT 0,
      window_start TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`
  ).run();
}

async function ipKey(request) {
  return sha256Hex(clientIp(request));
}

/** Returns { ok:true } or { ok:false, retryAfterSeconds }. */
export async function checkLoginRateLimit(env, request) {
  if (!env?.DB) return { ok: true };
  await ensureLoginAttemptsTable(env);

  const key = await ipKey(request);
  const row = await env.DB.prepare(
    "SELECT fail_count, window_start FROM login_attempts WHERE ip_hash = ?"
  )
    .bind(key)
    .first();

  if (!row) return { ok: true };

  const start = new Date(row.window_start).getTime();
  const elapsed = Date.now() - start;
  if (!Number.isFinite(start) || elapsed > LOGIN_WINDOW_MS) {
    await env.DB.prepare("DELETE FROM login_attempts WHERE ip_hash = ?").bind(key).run();
    return { ok: true };
  }

  if (Number(row.fail_count) >= LOGIN_MAX_ATTEMPTS) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((LOGIN_WINDOW_MS - elapsed) / 1000)),
    };
  }

  return { ok: true };
}

export async function recordLoginFailure(env, request) {
  if (!env?.DB) return;
  await ensureLoginAttemptsTable(env);
  const key = await ipKey(request);
  const row = await env.DB.prepare(
    "SELECT fail_count, window_start FROM login_attempts WHERE ip_hash = ?"
  )
    .bind(key)
    .first();

  const nowIso = new Date().toISOString();
  if (!row) {
    await env.DB.prepare(
      "INSERT INTO login_attempts (ip_hash, fail_count, window_start, updated_at) VALUES (?, 1, ?, ?)"
    )
      .bind(key, nowIso, nowIso)
      .run();
    return;
  }

  const start = new Date(row.window_start).getTime();
  if (!Number.isFinite(start) || Date.now() - start > LOGIN_WINDOW_MS) {
    await env.DB.prepare(
      "UPDATE login_attempts SET fail_count = 1, window_start = ?, updated_at = ? WHERE ip_hash = ?"
    )
      .bind(nowIso, nowIso, key)
      .run();
    return;
  }

  await env.DB.prepare(
    "UPDATE login_attempts SET fail_count = fail_count + 1, updated_at = ? WHERE ip_hash = ?"
  )
    .bind(nowIso, key)
    .run();
}

export async function clearLoginFailures(env, request) {
  if (!env?.DB) return;
  await ensureLoginAttemptsTable(env);
  const key = await ipKey(request);
  await env.DB.prepare("DELETE FROM login_attempts WHERE ip_hash = ?").bind(key).run();
}
