(() => {
  const VACANT = "공석";
  const SEARCH_DELAY = 140;

  // 이름·직위·시군구·연락처는 줄에 이미 보이므로 상세에서는 빼고 나머지만 보여 준다.
  // 임관과 기수는 반드시 두 줄로 나눈다. 명부에 "육사30"처럼 붙어 있으면 여기서 푼다.
  const DETAIL_FIELDS = [
    ["선임일", "appointDate"],
    ["생년월일", "birthDate"],
    ["군별", "militaryBranch"],
    ["계급", "militaryRank"],
    ["임관", "commission"],
    ["기수", "classNo"],
    ["임관구분", "commissionType"],
    ["주소", "address"],
    ["이메일", "email"],
  ];

  let CONTACTS = [];
  const openIds = new Set();
  const filters = { query: "", region: "", dept: "", position: "", hideVacant: false };

  const els = {
    searchInput: document.getElementById("searchInput"),
    searchClear: document.getElementById("searchClear"),
    filterBtn: document.getElementById("filterBtn"),
    filterBadge: document.getElementById("filterBadge"),
    filterSheet: document.getElementById("filterSheet"),
    filterReset: document.getElementById("filterReset"),
    filterApply: document.getElementById("filterApply"),
    regionChips: document.getElementById("regionChips"),
    positionChips: document.getElementById("positionChips"),
    deptFilter: document.getElementById("deptFilter"),
    hideVacant: document.getElementById("hideVacant"),
    contactList: document.getElementById("contactList"),
    resultCount: document.getElementById("resultCount"),
    emptyState: document.getElementById("emptyState"),
    loadingState: document.getElementById("loadingState"),
    errorState: document.getElementById("errorState"),
    retryBtn: document.getElementById("retryBtn"),
    menuBtn: document.getElementById("menuBtn"),
    drawer: document.getElementById("drawer"),
    drawerBackdrop: document.getElementById("drawerBackdrop"),
  };

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function phoneDigits(phone) {
    return String(phone || "").replace(/\D/g, "");
  }

  // 번호가 비어 있어도 사람은 사람이다. 공석은 이름으로만 판단한다.
  function isVacant(contact) {
    return String(contact.name || "").trim() === VACANT;
  }

  function findContact(id) {
    return CONTACTS.find((c) => String(c.id) === String(id));
  }

  /* ── 아이콘 ─────────────────────────────────────────── */
  const ICON = {
    phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.8.7A2 2 0 0 1 22 16.9z"/></svg>`,
    sms: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.5 9.5 0 0 1-3-.5L3 21l1.5-4a8.4 8.4 0 0 1-.5-3 8.4 8.4 0 0 1 9-8.5 8.4 8.4 0 0 1 8 6z"/></svg>`,
    card: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 17a3.4 3.4 0 0 1 6.4 0M15 9h4M15 13h4"/></svg>`,
    caret: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`,
  };

  /* ── 필터 ───────────────────────────────────────────── */
  function regionsInData() {
    return SuchupSort.uniqueSortedRegions(CONTACTS.map((c) => c.region));
  }

  function deptsForRegion(region) {
    const pool = region ? CONTACTS.filter((c) => c.region === region) : CONTACTS;
    return SuchupSort.uniqueSortedDepts(pool.map((c) => c.dept), region);
  }

  function buildRegionChips() {
    const counts = new Map();
    CONTACTS.forEach((c) => counts.set(c.region, (counts.get(c.region) || 0) + 1));
    const chips = [
      `<button type="button" class="chip" data-region="" aria-pressed="${filters.region === ""}">전체<span class="chip__count">${CONTACTS.length}</span></button>`,
      ...regionsInData().map((r) => {
        const on = filters.region === r;
        return `<button type="button" class="chip" data-region="${escapeHtml(r)}" aria-pressed="${on}">${escapeHtml(r)}<span class="chip__count">${counts.get(r) || 0}</span></button>`;
      }),
    ];
    els.regionChips.innerHTML = chips.join("");
  }

  function buildPositionChips() {
    const list = SuchupSort.uniqueSortedPositions(CONTACTS.map((c) => c.position));
    els.positionChips.innerHTML = [
      `<button type="button" class="chip" data-position="" aria-pressed="${filters.position === ""}">전체</button>`,
      ...list.map(
        (p) =>
          `<button type="button" class="chip" data-position="${escapeHtml(p)}" aria-pressed="${filters.position === p}">${escapeHtml(p)}</button>`
      ),
    ].join("");
  }

  // 시군구는 281개라 전체를 한 번에 보여주면 고를 수 없다. 고른 소속 안으로 좁힌다.
  function buildDeptOptions() {
    const list = deptsForRegion(filters.region);
    if (!list.includes(filters.dept)) filters.dept = "";
    const label = filters.region ? `${filters.region} 전체` : "전체";
    els.deptFilter.innerHTML = [
      `<option value="">${escapeHtml(label)}</option>`,
      ...list.map((d) => `<option value="${escapeHtml(d)}"${d === filters.dept ? " selected" : ""}>${escapeHtml(d)}</option>`),
    ].join("");
  }

  function activeFilterCount() {
    return [filters.region, filters.dept, filters.position].filter(Boolean).length + (filters.hideVacant ? 1 : 0);
  }

  function syncFilterBadge() {
    const n = activeFilterCount();
    els.filterBadge.hidden = n === 0;
    els.filterBadge.textContent = String(n);
    els.filterBtn.classList.toggle("is-active", n > 0);
  }

  function getFiltered() {
    const q = filters.query.trim().toLowerCase();
    const matched = CONTACTS.filter((c) => {
      if (filters.region && c.region !== filters.region) return false;
      if (filters.dept && c.dept !== filters.dept) return false;
      if (filters.position && c.position !== filters.position) return false;
      if (filters.hideVacant && isVacant(c)) return false;
      if (!q) return true;
      return c._haystack.includes(q);
    });
    return SuchupSort.sortContacts(matched);
  }

  /* ── 렌더 ───────────────────────────────────────────── */
  function toneOf(region) {
    const idx = SuchupOrg.REGION_NAMES.indexOf(region);
    return (idx < 0 ? 0 : idx) % 8;
  }

  function rowHtml(contact) {
    const vacant = isVacant(contact);
    const digits = phoneDigits(contact.phone);
    const initial = vacant ? "—" : String(contact.name || "?").trim().charAt(0);
    const open = openIds.has(String(contact.id));

    // 어느 시·구 회장인지 한눈에 보이도록 시군구와 직위를 한 줄로 묶는다.
    const placeRole = [contact.dept, contact.position].filter(Boolean).join(" · ");

    const phoneLine = vacant
      ? `<span class="row__vacant-tag">${VACANT}</span>`
      : digits
        ? `<span class="row__phone">${escapeHtml(contact.phone)}</span>`
        : `<span class="row__phone row__phone--none">번호 없음</span>`;

    // 아이콘만 두지 않고 「전화」 글자를 붙여 나이가 드신 분도 바로 누를 수 있게 한다.
    const call = digits
      ? `<a class="row__call" href="tel:${digits}" aria-label="${escapeHtml(contact.name)} 전화걸기">${ICON.phone}<span>전화</span></a>`
      : `<span class="row__call row__call--off" aria-hidden="true"></span>`;

    return `<li class="row${vacant ? " row--vacant" : ""}${open ? " is-open" : ""}" data-id="${escapeHtml(contact.id)}">
      <div class="row__top">
        <button type="button" class="row__main" aria-expanded="${open}">
          <span class="row__avatar" data-tone="${toneOf(contact.region)}" aria-hidden="true">${escapeHtml(initial)}</span>
          <span class="row__body">
            <span class="row__line"><span class="row__name">${escapeHtml(contact.name)}</span></span>
            <span class="row__line"><span class="row__role">${escapeHtml(placeRole || (vacant ? VACANT : ""))}</span></span>
            <span class="row__line">${phoneLine}</span>
          </span>
          <span class="row__caret" aria-hidden="true">${ICON.caret}</span>
        </button>
        ${call}
      </div>
      <div class="row__panel"${open ? "" : " hidden"}></div>
    </li>`;
  }

  // "육사30" · "3사12"처럼 끝에 숫자만 붙은 값은 임관/기수로 나눈다.
  function splitCommission(contact) {
    const rawComm = String(contact.commission || "").trim();
    const rawClass = String(contact.classNo || "").trim();
    if (rawClass || !rawComm) return { commission: rawComm, classNo: rawClass };
    const m = rawComm.match(/^(.+?)(\d+)$/);
    if (!m) return { commission: rawComm, classNo: "" };
    return { commission: m[1].trim(), classNo: m[2] };
  }

  function detailHtml(contact) {
    const split = splitCommission(contact);
    const view = { ...contact, commission: split.commission, classNo: split.classNo };

    const rows = DETAIL_FIELDS.map(([label, key]) => {
      const value = view[key];
      if (!value) return "";
      return `<div class="detail-row"><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`;
    }).join("");

    const body = rows
      ? `<dl class="detail-grid">${rows}</dl>`
      : `<p class="detail-empty">등록된 추가 정보가 없습니다.</p>`;

    const digits = phoneDigits(contact.phone);
    const actions = digits
      ? `<div class="row__actions">
          <a class="row-action" href="tel:${digits}">${ICON.phone}전화</a>
          <a class="row-action" href="sms:${digits}">${ICON.sms}문자</a>
          <button type="button" class="row-action" data-save>${ICON.card}저장</button>
        </div>`
      : "";

    return body + actions + remarkHtml(contact);
  }

  function remarkHtml(contact) {
    const text = (contact.remark || "").trim();
    const view = text
      ? `<p class="remark__text">${escapeHtml(text)}</p>`
      : `<p class="remark__empty">등록된 비고가 없습니다.</p>`;

    return `<div class="remark" data-remark>
      <div class="remark__head">
        <strong>비고</strong>
        <button type="button" class="remark__edit" data-remark-edit>작성</button>
      </div>
      <div data-remark-view>${view}</div>
      <form class="remark__form" data-remark-form hidden>
        <textarea rows="3" maxlength="1000" placeholder="인물 특징, 특이사항, 메모 등" data-remark-input>${escapeHtml(text)}</textarea>
        <div class="remark__actions">
          <button type="button" class="ghost-btn" data-remark-cancel>취소</button>
          <button type="submit" class="primary-btn">저장</button>
        </div>
        <p class="form-error" data-remark-error hidden></p>
      </form>
    </div>`;
  }

  // 소속으로 묶어 스티키 머리글을 만든다. 정렬이 이미 소속 순서라 이어서 끊기만 하면 된다.
  function groupByRegion(list) {
    const groups = [];
    for (const contact of list) {
      const last = groups[groups.length - 1];
      if (last && last.region === contact.region) last.items.push(contact);
      else groups.push({ region: contact.region || "기타", items: [contact] });
    }
    return groups;
  }

  function render() {
    const filtered = getFiltered();
    const groups = groupByRegion(filtered);

    els.resultCount.hidden = false;
    els.resultCount.textContent =
      filtered.length === CONTACTS.length
        ? `총 ${CONTACTS.length}명`
        : `${filtered.length}명 · 전체 ${CONTACTS.length}명`;

    els.contactList.innerHTML = groups
      .map(
        (g) => `<section class="group">
          <h2 class="group__head"><span>${escapeHtml(g.region)}</span><span class="group__count">${g.items.length}명</span></h2>
          <ul class="rows">${g.items.map(rowHtml).join("")}</ul>
        </section>`
      )
      .join("");

    // 펼쳐 둔 줄은 상세를 다시 채워 준다.
    els.contactList.querySelectorAll(".row.is-open").forEach((li) => {
      const contact = findContact(li.dataset.id);
      if (contact) li.querySelector(".row__panel").innerHTML = detailHtml(contact);
    });

    els.contactList.hidden = filtered.length === 0;
    els.emptyState.hidden = filtered.length > 0;
  }

  function setUiMode(mode) {
    els.loadingState.hidden = mode !== "loading";
    els.errorState.hidden = mode !== "error";
    if (mode !== "ready") {
      els.contactList.hidden = true;
      els.resultCount.hidden = true;
      els.emptyState.hidden = true;
    }
  }

  /* ── 동작 ───────────────────────────────────────────── */
  function toggleRow(li) {
    const id = li.dataset.id;
    const contact = findContact(id);
    if (!contact) return;
    const panel = li.querySelector(".row__panel");
    const opening = !li.classList.contains("is-open");

    if (opening) {
      if (!panel.innerHTML) panel.innerHTML = detailHtml(contact);
      panel.hidden = false;
      openIds.add(String(id));
    } else {
      panel.hidden = true;
      openIds.delete(String(id));
    }
    li.classList.toggle("is-open", opening);
    li.querySelector(".row__main").setAttribute("aria-expanded", String(opening));
  }

  function buildVCard(contact) {
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${contact.name}`,
      `N:${contact.name};;;;`,
      `TEL;TYPE=CELL:${contact.phone || ""}`,
      `ORG:${[contact.region, contact.dept].filter(Boolean).join(" ")}`,
      `TITLE:${contact.position || ""}`,
    ];
    if (contact.email) lines.push(`EMAIL:${contact.email}`);
    if (contact.address) lines.push(`ADR;TYPE=WORK:;;${contact.address};;;;`);
    if (contact.remark) lines.push(`NOTE:${contact.remark}`);
    lines.push("END:VCARD");
    return lines.join("\r\n");
  }

  function downloadVCard(contact) {
    const blob = new Blob([buildVCard(contact)], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${contact.name || "contact"}.vcf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function setDrawerOpen(open) {
    els.drawer.classList.toggle("is-open", open);
    els.drawer.setAttribute("aria-hidden", String(!open));
    els.menuBtn.setAttribute("aria-expanded", String(open));
    els.drawerBackdrop.hidden = !open;
  }

  function setSheetOpen(open) {
    els.filterSheet.hidden = !open;
    if (open) els.filterSheet.querySelector(".sheet__panel").focus?.();
  }

  /* ── 데이터 ─────────────────────────────────────────── */
  async function loadContacts() {
    setUiMode("loading");
    try {
      const res = await fetch("/api/contacts", { credentials: "same-origin" });
      if (res.status === 401) {
        location.replace("login.html");
        return;
      }
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      CONTACTS = (Array.isArray(data.contacts) ? data.contacts : []).map(withHaystack);
      buildRegionChips();
      buildPositionChips();
      buildDeptOptions();
      syncFilterBadge();
      setUiMode("ready");
      render();
    } catch (err) {
      console.error(err);
      setUiMode("error");
    }
  }

  // 검색어를 칠 때마다 13개 필드를 다시 이어 붙이지 않도록 한 번만 만들어 둔다.
  function withHaystack(contact) {
    contact._haystack = [
      contact.name,
      contact.region,
      contact.dept,
      contact.position,
      contact.phone,
      phoneDigits(contact.phone),
      contact.email,
      contact.address,
      contact.militaryBranch,
      contact.militaryRank,
      contact.commission,
      contact.commissionType,
      contact.classNo,
      contact.remark,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return contact;
  }

  async function ensureAuth() {
    try {
      const me = await SuchupAuth.me();
      if (!me.authenticated) {
        location.replace("login.html");
        return false;
      }
      const isAdmin = me.admin?.role === "admin";
      const adminLink = document.getElementById("adminLink");
      if (adminLink) adminLink.hidden = !isAdmin;
      const nameEl = document.getElementById("drawerUserName");
      const roleEl = document.getElementById("drawerUserRole");
      if (nameEl) nameEl.textContent = me.admin?.username || "사용자";
      if (roleEl) roleEl.textContent = isAdmin ? "관리자" : "일반 사용자";
      return true;
    } catch {
      location.replace("login.html");
      return false;
    }
  }

  /* ── 이벤트 ─────────────────────────────────────────── */
  function bindEvents() {
    let searchTimer = 0;
    els.searchInput.addEventListener("input", () => {
      filters.query = els.searchInput.value;
      els.searchClear.hidden = !filters.query;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(render, SEARCH_DELAY);
    });

    els.searchClear.addEventListener("click", () => {
      els.searchInput.value = "";
      filters.query = "";
      els.searchClear.hidden = true;
      els.searchInput.focus();
      render();
    });

    els.regionChips.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-region]");
      if (!chip) return;
      filters.region = chip.dataset.region;
      filters.dept = "";
      buildRegionChips();
      buildDeptOptions();
      syncFilterBadge();
      openIds.clear();
      render();
      els.contactList.parentElement.scrollTop = 0;
    });

    els.positionChips.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-position]");
      if (!chip) return;
      filters.position = chip.dataset.position;
      buildPositionChips();
      syncFilterBadge();
      render();
    });

    els.deptFilter.addEventListener("change", () => {
      filters.dept = els.deptFilter.value;
      syncFilterBadge();
      render();
    });

    els.hideVacant.addEventListener("change", () => {
      filters.hideVacant = els.hideVacant.checked;
      syncFilterBadge();
      render();
    });

    els.filterBtn.addEventListener("click", () => setSheetOpen(true));
    els.filterApply.addEventListener("click", () => setSheetOpen(false));
    els.filterSheet.addEventListener("click", (e) => {
      if (e.target.closest("[data-sheet-close]")) setSheetOpen(false);
    });

    els.filterReset.addEventListener("click", () => {
      filters.region = "";
      filters.dept = "";
      filters.position = "";
      filters.hideVacant = false;
      els.hideVacant.checked = false;
      buildRegionChips();
      buildPositionChips();
      buildDeptOptions();
      syncFilterBadge();
      render();
    });

    els.contactList.addEventListener("click", (e) => {
      const li = e.target.closest(".row");
      if (!li) return;

      if (e.target.closest("[data-save]")) {
        const contact = findContact(li.dataset.id);
        if (contact) downloadVCard(contact);
        return;
      }

      if (e.target.closest("[data-remark-edit]")) {
        const wrap = e.target.closest("[data-remark]");
        wrap.querySelector("[data-remark-view]").hidden = true;
        wrap.querySelector("[data-remark-form]").hidden = false;
        wrap.querySelector("[data-remark-edit]").hidden = true;
        wrap.querySelector("[data-remark-input]").focus();
        return;
      }

      if (e.target.closest("[data-remark-cancel]")) {
        const wrap = e.target.closest("[data-remark]");
        const contact = findContact(li.dataset.id);
        wrap.querySelector("[data-remark-input]").value = contact?.remark || "";
        wrap.querySelector("[data-remark-form]").hidden = true;
        wrap.querySelector("[data-remark-view]").hidden = false;
        wrap.querySelector("[data-remark-edit]").hidden = false;
        return;
      }

      if (e.target.closest(".row__call") || e.target.closest(".row-action")) return;
      if (e.target.closest(".row__main")) toggleRow(li);
    });

    els.contactList.addEventListener("submit", async (e) => {
      const form = e.target.closest("[data-remark-form]");
      if (!form) return;
      e.preventDefault();
      const li = form.closest(".row");
      const id = li?.dataset.id;
      if (!id) return;

      const input = form.querySelector("[data-remark-input]");
      const err = form.querySelector("[data-remark-error]");
      err.hidden = true;

      try {
        const data = await SuchupAuth.api(`/api/contacts/${encodeURIComponent(id)}/remark`, {
          method: "PUT",
          body: JSON.stringify({ remark: (input.value || "").trim() }),
        });
        const idx = CONTACTS.findIndex((c) => String(c.id) === String(id));
        if (idx >= 0 && data.contact) CONTACTS[idx] = withHaystack(data.contact);
        // 목록 전체를 다시 그리지 않고 펼쳐진 상세만 갈아 끼운다.
        li.querySelector(".row__panel").innerHTML = detailHtml(CONTACTS[idx]);
      } catch (ex) {
        err.hidden = false;
        err.textContent = ex.message || "비고 저장에 실패했습니다.";
      }
    });

    els.menuBtn.addEventListener("click", () => setDrawerOpen(!els.drawer.classList.contains("is-open")));
    els.drawerBackdrop.addEventListener("click", () => setDrawerOpen(false));
    els.retryBtn.addEventListener("click", loadContacts);

    document.getElementById("logoutBtn").addEventListener("click", async () => {
      try {
        await SuchupAuth.logout();
      } finally {
        location.href = "login.html";
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!els.filterSheet.hidden) setSheetOpen(false);
      else setDrawerOpen(false);
    });
  }

  bindEvents();
  ensureAuth().then((ok) => {
    if (ok) loadContacts();
  });
})();
