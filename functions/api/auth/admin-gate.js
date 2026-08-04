import { verifyPassword } from "../../_lib/crypto.js";
import { createSession, cleanupExpiredSessions } from "../../_lib/auth.js";
import { json, error, readJson } from "../../_lib/response.js";
import { ensureSchema } from "../../_lib/db.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return error("Database binding missing", 500);
  await ensureSchema(env);
  await cleanupExpiredSessions(env);

  const body = await readJson(request);
  const password = body && String(body.password || "");
  if (!password) return error("password is required", 400);

  const { results } = await env.DB.prepare(
    "SELECT id, username, password_hash, salt FROM admins ORDER BY id ASC"
  ).all();

  let matched = null;
  for (const admin of results || []) {
    const ok = await verifyPassword(password, admin.salt, admin.password_hash);
    if (ok) {
      matched = admin;
      break;
    }
  }

  if (!matched) return error("Invalid credentials", 401);

  const secure = new URL(request.url).protocol === "https:";
  const session = await createSession(env, matched.id, secure);

  return json(
    { ok: true, admin: { id: matched.id, username: matched.username } },
    200,
    { "Set-Cookie": session.cookie }
  );
}
