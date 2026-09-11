(() => {
  const form = document.getElementById("loginForm");
  const errorEl = document.getElementById("loginError");
  const btn = document.getElementById("loginBtn");
  const username = document.getElementById("username");
  const password = document.getElementById("password");
  const pwToggle = document.getElementById("pwToggle");
  const params = new URLSearchParams(location.search);
  const wantsAdmin = params.get("next") === "admin";

  function destination(role) {
    if (wantsAdmin && role === "admin") return "admin.html";
    return "index.html";
  }

  function showError(msg) {
    errorEl.hidden = !msg;
    errorEl.textContent = msg || "";
  }

  function setLoading(on) {
    btn.disabled = on;
    btn.classList.toggle("is-loading", on);
    const label = btn.querySelector(".auth-submit__label");
    if (label) label.textContent = on ? "\uC785\uC7A5 \uC911..." : "\uB85C\uADF8\uC778";
  }

  SuchupAuth.me()
    .then((data) => {
      if (data.authenticated) location.replace(destination(data.admin?.role));
    })
    .catch(() => {});

  if (pwToggle) {
    pwToggle.addEventListener("click", () => {
      const show = password.type === "password";
      password.type = show ? "text" : "password";
      pwToggle.textContent = show ? "\uC228\uAE40" : "\uBCF4\uAE30";
      pwToggle.setAttribute("aria-label", show ? "\uBE44\uBC00\uBC88\uD638 \uC228\uAE30\uAE30" : "\uBE44\uBC00\uBC88\uD638 \uD45C\uC2DC");
    });
  }

  document.querySelectorAll("[data-fill]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const id = chip.getAttribute("data-fill");
      username.value = id || "";
      password.value = id === "admin" ? "changeme" : "suchup";
      password.focus();
      showError("");
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");
    setLoading(true);
    try {
      const result = await SuchupAuth.login(username.value.trim(), password.value);
      location.href = destination(result.admin?.role);
    } catch (err) {
      showError(err.message || "\uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
      setLoading(false);
    }
  });
})();
