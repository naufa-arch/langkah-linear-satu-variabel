// Kerangka aplikasi: router berbasis hash (#/...), memuat layar secara lazy.
// Modul layar boleh mengekspor `nav` (false = sembunyikan navigasi bawah agar siswa fokus) dan `tab`.
import * as store from './lib/store.js';
import { cancelAll, setRender } from './lib/tween.js';
import * as sync from './lib/sync.js';
import { isNative } from './config.js';

const ROUTES = {
  '': () => import('./features/home.js'),
  'masuk': () => import('./features/enroll.js'),
  'pengaturan': () => import('./features/profil.js'),
  'profil': () => import('./features/profil.js'),
  'timbangan': () => import('./features/balance3d.js'),
  'balik-tanda': () => import('./features/flip3d.js'),
  'contoh': () => import('./features/example.js'),
  'materi': () => import('./features/materi.js'),
  'kamus': () => import('./features/kamus.js'),
  'prasyarat': () => import('./features/prereq.js'),
  'soal-cerita': () => import('./features/story.js'),
  'latihan': () => import('./features/practice.js'),
  'pembahasan': () => import('./features/pembahasan.js'),
  'tutor': () => import('./features/tutor.js'),
  'rmt': () => import('./features/rmt.js'),
  'evaluasi': () => import('./features/evaluasi.js'),
  'hasil': () => import('./features/hasil.js'),
  'peneliti': () => import('./features/peneliti.js'),
};
// rute yang boleh dibuka tanpa kode siswa
const PUBLIC = new Set(['masuk', 'peneliti']);
// tab navigasi bawah yang menyala untuk setiap rute
const TAB_OF = { '': 'beranda', materi: 'materi', latihan: 'latihan', pembahasan: 'latihan', tutor: 'tutor', rmt: 'tutor', hasil: 'hasil', evaluasi: 'hasil', profil: 'beranda', pengaturan: 'beranda' };

const app = document.getElementById('app');
const titleEl = document.getElementById('title');
const backEl = document.getElementById('back');
const navEl = document.getElementById('nav');
let cleanup = null;
let navId = 0;

async function navigate() {
  const id = ++navId;
  const parts = location.hash.replace(/^#\/?/, '').split(/[/?]/).filter(Boolean);
  let name = parts[0] || '';
  if (!store.get().studentCode && !PUBLIC.has(name)) name = 'masuk';
  const load = ROUTES[name] || ROUTES[''];

  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  cancelAll(); setRender(null);
  app.innerHTML = '<div class="skeleton" aria-busy="true"><i></i><i></i><i></i></div>';

  let mod;
  try { mod = await load(); } catch (e) {
    console.error(e);
    app.innerHTML = '<p class="fb" data-tone="warn"><span class="ic">!</span><span class="t">Halaman ini belum tersimpan untuk dipakai offline. Sambungkan ke internet sekali, lalu coba lagi.</span></p>';
    return;
  }
  if (id !== navId) return; // pengguna sudah pindah halaman lagi

  const params = parts.slice(1);
  const isHome = name === '' || name === 'masuk';
  const showNav = name !== 'masuk' && name !== 'peneliti' && (typeof mod.nav === 'function' ? mod.nav(params) : mod.nav !== false);
  backEl.hidden = isHome;
  // tombol kembali menuju "induk": subhalaman → daftarnya, selain itu → beranda
  backEl.href = mod.back || (params.length && name === 'materi' ? '#/materi' : '#/');
  document.body.classList.toggle('has-nav', showNav);
  document.body.dataset.route = name || 'beranda';
  navEl.hidden = !showNav;
  const tab = mod.tab || TAB_OF[name];
  navEl.querySelectorAll('a').forEach((a) => a.toggleAttribute('aria-current', a.dataset.tab === tab));
  titleEl.textContent = mod.title || 'Langkah Linear';
  document.title = name === '' ? 'Langkah Linear' : `${mod.title} · Langkah Linear`;
  app.innerHTML = '';
  app.classList.remove('enter'); void app.offsetWidth; app.classList.add('enter');
  window.scrollTo(0, 0);
  cleanup = (await mod.mount(app, params)) || null;
  if (!isHome && !['pengaturan', 'profil', 'hasil', 'peneliti'].includes(name)) store.set({ last: location.hash });
}

export function applyPrefs() {
  const s = store.get();
  const root = document.documentElement;
  root.classList.toggle('reduce-motion', store.prefersReducedMotion());
  if (s.theme === 'light' || s.theme === 'dark') root.dataset.theme = s.theme;
  else delete root.dataset.theme;
}

window.addEventListener('hashchange', navigate);
window.addEventListener('langkah:prefs', applyPrefs);
applyPrefs();
navigate();
sync.start();

if (isNative()) {
  document.documentElement.classList.add('native');
  // tombol kembali Android: mundur satu halaman, atau keluar dari beranda
  window.Capacitor.Plugins?.App?.addListener?.('backButton', () => {
    if (location.hash && location.hash !== '#/' && location.hash !== '#/masuk') history.back();
    else window.Capacitor.Plugins.App.exitApp();
  });
} else if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service worker gagal didaftarkan', e));
  });
}
