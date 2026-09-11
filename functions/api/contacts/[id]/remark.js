import { json, error, readJson } from "../../../_lib/response.js";
import { requireAdmin } from "../../../_lib/auth.js";
import { ensureSchema } from "../../../_lib/db.js";
import { CONTACT_COLUMNS, mapContact } from "../../../_lib/contacts.js";
import { clampText, FIELD_LIMITS } from "../../../_lib/security.js";

/** Any logged-in user can update 비고 (특징·메모). */
export async function onRequestPut(context) {
  const { request, env, params } = context;
  if (!env.DB) return error("Database binding missing", 500);
  await ensureSchema(env);

  const user = await requireAdmin(env, request);
  if (!user) return error("Unauthorized", 401);

  const id = Number(params.id);
  if (!Number.isFinite(id)) return error("Invalid id", 400);

  const body = await readJson(request);
  if (!body) return error("Invalid JSON body", 400);

  const remark = clampText(body.remark, FIELD_LIMITS.remark);
  const existing = await env.DB.prepare("SELECT id FROM contacts WHERE id = ?").bind(id).first();
  if (!existing) return error("Not found", 404);

  await env.DB.prepare(
    "UPDATE contacts SET remark = ?, updated_at = datetime('now') WHERE id = ?"
  )
    .bind(remark, id)
    .run();

  const row = await env.DB.prepare(
    `SELECT ${CONTACT_COLUMNS} FROM contacts WHERE id = ?`
  )
    .bind(id)
    .first();

  return json({ contact: mapContact(row) });
}
