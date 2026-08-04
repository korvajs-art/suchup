export const CONTACT_COLUMNS =
  "id, name, region, dept, position, phone, email, appoint_date, birth_date, military_branch, military_rank, commission, commission_type, class_no, address, remark, avatar";

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
  };
}

export function normalizeContact(body) {
  return {
    name: String(body.name || "").trim(),
    region: String(body.region || "").trim(),
    dept: String(body.dept || "").trim(),
    position: String(body.position || "").trim(),
    phone: String(body.phone || "").trim(),
    email: String(body.email || "").trim(),
    appointDate: String(body.appointDate || body.appoint_date || "").trim(),
    birthDate: String(body.birthDate || body.birth_date || "").trim(),
    militaryBranch: String(body.militaryBranch || body.military_branch || "").trim(),
    militaryRank: String(body.militaryRank || body.military_rank || "").trim(),
    commission: String(body.commission || "").trim(),
    commissionType: String(body.commissionType || body.commission_type || "").trim(),
    classNo: String(body.classNo || body.class_no || "").trim(),
    address: String(body.address || "").trim(),
    remark: String(body.remark || "").trim(),
    avatar: String(body.avatar || "").trim(),
  };
}

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
