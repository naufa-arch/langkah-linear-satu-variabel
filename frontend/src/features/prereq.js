// F1 Cek Prasyarat: 8 soal singkat (bilangan bulat, suku sejenis, distributif) + Ulasan Kilat.
import { prereqQuiz, prereqSummary, PREREQ_CATS } from '../math/practice.js';
import { sideHTML } from '../components/mathexpr.js';
import { REVIEW } from '../content/review.js';
import { esc } from '../lib/dom.js';
import * as store from '../lib/store.js';

export const title = 'Cek Prasyarat';

export function mount(el) {
  let qs, picks, i, mode, reviewCat, reviewPage;
  function start() {
    qs = prereqQuiz((Math.random() * 1e9) | 0);
    picks = new Array(qs.length).fill(null);
    i = 0; mode = 'q';
    render();
  }

  function renderIntro() {
    el.innerHTML = `<div class="screen">
      <h2>Sebelum mulai, cek dulu bekalmu</h2>
      <p class="lede">Ada 8 soal singkat tentang operasi bilangan bulat, suku sejenis, dan tanda kurung. Ini bukan ulangan. Hasilnya hanya untuk menentukan bagian mana yang perlu diulas.</p>
      <ul class="cats">${Object.values(PREREQ_CATS).map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
      <div class="bottombar single"><button class="btn primary" type="button" data-act="start">Mulai cek ▶</button></div></div>`;
  }

  function renderQ() {
    const q = qs[i];
    const picked = picks[i];
    const answered = picked !== null;
    const opts = q.options.map((o, j) => {
      let state = '';
      if (answered && j === q.answer) state = 'ok';
      else if (answered && j === picked) state = 'no';
      return `<button class="btn opt-big" type="button" data-pick="${j}" ${answered ? 'disabled' : ''} ${state ? `data-picked="${state}"` : ''}>${sideHTML(o)}</button>`;
    }).join('');
    const right = answered && picked === q.answer;
    el.innerHTML = `<div class="screen">
      <div class="progress" aria-label="Soal ${i + 1} dari ${qs.length}">${qs.map((_, j) => `<i class="${j < i ? 'past' : j === i ? 'now' : ''}"></i>`).join('')}</div>
      <p class="eyebrow">${esc(PREREQ_CATS[q.cat])} · soal ${i + 1} dari ${qs.length}</p>
      <div class="eq"><span class="eq-label">${esc(q.verb)}</span><div class="eq-main">${esc(q.prompt)}</div></div>
      <div class="grid2">${opts}</div>
      ${answered ? `<p class="fb" data-tone="${right ? 'ok' : 'warn'}" aria-live="polite"><span class="ic">${right ? '✓' : '!'}</span><span class="t">${right ? 'Tepat. ' : 'Belum tepat. '}${esc(q.explain)}</span></p>` : ''}
      <div class="bottombar single"><button class="btn primary" type="button" data-act="next" ${answered ? '' : 'disabled'}>${i === qs.length - 1 ? 'Lihat hasil ▶' : 'Lanjut ▶'}</button></div></div>`;
  }

  function renderResult() {
    const sum = prereqSummary(qs, picks);
    store.set({ prereq: Object.fromEntries(Object.entries(sum).map(([k, v]) => [k, v.weak ? 'perlu-ulasan' : 'lancar'])) });
    store.markDone('cek-prasyarat');
    const weak = Object.entries(sum).filter(([, v]) => v.weak);
    el.innerHTML = `<div class="screen">
      <h2>${weak.length ? 'Ada bagian yang perlu diulas sebentar' : 'Bekalmu sudah lancar'}</h2>
      <ul class="scores">${Object.entries(sum).map(([cat, v]) => `<li>
        <div class="score-head"><span>${esc(PREREQ_CATS[cat])}</span><span class="pill ${v.weak ? 'warn' : 'ok'}">${v.weak ? 'perlu ulasan' : 'lancar'}</span></div>
        <div class="bar" role="img" aria-label="${v.correct} dari ${v.total} benar"><i style="width:${(100 * v.correct) / v.total}%"></i></div>
        <small>${v.correct} dari ${v.total} benar</small></li>`).join('')}</ul>
      <div class="actions">
        ${weak.map(([cat]) => `<button class="btn primary" type="button" data-review="${cat}">Ulasan kilat: ${esc(PREREQ_CATS[cat])}</button>`).join('')}
        <a class="btn ${weak.length ? '' : 'primary'}" href="#/timbangan">Lanjut ke Persamaan (PLSV) ▶</a>
        <button class="btn ghost" type="button" data-act="start">Ulangi cek dengan soal baru</button>
      </div></div>`;
  }

  function renderReview() {
    const pages = REVIEW[reviewCat];
    const p = pages[reviewPage];
    const last = reviewPage === pages.length - 1;
    el.innerHTML = `<div class="screen">
      <p class="eyebrow">Ulasan kilat · ${esc(PREREQ_CATS[reviewCat])} · ${reviewPage + 1}/${pages.length}</p>
      <div class="review"><h2>${esc(p.title)}</h2>${p.body}</div>
      <div class="bottombar">
        <button class="btn" type="button" data-act="rprev" ${reviewPage === 0 ? 'disabled' : ''}>Kembali</button>
        <button class="btn primary" type="button" data-act="${last ? 'rdone' : 'rnext'}">${last ? 'Selesai ✓' : 'Berikutnya ▶'}</button>
      </div></div>`;
  }

  function render() {
    if (mode === 'intro') renderIntro();
    else if (mode === 'q') renderQ();
    else if (mode === 'result') renderResult();
    else renderReview();
    window.scrollTo(0, 0);
  }

  const onClick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.pick !== undefined) { picks[i] = Number(b.dataset.pick); return render(); }
    if (b.dataset.review) { reviewCat = b.dataset.review; reviewPage = 0; mode = 'review'; return render(); }
    switch (b.dataset.act) {
      case 'start': return start();
      case 'next': if (i < qs.length - 1) { i++; } else { mode = 'result'; } return render();
      case 'rprev': reviewPage--; return render();
      case 'rnext': reviewPage++; return render();
      case 'rdone': mode = 'result'; return render();
      default:
    }
  };
  el.addEventListener('click', onClick);
  mode = 'intro'; render();
  return () => el.removeEventListener('click', onClick);
}
