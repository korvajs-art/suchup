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
  const MIN_PW = 8;

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
    lengthHint.classList.toggle("is-ok", next.length >= MIN_PW);
    lengthHint.classList.toggle("is-bad", next.length > 0 && next.length < MIN_PW);
    lengthHint.textContent =
      next.length === 0
        ? "8자 이상 입력해 주세요."
        : next.length < MIN_PW
          ? `${MIN_PW - next.length}자 더 입력해 주세요.`
          : "사용 가능한 길이입니다.";

    if (!confirm) {
      matchHint.hidden = true;
      return;
    }
    matchHint.hidden = false;
    const ok = next === confirm && next.length >= MIN_PW;
    matchHint.classList.toggle("is-ok", ok);
    matchHint.classList.toggle("is-bad", !ok);
    matchHint.textContent = ok ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다.";
  }

  document.querySelectorAll(".pw-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = document.getElementById(toggle.getAttribute("data-toggle"));
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      toggle.textContent = show ? "숨김" : "보기";
      toggle.setAttribute("aria-label", show ? "비밀번호 숨기기" : "비밀번호 표시");
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

    if (newPassword.length < MIN_PW) {
      showError("새 비밀번호는 8자 이상이어야 합니다.");
      pwNew.focus();
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("새 비밀번호가 일치하지 않습니다.");
      pwNew2.focus();
      return;
    }
    if (newPassword === currentPassword) {
      showError("현재 비밀번호와 다른 비밀번호를 입력해 주세요.");
      pwNew.focus();
      return;
    }

    btn.disabled = true;
    btn.textContent = "변경 중...";
    try {
      await SuchupAuth.changePassword(currentPassword, newPassword);
      try {
        await SuchupAuth.logout();
      } catch {
        /* 서버에서 세션이 이미 삭제됐을 수 있다 */
      }
      successEl.hidden = false;
      form.reset();
      updateHints();
      showToast("비밀번호가 변경되었습니다. 다시 로그인해 주세요.");
      setTimeout(() => {
        location.href = "login.html";
      }, 900);
    } catch (err) {
      showError(err.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      btn.disabled = false;
      btn.textContent = "변경하기";
    }
  });

  SuchupAuth.me()
    .then((me) => {
      if (!me.authenticated) {
        location.replace("login.html");
        return;
      }
      const role = me.admin?.role === "admin" ? "관리자" : "일반 사용자";
      accountLabel.textContent = `비밀번호 변경 · ${me.admin?.username || role}`;
      pwCurrent.focus();
    })
    .catch(() => location.replace("login.html"));
})();
