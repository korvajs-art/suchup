import { verifyPassword, hashPassword, createSalt } from "../../_lib/crypto.js";
import { requireAdmin } from "../../_lib/auth.js";
import { json, error, readJson } from "../../_lib/response.js";
import { ensureSchema } from "../../_lib/db.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return error("Database binding missing", 500);
  await ensureSchema(env);

  const admin = await requireAdmin(env, request);
  if (!admin) return error("로그인이 필요합니다.", 401);

  const body = await readJson(request);
  if (!body) return error("잘못된 요청입니다.", 400);

  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");

  if (!currentPassword || !newPassword) {
    return error("비밀번호를 모두 입력해 주세요.", 400);
  }
  if (newPassword.length < 4) {
    return error("새 비밀번호는 4자 이상이어야 합니다.", 400);
  }

  const row = await env.DB.prepare(
    "SELECT id, password_hash, salt FROM admins WHERE id = ?"
  )
    .bind(admin.id)
    .first();

  if (!row) return error("계정을 찾을 수 없습니다.", 404);

  const ok = await verifyPassword(currentPassword, row.salt, row.password_hash);
  if (!ok) return error("현재 비밀번호가 올바르지 않습니다.", 401);

  const salt = createSalt();
  const passwordHash = await hashPassword(newPassword, salt);

  await env.DB.prepare("UPDATE admins SET password_hash = ?, salt = ? WHERE id = ?")
    .bind(passwordHash, salt, admin.id)
    .run();

  return json({ ok: true });
}
