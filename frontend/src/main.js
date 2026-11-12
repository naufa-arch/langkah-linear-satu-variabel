// Kerangka aplikasi: router berbasis hash (#/...), memuat layar secara lazy.
import * as store from './lib/store.js';
import { cancelAll, setRender } from './lib/tween.js';

const ROUTES = {
  '': () => import('./features/home.js'),
  'masuk': () => import('./features/enroll.js'),
  'pengaturan': () => import('./features/settings.js'),
  'timbangan': () => import('./features/balance3d.js'),
  'balik-tanda': () => import('./features/flip3d.js'),
  'contoh': () => import('./features/example.js'),
  'materi': () => import('./features/materi.js'),
  'kamus': () => import('./features/kamus.js'),
  'prasyarat': () => import('./features/prereq.js'),
  'soal-cerita': () => import('./features/story.js'),
  'latihan': () => import('./features/practice.js'),
};

const app = document.getElementById('app');
const titleEl = document.getElementById('title');
const backEl = document.getElementById('back');
let cleanup = null;
let navId = 0;

async function navigate() {
  const id = ++navId;
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  let name = parts[0] || '';
  if (!store.get().studentCode && name !== 'masuk') name = 'masuk';
  const load = ROUTES[name] || ROUTES[''];

  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  cancelAll(); setRender(null);
  app.innerHTML = '<p class="loading">Memuat…</p>';

  let mod;
  try { mod = await load(); } catch (e) {
    console.error(e);
    app.innerHTML = '<p class="fb" data-tone="warn"><span class="ic">!</span><span class="t">Halaman ini belum tersimpan untuk dipakai offline. Sambungkan ke internet sekali, lalu coba lagi.</span></p>';
    return;
  }
  if (id !== navId) return; // pengguna sudah pindah halaman lagi

  const isHome = name === '' || name === 'masuk';
  backEl.hidden = isHome;
  titleEl.textContent = mod.title || 'Langkah Linear';
  document.title = name === '' ? 'Langkah Linear' : `${mod.title} · Langkah Linear`;
  app.innerHTML = '';
  window.scrollTo(0, 0);
  cleanup = (await mod.mount(app, parts.slice(1))) || null;
  if (!isHome && name !== 'pengaturan') store.set({ last: location.hash });
}

function applyMotionPref() {
  document.documentElement.classList.toggle('reduce-motion', store.prefersReducedMotion());
}

window.addEventListener('hashchange', navigate);
window.addEventListener('langkah:prefs', applyMotionPref);
applyMotionPref();
navigate();

if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service worker gagal didaftarkan', e));
  });
}
