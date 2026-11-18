// Evaluasi: Instrumen Mathematical Literacy (5 soal uraian, skor maks 30).
// - Pre-test / post-test: tanpa bantuan AI & tanpa kunci; dinilai peneliti dengan rubrik (dasbor peneliti).
// - Latihan: setelah dikumpulkan, pembahasan dari server ditampilkan dan bisa didiskusikan dengan Tutor AI.
// Jawaban tersimpan otomatis di HP (per siswa) dan dikirim saat online.
import * as store from '../lib/store.js';
import { esc } from '../lib/dom.js';
import { api, identity } from '../lib/api.js';
import * as sync from '../lib/sync.js';
import { LITERASI } from '../content/literasi.js';
import { icon } from '../components/icons.js';
import { toast, fmtDate } from '../components/ui.js';
import { openTutor } from './tutor.js';

export const title = 'Evaluasi';
export const tab = 'hasil';
export const nav = (params) => !params[0];

const KINDS = {
  pretest: { label: 'Pre-test', icon: 'flag', desc: 'Dikerjakan sebelum belajar. Kerjakan sendiri, tanpa bantuan.' },
  posttest: { label: 'Post-test', icon: 'medal', desc: 'Dikerjakan setelah belajar. Kerjakan sendiri, tanpa bantuan.' },
  latihan: { label: 'Latihan literasi', icon: 'pencil', desc: 'Untuk berlatih. Setelah dikumpulkan, pembahasan langsung muncul.' },
};
const SOAL = LITERASI.soal;

export function mount(el, params) {
  let d = store.getDraft('evaluasi');
  let kind = d?.kind || 'latihan';
  let view = params[0] === 'hasil' && params[1] ? 'result' : params[0] === 'kerja' && d ? 'item' : 'intro';
  let i = d?.i || 0;
  let confirm = false;
  let resultId = params[1] || null;
  let alive = true;
  let saveTimer = null;

  const save = () => { if (d) store.setDraft('evaluasi', { ...d, i }); };
  const filled = (sid) => (d.answers[sid] || []).filter((x) => x.trim()).length;

  function renderIntro() {
    const past = store.attempts();
    el.innerHTML = `<div class="screen">
      <div class="card soft"><h3>${icon('clipboard', 20)} ${esc(LITERASI.judul)}</h3>
        <p class="muted">${esc(LITERASI.materi)} · ${SOAL.length} soal uraian · skor maksimum ${LITERASI.skor_maks}</p></div>
      <div class="kind-cards" role="group" aria-label="Jenis tes">${Object.entries(KINDS).map(([k, v]) => `<button class="kind-card" type="button" data-kind="${k}" aria-pressed="${kind === k}">
        <span class="r-ic">${icon(v.icon, 20)}</span><span><b>${v.label}</b><small>${v.desc}</small></span></button>`).join('')}</div>
      <details class="collapse"><summary>${icon('list', 18)} Petunjuk pengerjaan</summary><div><ol class="tight">${LITERASI.petunjuk.map((p) => `<li>${esc(p)}</li>`).join('')}</ol></div></details>
      ${kind !== 'latihan' ? '<p class="fb" data-tone="info"><span class="ic">i</span><span class="t">Selama tes, Tutor AI dan pembahasan tidak tersedia. Jawabanmu tersimpan otomatis walau internet putus.</span></p>' : ''}
      ${d ? `<div class="card accent"><p><b>Ada pengerjaan yang belum dikumpulkan</b></p><p class="muted">${KINDS[d.kind].label} · dimulai ${fmtDate(d.startedAt)}</p>
        <a class="btn primary" href="#/evaluasi/kerja">${icon('play', 16)} Lanjutkan pengerjaan</a>
        <button class="btn ghost small" type="button" data-act="discard">${confirm ? 'Ketuk lagi: jawaban yang belum dikumpulkan akan dihapus' : 'Buang dan mulai baru'}</button></div>`
        : `<button class="btn primary" type="button" data-act="start">${icon('play', 16)} Mulai ${KINDS[kind].label}</button>`}
      ${past.length ? `<div class="section-title"><h3>Riwayat pengerjaan</h3></div>
        <ul class="rows">${past.map((a) => `<li><a href="#/evaluasi/hasil/${a.id}"><span class="r-ic">${icon(KINDS[a.kind]?.icon || 'clipboard', 18)}</span>
          <span class="r-main"><b>${KINDS[a.kind]?.label || a.kind}</b><small>${fmtDate(a.submittedAt)}</small></span>
          <span class="pill ${a.sent ? 'ok' : 'warn'}">${a.sent ? 'terkirim' : 'menunggu internet'}</span></a></li>`).join('')}</ul>` : ''}
    </div>`;
  }

  function renderItem() {
    const q = SOAL[i];
    const ans = d.answers[q.id];
    el.innerHTML = `<div class="screen">
      <div class="qnav" role="tablist" aria-label="Nomor soal">${SOAL.map((s, j) => `<button type="button" data-go="${j}" aria-current="${j === i}" class="${filled(s.id) ? 'filled' : ''}" aria-label="Soal ${j + 1}">${j + 1}</button>`).join('')}
        <button type="button" data-act="review" aria-label="Periksa semua jawaban" style="width:auto;padding:0 12px">${icon('check', 18)}</button></div>
      <p class="eyebrow">${KINDS[d.kind].label} · Soal ${i + 1} dari ${SOAL.length}</p>
      ${d.kind === 'latihan' ? `<span class="indikator">${icon('target', 14)} ${esc(q.indikator)}</span>` : ''}
      <div class="story-box"><h3>${esc(q.judul)}</h3><p>${esc(q.stimulus)}</p></div>
      ${q.tahap.map((t, j) => `<div class="part"><label for="a${j}"><span class="n">${j + 1}</span><span>${esc(t.pertanyaan)}</span></label>
        <textarea id="a${j}" data-part="${j}" maxlength="3000" placeholder="Tulis jawabanmu…">${esc(ans[j] || '')}</textarea></div>`).join('')}
      <p class="saved" id="saved">${icon('check', 14)} Tersimpan otomatis di HP ini</p>
      <div class="bottombar">
        <button class="btn" type="button" data-act="prevq">${i === 0 ? 'Keluar' : 'Sebelumnya'}</button>
        <button class="btn primary" type="button" data-act="nextq">${i === SOAL.length - 1 ? 'Periksa & kumpulkan' : 'Soal berikutnya ▶'}</button>
      </div></div>`;
    el.querySelectorAll('textarea[data-part]').forEach((ta) => ta.addEventListener('input', () => {
      d.answers[q.id][Number(ta.dataset.part)] = ta.value;
      clearTimeout(saveTimer); saveTimer = setTimeout(save, 300);
    }));
  }

  function renderReview() {
    const empty = SOAL.reduce((n, s) => n + s.tahap.length - filled(s.id), 0);
    el.innerHTML = `<div class="screen">
      <h2>Periksa sebelum dikumpulkan</h2>
      <ul class="rows">${SOAL.map((s, j) => `<li><button class="rowbtn" type="button" data-go="${j}"><span class="r-ic">${filled(s.id) === s.tahap.length ? icon('check', 18) : j + 1}</span>
        <span class="r-main"><b>${esc(s.judul)}</b><small>${filled(s.id)} dari ${s.tahap.length} bagian terisi</small></span><span class="r-end">${icon('chevron', 18)}</span></button></li>`).join('')}</ul>
      ${empty ? `<p class="fb" data-tone="warn"><span class="ic">!</span><span class="t">Masih ada ${empty} bagian kosong. Bagian kosong tetap boleh dikumpulkan, tetapi akan bernilai 0.</span></p>` : '<p class="fb" data-tone="ok"><span class="ic">✓</span><span class="t">Semua bagian sudah terisi.</span></p>'}
      <div class="bottombar">
        <button class="btn" type="button" data-go="${SOAL.length - 1}">Kembali</button>
        <button class="btn primary" type="button" data-act="submit">${confirm ? 'Ketuk lagi untuk mengumpulkan' : 'Kumpulkan jawaban'}</button>
      </div></div>`;
  }

  async function renderResult() {
    const att = store.attempts().find((a) => a.id === resultId);
    if (!att) { view = 'intro'; return render(); }
    el.innerHTML = `<div class="screen">
      <div class="hero"><div><p class="eyebrow">${KINDS[att.kind]?.label || ''} · ${fmtDate(att.submittedAt)}</p>
        <h2>Jawaban sudah dikumpulkan</h2><p id="sendState">${att.sent ? 'Sudah terkirim ke server peneliti.' : 'Menunggu internet untuk dikirim. Jawaban aman di HP ini.'}</p></div>
        <div class="ring"><b style="font-size:34px">${att.sent ? '✓' : '⏳'}</b></div></div>
      <div id="resBody"><div class="skeleton"><i></i></div></div>
      <a class="btn" href="#/evaluasi">Kembali ke Evaluasi</a>
    </div>`;
    const body = el.querySelector('#resBody');
    if (!att.sent) await sync.flush();
    const fresh = store.attempts().find((a) => a.id === resultId);
    if (!alive) return;
    if (!fresh?.sent) { body.innerHTML = '<p class="note">Hasil dan pembahasan muncul setelah jawaban terkirim.</p>'; return; }
    el.querySelector('#sendState').textContent = 'Sudah terkirim ke server peneliti.';
    try {
      const res = await api(`/literasi/attempts/${att.id}/hasil`, { method: 'POST', body: identity() });
      if (!alive) return;
      const scoreTxt = res.dinilai ? `<div class="card"><p class="eyebrow">Skor dari guru/peneliti</p><p class="big">${res.total} / ${res.maks}</p></div>`
        : `<p class="fb" data-tone="info"><span class="ic">i</span><span class="t">Jawabanmu sedang menunggu dinilai oleh guru/peneliti${att.kind === 'latihan' ? '' : '. Skor akan muncul di sini dan di halaman Hasil'}.</span></p>`;
      const pem = res.pembahasan ? SOAL.map((s) => `<details class="collapse"><summary>${icon('book', 18)} ${esc(s.judul)}</summary><div>
        ${s.tahap.map((t, j) => `<div class="part"><b>${j + 1}. ${esc(t.pertanyaan)}</b>
          <p class="muted"><b>Jawabanmu:</b> ${esc(att.answers[s.id][j] || '(kosong)')}</p>
          <p class="key"><b>Pembahasan:</b> ${esc(res.pembahasan[s.id][j])}</p></div>`).join('')}
        <button class="btn soft small" type="button" data-discuss="${s.id}">${icon('spark', 18)} Diskusikan soal ini dengan Tutor AI</button></div></details>`).join('') : '';
      body.innerHTML = scoreTxt + (pem ? `<div class="section-title"><h3>Pembahasan</h3></div>${pem}` : '');
      body.dataset.pem = res.pembahasan ? JSON.stringify(res.pembahasan) : '';
    } catch (e) {
      body.innerHTML = `<p class="fb" data-tone="warn"><span class="ic">!</span><span class="t">${esc(e.message)}</span></p>`;
    }
  }

  function render() {
    window.scrollTo(0, 0);
    if (view === 'intro') renderIntro();
    else if (view === 'item') renderItem();
    else if (view === 'review') renderReview();
    else renderResult();
  }

  function start() {
    d = { id: store.uuid(), kind, startedAt: new Date().toISOString(), answers: Object.fromEntries(SOAL.map((s) => [s.id, s.tahap.map(() => '')])) };
    i = 0; save(); view = 'item';
    store.log('evaluasi.mulai', { kind, id: d.id });
    location.hash = '#/evaluasi/kerja';
  }

  async function submit() {
    if (!confirm) { confirm = true; return render(); }
    const att = { ...d, submittedAt: new Date().toISOString(), sent: false };
    delete att.i;
    store.addAttempt(att);
    store.setDraft('evaluasi', null);
    store.log('evaluasi.kumpul', { kind: att.kind, id: att.id, terisi: SOAL.reduce((n, s) => n + filled(s.id), 0) });
    store.markDone('evaluasi');
    d = null; confirm = false;
    toast('Jawaban dikumpulkan ✓');
    location.hash = `#/evaluasi/hasil/${att.id}`;
  }

  const onClick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.kind) { kind = b.dataset.kind; return render(); }
    if (b.dataset.go !== undefined) { save(); i = Number(b.dataset.go); view = 'item'; confirm = false; return render(); }
    if (b.dataset.discuss) {
      const s = SOAL.find((x) => x.id === b.dataset.discuss);
      const att = store.attempts().find((a) => a.id === resultId);
      const pem = JSON.parse(el.querySelector('#resBody').dataset.pem || '{}');
      return openTutor({
        mode: 'pembahasan', label: s.judul,
        context: { soal: s.stimulus.slice(0, 900), jawaban_siswa: (att.answers[s.id] || []).map((x, j) => `${j + 1}) ${x || '-'}`).join(' ').slice(0, 1200), pembahasan_resmi: (pem[s.id] || []).join(' ').slice(0, 1400) },
        first: 'Tolong bantu aku memahami soal ini dan bagian jawabanku yang masih keliru.',
      });
    }
    switch (b.dataset.act) {
      case 'start': return start();
      case 'discard':
        if (!confirm) { confirm = true; return render(); }
        store.log('evaluasi.buang', { id: d.id, kind: d.kind });
        store.setDraft('evaluasi', null); d = null; confirm = false; return render();
      case 'review': save(); view = 'review'; return render();
      case 'prevq': save(); if (i === 0) { location.hash = '#/evaluasi'; return undefined; } i--; return render();
      case 'nextq': save(); if (i === SOAL.length - 1) { view = 'review'; } else { i++; } return render();
      case 'submit': return submit();
      default:
    }
  };
  el.addEventListener('click', onClick);
  if (params[0] === 'kerja' && !d) { location.replace('#/evaluasi'); return () => el.removeEventListener('click', onClick); }
  render();
  return () => { alive = false; clearTimeout(saveTimer); save(); el.removeEventListener('click', onClick); };
}
