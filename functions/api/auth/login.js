import { json, error, readJson } from "../../_lib/response.js";
import { verifyPassword } from "../../_lib/crypto.js";
import { createSession, cleanupExpiredSessions } from "../../_lib/auth.js";
import { ensureSchema } from "../../_lib/db.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.DB) {
    return error("데이터베이스 연결이 없습니다.", 500);
  }

  await ensureSchema(env);

  const body = await readJson(request);
  if (!body || !body.username || !body.password) {
    return error("아이디와 비밀번호를 입력해 주세요.", 400);
  }

  await cleanupExpiredSessions(env);

  const admin = await env.DB.prepare(
    "SELECT id, username, password_hash, salt, role FROM admins WHERE username = ?"
  )
    .bind(String(body.username).trim())
    .first();

  if (!admin) {
    return error("아이디 또는 비밀번호가 올바르지 않습니다.", 401);
  }

  const ok = await verifyPassword(String(body.password), admin.salt, admin.password_hash);
  if (!ok) {
    return error("아이디 또는 비밀번호가 올바르지 않습니다.", 401);
  }

  const role = admin.role === "admin" ? "admin" : "user";
  const secure = new URL(request.url).protocol === "https:";
  const session = await createSession(env, admin.id, secure);

  return json(
    { ok: true, admin: { id: admin.id, username: admin.username, role } },
    200,
    { "Set-Cookie": session.cookie }
  );
}
