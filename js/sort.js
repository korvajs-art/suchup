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

    // 같은 자리 안에서는 업로드한 명부의 행 순서를 따른다. 명부에 없으면 뒤로 보낸다.
    const orderA = a.sortOrder > 0 ? a.sortOrder : Infinity;
    const orderB = b.sortOrder > 0 ? b.sortOrder : Infinity;
    if (orderA !== orderB) return orderA - orderB;

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

  // 시군구 이름은 소속끼리 겹치므로(서구·중구 등) 소속을 알면 그 안의 순서를 쓴다.
  function uniqueSortedDepts(values, region = "") {
    return uniqueSortedBy(values, (d) => deptRank(region, d));
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
