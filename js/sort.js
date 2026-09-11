window.SuchupSort = (() => {
  const { regionRank, deptRank, positionRankOf } = SuchupOrg;

  function compareContacts(a, b) {
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

  function sortContacts(list) {
    return [...list].sort(compareContacts);
  }

  function uniqueSortedBy(values, rank) {
    return [...new Set(values.filter(Boolean))].sort((a, b) => {
      const d = rank(a) - rank(b);
      return d !== 0 ? d : a.localeCompare(b, "ko");
    });
  }

  function uniqueSortedRegions(values) {
    return uniqueSortedBy(values, regionRank);
  }

  // 필터 목록은 소속 구분 없이 모이므로 전체 기준 순서를 쓴다.
  function uniqueSortedDepts(values) {
    return uniqueSortedBy(values, (d) => deptRank("", d));
  }

  function uniqueSortedPositions(values) {
    return uniqueSortedBy(values, positionRankOf);
  }

  return {
    sortContacts,
    compareContacts,
    uniqueSortedRegions,
    uniqueSortedDepts,
    uniqueSortedPositions,
  };
})();
