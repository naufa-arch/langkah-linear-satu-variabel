// Pemanggil API backend. Kunci AI TIDAK ada di HP: semua permintaan AI lewat server.
import { REMOTE_API, isNative } from '../config.js';
import * as store from './store.js';

export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.status = status; }
}

export function apiBase() {
  const custom = (store.get().apiBase || '').trim().replace(/\/+$/, '');
  if (custom) return custom;
  if (isNative() || location.hostname.endsWith('github.io') || location.protocol === 'file:') return REMOTE_API;
  // aplikasi disajikan oleh FastAPI: API ada di folder yang sama
  return new URL('.', location.href).href.replace(/\/+$/, '');
}

export async function api(path, { method = 'GET', body, token, timeout = 30000, raw = false } = {}) {
  if (!navigator.onLine) throw new ApiError('Tidak ada internet. Sambungkan HP ke internet, lalu coba lagi.');
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${apiBase()}/api/v1${path}`, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: ctrl.signal,
    });
  } catch (e) {
    throw new ApiError(e.name === 'AbortError'
      ? 'Server terlalu lama menjawab. Jika server baru bangun, tunggu ±1 menit lalu coba lagi.'
      : 'Tidak bisa terhubung ke server. Periksa internet atau alamat server di Profil.');
  } finally { clearTimeout(t); }
  if (raw && res.ok) return res;
  let data = null;
  try { data = await res.json(); } catch { /* bukan JSON */ }
  if (!res.ok) {
    let msg = data && data.detail;
    if (Array.isArray(msg)) msg = msg.map((d) => d.msg).join(' ');
    throw new ApiError(msg || `Server menjawab dengan kode ${res.status}.`, res.status);
  }
  return data;
}

export const identity = () => {
  const s = store.get();
  return { student_code: s.studentCode, class_code: s.classCode || '' };
};
