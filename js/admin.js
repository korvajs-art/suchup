(() => {
  const els = {
    user: document.getElementById("adminUser"),
    count: document.getElementById("adminCount"),
    loading: document.getElementById("adminLoading"),
    error: document.getElementById("adminError"),
    wrap: document.getElementById("adminTableWrap"),
    body: document.getElementById("adminTableBody"),
    addBtn: document.getElementById("addBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
    modal: document.getElementById("contactModal"),
    form: document.getElementById("contactForm"),
    modalTitle: document.getElementById("modalTitle"),
    formError: document.getElementById("formError"),
    id: document.getElementById("contactId"),
    name: document.getElementById("fName"),
    phone: document.getElementById("fPhone"),
    region: document.getElementById("fRegion"),
    dept: document.getElementById("fDept"),
    position: document.getElementById("fPosition"),
    email: document.getElementById("fEmail"),
    address: document.getElementById("fAddress"),
    appointDate: document.getElementById("fAppointDate"),
    birthDate: document.getElementById("fBirthDate"),
    militaryBranch: document.getElementById("fMilitaryBranch"),
    militaryRank: document.getElementById("fMilitaryRank"),
    commission: document.getElementById("fCommission"),
    commissionType: document.getElementById("fCommissionType"),
    classNo: document.getElementById("fClassNo"),
    remark: document.getElementById("fRemark"),
    excelFile: document.getElementById("excelFile"),
    excelImportBtn: document.getElementById("excelImportBtn"),
    excelTemplateBtn: document.getElementById("excelTemplateBtn"),
    excelMsg: document.getElementById("excelMsg"),
    app: document.getElementById("adminApp"),
    regionOptions: document.getElementById("regionOptions"),
    deptOptions: document.getElementById("deptOptions"),
  };

  let contacts = [];

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fillDatalist(list, values) {
    list.innerHTML = values.map((v) => `<option value="${escapeHtml(v)}"></option>`).join("");
  }

  // 소속을 고르면 그 소속의 시군구만 제안하고, 명부에 없는 값은 뒤에 덧붙인다.
  function refreshOrgOptions() {
    fillDatalist(els.regionOptions, SuchupOrg.REGION_NAMES);
    const scoped = SuchupOrg.DEPTS_BY_REGION.get(els.region.value.trim());
    const base = scoped || SuchupOrg.DEPT_NAMES;
    const known = new Set(base);
    const extra = [...new Set(contacts.map((c) => c.dept).filter((d) => d && !known.has(d)))];
    fillDatalist(els.deptOptions, scoped ? base : [...base, ...extra]);
  }

  function showFormError(msg) {
    els.formError.hidden = !msg;
    els.formError.textContent = msg || "";
  }

  function showExcelMsg(msg, isError) {
    els.excelMsg.hidden = !msg;
    els.excelMsg.textContent = msg || "";
    els.excelMsg.classList.toggle("admin-panel__msg--error", !!isError);
    els.excelMsg.classList.toggle("admin-panel__msg--ok", !!msg && !isError);
  }

  function fillForm(contact) {
    els.id.value = contact?.id || "";
    els.name.value = contact?.name || "";
    els.phone.value = contact?.phone || "";
    els.region.value = contact?.region || "";
    els.dept.value = contact?.dept || "";
    els.position.value = contact?.position || "";
    els.email.value = contact?.email || "";
    els.address.value = contact?.address || "";
    els.appointDate.value = contact?.appointDate || "";
    els.birthDate.value = contact?.birthDate || "";
    els.militaryBranch.value = contact?.militaryBranch || "";
    els.militaryRank.value = contact?.militaryRank || "";
    els.commission.value = contact?.commission || "";
    els.commissionType.value = contact?.commissionType || "";
    els.classNo.value = contact?.classNo || "";
    els.remark.value = contact?.remark || "";
  }

  function openModal(contact) {
    showFormError("");
    els.modal.hidden = false;
    document.body.style.overflow = "hidden";
    if (contact) {
      els.modalTitle.textContent = "\uC5F0\uB77D\uCC98 \uC218\uC815";
      fillForm(contact);
    } else {
      els.modalTitle.textContent = "\uC5F0\uB77D\uCC98 \uCD94\uAC00";
      els.form.reset();
      fillForm(null);
    }
    refreshOrgOptions();
    els.name.focus();
  }

  function closeModal() {
    els.modal.hidden = true;
    document.body.style.overflow = "";
  }

  function render() {
    els.count.textContent = contacts.length + "\uBA85";
    // data-label 은 좁은 화면에서 표가 카드로 바뀔 때 항목 이름으로 쓰인다.
    els.body.innerHTML = contacts
      .map(
        (c) => `
      <tr>
        <td data-label="\uC131\uBA85" class="admin-table__name">${escapeHtml(c.name)}</td>
        <td data-label="\uC18C\uC18D">${escapeHtml(c.region || "")}</td>
        <td data-label="\uC2DC\uAD70\uAD6C">${escapeHtml(c.dept || "")}</td>
        <td data-label="\uC9C1\uC704">${escapeHtml(c.position || "")}</td>
        <td data-label="\uC5F0\uB77D\uCC98">${escapeHtml(c.phone || "")}</td>
        <td data-label="\uAD70\uBCC4">${escapeHtml(c.militaryBranch || "")}</td>
        <td data-label="\uACC4\uAE09">${escapeHtml(c.militaryRank || "")}</td>
        <td>
          <div class="row-actions">
            <button type="button" data-edit="${escapeHtml(c.id)}">\uC218\uC815</button>
            <button type="button" class="danger" data-del="${escapeHtml(c.id)}">\uC0AD\uC81C</button>
          </div>
        </td>
      </tr>`
      )
      .join("");
  }

  async function loadContacts() {
    els.loading.hidden = false;
    els.error.hidden = true;
    els.wrap.hidden = true;
    try {
      const data = await SuchupAuth.api("/api/contacts");
      contacts = data.contacts || [];
      refreshOrgOptions();
      render();
      els.wrap.hidden = false;
    } catch (err) {
      els.error.hidden = false;
      els.error.textContent = err.message || "\uBD88\uB7EC\uC624\uAE30 \uC2E4\uD328";
    } finally {
      els.loading.hidden = true;
    }
  }

  function formPayload() {
    return {
      name: els.name.value.trim(),
      phone: els.phone.value.trim(),
      region: els.region.value.trim(),
      dept: els.dept.value.trim(),
      position: els.position.value.trim(),
      email: els.email.value.trim(),
      address: els.address.value.trim(),
      appointDate: els.appointDate.value.trim(),
      birthDate: els.birthDate.value.trim(),
      militaryBranch: els.militaryBranch.value.trim(),
      militaryRank: els.militaryRank.value.trim(),
      commission: els.commission.value.trim(),
      commissionType: els.commissionType.value.trim(),
      classNo: els.classNo.value.trim(),
      remark: els.remark.value.trim(),
    };
  }

  async function boot() {
    try {
      const me = await SuchupAuth.me();
      if (!me.authenticated) {
        location.replace("login.html?next=admin");
        return;
      }
      if (me.admin?.role !== "admin") {
        location.replace("index.html");
        return;
      }
      els.user.textContent = "\uAD00\uB9AC \u00B7 " + (me.admin.username || "Admin");
      await loadContacts();
    } catch (_) {
      location.replace("login.html?next=admin");
    }
  }

  els.region.addEventListener("input", refreshOrgOptions);
  els.addBtn.addEventListener("click", () => openModal(null));
  els.logoutBtn.addEventListener("click", async () => {
    try {
      await SuchupAuth.logout();
    } finally {
      location.href = "login.html";
    }
  });

  els.modal.addEventListener("click", (e) => {
    if (e.target.matches("[data-close]")) closeModal();
  });

  els.body.addEventListener("click", async (e) => {
    const editId = e.target.getAttribute("data-edit");
    const delId = e.target.getAttribute("data-del");
    if (editId) {
      const contact = contacts.find((c) => String(c.id) === String(editId));
      if (contact) openModal(contact);
      return;
    }
    if (delId) {
      if (!confirm("\uC774 \uC5F0\uB77D\uCC98\uB97C \uC0AD\uC81C\uD560\uAE4C\uC694?")) return;
      try {
        await SuchupAuth.api("/api/contacts/" + encodeURIComponent(delId), { method: "DELETE" });
        await loadContacts();
      } catch (err) {
        alert(err.message || "\uC0AD\uC81C \uC2E4\uD328");
      }
    }
  });

  els.form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showFormError("");
    const payload = formPayload();
    if (!payload.name) {
      showFormError("\uC131\uBA85\uC740 \uD544\uC218\uC785\uB2C8\uB2E4.");
      return;
    }
    const id = els.id.value;
    try {
      if (id) {
        await SuchupAuth.api("/api/contacts/" + encodeURIComponent(id), {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await SuchupAuth.api("/api/contacts", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      closeModal();
      await loadContacts();
    } catch (err) {
      showFormError(err.message || "\uC800\uC7A5 \uC2E4\uD328");
    }
  });

  // 한 요청에 많이 담으면 서버 실행 한도에 걸려 일부만 반영된다. 나눠 보내고 실패하면 다시 시도한다.
  const IMPORT_CHUNK = 20;

  async function importChunk(chunk) {
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await SuchupAuth.api("/api/contacts/import", {
          method: "POST",
          body: JSON.stringify({ contacts: chunk }),
        });
      } catch (err) {
        // 권한·형식 문제는 다시 시도해도 같으므로 바로 알린다.
        if (err.status && err.status < 500) throw err;
        lastError = err;
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
    throw lastError;
  }

  async function importInChunks(contacts) {
    const total = { inserted: 0, updated: 0, skipped: 0 };
    for (let i = 0; i < contacts.length; i += IMPORT_CHUNK) {
      const result = await importChunk(contacts.slice(i, i + IMPORT_CHUNK));
      total.inserted += result.inserted;
      total.updated += result.updated;
      total.skipped += result.skipped;
      const done = Math.min(i + IMPORT_CHUNK, contacts.length);
      showExcelMsg(`\uC5C5\uB85C\uB4DC \uC911... ${done} / ${contacts.length}`, false);
    }
    return total;
  }

  els.excelTemplateBtn.addEventListener("click", () => {
    try {
      SuchupExcel.downloadTemplate();
    } catch (err) {
      showExcelMsg(err.message || "template failed", true);
    }
  });

  els.excelImportBtn.addEventListener("click", async () => {
    const file = els.excelFile.files && els.excelFile.files[0];
    if (!file) {
      showExcelMsg("\uC5D1\uC140 \uD30C\uC77C\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.", true);
      return;
    }
    showExcelMsg("\uC5C5\uB85C\uB4DC \uC911...", false);
    try {
      const parsed = await SuchupExcel.parseFile(file);
      const total = await importInChunks(parsed);
      showExcelMsg(
        `\uC5D1\uC140 \uBC18\uC601 \uC644\uB8CC: \uCD94\uAC00 ${total.inserted}\uAC74, \uC218\uC815 ${total.updated}\uAC74, \uC0DD\uB7B5 ${total.skipped}\uAC74`,
        false
      );
      els.excelFile.value = "";
      await loadContacts();
    } catch (err) {
      showExcelMsg(err.message || "\uC5D1\uC140 \uBC18\uC601 \uC2E4\uD328", true);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !els.modal.hidden) closeModal();
  });

  boot();
})();
