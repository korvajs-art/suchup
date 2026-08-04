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
    gate: document.getElementById("adminGate"),
    app: document.getElementById("adminApp"),
    gateForm: document.getElementById("adminGateForm"),
    gateUser: document.getElementById("gateUsername"),
    gatePass: document.getElementById("gatePassword"),
    gateError: document.getElementById("gateError"),
    gateBtn: document.getElementById("gateBtn"),
  };

  let contacts = [];

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showFormError(msg) {
    els.formError.hidden = !msg;
    els.formError.textContent = msg || "";
  }

  function showGateError(msg) {
    els.gateError.hidden = !msg;
    els.gateError.textContent = msg || "";
  }

  function showExcelMsg(msg, isError) {
    els.excelMsg.hidden = !msg;
    els.excelMsg.textContent = msg || "";
    els.excelMsg.classList.toggle("status-msg--error", !!isError);
    if (!isError) {
      els.excelMsg.style.background = "#ecfdf5";
      els.excelMsg.style.color = "#047857";
    } else {
      els.excelMsg.style.background = "";
      els.excelMsg.style.color = "";
    }
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
    els.name.focus();
  }

  function closeModal() {
    els.modal.hidden = true;
    document.body.style.overflow = "";
  }

  function render() {
    els.count.textContent = contacts.length + "\uBA85";
    els.body.innerHTML = contacts
      .map(
        (c) => `
      <tr>
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.dept || "")}</td>
        <td>${escapeHtml(c.position || "")}</td>
        <td>${escapeHtml(c.phone || "")}</td>
        <td>${escapeHtml(c.militaryBranch || "")}</td>
        <td>${escapeHtml(c.militaryRank || "")}</td>
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

  async function unlockAdmin(username) {
    els.gate.hidden = true;
    els.app.hidden = false;
    els.user.textContent = username || "Admin";
    await loadContacts();
  }

  async function boot() {
    try {
      const me = await SuchupAuth.me();
      if (me.authenticated && me.admin?.username) {
        els.gateUser.value = me.admin.username;
      }
    } catch (_) {
      /* ignore */
    }

    els.gate.hidden = false;
    els.app.hidden = true;
    (els.gateUser.value ? els.gatePass : els.gateUser).focus();
  }

  els.gateForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showGateError("");
    els.gateBtn.disabled = true;
    try {
      const username = els.gateUser.value.trim();
      const password = els.gatePass.value;
      const result = await SuchupAuth.login(username, password);
      els.gatePass.value = "";
      await unlockAdmin(result.admin?.username || username);
    } catch (err) {
      showGateError(err.message || "\uC554\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
    } finally {
      els.gateBtn.disabled = false;
    }
  });

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
      const result = await SuchupAuth.api("/api/contacts/import", {
        method: "POST",
        body: JSON.stringify({ contacts: parsed }),
      });
      showExcelMsg(
        `\uC5D1\uC140 \uBC18\uC601 \uC644\uB8CC: \uCD94\uAC00 ${result.inserted}\uAC74, \uC218\uC815 ${result.updated}\uAC74, \uC0DD\uB7B5 ${result.skipped}\uAC74`,
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
