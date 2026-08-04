import { json, error, readJson } from "../../_lib/response.js";
import { requireAdmin } from "../../_lib/auth.js";
import { ensureSchema } from "../../_lib/db.js";
import {
  CONTACT_COLUMNS,
  mapContact,
  normalizeContact,
  bindContactValues,
} from "../../_lib/contacts.js";

export async function onRequestPut(context) {
  const { request, env, params } = context;
  if (!env.DB) return error("Database binding missing", 500);
  await ensureSchema(env);

  const admin = await requireAdmin(env, request);
  if (!admin) return error("Unauthorized", 401);

  const id = Number(params.id);
  if (!Number.isFinite(id)) return error("Invalid id", 400);

  const body = await readJson(request);
  if (!body) return error("Invalid JSON body", 400);

  const c = normalizeContact(body);
  if (!c.name) return error("name is required", 400);

  const existing = await env.DB.prepare("SELECT id FROM contacts WHERE id = ?").bind(id).first();
  if (!existing) return error("Not found", 404);

  await env.DB.prepare(
    `UPDATE contacts
     SET name = ?, region = ?, dept = ?, position = ?, phone = ?, email = ?,
         appoint_date = ?, birth_date = ?, military_branch = ?, military_rank = ?,
         commission = ?, commission_type = ?, class_no = ?, address = ?, remark = ?, avatar = ?,
         updated_at = datetime('now')
     WHERE id = ?`
  )
    .bind(...bindContactValues(c), id)
    .run();

  const row = await env.DB.prepare(`SELECT ${CONTACT_COLUMNS} FROM contacts WHERE id = ?`)
    .bind(id)
    .first();

  return json({ contact: mapContact(row) });
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  if (!env.DB) return error("Database binding missing", 500);
  await ensureSchema(env);

  const admin = await requireAdmin(env, request);
  if (!admin) return error("Unauthorized", 401);

  const id = Number(params.id);
  if (!Number.isFinite(id)) return error("Invalid id", 400);

  const existing = await env.DB.prepare("SELECT id FROM contacts WHERE id = ?").bind(id).first();
  if (!existing) return error("Not found", 404);

  await env.DB.prepare("DELETE FROM contacts WHERE id = ?").bind(id).run();
  return json({ ok: true });
}
