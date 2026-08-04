(() => {
  const form = document.getElementById("loginForm");
  const errorEl = document.getElementById("loginError");
  const btn = document.getElementById("loginBtn");
  const params = new URLSearchParams(location.search);
  const next = params.get("next") === "admin" ? "admin.html" : "index.html";

  function showError(msg) {
    errorEl.hidden = !msg;
    errorEl.textContent = msg || "";
  }

  SuchupAuth.me()
    .then((data) => {
      if (data.authenticated) location.replace(next);
    })
    .catch(() => {});

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");
    btn.disabled = true;
    try {
      await SuchupAuth.login(
        document.getElementById("username").value.trim(),
        document.getElementById("password").value
      );
      location.href = next;
    } catch (err) {
      showError(err.message || "로그인에 실패했습니다.");
    } finally {
      btn.disabled = false;
    }
  });
})();
