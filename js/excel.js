(() => {
  const HEADERS = [
    "\uC18C\uC18D",
    "\uC131\uBA85",
    "\uC9C1\uCC45",
    "\uC5F0\uB77D\uCC98",
    "\uC120\uC784\uC77C",
    "\uC0DD\uB144\uC6D4\uC77C",
    "\uAD70\uBCC4",
    "\uACC4\uAE09",
    "\uC784\uAD00/\uAE30\uC218",
    "\uC784\uAD00\uAD6C\uBD84",
    "\uAE30\uC218",
    "\uC8FC\uC18C",
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
    let contact = {
      dept: firstFromMap(row, map, ["\uC18C\uC18D", "\uD68C/\uBD80\uC11C", "\uBD80\uC11C"]),
      name: firstFromMap(row, map, ["\uC131\uBA85", "\uC774\uB984"]),
      position: firstFromMap(row, map, ["\uC9C1\uCC45", "\uC9C1\uC704"]),
      phone: firstFromMap(row, map, ["\uC5F0\uB77D\uCC98", "\uC804\uD654"]),
      appointDate: firstFromMap(row, map, ["\uC120\uC784\uC77C"]),
      birthDate: firstFromMap(row, map, ["\uC0DD\uB144\uC6D4\uC77C"]),
      militaryBranch: firstFromMap(row, map, ["\uAD70\uBCC4"]),
      militaryRank: firstFromMap(row, map, ["\uACC4\uAE09"]),
      commission: firstFromMap(row, map, ["\uC784\uAD00/\uAE30\uC218", "\uC784\uAD00"]),
      commissionType: firstFromMap(row, map, ["\uC784\uAD00\uAD6C\uBD84"]),
      classNo: firstFromMap(row, map, ["\uAE30\uC218"]),
      address: firstFromMap(row, map, ["\uC8FC\uC18C"]),
      remark: firstFromMap(row, map, ["\uBE44\uACE0"]),
      region: firstFromMap(row, map, ["\uC9C0\uC5ED"]),
      email: firstFromMap(row, map, ["\uC774\uBA54\uC77C"]),
    };

    if (!contact.name) {
      // positional fallback: ignore col0 \uC21C\uBC88
      contact = {
        dept: cellFromRow(row, 2),
        name: cellFromRow(row, 3),
        position: cellFromRow(row, 4),
        phone: cellFromRow(row, 5) || cellFromRow(row, 15),
        appointDate: cellFromRow(row, 6),
        birthDate: cellFromRow(row, 7),
        militaryBranch: cellFromRow(row, 8),
        militaryRank: cellFromRow(row, 9),
        commission: cellFromRow(row, 10),
        commissionType: cellFromRow(row, 11),
        classNo: cellFromRow(row, 12),
        address: cellFromRow(row, 13),
        remark: cellFromRow(row, 14),
        region: "",
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
      contacts.push(mapDataRow(row, map));
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
      "\uACBD\uB0A8\uB3C4\uD68C",
      "\uC815\uC778\uADDC",
      "\uD68C\uC7A5",
      "010-4566-3080",
      "2020-01-01",
      "1960-01-01",
      "\uC721\uAD70",
      "\uB300\uB839",
      "",
      "",
      "",
      "\uACBD\uC0C1\uB0A8\uB3C4 \uCC3D\uC6D0\uC2DC",
      "",
    ];
    const ws = XLSX.utils.aoa_to_sheet([HEADERS, sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "contacts");
    XLSX.writeFile(wb, "contacts-template.xlsx");
  }

  window.SuchupExcel = { parseFile, downloadTemplate, HEADERS };
})();
