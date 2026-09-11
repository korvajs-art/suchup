(() => {
  const form = document.getElementById("passwordForm");
  const btn = document.getElementById("pwSaveBtn");
  const errorEl = document.getElementById("pwError");
  const successEl = document.getElementById("pwSuccess");
  const matchHint = document.getElementById("pwMatchHint");
  const lengthHint = document.getElementById("pwLengthHint");
  const accountLabel = document.getElementById("accountLabel");
  const toast = document.getElementById("toast");
  const pwCurrent = document.getElementById("pwCurrent");
  const pwNew = document.getElementById("pwNew");
  const pwNew2 = document.getElementById("pwNew2");
  const fromAdmin = new URLSearchParams(location.search).get("from") === "admin";
  const home = fromAdmin ? "admin.html" : "index.html";

  const backLink = document.getElementById("backLink");
  const cancelLink = document.getElementById("cancelLink");
  if (backLink) backLink.href = home;
  if (cancelLink) cancelLink.href = home;

  function showError(msg) {
    successEl.hidden = true;
    errorEl.hidden = !msg;
    errorEl.textContent = msg || "";
  }

  function showToast(msg) {
    if (!toast) return;
    toast.hidden = false;
    toast.textContent = msg;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toast.hidden = true;
    }, 2400);
  }

  function updateHints() {
    const next = pwNew.value;
    const confirm = pwNew2.value;
    lengthHint.classList.toggle("is-ok", next.length >= 4);
    lengthHint.classList.toggle("is-bad", next.length > 0 && next.length < 4);
    lengthHint.textContent =
      next.length === 0
        ? "\u0034\uC790 \uC774\uC0C1 \uC785\uB825\uD574 \uC8FC\uC138\uC694."
        : next.length < 4
          ? `${4 - next.length}\uC790 \uB354 \uC785\uB825\uD574 \uC8FC\uC138\uC694.`
          : "\uC0AC\uC6A9 \uAC00\uB2A5\uD55C \uAE38\uC774\uC785\uB2C8\uB2E4.";

    if (!confirm) {
      matchHint.hidden = true;
      return;
    }
    matchHint.hidden = false;
    const ok = next === confirm && next.length >= 4;
    matchHint.classList.toggle("is-ok", ok);
    matchHint.classList.toggle("is-bad", !ok);
    matchHint.textContent = ok
      ? "\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD569\uB2C8\uB2E4."
      : "\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.";
  }

  document.querySelectorAll(".pw-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = document.getElementById(toggle.getAttribute("data-toggle"));
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      toggle.textContent = show ? "\uC228\uAE40" : "\uBCF4\uAE30";
      toggle.setAttribute(
        "aria-label",
        show ? "\uBE44\uBC00\uBC88\uD638 \uC228\uAE30\uAE30" : "\uBE44\uBC00\uBC88\uD638 \uD45C\uC2DC"
      );
    });
  });

  pwNew.addEventListener("input", updateHints);
  pwNew2.addEventListener("input", updateHints);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");
    const currentPassword = pwCurrent.value;
    const newPassword = pwNew.value;
    const confirmPassword = pwNew2.value;

    if (newPassword.length < 4) {
      showError("\uC0C8 \uBE44\uBC00\uBC88\uD638\uB294 4\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.");
      pwNew.focus();
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("\uC0C8 \uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
      pwNew2.focus();
      return;
    }
    if (newPassword === currentPassword) {
      showError(
        "\uD604\uC7AC \uBE44\uBC00\uBC88\uD638\uC640 \uB2E4\uB978 \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694."
      );
      pwNew.focus();
      return;
    }

    btn.disabled = true;
    btn.textContent = "\uBCC0\uACBD \uC911...";
    try {
      await SuchupAuth.changePassword(currentPassword, newPassword);
      successEl.hidden = false;
      form.reset();
      updateHints();
      showToast("\uBE44\uBC00\uBC88\uD638\uAC00 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
      setTimeout(() => {
        location.href = home;
      }, 900);
    } catch (err) {
      showError(err.message || "\uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
    } finally {
      btn.disabled = false;
      btn.textContent = "\uBCC0\uACBD\uD558\uAE30";
    }
  });

  SuchupAuth.me()
    .then((me) => {
      if (!me.authenticated) {
        location.replace("login.html");
        return;
      }
      const role =
        me.admin?.role === "admin" ? "\uAD00\uB9AC\uC790" : "\uC77C\uBC18 \uC0AC\uC6A9\uC790";
      accountLabel.textContent = `\uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD \u00B7 ${me.admin?.username || role}`;
      pwCurrent.focus();
    })
    .catch(() => location.replace("login.html"));
})();
