// Profil & Pengaturan: kode siswa, tampilan, status server & Tutor AI, pengiriman data, reset.
import * as store from '../lib/store.js';
import { esc } from '../lib/dom.js';
import { api, apiBase } from '../lib/api.js';
import * as sync from '../lib/sync.js';
import { APP_VERSION, REMOTE_API, isNative } from '../config.js';
import { icon } from '../components/icons.js';
import { aiStatus, toast } from '../components/ui.js';

export const title = 'Profil & Pengaturan';

export function mount(el) {
  let confirmReset = false;
  let server = null; // {ok, ai, provider}
  let alive = true;

  async function check() {
    server = null; render();
    try {
      const h = await api('/health', { timeout: 20000 });
      const ai = await aiStatus(true);
      server = { ok: h.status === 'ok', ai: ai.available, provider: ai.provider, model: ai.model };
    } catch (e) { server = { ok: false, error: e.message }; }
    if (alive) render();
  }

  function render() {
    const s = store.get();
    const sy = sync.status();
    const initials = (s.studentCode || '?').replace(/[^A-Z0-9]/g, '').slice(0, 3);
    el.innerHTML = `<div class="screen">
      <div class="card"><div class="profile-head"><span class="avatar">${esc(initials)}</span>
        <div><p class="eyebrow">Kode siswa</p><h2>${esc(s.studentCode || '–')}</h2><p class="muted">${s.classCode ? 'Kelas ' + esc(s.classCode) : 'Tanpa kode kelas'}</p></div></div>
        <a class="btn small" href="#/masuk">${icon('user', 18)} Ganti kode / pengguna lain</a></div>

      <div class="section-title"><h3>${icon('eye', 18)} Tampilan</h3></div>
      <div class="segtabs" role="group" aria-label="Tema">${[['auto', 'Otomatis'], ['light', 'Terang'], ['dark', 'Gelap']].map(([k, v]) => `<button type="button" data-theme="${k}" aria-pressed="${(s.theme || 'auto') === k}">${v}</button>`).join('')}</div>
      <label class="switch" for="reduceMotion"><span>Kurangi gerakan animasi</span>
        <input type="checkbox" id="reduceMotion" ${s.reduceMotion ? 'checked' : ''}></label>

      <div class="section-title"><h3>${icon('cloud', 18)} Server & Tutor AI</h3></div>
      <div class="card">
        <p class="score-head"><span>Server</span>${server === null ? '<span class="spinner"></span>' : `<span class="pill ${server.ok ? 'ok' : 'warn'}">${server.ok ? 'tersambung' : 'tidak tersambung'}</span>`}</p>
        <p class="score-head"><span>Tutor AI</span>${server === null ? '' : `<span class="pill ${server.ai ? 'ok' : 'warn'}">${server.ai ? `aktif (${esc(server.provider === 'deepseek' ? 'DeepSeek' : 'Gemini')})` : 'belum aktif'}</span>`}</p>
        ${server && server.error ? `<p class="note">${esc(server.error)}</p>` : ''}
        <p class="score-head"><span>Data menunggu dikirim</span><b>${sy.pending}</b></p>
        <div class="row2"><button class="btn small" type="button" data-act="check">${icon('refresh', 18)} Cek ulang</button>
          <button class="btn small" type="button" data-act="sync">${icon('send', 18)} Kirim data</button></div>
      </div>
      <details class="collapse"><summary>${icon('gear', 18)} Pengaturan lanjutan</summary><div>
        <div class="field"><label for="apiBase">Alamat server</label>
          <input type="url" class="plain" id="apiBase" inputmode="url" autocomplete="off" placeholder="${esc(isNative() ? REMOTE_API : 'kosong = server ini')}" value="${esc(s.apiBase || '')}">
          <small>Sekarang: ${esc(apiBase())}. Kosongkan untuk memakai alamat bawaan. Untuk uji di Wi-Fi: http://IP-LAPTOP:8000</small></div>
        <button class="btn small" type="button" data-act="saveApi">Simpan alamat</button>
      </div></details>

      <div class="section-title"><h3>${icon('lock', 18)} Data di HP ini</h3></div>
      <button class="btn ghost" type="button" id="reset">${confirmReset ? 'Ketuk lagi untuk menghapus progres kode ini' : 'Hapus progres kode ini di HP ini'}</button>
      <p class="note">Menghapus progres tidak menghapus data yang sudah terkirim ke peneliti. Setiap kode siswa punya progres terpisah.</p>
      <a class="btn ghost small" href="#/peneliti">${icon('key', 18)} Dasbor peneliti / guru</a>
      <p class="note center">Langkah Linear v${APP_VERSION} · Model belajar: Rigorous Mathematical Thinking (RMT) dengan prinsip Cognitive Load Theory.</p>
    </div>`;
    el.querySelector('#reduceMotion').addEventListener('change', (e) => {
      store.set({ reduceMotion: e.target.checked });
      window.dispatchEvent(new Event('langkah:prefs'));
    });
  }

  const onClick = async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.theme) { store.set({ theme: b.dataset.theme }); window.dispatchEvent(new Event('langkah:prefs')); return render(); }
    if (b.id === 'reset') {
      if (!confirmReset) { confirmReset = true; return render(); }
      store.resetAll(); confirmReset = false; toast('Progres dihapus.'); return render();
    }
    switch (b.dataset.act) {
      case 'check': return check();
      case 'sync': { const st = await sync.flush(); toast(st.lastError || 'Data terkirim ✓'); if (alive) render(); return undefined; }
      case 'saveApi': {
        const v = el.querySelector('#apiBase').value.trim();
        if (v && !/^https?:\/\/[^\s]+$/i.test(v)) { toast('Alamat harus diawali http:// atau https://'); return undefined; }
        store.set({ apiBase: v }); toast('Alamat server disimpan.'); return check();
      }
      default:
    }
  };
  el.addEventListener('click', onClick);
  render();
  check();
  return () => { alive = false; el.removeEventListener('click', onClick); };
}
