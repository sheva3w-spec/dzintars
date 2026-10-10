// Хранит приложение на телефоне: без интернета берёт из памяти,
// с интернетом сначала проверяет новую версию.
const CACHE = "dzintars-v5";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-512.png",
  "content/part1.json", "content/part2.json", "content/grammar.json", "audio/index.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // модель распознавания и библиотека с других сайтов — не трогаем, они кэшируются сами
  if (new URL(e.request.url).origin !== location.origin) return;
  if (e.request.mode === "navigate") {
    // страница: сеть, если есть; иначе сохранённая копия
    e.respondWith(
      fetch(e.request)
        .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put("index.html", copy)); return r; })
        .catch(() => caches.match("index.html"))
    );
    return;
  }
  // остальное: из памяти, а то, что скачали впервые (озвучка), — сохраняем для офлайна
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return r;
    }))
  );
});
