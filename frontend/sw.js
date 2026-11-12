// Service worker: simpan semua berkas agar aplikasi jalan offline.
// Strategi "network-first": jika online pakai versi terbaru, jika offline/lambat pakai salinan.
// Setiap menambah berkas baru di frontend, tambahkan juga ke PRECACHE (diuji oleh pytest).
const VERSION = 'v0.3.1';
const CACHE = `langkah-linear-${VERSION}`;
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './fonts/atkinson-400-normal.woff2',
  './fonts/atkinson-700-normal.woff2',
  './fonts/atkinson-700-italic.woff2',
  './vendor/three.module.min.js',
  './src/styles/tokens.css',
  './src/styles/app.css',
  './src/main.js',
  './src/lib/store.js',
  './src/lib/dom.js',
  './src/lib/tween.js',
  './src/math/linear.js',
  './src/math/practice.js',
  './src/content/keywords.js',
  './src/content/modules.js',
  './src/content/stories.js',
  './src/content/review.js',
  './src/content/lessons.js',
  './src/components/balance2d.js',
  './src/features/materi.js',
  './src/components/mathexpr.js',
  './src/components/numberline.js',
  './src/three/view.js',
  './src/features/home.js',
  './src/features/enroll.js',
  './src/features/settings.js',
  './src/features/example.js',
  './src/features/kamus.js',
  './src/features/balance3d.js',
  './src/features/flip3d.js',
  './src/features/prereq.js',
  './src/features/story.js',
  './src/features/practice.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('langkah-linear-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function timeout(ms) { return new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)); }

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.includes('/api/')) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await Promise.race([fetch(e.request), timeout(4000)]);
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    } catch {
      const hit = await cache.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
      if (e.request.mode === 'navigate') return cache.match('./index.html');
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    }
  })());
});
