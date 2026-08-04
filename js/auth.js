window.SuchupAuth = (() => {
  async function api(path, options = {}) {
    const res = await fetch(path, {
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      const message = (data && data.error) || `Request failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  }

  function me() {
    return api("/api/auth/me");
  }

  function login(username, password) {
    return api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  function logout() {
    return api("/api/auth/logout", { method: "POST", body: "{}" });
  }

  return { api, me, login, logout };
})();
