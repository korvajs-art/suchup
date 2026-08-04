/** Administrative region order (본부 first, then official si/do order). */
export const REGION_ORDER = [
  "본부",
  "중앙",
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충청북",
  "충남",
  "충청남",
  "전북",
  "전라북",
  "전남",
  "전라남",
  "경북",
  "경상북",
  "경남",
  "경상남",
  "제주",
];

/** Position order — more specific titles first (부회장 before 회장). */
export const POSITION_ORDER = [
  "명예회장",
  "수석부회장",
  "부회장",
  "회장",
  "이사",
  "감사",
  "사무총장",
  "사무국장",
  "사무처장",
  "국장",
  "부장",
  "과장",
  "팀장",
  "총무",
  "주무관",
  "직원",
];

export function rankByKeywords(value, order) {
  const text = String(value || "").trim();
  if (!text) return order.length + 1;
  for (let i = 0; i < order.length; i++) {
    if (text.includes(order[i])) return i;
  }
  return order.length;
}

export function compareContacts(a, b) {
  const regionA = rankByKeywords(a.region || a.dept, REGION_ORDER);
  const regionB = rankByKeywords(b.region || b.dept, REGION_ORDER);
  if (regionA !== regionB) return regionA - regionB;

  const deptA = rankByKeywords(a.dept, REGION_ORDER);
  const deptB = rankByKeywords(b.dept, REGION_ORDER);
  if (deptA !== deptB) return deptA - deptB;

  const posA = rankByKeywords(a.position, POSITION_ORDER);
  const posB = rankByKeywords(b.position, POSITION_ORDER);
  if (posA !== posB) return posA - posB;

  return String(a.name || "").localeCompare(String(b.name || ""), "ko");
}

export function sortContacts(list) {
  return [...list].sort(compareContacts);
}
