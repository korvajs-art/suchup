// 밝게 / 어둡게 / 시스템 세 가지를 기억하고 <html data-theme> 에 반영한다.
window.SuchupTheme = (() => {
  const KEY = "suchup.theme";
  const MODES = ["light", "dark", "system"];
  const media = matchMedia("(prefers-color-scheme: dark)");
  const listeners = new Set();

  function preference() {
    const saved = localStorage.getItem(KEY);
    return MODES.includes(saved) ? saved : "system";
  }

  function resolved() {
    const pref = preference();
    if (pref !== "system") return pref;
    return media.matches ? "dark" : "light";
  }

  function apply() {
    document.documentElement.dataset.theme = resolved();
    listeners.forEach((fn) => fn(preference(), resolved()));
  }

  function set(mode) {
    localStorage.setItem(KEY, MODES.includes(mode) ? mode : "system");
    apply();
  }

  function toggle() {
    set(resolved() === "dark" ? "light" : "dark");
  }

  function onChange(fn) {
    listeners.add(fn);
    fn(preference(), resolved());
  }

  // 시스템을 따르는 중이면 OS 설정이 바뀔 때 같이 따라간다.
  media.addEventListener("change", () => {
    if (preference() === "system") apply();
  });

  apply();

  return { preference, resolved, set, toggle, onChange };
})();

// 헤더 아이콘과 드로어의 세 칸짜리 선택기를 테마 상태에 묶는다.
document.addEventListener("DOMContentLoaded", () => {
  const themeBtn = document.getElementById("themeBtn");
  if (themeBtn) themeBtn.addEventListener("click", () => SuchupTheme.toggle());

  const opts = Array.from(document.querySelectorAll("[data-theme-set]"));
  opts.forEach((btn) => {
    btn.addEventListener("click", () => SuchupTheme.set(btn.dataset.themeSet));
  });

  SuchupTheme.onChange((pref) => {
    opts.forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.themeSet === pref)));
  });
});
