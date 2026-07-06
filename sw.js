/* ═══════════════════════════════════════════════
   صيدليات داريا — Service Worker v2.0
   يخلي الموقع يشتغل بدون نت ويتنزل على الجوال
═══════════════════════════════════════════════ */

const CACHE = 'daraya-pharmacy-v2';
const STATIC = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

// تثبيت — نحفظ الملفات الأساسية
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(STATIC).catch(() => {});
    })
  );
  self.skipWaiting();
});

// تفعيل — نحذف الكاش القديم
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// طلبات الشبكة — نجرب النت أولاً وإلا نرجع للكاش
self.addEventListener('fetch', e => {
  // Google Sheets يحتاج دائماً نت (للبيانات الحديثة)
  if (e.request.url.includes('docs.google.com') || e.request.url.includes('sheets.googleapis.com')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
