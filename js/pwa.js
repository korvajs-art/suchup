// 홈 화면 설치 안내. 50대 사용자도 "앱처럼" 쓸 수 있게 안내 문구를 크게 둔다.
(() => {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.register("./sw.js").catch((err) => {
    console.warn("서비스 워커 등록 실패", err);
  });

  const KEY = "suchup.installDismissed";
  let deferred = null;

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function isIos() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  function dismiss() {
    localStorage.setItem(KEY, "1");
    const el = document.getElementById("installBanner");
    if (el) el.hidden = true;
  }

  function showBanner(mode) {
    if (isStandalone() || localStorage.getItem(KEY) === "1") return;
    const el = document.getElementById("installBanner");
    if (!el) return;

    const title = el.querySelector("[data-install-title]");
    const lead = el.querySelector("[data-install-lead]");
    const action = el.querySelector("[data-install-action]");

    if (mode === "ios") {
      if (title) title.textContent = "홈 화면에 수첩 넣기";
      if (lead) lead.textContent = "Safari 아래쪽 공유 버튼(□↑)을 누른 뒤「홈 화면에 추가」를 선택하세요.";
      if (action) action.hidden = true;
    } else if (mode === "android") {
      if (title) title.textContent = "수첩 앱으로 설치";
      if (lead) lead.textContent = "홈 화면에 아이콘이 생기고, 일반 앱처럼 바로 열 수 있습니다.";
      if (action) {
        action.hidden = false;
        action.textContent = "설치하기";
        action.onclick = async () => {
          if (!deferred) return;
          deferred.prompt();
          await deferred.userChoice;
          deferred = null;
          dismiss();
        };
      }
    } else {
      return;
    }

    el.hidden = false;
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    // 목록을 가리지 않도록 잠시 뒤 안내한다.
    setTimeout(() => showBanner("android"), 8000);
  });

  // iOS 는 설치 이벤트가 없어 Safari 안내만 보여 준다.
  if (isIos() && !isStandalone()) {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => showBanner("ios"), 8000);
    });
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-install-dismiss]")) dismiss();
  });
})();
