import { verifyPassword, hashPassword, createSalt } from "../../_lib/crypto.js";
import { requireAdmin } from "../../_lib/auth.js";
import { json, error, readJson } from "../../_lib/response.js";
import { ensureSchema } from "../../_lib/db.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return error("Database binding missing", 500);
  await ensureSchema(env);

  const admin = await requireAdmin(env, request);
  if (!admin) return error("Unauthorized", 401);

  const body = await readJson(request);
  if (!body) return error("Invalid JSON body", 400);

  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");

  if (!currentPassword || !newPassword) {
    return error("currentPassword and newPassword are required", 400);
  }
  if (newPassword.length < 4) {
    return error("new password must be at least 4 characters", 400);
  }

  const row = await env.DB.prepare(
    "SELECT id, password_hash, salt FROM admins WHERE id = ?"
  )
    .bind(admin.id)
    .first();

  if (!row) return error("Admin not found", 404);

  const ok = await verifyPassword(currentPassword, row.salt, row.password_hash);
  if (!ok) return error("Current password is incorrect", 401);

  const salt = createSalt();
  const passwordHash = await hashPassword(newPassword, salt);

  await env.DB.prepare("UPDATE admins SET password_hash = ?, salt = ? WHERE id = ?")
    .bind(passwordHash, salt, admin.id)
    .run();

  return json({ ok: true });
}
