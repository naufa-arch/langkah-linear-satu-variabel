// Penyimpanan lokal sederhana (pengaturan + progres). Log penelitian & sinkronisasi menyusul di Sprint S6.
const KEY = 'langkah-linear:v1';

const DEFAULTS = { studentCode: null, classCode: '', reduceMotion: false, progress: {}, last: null };

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function write(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* penyimpanan diblokir: aplikasi tetap jalan */ }
}

export function get() { return { ...DEFAULTS, ...read() }; }
export function set(patch) { const s = { ...get(), ...patch }; write(s); return s; }
export function markDone(id) { const s = get(); s.progress = { ...s.progress, [id]: 'done' }; write(s); }
export function isDone(id) { return get().progress[id] === 'done'; }
export function resetAll() { try { localStorage.removeItem(KEY); } catch { /* abaikan */ } }

export function prefersReducedMotion() {
  return get().reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
}
