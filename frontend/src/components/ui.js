// Komponen tampilan kecil yang dipakai banyak layar.
import { esc } from '../lib/dom.js';
import { icon } from './icons.js';
import { api } from '../lib/api.js';
import { isNative } from '../config.js';

// Cincin progres. pct 0–100.
export function ring(pct, { label = '', dark = false, size = 86 } = {}) {
  const r = 38, c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return `<div class="ring${dark ? ' dark' : ''}" style="width:${size}px;height:${size}px" role="img" aria-label="Progres ${pct} persen">
    <svg viewBox="0 0 86 86"><circle class="track" cx="43" cy="43" r="${r}"/><circle class="val" cx="43" cy="43" r="${r}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/></svg>
    <b>${pct}%${label ? `<small>${esc(label)}</small>` : ''}</b></div>`;
}

export const minibar = (pct) => `<div class="minibar" role="img" aria-label="${pct} persen"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></div>`;

export function badgeCard(b) {
  return `<div class="badge-card${b.earned ? ' earned' : ''}" title="${esc(b.desc)}"><span class="b-ic">${icon(b.icon, 22)}</span><b>${esc(b.title)}</b><small>${esc(b.desc)}</small></div>`;
}

let toastTimer = null;
export function toast(msg, ms = 2600) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), ms);
}

export function fmtDate(iso, withTime = true) {
  try {
    const d = new Date(iso);
    const opt = withTime ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', year: 'numeric' };
    return d.toLocaleString('id-ID', opt);
  } catch { return iso; }
}

// Status tutor AI (disimpan sebentar agar tidak memanggil server terus-menerus).
let aiCache = null;
export async function aiStatus(force = false) {
  if (!force && aiCache && Date.now() - aiCache.t < 60000) return aiCache.v;
  try {
    const v = await api('/ai/status', { timeout: 15000 });
    aiCache = { t: Date.now(), v };
    return v;
  } catch (e) {
    return { available: false, error: e.message };
  }
}

// Unduh teks sebagai berkas (CSV/JSON). Di aplikasi Android (WebView) unduhan blob tidak didukung,
// jadi kembalikan false agar layar menampilkan teksnya untuk disalin.
export function downloadText(name, text, type = 'text/plain') {
  if (isNative()) return false;
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return true;
}
