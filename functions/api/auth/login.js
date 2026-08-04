import { json, error, readJson } from "../../_lib/response.js";
import { verifyPassword } from "../../_lib/crypto.js";
import { createSession, cleanupExpiredSessions } from "../../_lib/auth.js";
import { ensureSchema } from "../../_lib/db.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.DB) {
    return error("Database binding missing", 500);
  }

  await ensureSchema(env);

  const body = await readJson(request);
  if (!body || !body.username || !body.password) {
    return error("username and password are required", 400);
  }

  await cleanupExpiredSessions(env);

  const admin = await env.DB.prepare(
    "SELECT id, username, password_hash, salt FROM admins WHERE username = ?"
  )
    .bind(String(body.username).trim())
    .first();

  if (!admin) {
    return error("Invalid credentials", 401);
  }

  const ok = await verifyPassword(String(body.password), admin.salt, admin.password_hash);
  if (!ok) {
    return error("Invalid credentials", 401);
  }

  const secure = new URL(request.url).protocol === "https:";
  const session = await createSession(env, admin.id, secure);

  return json(
    { ok: true, admin: { id: admin.id, username: admin.username } },
    200,
    { "Set-Cookie": session.cookie }
  );
}
