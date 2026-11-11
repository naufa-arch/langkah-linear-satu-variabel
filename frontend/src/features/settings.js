import * as store from '../lib/store.js';
import { esc } from '../lib/dom.js';

export const title = 'Pengaturan';

export function mount(el) {
  let confirmReset = false;
  function render() {
    const s = store.get();
    el.innerHTML = `<div class="screen">
      <dl class="kv"><dt>Kode siswa</dt><dd>${esc(s.studentCode || '–')}</dd><dt>Kode kelas</dt><dd>${esc(s.classCode || '–')}</dd>
        <dt>Pengiriman data</dt><dd>belum aktif</dd></dl>
      <label class="switch" for="reduceMotion"><span>Kurangi gerakan animasi</span>
        <input type="checkbox" id="reduceMotion" ${s.reduceMotion ? 'checked' : ''}></label>
      <a class="btn" href="#/masuk">Ganti kode</a>
      <button class="btn ghost" type="button" id="reset">${confirmReset ? 'Ketuk lagi untuk menghapus semua progres' : 'Hapus progres di HP ini'}</button>
      <p class="note">Progres saat ini hanya tersimpan di HP ini. Pengiriman otomatis ke server peneliti ditambahkan pada tahap berikutnya.</p>
    </div>`;
    el.querySelector('#reduceMotion').addEventListener('change', (e) => {
      store.set({ reduceMotion: e.target.checked });
      window.dispatchEvent(new Event('langkah:prefs'));
    });
    el.querySelector('#reset').addEventListener('click', () => {
      if (!confirmReset) { confirmReset = true; render(); return; }
      const { studentCode, classCode } = store.get();
      store.resetAll(); store.set({ studentCode, classCode });
      confirmReset = false; render();
    });
  }
  render();
}
