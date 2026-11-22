const CACHE = 'stockpro-v3';
const FILES = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// เก็บแคชเฉพาะไฟล์ของแอพเอง, ไลบรารี Firebase และตัวอ่านบาร์โค้ด ZXing (เพื่อเปิดแอพตอนออฟไลน์ได้)
// คำขอไปยัง Firestore/Auth (googleapis.com) ปล่อยผ่านตามปกติ ไม่แตะต้อง
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const mine = url.origin === location.origin;
  const lib = (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/'))
    || (url.hostname === 'cdn.jsdelivr.net' && url.pathname.startsWith('/npm/@zxing/library@'));
  if (!mine && !lib) return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request).then(r => r || (mine ? caches.match('./index.html') : Response.error())))
  );
});
