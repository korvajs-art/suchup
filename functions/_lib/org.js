import { ORG } from "./org-data.js";

// 조직 데이터는 org-data.js 에 있고, 여기서는 정렬 순위만 계산한다.
// 클라이언트용 사본은 js/org.js 에 있으므로 함께 수정해야 한다.

export const REGION_NAMES = ORG.REGIONS.map((r) => r.name);
export const POSITION_NAMES = ORG.POSITIONS;

/** 소속별 시군구 목록. */
export const DEPTS_BY_REGION = new Map(ORG.REGIONS.map((r) => [r.name, r.depts]));

/** 시군구 이름은 소속끼리 겹치므로(서구·중구 등) 전체 필터용 순서는 첫 등장 순서로 정한다. */
export const DEPT_NAMES = [...new Set(ORG.REGIONS.flatMap((r) => r.depts))];

const UNKNOWN = Number.MAX_SAFE_INTEGER;

const regionRankByText = new Map();
ORG.REGIONS.forEach((r, rank) => {
  for (const key of [r.name, ...(r.aliases || [])]) regionRankByText.set(key, rank);
});

const deptRankByRegion = new Map(
  ORG.REGIONS.map((r) => [r.name, new Map(r.depts.map((d, i) => [d, i]))])
);
const globalDeptRank = new Map(DEPT_NAMES.map((d, i) => [d, i]));
const positionRank = new Map(ORG.POSITIONS.map((p, i) => [p, i]));

function clean(value) {
  return String(value || "").trim();
}

/** 정확히 일치하는 이름을 먼저 찾고, 없으면 부분 일치로 넘어간다. */
function rankOf(value, exact) {
  const text = clean(value);
  if (!text) return UNKNOWN;
  if (exact.has(text)) return exact.get(text);
  let best = UNKNOWN;
  for (const [key, rank] of exact) {
    if (rank < best && text.includes(key)) best = rank;
  }
  return best;
}

export function regionRank(value) {
  return rankOf(value, regionRankByText);
}

export function deptRank(region, dept) {
  const scoped = deptRankByRegion.get(clean(region));
  if (scoped) {
    const hit = scoped.get(clean(dept));
    if (hit != null) return hit;
  }
  const global = globalDeptRank.get(clean(dept));
  return global != null ? global : UNKNOWN;
}

export function positionRankOf(value) {
  return rankOf(value, positionRank);
}
