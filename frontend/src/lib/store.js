// Penyimpanan lokal per siswa.
// Setiap pasangan (kode kelas, kode siswa) punya PROFIL sendiri, jadi bila satu HP dipakai bergantian,
// progres, riwayat, dan antrean kiriman tiap siswa tidak tertukar.
// Pengaturan tampilan (prefs) berlaku untuk HP, bukan untuk siswa.
const KEY = 'langkah-linear:v2';
const OLD_KEY = 'langkah-linear:v1';
const PREF_KEYS = ['reduceMotion', 'theme', 'apiBase'];
const HISTORY_MAX = 400;
const OUTBOX_MAX = 2000;

const PROFILE_DEFAULTS = {
  studentCode: null, classCode: '', progress: {}, last: null, practice: null, prereq: null,
  history: [], outbox: [], literasi: [], drafts: {}, createdAt: null,
};
const PREF_DEFAULTS = { reduceMotion: false, theme: 'auto', apiBase: '' };

const profileKey = (classCode, studentCode) => `${classCode || '-'}|${studentCode}`;

function readRaw() {
  try {
    const v2 = JSON.parse(localStorage.getItem(KEY));
    if (v2 && v2.profiles) return v2;
    // pindahkan data versi lama (satu siswa per HP) menjadi satu profil
    const v1 = JSON.parse(localStorage.getItem(OLD_KEY)) || {};
    const db = { current: null, profiles: {}, prefs: { ...PREF_DEFAULTS, reduceMotion: !!v1.reduceMotion } };
    if (v1.studentCode) {
      const k = profileKey(v1.classCode, v1.studentCode);
      db.profiles[k] = { ...PROFILE_DEFAULTS, ...pick(v1, Object.keys(PROFILE_DEFAULTS)), createdAt: new Date().toISOString() };
      db.current = k;
    }
    return db;
  } catch { return { current: null, profiles: {}, prefs: { ...PREF_DEFAULTS } }; }
}
function pick(o, keys) { const r = {}; for (const k of keys) if (o[k] !== undefined) r[k] = o[k]; return r; }

let cache = null;
function db() { if (!cache) cache = readRaw(); return cache; }
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db())); } catch { /* penyimpanan penuh/diblokir: aplikasi tetap jalan */ }
}
window.addEventListener('storage', (e) => { if (e.key === KEY) cache = null; });

function current() {
  const d = db();
  return d.current ? d.profiles[d.current] || null : null;
}

// ---------- API lama (dipakai semua layar) ----------
export function get() {
  const d = db();
  return { ...PREF_DEFAULTS, ...d.prefs, ...PROFILE_DEFAULTS, ...(current() || {}) };
}

export function set(patch) {
  const d = db();
  const prefs = pick(patch, PREF_KEYS);
  if (Object.keys(prefs).length) d.prefs = { ...PREF_DEFAULTS, ...d.prefs, ...prefs };
  const rest = { ...patch };
  for (const k of PREF_KEYS) delete rest[k];
  if ('studentCode' in rest || 'classCode' in rest) {
    // ganti/masuk siswa: pindah ke profil miliknya (dibuat bila belum ada)
    const cur = current() || {};
    const student = rest.studentCode ?? cur.studentCode;
    const klass = rest.classCode ?? cur.classCode ?? '';
    if (student) {
      const k = profileKey(klass, student);
      if (!d.profiles[k]) d.profiles[k] = { ...PROFILE_DEFAULTS, studentCode: student, classCode: klass, createdAt: new Date().toISOString() };
      d.current = k;
    }
    delete rest.studentCode; delete rest.classCode;
  }
  const p = current();
  if (p && Object.keys(rest).length) Object.assign(p, rest);
  save();
  return get();
}

export function markDone(id) {
  const p = current();
  if (!p) return;
  const first = p.progress[id] !== 'done';
  p.progress = { ...p.progress, [id]: 'done' };
  save();
  if (first) log('aktivitas.selesai', { id });
}
export function isDone(id) { return (current()?.progress || {})[id] === 'done'; }

// Hapus progres siswa yang sedang aktif saja (kode & antrean kiriman tetap).
export function resetAll() {
  const p = current();
  if (!p) return;
  Object.assign(p, { progress: {}, last: null, practice: null, prereq: null, history: [], drafts: {} });
  save();
}

export function prefersReducedMotion() {
  return get().reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ---------- riwayat belajar + antrean kiriman ke server ----------
export function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function log(kind, data = {}) {
  const p = current();
  if (!p) return null;
  const ev = { id: uuid(), kind, ts: new Date().toISOString(), data };
  p.history = [ev, ...(p.history || [])].slice(0, HISTORY_MAX);
  p.outbox = [...(p.outbox || []), ev].slice(-OUTBOX_MAX);
  save();
  window.dispatchEvent(new CustomEvent('langkah:logged', { detail: ev }));
  return ev;
}
export function history() { return current()?.history || []; }

// Semua profil yang masih punya kiriman tertunda (dipakai sync.js).
export function pendingProfiles() {
  return Object.entries(db().profiles)
    .filter(([, p]) => (p.outbox || []).length || (p.literasi || []).some((a) => !a.sent))
    .map(([key, p]) => ({ key, studentCode: p.studentCode, classCode: p.classCode, outbox: p.outbox || [], literasi: p.literasi || [] }));
}
export function ackEvents(key, ids) {
  const p = db().profiles[key];
  if (!p) return;
  const done = new Set(ids);
  p.outbox = (p.outbox || []).filter((e) => !done.has(e.id));
  save();
}
export function pendingCount() {
  const p = current();
  if (!p) return 0;
  return (p.outbox || []).length + (p.literasi || []).filter((a) => !a.sent).length;
}

// ---------- tes literasi ----------
export function addAttempt(att) {
  const p = current();
  if (!p) return;
  p.literasi = [att, ...(p.literasi || []).filter((a) => a.id !== att.id)];
  save();
}
export function updateAttempt(key, id, patch) {
  const p = key ? db().profiles[key] : current();
  if (!p) return;
  p.literasi = (p.literasi || []).map((a) => (a.id === id ? { ...a, ...patch } : a));
  save();
}
export function attempts() { return current()?.literasi || []; }

export function getDraft(name) { return (current()?.drafts || {})[name] || null; }
export function setDraft(name, value) {
  const p = current();
  if (!p) return;
  p.drafts = { ...(p.drafts || {}), [name]: value };
  if (value === null) delete p.drafts[name];
  save();
}

export function profiles() {
  return Object.entries(db().profiles).map(([key, p]) => ({ key, studentCode: p.studentCode, classCode: p.classCode, active: key === db().current }));
}
export function switchProfile(key) {
  if (!db().profiles[key]) return;
  db().current = key; save();
}
export function logout() { db().current = null; save(); }
