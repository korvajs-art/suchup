import { json, error, readJson } from "../../_lib/response.js";
import { requireAdmin } from "../../_lib/auth.js";
import { ensureSchema } from "../../_lib/db.js";
import {
  normalizeContact,
  bindContactValues,
  phoneDigits,
} from "../../_lib/contacts.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return error("Database binding missing", 500);
  await ensureSchema(env);

  const admin = await requireAdmin(env, request);
  if (!admin) return error("Unauthorized", 401);

  const body = await readJson(request);
  if (!body || !Array.isArray(body.contacts)) {
    return error("contacts array is required", 400);
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  const { results: allRows } = await env.DB.prepare("SELECT id, phone FROM contacts").all();
  const byPhone = new Map();
  for (const row of allRows || []) {
    const d = phoneDigits(row.phone);
    if (d && !byPhone.has(d)) byPhone.set(d, row.id);
  }

  for (const item of body.contacts) {
    const c = normalizeContact(item || {});
    if (!c.name) {
      skipped += 1;
      continue;
    }

    const digits = phoneDigits(c.phone);
    const existingId = digits ? byPhone.get(digits) : null;

    if (existingId) {
      await env.DB.prepare(
        `UPDATE contacts
         SET name = ?, region = ?, dept = ?, position = ?, phone = ?, email = ?,
             appoint_date = ?, birth_date = ?, military_branch = ?, military_rank = ?,
             commission = ?, commission_type = ?, class_no = ?, address = ?, remark = ?, avatar = ?,
             updated_at = datetime('now')
         WHERE id = ?`
      )
        .bind(...bindContactValues(c), existingId)
        .run();
      updated += 1;
    } else {
      const result = await env.DB.prepare(
        `INSERT INTO contacts (name, region, dept, position, phone, email, appoint_date, birth_date, military_branch, military_rank, commission, commission_type, class_no, address, remark, avatar)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(...bindContactValues(c))
        .run();
      if (digits && result.meta.last_row_id) {
        byPhone.set(digits, result.meta.last_row_id);
      }
      inserted += 1;
    }
  }

  return json({ inserted, updated, skipped });
}
