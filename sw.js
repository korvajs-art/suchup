/* 앱처럼 설치할 수 있게 하는 최소 서비스 워커.
   화면·스타일·스크립트는 캐시에 두고, 연락처 API 는 항상 최신을 받는다. */
const CACHE = "suchup-shell-v3";
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

  event.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res.ok && url.origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
