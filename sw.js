/* 앱처럼 설치할 수 있게 하는 최소 서비스 워커.
   HTML·CSS·JS 는 네트워크를 먼저 보고, 실패할 때만 캐시를 쓴다.
   연락처 API 는 캐시하지 않는다. */
const CACHE = "suchup-shell-v8";
const SHELL = [
  "./",
  "./index.html",
  "./login.html",
  "./password.html",
  "./css/tokens.css",
  "./css/styles.css",
  "./css/admin.css",
  "./js/auth.js",
  "./js/theme.js",
  "./js/org-data.js",
  "./js/org.js",
  "./js/sort.js",
  "./js/app.js",
  "./js/pwa.js",
  "./assets/logo.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/apple-touch-icon.png",
  "./assets/korva-logo.gif",
  "./manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // API·로그인은 캐시하지 않는다. 항상 최신 연락처를 받는다.
  if (url.pathname.startsWith("/api/")) return;

  // 화면 껍데기는 최신 배포를 바로 받게 네트워크 우선.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && url.origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || Response.error()))
  );
});
