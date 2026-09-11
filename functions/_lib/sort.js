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

  return String(a.name || "").localeCompare(String(b.name || ""), "ko");
}

export function sortContacts(list) {
  return [...list].sort(compareContacts);
}
