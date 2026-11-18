import * as store from '../lib/store.js';
import { esc } from '../lib/dom.js';
import { icon } from '../components/icons.js';

export const title = 'Selamat datang';
export const nav = false;

const CODE = /^[A-Z0-9-]{2,12}$/;

export function mount(el) {
  const s = store.get();
  el.innerHTML = `<form class="screen" id="enroll" novalidate>
    <div class="enroll-hero"><img class="logo" src="icons/icon-192.png" alt="" width="84" height="84">
      <p class="eyebrow">Langkah Linear</p><h2>Belajar persamaan & pertidaksamaan, selangkah demi selangkah</h2></div>
    <ul class="feature-list">
      <li>${icon('book', 22)}Materi bertahap</li>
      <li>${icon('spark', 22)}Tutor AI</li>
      <li>${icon('brain', 22)}Berpikir teliti</li>
    </ul>
    <div class="card">
      <p class="lede">Masukkan kode dari gurumu. <b>Jangan tulis nama asli.</b></p>
      <div class="field"><label for="classCode">Kode kelas</label>
        <input type="text" id="classCode" autocomplete="off" autocapitalize="characters" inputmode="text" maxlength="12" placeholder="8B-KDH" value="${esc(s.classCode || '')}">
        <small>Boleh dikosongkan jika belum ada.</small></div>
      <div class="field"><label for="studentCode">Kode siswa</label>
        <input type="text" id="studentCode" autocomplete="off" autocapitalize="characters" inputmode="text" maxlength="12" placeholder="S-07" value="${esc(s.studentCode || '')}" required>
        <small>Huruf, angka, atau tanda hubung (2–12 karakter).</small></div>
      <p class="fb" id="enrollFb" data-tone="info" hidden><span class="ic">!</span><span class="t"></span></p>
      <button class="btn primary" type="submit">Mulai belajar ${icon('play', 16)}</button>
    </div>
    <p class="note center">Jawabanmu dipakai untuk penelitian pendidikan matematika dan hanya dikenali lewat kode, bukan nama.
      Jika satu HP dipakai bergantian, setiap kode punya progres sendiri.</p>
    <a class="btn ghost small" href="#/peneliti">${icon('key', 18)} Masuk sebagai peneliti/guru</a>
  </form>`;

  const form = el.querySelector('#enroll');
  const fb = el.querySelector('#enrollFb');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const student = form.studentCode.value.trim().toUpperCase();
    const klass = form.classCode.value.trim().toUpperCase();
    const bad = !CODE.test(student) ? 'Kode siswa' : klass && !CODE.test(klass) ? 'Kode kelas' : null;
    if (bad) {
      fb.hidden = false; fb.dataset.tone = 'warn';
      fb.querySelector('.t').textContent = `${bad} hanya boleh berisi huruf, angka, atau tanda hubung, 2–12 karakter. Contoh: S-07.`;
      return;
    }
    store.set({ studentCode: student, classCode: klass });
    store.log('sesi.masuk', {});
    // layar masuk bisa tampil di alamat #/ (belum ada kode); paksa router memuat ulang beranda
    if (location.hash === '#/' || location.hash === '') window.dispatchEvent(new HashChangeEvent('hashchange'));
    else location.hash = '#/';
  });
}
