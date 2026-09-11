(() => {
  const DEFAULT_AVATAR = "assets/avatar-default.svg";
  const L = {
    region: "\uC9C0\uC5ED",
    dept: "\uD68C/\uBD80\uC11C\uAC80\uC0C9",
    position: "\uC9C1\uC704\uAC80\uC0C9",
    countPrefix: "\uCD1D ",
    countSuffix: "\uBA85",
    call: "\uC804\uD654\uAC78\uAE30",
    sms: "\uBB38\uC790\uC804\uC1A1",
    save: "\uC5F0\uB77D\uCC98 \uC800\uC7A5",
    noDetail: "\uCD94\uAC00 \uC815\uBCF4 \uC5C6\uC74C",
    deptLabel: "\uC18C\uC18D",
    appoint: "\uC120\uC784\uC77C",
    birth: "\uC0DD\uB144\uC6D4\uC77C",
    branch: "\uAD70\uBCC4",
    rank: "\uACC4\uAE09",
    commission: "\uC784\uAD00/\uAE30\uC218",
    commissionType: "\uC784\uAD00\uAD6C\uBD84",
    classNo: "\uAE30\uC218",
    address: "\uC8FC\uC18C",
    remark: "\uBE44\uACE0",
    email: "\uC774\uBA54\uC77C",
  };

  let CONTACTS = [];

  const els = {
    searchInput: document.getElementById("searchInput"),
    regionFilter: document.getElementById("regionFilter"),
    deptFilter: document.getElementById("deptFilter"),
    positionFilter: document.getElementById("positionFilter"),
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

  function fillSelect(select, values, placeholder) {
    const options = [
      `<option value="">${placeholder}</option>`,
      ...values.map((v) => `<option value="${escapeAttr(v)}">${escapeHtml(v)}</option>`),
    ];
    select.innerHTML = options.join("");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }

  function phoneDigits(phone) {
    return String(phone || "").replace(/\D/g, "");
  }

  function setUiMode(mode) {
    const loading = mode === "loading";
    const errored = mode === "error";
    const ready = mode === "ready";
    if (els.loadingState) els.loadingState.hidden = !loading;
    if (els.errorState) els.errorState.hidden = !errored;
    els.contactList.hidden = !ready;
    els.resultCount.hidden = !ready;
    if (!ready) els.emptyState.hidden = true;
  }

  function initFilters() {
    fillSelect(
      els.regionFilter,
      SuchupSort.uniqueSortedRegions(CONTACTS.map((c) => c.region)),
      L.region
    );
    fillSelect(els.deptFilter, SuchupSort.uniqueSortedDepts(CONTACTS.map((c) => c.dept)), L.dept);
    fillSelect(
      els.positionFilter,
      SuchupSort.uniqueSortedPositions(CONTACTS.map((c) => c.position)),
      L.position
    );
  }

  function getFilteredContacts() {
    const query = els.searchInput.value.trim().toLowerCase();
    const region = els.regionFilter.value;
    const dept = els.deptFilter.value;
    const position = els.positionFilter.value;

    const filtered = CONTACTS.filter((c) => {
      if (region && c.region !== region) return false;
      if (dept && c.dept !== dept) return false;
      if (position && c.position !== position) return false;
      if (!query) return true;
      const haystack = [
        c.name,
        c.region,
        c.dept,
        c.position,
        c.phone,
        c.email,
        c.address,
        c.appointDate,
        c.birthDate,
        c.militaryBranch,
        c.militaryRank,
        c.commission,
        c.commissionType,
        c.classNo,
        c.remark,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
    return SuchupSort.sortContacts(filtered);
  }

  function iconPhone() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/></svg>`;
  }

  function iconMail() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>`;
  }

  function iconContact() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><circle cx="12" cy="12" r="2.5"/><path d="M8.5 18a3.5 3.5 0 0 1 7 0"/></svg>`;
  }

  function detailLine(label, value) {
    if (!value) return "";
    return `<p><strong>${escapeHtml(label)}</strong> ${escapeHtml(value)}</p>`;
  }

  function remarkBlock(contact) {
    const text = (contact.remark || "").trim();
    const body = text
      ? `<p class="contact-remark__text">${escapeHtml(text)}</p>`
      : `<p class="contact-remark__empty">\uB4F1\uB85D\uB41C \uBE44\uACE0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.</p>`;
    return `
      <div class="contact-remark" data-remark-wrap="${escapeAttr(contact.id)}">
        <div class="contact-remark__head">
          <strong>\uBE44\uACE0</strong>
          <button type="button" class="contact-remark__edit" data-remark-edit="${escapeAttr(contact.id)}">\uC791\uC131</button>
        </div>
        <div class="contact-remark__view" data-remark-view>${body}</div>
        <form class="contact-remark__form" data-remark-form hidden>
          <textarea rows="3" maxlength="1000" placeholder="\uC778\uBB3C \uD2B9\uC9D5, \uD2B9\uC774\uC0AC\uD56D, \uBA54\uBAA8 \uB4F1" data-remark-input>${escapeHtml(text)}</textarea>
          <div class="contact-remark__actions">
            <button type="button" class="ghost-btn" data-remark-cancel>\uCDE8\uC18C</button>
            <button type="submit" class="primary-btn">\uC800\uC7A5</button>
          </div>
          <p class="form-error" data-remark-error hidden></p>
        </form>
      </div>`;
  }

  function renderContactCard(contact) {
    const avatar = contact.avatar || DEFAULT_AVATAR;
    const title = `${contact.name} ${contact.dept || ""}`.trim();
    const digits = phoneDigits(contact.phone);
    const details = [
      detailLine(L.deptLabel, contact.dept),
      detailLine(L.appoint, contact.appointDate),
      detailLine(L.birth, contact.birthDate),
      detailLine(L.branch, contact.militaryBranch),
      detailLine(L.rank, contact.militaryRank),
      detailLine(L.commission, contact.commission),
      detailLine(L.commissionType, contact.commissionType),
      detailLine(L.classNo, contact.classNo),
      detailLine(L.address, contact.address),
      detailLine(L.email, contact.email),
    ].filter(Boolean);
    if (!details.length) details.push(`<p>${escapeHtml(L.noDetail)}</p>`);

    return `
      <article class="contact-card" data-id="${escapeAttr(contact.id)}">
        <button type="button" class="contact-card__main" aria-expanded="false">
          <img class="contact-card__avatar" src="${escapeAttr(avatar)}" alt="" width="56" height="56" />
          <div class="contact-card__info">
            <h2 class="contact-card__title">${escapeHtml(title)}</h2>
            <p class="contact-card__position">${escapeHtml(contact.position || "")}</p>
            <p class="contact-card__phone">${escapeHtml(contact.phone || "")}</p>
          </div>
          <span class="contact-card__toggle" aria-hidden="true"></span>
        </button>
        <div class="contact-card__details">
          <div class="contact-card__details-inner">
            ${details.join("")}
            ${remarkBlock(contact)}
          </div>
        </div>
        <div class="contact-card__actions">
          <a class="action-btn" href="tel:${digits}">${iconPhone()}<span>${escapeHtml(L.call)}</span></a>
          <a class="action-btn" href="sms:${digits}">${iconMail()}<span>${escapeHtml(L.sms)}</span></a>
          <button type="button" class="action-btn" data-save="${escapeAttr(contact.id)}">${iconContact()}<span>${escapeHtml(L.save)}</span></button>
        </div>
      </article>
    `;
  }

  function render() {
    const filtered = getFilteredContacts();
    els.resultCount.textContent = `${L.countPrefix}${filtered.length}${L.countSuffix}`;
    els.contactList.innerHTML = filtered.map(renderContactCard).join("");
    els.emptyState.hidden = filtered.length > 0;
  }

  function findContact(id) {
    return CONTACTS.find((c) => String(c.id) === String(id));
  }

  function buildVCard(contact) {
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${contact.name}`,
      `N:${contact.name};;;;`,
      `TEL;TYPE=CELL:${contact.phone || ""}`,
      `ORG:${contact.dept || ""}`,
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
    document.body.style.overflow = open ? "hidden" : "";
  }

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
      CONTACTS = Array.isArray(data.contacts) ? data.contacts : [];
      initFilters();
      setUiMode("ready");
      render();
    } catch (err) {
      console.error(err);
      setUiMode("error");
    }
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
      if (adminLink) {
        adminLink.hidden = !isAdmin;
        adminLink.setAttribute("aria-hidden", String(!isAdmin));
      }
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

  function bindEvents() {
    ["input", "change"].forEach((evt) => els.searchInput.addEventListener(evt, render));
    els.regionFilter.addEventListener("change", render);
    els.deptFilter.addEventListener("change", render);
    els.positionFilter.addEventListener("change", render);

    els.contactList.addEventListener("click", (e) => {
      const saveBtn = e.target.closest("[data-save]");
      if (saveBtn) {
        e.preventDefault();
        const contact = findContact(saveBtn.getAttribute("data-save"));
        if (contact) downloadVCard(contact);
        return;
      }

      const editBtn = e.target.closest("[data-remark-edit]");
      if (editBtn) {
        e.preventDefault();
        e.stopPropagation();
        const wrap = editBtn.closest("[data-remark-wrap]");
        if (!wrap) return;
        wrap.querySelector("[data-remark-view]").hidden = true;
        wrap.querySelector("[data-remark-form]").hidden = false;
        editBtn.hidden = true;
        const input = wrap.querySelector("[data-remark-input]");
        if (input) input.focus();
        return;
      }

      const cancelBtn = e.target.closest("[data-remark-cancel]");
      if (cancelBtn) {
        e.preventDefault();
        e.stopPropagation();
        const wrap = cancelBtn.closest("[data-remark-wrap]");
        if (!wrap) return;
        const id = wrap.getAttribute("data-remark-wrap");
        const contact = findContact(id);
        const input = wrap.querySelector("[data-remark-input]");
        if (input) input.value = contact?.remark || "";
        wrap.querySelector("[data-remark-form]").hidden = true;
        wrap.querySelector("[data-remark-view]").hidden = false;
        const edit = wrap.querySelector("[data-remark-edit]");
        if (edit) edit.hidden = false;
        const err = wrap.querySelector("[data-remark-error]");
        if (err) {
          err.hidden = true;
          err.textContent = "";
        }
        return;
      }

      const main = e.target.closest(".contact-card__main");
      if (!main) return;
      if (e.target.closest(".contact-remark")) return;
      const card = main.closest(".contact-card");
      const expanded = card.classList.toggle("is-expanded");
      main.setAttribute("aria-expanded", String(expanded));
    });

    els.contactList.addEventListener("submit", async (e) => {
      const form = e.target.closest("[data-remark-form]");
      if (!form) return;
      e.preventDefault();
      e.stopPropagation();
      const wrap = form.closest("[data-remark-wrap]");
      const id = wrap?.getAttribute("data-remark-wrap");
      if (!id) return;
      const input = form.querySelector("[data-remark-input]");
      const err = form.querySelector("[data-remark-error]");
      const remark = (input?.value || "").trim();
      if (err) {
        err.hidden = true;
        err.textContent = "";
      }
      try {
        const data = await SuchupAuth.api("/api/contacts/" + encodeURIComponent(id) + "/remark", {
          method: "PUT",
          body: JSON.stringify({ remark }),
        });
        const idx = CONTACTS.findIndex((c) => String(c.id) === String(id));
        if (idx >= 0 && data.contact) CONTACTS[idx] = data.contact;
        render();
        const card = els.contactList.querySelector(`.contact-card[data-id="${CSS.escape(String(id))}"]`);
        if (card) {
          card.classList.add("is-expanded");
          const main = card.querySelector(".contact-card__main");
          if (main) main.setAttribute("aria-expanded", "true");
        }
      } catch (ex) {
        if (err) {
          err.hidden = false;
          err.textContent = ex.message || "\uBE44\uACE0 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.";
        }
      }
    });

    els.menuBtn.addEventListener("click", () => {
      setDrawerOpen(!els.drawer.classList.contains("is-open"));
    });
    els.drawerBackdrop.addEventListener("click", () => setDrawerOpen(false));
    if (els.retryBtn) els.retryBtn.addEventListener("click", loadContacts);

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          await SuchupAuth.logout();
        } finally {
          location.href = "login.html";
        }
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setDrawerOpen(false);
    });
  }

  bindEvents();
  ensureAuth().then((ok) => {
    if (ok) loadContacts();
  });
})();
