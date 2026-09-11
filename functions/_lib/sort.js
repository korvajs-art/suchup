import { regionRank, deptRank, positionRankOf } from "./org.js";

export function compareContacts(a, b) {
  const regionA = regionRank(a.region || a.dept);
  const regionB = regionRank(b.region || b.dept);
  if (regionA !== regionB) return regionA - regionB;

  const deptA = deptRank(a.region, a.dept);
  const deptB = deptRank(b.region, b.dept);
  if (deptA !== deptB) return deptA - deptB;

  const posA = positionRankOf(a.position);
  const posB = positionRankOf(b.position);
  if (posA !== posB) return posA - posB;

  // 같은 자리 안에서는 업로드한 명부의 행 순서를 따른다. 명부에 없으면 뒤로 보낸다.
  const orderA = a.sortOrder > 0 ? a.sortOrder : Infinity;
  const orderB = b.sortOrder > 0 ? b.sortOrder : Infinity;
  if (orderA !== orderB) return orderA - orderB;

  return String(a.name || "").localeCompare(String(b.name || ""), "ko");
}

export function sortContacts(list) {
  return [...list].sort(compareContacts);
}
