// まぃの箱(入口)のサービスワーカー: オンラインでもオフラインでも開けるように
// 各ゲームの中身はゲーム側のサービスワーカーが担当。ここは入口と、一覧に出すゲームのアイコンだけ扱う
const CACHE = "mai-no-hako-v2";
const FILES = ["/", "/index.html", "/manifest.json", "/icon-192.png", "/icon-512.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("mai-no-hako-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
function save(req, r) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return r; }
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const p = url.pathname;
  // 入口のファイルと、各ゲームのアイコン(/〇〇/icon-192.png): ネット優先、オフラインなら保存分
  const mine = url.origin === location.origin &&
    (FILES.includes(p) || p.startsWith("/icon-maskable") || /^\/[^/]+\/icon-192\.png$/.test(p));
  if (mine) {
    e.respondWith(fetch(e.request).then((r) => save(e.request, r))
      .catch(() => caches.match(e.request).then((m) => m || (e.request.mode === "navigate" ? caches.match("/") : undefined))));
    return;
  }
  // Google Fonts: 保存分を優先
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.match(e.request).then((cached) => {
      const net = fetch(e.request).then((r) => save(e.request, r)).catch(() => cached);
      return cached || net;
    }));
  }
});
