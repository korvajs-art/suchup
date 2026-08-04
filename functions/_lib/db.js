import { hashPassword } from "./crypto.js";

const DEFAULT_CONTACTS = [
  ["\uAE40\uBBFC\uC218", "\uC11C\uC6B8", "\uBCF8\uBD80", "\uD68C\uC7A5", "010-1234-5678", "minsu.kim@example.com", "", "", "\uC721\uAD70", "\uB300\uB839", "", "", "", "\uC11C\uC6B8\uD2B9\uBCC4\uC2DC \uC911\uAD6C \uC138\uC885\uB300\uB85C 110", ""],
  ["\uC774\uC11C\uC5F0", "\uC11C\uC6B8", "\uC0AC\uBB34\uAD6D", "\uC0AC\uBB34\uAD6D\uC7A5", "010-2345-6789", "seoyeon.lee@example.com", "", "", "", "", "", "", "", "\uC11C\uC6B8\uD2B9\uBCC4\uC2DC \uC885\uB85C\uAD6C \uC885\uB85C 1", ""],
  ["\uBC15\uC900\uD638", "\uACBD\uAE30", "\uACBD\uAE30\uB3C4\uD68C", "\uD68C\uC7A5", "010-3456-7890", "junho.park@example.com", "", "", "\uC721\uAD70", "\uC911\uB839", "", "", "", "\uACBD\uAE30\uB3C4 \uC218\uC6D0\uC2DC \uC601\uD1B5\uAD6C \uAD11\uAD50\uB85C 209", ""],
  ["\uCD5C\uC720\uC9C4", "\uACBD\uAE30", "\uACBD\uAE30\uB3C4\uD68C", "\uBD80\uD68C\uC7A5", "010-4567-8901", "yujin.choi@example.com", "", "", "", "", "", "", "", "", ""],
  ["\uC815\uC778\uADDC", "\uACBD\uB0A8", "\uACBD\uB0A8\uB3C4\uD68C", "\uD68C\uC7A5", "010-4566-3080", "ingyu.jung@example.com", "2020-01-01", "1960-01-01", "\uC721\uAD70", "\uB300\uB839", "", "", "", "\uACBD\uC0C1\uB0A8\uB3C4 \uCC3D\uC6D0\uC2DC \uC758\uCC3D\uAD6C \uC911\uC559\uB300\uB85C 151", ""],
  ["\uD55C\uB3D9\uC6B1", "\uACBD\uB0A8", "\uACBD\uB0A8\uB3C4\uD68C", "\uC721\uAD70\uBD80\uD68C\uC7A5", "010-3215-9949", "dongwook.han@example.com", "", "", "\uC721\uAD70", "", "", "", "", "", ""],
  ["\uC624\uD558\uB298", "\uBD80\uC0B0", "\uBD80\uC0B0\uC2DC\uD68C", "\uD68C\uC7A5", "010-5678-9012", "haneul.oh@example.com", "", "", "", "", "", "", "", "\uBD80\uC0B0\uAD11\uC5ED\uC2DC \uC5F0\uC81C\uAD6C \uC911\uC559\uB300\uB85C 1001", ""],
  ["\uC724\uC7AC\uC11D", "\uBD80\uC0B0", "\uBD80\uC0B0\uC2DC\uD68C", "\uCD1D\uBB34", "010-6789-0123", "jaeseok.yoon@example.com", "", "", "", "", "", "", "", "", ""],
  ["\uAC15\uBBF8\uB77C", "\uB300\uC804", "\uC0AC\uBB34\uAD6D", "\uACFC\uC7A5", "010-7890-1234", "mira.kang@example.com", "", "", "", "", "", "", "", "\uB300\uC804\uAD11\uC5ED\uC2DC \uC11C\uAD6C \uB454\uC0B0\uB85C 100", ""],
  ["\uC870\uD604\uC6B0", "\uB300\uAD6C", "\uB300\uAD6C\uC2DC\uD68C", "\uBD80\uD68C\uC7A5", "010-8901-2345", "hyunwoo.cho@example.com", "", "", "", "", "", "", "", "", ""],
  ["\uC2E0\uC608\uB9B0", "\uC778\uCC9C", "\uC778\uCC9C\uC2DC\uD68C", "\uCD1D\uBB34", "010-9012-3456", "yerin.shin@example.com", "", "", "", "", "", "", "", "\uC778\uCC9C\uAD11\uC5ED\uC2DC \uB0A8\uB3D9\uAD6C \uC608\uC220\uB85C 178", ""],
  ["\uC784\uC131\uD638", "\uAD11\uC8FC", "\uAD11\uC8FC\uC2DC\uD68C", "\uD68C\uC7A5", "010-0123-4567", "seongho.lim@example.com", "", "", "", "", "", "", "", "", ""],
];

const EXTRA_COLUMNS = [
  "appoint_date",
  "birth_date",
  "military_branch",
  "military_rank",
  "commission",
  "commission_type",
  "class_no",
  "remark",
];

const ADMIN_SALT = "0123456789abcdef0123456789abcdef";

let readyPromise = null;

async function addColumnIfMissing(db, column) {
  try {
    await db.prepare(`ALTER TABLE contacts ADD COLUMN ${column} TEXT NOT NULL DEFAULT ''`).run();
  } catch (_) {
    /* column already exists */
  }
}

export async function ensureSchema(env) {
  if (!env?.DB) return;
  if (!readyPromise) {
    readyPromise = (async () => {
      await env.DB.batch([
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS admins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`),
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          token_hash TEXT NOT NULL UNIQUE,
          admin_id INTEGER NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`),
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS contacts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          region TEXT NOT NULL DEFAULT '',
          dept TEXT NOT NULL DEFAULT '',
          position TEXT NOT NULL DEFAULT '',
          phone TEXT NOT NULL DEFAULT '',
          email TEXT NOT NULL DEFAULT '',
          appoint_date TEXT NOT NULL DEFAULT '',
          birth_date TEXT NOT NULL DEFAULT '',
          military_branch TEXT NOT NULL DEFAULT '',
          military_rank TEXT NOT NULL DEFAULT '',
          commission TEXT NOT NULL DEFAULT '',
          commission_type TEXT NOT NULL DEFAULT '',
          class_no TEXT NOT NULL DEFAULT '',
          address TEXT NOT NULL DEFAULT '',
          remark TEXT NOT NULL DEFAULT '',
          avatar TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`),
      ]);

      for (const col of EXTRA_COLUMNS) {
        await addColumnIfMissing(env.DB, col);
      }

      const adminCount = await env.DB.prepare("SELECT COUNT(*) AS c FROM admins").first();
      if (!adminCount || Number(adminCount.c) === 0) {
        const hash = await hashPassword("changeme", ADMIN_SALT);
        await env.DB.prepare(
          "INSERT INTO admins (username, password_hash, salt) VALUES (?, ?, ?)"
        )
          .bind("admin", hash, ADMIN_SALT)
          .run();
      }

      const contactCount = await env.DB.prepare("SELECT COUNT(*) AS c FROM contacts").first();
      if (!contactCount || Number(contactCount.c) === 0) {
        const stmts = DEFAULT_CONTACTS.map((c) =>
          env.DB.prepare(
            `INSERT INTO contacts (name, region, dept, position, phone, email, appoint_date, birth_date, military_branch, military_rank, commission, commission_type, class_no, address, remark)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(...c)
        );
        await env.DB.batch(stmts);
      }
    })().catch((err) => {
      readyPromise = null;
      throw err;
    });
  }
  await readyPromise;
}
