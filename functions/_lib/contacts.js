import { clampText, sanitizeAvatar, FIELD_LIMITS } from "./security.js";

export const CONTACT_COLUMNS =
  "id, name, region, dept, position, phone, email, appoint_date, birth_date, military_branch, military_rank, commission, commission_type, class_no, address, remark, avatar, sort_order";

export function phoneDigits(phone) {
  return String(phone || "").replace(/\D/g, "");
}

export function mapContact(row) {
  return {
    id: String(row.id),
    name: row.name || "",
    region: row.region || "",
    dept: row.dept || "",
    position: row.position || "",
    phone: row.phone || "",
    email: row.email || "",
    appointDate: row.appoint_date || "",
    birthDate: row.birth_date || "",
    militaryBranch: row.military_branch || "",
    militaryRank: row.military_rank || "",
    commission: row.commission || "",
    commissionType: row.commission_type || "",
    classNo: row.class_no || "",
    address: row.address || "",
    remark: row.remark || "",
    avatar: row.avatar || "",
    sortOrder: Number(row.sort_order) || 0,
  };
}

export function normalizeContact(body) {
  return {
    name: clampText(body.name, FIELD_LIMITS.name),
    region: clampText(body.region, FIELD_LIMITS.region),
    dept: clampText(body.dept, FIELD_LIMITS.dept),
    position: clampText(body.position, FIELD_LIMITS.position),
    phone: clampText(body.phone, FIELD_LIMITS.phone),
    email: clampText(body.email, FIELD_LIMITS.email),
    appointDate: clampText(body.appointDate || body.appoint_date, FIELD_LIMITS.appointDate),
    birthDate: clampText(body.birthDate || body.birth_date, FIELD_LIMITS.birthDate),
    militaryBranch: clampText(
      body.militaryBranch || body.military_branch,
      FIELD_LIMITS.militaryBranch
    ),
    militaryRank: clampText(body.militaryRank || body.military_rank, FIELD_LIMITS.militaryRank),
    commission: clampText(body.commission, FIELD_LIMITS.commission),
    commissionType: clampText(
      body.commissionType || body.commission_type,
      FIELD_LIMITS.commissionType
    ),
    classNo: clampText(body.classNo || body.class_no, FIELD_LIMITS.classNo),
    address: clampText(body.address, FIELD_LIMITS.address),
    remark: clampText(body.remark, FIELD_LIMITS.remark),
    avatar: sanitizeAvatar(body.avatar),
    sortOrder: Math.min(Math.max(Number(body.sortOrder || body.sort_order || 0) || 0, 0), 1_000_000),
  };
}

// sort_order 는 일괄등록에서만 다루므로 bindContactValues 에는 넣지 않는다.
// 관리자가 연락처를 수정해도 원래 명부 순서가 그대로 유지된다.

export function bindContactValues(c) {
  return [
    c.name,
    c.region,
    c.dept,
    c.position,
    c.phone,
    c.email,
    c.appointDate,
    c.birthDate,
    c.militaryBranch,
    c.militaryRank,
    c.commission,
    c.commissionType,
    c.classNo,
    c.address,
    c.remark,
    c.avatar,
  ];
}
