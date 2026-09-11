import { hashPassword } from "./crypto.js";

// DB 가 비어 있을 때만 들어가는 예시값. 실제 대의원 명부는 seed-delegates.sql 로 넣는다.
// 소속·시군구·직위는 org-data.js 의 조직 체계를 따르고, 성명·연락처는 가짜다.
const DEFAULT_CONTACTS = [
  ["김민수", "본부", "본부", "회장", "010-1234-5678", "", "", "", "육군", "대령", "3사6", "", "", "", ""],
  ["이서연", "본부", "본부", "육군부회장", "010-2345-6789", "", "", "", "육군", "중장", "육사31", "", "", "", ""],
  ["박태준", "본부", "본부", "사무총장", "010-2345-1102", "", "", "", "육군", "중장", "육사41", "", "", "", ""],
  ["정하윤", "본부", "군직능대표", "직능대표", "010-2345-2101", "", "", "", "해군", "준장", "해사41", "", "", "", ""],
  ["임성호", "서울", "시회", "회장", "010-0123-4567", "", "", "", "육군", "소장", "3사9", "", "", "", ""],
  ["최수빈", "서울", "강남", "회장", "010-3456-2201", "", "", "", "육군", "중령", "학군21", "", "", "", ""],
  ["윤재석", "부산", "시회", "회장", "010-6789-0123", "", "", "", "해군", "대령", "해사30", "", "", "", ""],
  ["박준호", "경기", "도회", "회장", "010-3456-7890", "", "", "", "육군", "중령", "3사18", "", "", "", ""],
  ["문지호", "대전충남", "도회", "회장", "010-4210-3300", "", "", "", "육군", "소령", "기행2", "", "", "", ""],
  ["정인규", "경남", "도회", "회장", "010-4566-3080", "", "", "", "육군", "대령", "3사14", "", "", "", ""],
  ["방승일", "해외", "미동부", "회장", "002-6140-173-3265", "", "", "", "육군", "중위", "기행7", "", "", "", ""],
  ["공석", "업체", "향군타워", "대표이사", "", "", "", "", "", "", "", "", "", "", ""],
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

async function addColumnIfMissing(db, table, column, ddl) {
  try {
    await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`).run();
  } catch (_) {
    /* column already exists */
  }
}

async function ensureUser(db, username, password, role) {
  const existing = await db.prepare("SELECT id, role FROM admins WHERE username = ?").bind(username).first();
  if (existing) {
    if (existing.role !== role) {
      await db.prepare("UPDATE admins SET role = ? WHERE id = ?").bind(role, existing.id).run();
    }
    return;
  }
  const hash = await hashPassword(password, ADMIN_SALT);
  try {
    await db.prepare(
      "INSERT INTO admins (username, password_hash, salt, role) VALUES (?, ?, ?, ?)"
    )
      .bind(username, hash, ADMIN_SALT, role)
      .run();
  } catch (_) {
    await db.prepare(
      "INSERT INTO admins (username, password_hash, salt) VALUES (?, ?, ?)"
    )
      .bind(username, hash, ADMIN_SALT)
      .run();
    await db.prepare("UPDATE admins SET role = ? WHERE username = ?").bind(role, username).run();
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
          role TEXT NOT NULL DEFAULT 'user',
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
        await addColumnIfMissing(env.DB, "contacts", col, "TEXT NOT NULL DEFAULT ''");
      }
      await addColumnIfMissing(env.DB, "admins", "role", "TEXT NOT NULL DEFAULT 'user'");

      await ensureUser(env.DB, "admin", "changeme", "admin");
      await ensureUser(env.DB, "suchup", "suchup", "user");

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
