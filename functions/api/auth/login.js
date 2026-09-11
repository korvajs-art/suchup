import { json, error, readJson } from "../../_lib/response.js";
import { verifyPassword } from "../../_lib/crypto.js";
import { createSession, cleanupExpiredSessions } from "../../_lib/auth.js";
import { ensureSchema } from "../../_lib/db.js";
import { FIELD_LIMITS, clampText } from "../../_lib/security.js";
import {
  checkLoginRateLimit,
  recordLoginFailure,
  clearLoginFailures,
} from "../../_lib/rate-limit.js";

// 존재하지 않는 계정에도 비슷한 시간을 쓰기 위한 더미 검증 (A07).
const DUMMY_SALT = "0123456789abcdef0123456789abcdef";
const DUMMY_HASH = "0".repeat(64);

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.DB) {
    return error("데이터베이스 연결이 없습니다.", 500);
  }

  await ensureSchema(env);

  const limited = await checkLoginRateLimit(env, request);
  if (!limited.ok) {
    return json(
      { error: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      429,
      { "Retry-After": String(limited.retryAfterSeconds) }
    );
  }

  const body = await readJson(request);
  if (!body || !body.username || !body.password) {
    return error("아이디와 비밀번호를 입력해 주세요.", 400);
  }

  const username = clampText(body.username, FIELD_LIMITS.username);
  const password = String(body.password || "").slice(0, FIELD_LIMITS.password);
  if (!username || !password) {
    return error("아이디와 비밀번호를 입력해 주세요.", 400);
  }

  await cleanupExpiredSessions(env);

  const admin = await env.DB.prepare(
    "SELECT id, username, password_hash, salt, role FROM admins WHERE username = ?"
  )
    .bind(username)
    .first();

  const ok = admin
    ? await verifyPassword(password, admin.salt, admin.password_hash)
    : await verifyPassword(password, DUMMY_SALT, DUMMY_HASH);

  if (!admin || !ok) {
    await recordLoginFailure(env, request);
    return error("아이디 또는 비밀번호가 올바르지 않습니다.", 401);
  }

  await clearLoginFailures(env, request);

  const role = admin.role === "admin" ? "admin" : "user";
  const secure = new URL(request.url).protocol === "https:";
  const session = await createSession(env, admin.id, secure);

  return json(
    { ok: true, admin: { id: admin.id, username: admin.username, role } },
    200,
    { "Set-Cookie": session.cookie }
  );
}
