import { json, error, readJson } from "../_lib/response.js";
import { requireAdmin, requireAdminRole } from "../_lib/auth.js";
import { ensureSchema } from "../_lib/db.js";
import {
  CONTACT_COLUMNS,
  mapContact,
  normalizeContact,
  bindContactValues,
} from "../_lib/contacts.js";
import { sortContacts } from "../_lib/sort.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.DB) return error("Database binding missing", 500);
  await ensureSchema(env);

  const admin = await requireAdmin(env, request);
  if (!admin) return error("Unauthorized", 401);

  // list: any logged-in user
  const { results } = await env.DB.prepare(
    `SELECT ${CONTACT_COLUMNS}
     FROM contacts`
  ).all();

  const contacts = sortContacts((results || []).map(mapContact));
  return json({ contacts });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return error("Database binding missing", 500);
  await ensureSchema(env);

  const admin = await requireAdminRole(env, request);
  if (!admin) return error("Forbidden", 403);

  const body = await readJson(request);
  if (!body) return error("Invalid JSON body", 400);

  const c = normalizeContact(body);
  if (!c.name) return error("name is required", 400);

  const result = await env.DB.prepare(
    `INSERT INTO contacts (name, region, dept, position, phone, email, appoint_date, birth_date, military_branch, military_rank, commission, commission_type, class_no, address, remark, avatar)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(...bindContactValues(c))
    .run();

  const id = result.meta.last_row_id;
  const row = await env.DB.prepare(`SELECT ${CONTACT_COLUMNS} FROM contacts WHERE id = ?`)
    .bind(id)
    .first();

  return json({ contact: mapContact(row) }, 201);
}
