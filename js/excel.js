(() => {
  // 대의원 명부와 같은 순서. 소속(시·도회)과 시군구를 따로 받는다.
  const HEADERS = [
    "\uC18C\uC18D",
    "\uC2DC\uAD70\uAD6C",
    "\uC9C1\uC704",
    "\uC131\uBA85",
    "\uC5F0\uB77D\uCC98",
    "\uAD70\uBCC4",
    "\uACC4\uAE09",
    "\uC784\uAD00/\uAE30\uC218",
    "\uC784\uAD00\uAD6C\uBD84",
    "\uAE30\uC218",
    "\uC120\uC784\uC77C",
    "\uC0DD\uB144\uC6D4\uC77C",
    "\uC8FC\uC18C",
    "\uC774\uBA54\uC77C",
    "\uBE44\uACE0",
  ];

  function normalizeHeader(raw) {
    return String(raw || "")
      .replace(/\s+/g, "")
      .replace(/\u00A0/g, "")
      .trim();
  }

  function looksLikeFormula(v) {
    const s = String(v || "").trim().replace(/^'/, "");
    if (!s) return false;
    if (s.startsWith("=") || s.startsWith("--")) return true;
    const u = s.toUpperCase();
    return (
      u.includes("MID(") ||
      u.includes("FIND(") ||
      u.includes("LEN(") ||
      u.includes("LEFT(") ||
      u.includes("RIGHT(") ||
      u.includes("IF(") ||
      u.includes("TEXT(") ||
      u.includes("CONCATENATE(") ||
      u.includes("SUBSTITUTE(")
    );
  }

  function cleanCell(v) {
    let s = String(v == null ? "" : v).trim();
    if (s.startsWith("'")) s = s.slice(1).trim();
    if (looksLikeFormula(s)) return "";
    return s;
  }

  function cellFromRow(row, idx) {
    if (idx == null || idx < 0) return "";
    return cleanCell(row[idx]);
  }

  function firstFromMap(row, map, keys) {
    for (const key of keys) {
      const v = cellFromRow(row, map[normalizeHeader(key)]);
      if (v) return v;
    }
    return "";
  }

  function buildHeaderMap(headerRow) {
    const map = {};
    (headerRow || []).forEach((h, i) => {
      const key = normalizeHeader(h);
      if (key && map[key] == null) map[key] = i;
    });
    return map;
  }

  function mapDataRow(row, map) {
    const region = firstFromMap(row, map, ["\uC18C\uC18D", "\uC9C0\uC5ED", "\uC2DC\uB3C4"]);
    let contact = {
      region,
      // \uC2DC\uAD70\uAD6C \uCE78\uC774 \uC5C6\uB294 \uC591\uC2DD\uC774\uBA74 \uC18C\uC18D\uC744 \uADF8\uB300\uB85C \uC4F4\uB2E4.
      dept: firstFromMap(row, map, ["\uC2DC\uAD70\uAD6C", "\uD68C/\uBD80\uC11C", "\uBD80\uC11C"]) || region,
      name: firstFromMap(row, map, ["\uC131\uBA85", "\uC774\uB984"]),
      position: firstFromMap(row, map, ["\uC9C1\uC704", "\uC9C1\uCC45"]),
      phone: firstFromMap(row, map, ["\uC5F0\uB77D\uCC98", "\uC804\uD654", "\uD578\uB4DC\uD3F0"]),
      appointDate: firstFromMap(row, map, ["\uC120\uC784\uC77C"]),
      birthDate: firstFromMap(row, map, ["\uC0DD\uB144\uC6D4\uC77C"]),
      militaryBranch: firstFromMap(row, map, ["\uAD70\uBCC4", "\uAD70"]),
      militaryRank: firstFromMap(row, map, ["\uACC4\uAE09"]),
      commission: firstFromMap(row, map, ["\uC784\uAD00/\uAE30\uC218", "\uC784\uAD00"]),
      commissionType: firstFromMap(row, map, ["\uC784\uAD00\uAD6C\uBD84"]),
      classNo: firstFromMap(row, map, ["\uAE30\uC218"]),
      address: firstFromMap(row, map, ["\uC8FC\uC18C"]),
      remark: firstFromMap(row, map, ["\uBE44\uACE0"]),
      email: firstFromMap(row, map, ["\uC774\uBA54\uC77C"]),
    };

    if (!contact.name) {
      // 머리글을 못 읽었을 때 쓰는 자리 기준 해석. 대의원 명부 칸 순서를 따른다.
      // 순번, 소속, 구분, 시군구, 직위, 성명, 군, 계급, 임관, 연락처, 비고
      const fallbackRegion = cellFromRow(row, 1);
      contact = {
        region: fallbackRegion,
        dept: cellFromRow(row, 3) || fallbackRegion,
        position: cellFromRow(row, 4),
        name: cellFromRow(row, 5),
        militaryBranch: cellFromRow(row, 6),
        militaryRank: cellFromRow(row, 7),
        commission: cellFromRow(row, 8),
        phone: cellFromRow(row, 9),
        remark: cellFromRow(row, 10),
        appointDate: "",
        birthDate: "",
        commissionType: "",
        classNo: "",
        address: "",
        email: "",
      };
    }
    return contact;
  }

  function parseWorkbook(workbook) {
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
    if (!rows.length) return [];
    const map = buildHeaderMap(rows[0]);
    const contacts = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row.some((c) => String(c || "").trim())) continue;
      // \uD30C\uC77C\uC758 \uD589 \uC21C\uC11C\uAC00 \uC218\uCCA9\uC758 \uC815\uB82C \uC21C\uC11C\uAC00 \uB41C\uB2E4.
      contacts.push({ ...mapDataRow(row, map), sortOrder: contacts.length + 1 });
    }
    return contacts;
  }

  async function parseFile(file) {
    if (typeof XLSX === "undefined") {
      throw new Error("SheetJS not loaded");
    }
    const buf = await file.arrayBuffer();
    const workbook = XLSX.read(buf, { type: "array", cellDates: true });
    return parseWorkbook(workbook);
  }

  function downloadTemplate() {
    if (typeof XLSX === "undefined") {
      throw new Error("SheetJS not loaded");
    }
    const sample = [
      "\uACBD\uB0A8",
      "\uCC3D\uC6D0\uC2DC",
      "\uD68C\uC7A5",
      "\uC815\uC778\uADDC",
      "010-4566-3080",
      "\uC721\uAD70",
      "\uB300\uB839",
      "3\uC0AC12",
      "",
      "",
      "2020-01-01",
      "1960-01-01",
      "\uACBD\uC0C1\uB0A8\uB3C4 \uCC3D\uC6D0\uC2DC",
      "",
      "",
    ];
    const ws = XLSX.utils.aoa_to_sheet([HEADERS, sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "contacts");
    XLSX.writeFile(wb, "contacts-template.xlsx");
  }

  window.SuchupExcel = { parseFile, downloadTemplate, HEADERS };
})();
