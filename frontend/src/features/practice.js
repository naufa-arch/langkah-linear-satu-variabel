// F6 tahap 4: Latihan mandiri dengan angka acak, petunjuk bertingkat, dan umpan balik miskonsepsi.
import { practiceProblem, hintFor } from '../math/practice.js';
import { solve, diagnose, evalSide, toInterval, fmtNum, relSymbol, holds, generate } from '../math/linear.js';
import { statementHTML, relHTML } from '../components/mathexpr.js';
import { numberLineSVG, numberLineLegend } from '../components/numberline.js';
import { esc } from '../lib/dom.js';
import * as store from '../lib/store.js';

export const title = 'Latihan Mandiri';

const LEVEL_LABEL = { mudah: 'Mudah', sedang: 'Sedang', sulit: 'Sulit' };
const TYPE_LABEL = { PLSV: 'Persamaan', PtLSV: 'Pertidaksamaan', campur: 'Campur' };
const MSG = {
  M2: 'Nilainya sudah benar, tetapi coba lihat langkah terakhir: kamu membagi dengan bilangan <b>negatif</b>. Apa yang harus terjadi pada tanda?',
  M3: 'Nilainya sudah benar, tetapi tandanya tidak perlu dibalik. Tanda hanya dibalik saat <b>mengali atau membagi</b> kedua ruas dengan bilangan <b>negatif</b>.',
  M4: 'Batasnya sudah benar. Sekarang periksa apakah batas itu <b>termasuk</b>: pakai ≤ atau ≥ jika termasuk, &lt; atau &gt; jika tidak.',
  M6: 'Periksa langkah memindahkan konstanta. Yang dilakukan adalah <b>mengurangi (atau menambah) kedua ruas</b> dengan bilangan yang sama, jadi tandanya berubah.',
  rel: 'Tandanya belum tepat. Ingat, tanda hanya dibalik saat membagi dengan bilangan negatif.',
};

export function mount(el) {
  const saved = store.get().practice || {};
  let level = saved.level || 'sedang';
  let type = saved.type || 'campur';
  const score = { tried: saved.tried || 0, correct: saved.correct || 0, streak: 0 };
  let p, sol, input, rel, attempts, hint, result, lastMsg;

  function save() { store.set({ practice: { level, type, tried: score.tried, correct: score.correct } }); }
  function next(sameForm) {
    const seed = (Math.random() * 1e9) | 0;
    // soal kembar = bentuk & jenis yang sama, angka berbeda (PRD F6)
    p = sameForm ? generate(p.form, { type: p.type, seed }) : practiceProblem(level, type, seed);
    sol = solve(p);
    input = ''; rel = p.type === 'PLSV' ? '=' : null; attempts = 0; hint = 0; result = null; lastMsg = '';
    render();
  }

  function answerHTML() {
    const disp = input === '' ? '<span class="ph">?</span>' : esc(input.replace('-', '−'));
    const relPart = p.type === 'PLSV'
      ? relHTML('=')
      : `<span class="relpick">${['<', '>', '<=', '>='].map((r) => `<button class="kbtn small" type="button" data-relp="${r}" aria-pressed="${rel === r}">${esc(relSymbol(r))}</button>`).join('')}</span>`;
    return `<div class="answer-row"><span class="v"><span class="xbox">x</span></span>${relPart}<span class="numbox" aria-live="polite">${disp}</span></div>`;
  }

  function keypad() {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '±', '0', '⌫'];
    return `<div class="keypad">${keys.map((k) => `<button class="kbtn" type="button" data-key="${k}" aria-label="${k === '±' ? 'ubah tanda plus minus' : k === '⌫' ? 'hapus' : k}">${k === '±' ? '±' : k}</button>`).join('')}</div>`;
  }

  function hintHTML() {
    if (!hint) return '';
    const h = hintFor(p);
    const parts = [`<p><b>Petunjuk 1.</b> ${esc(h.arah)}</p>`];
    if (hint >= 2 && h.first) parts.push(`<p><b>Petunjuk 2.</b> Langkah pertama: ${statementHTML(h.first.after)}</p>`);
    if (hint >= 3) parts.push(`<ol class="steps">${h.steps.map((x) => `<li class="step${x.flipped ? ' flipped' : ''}"><div class="eq-line">${statementHTML(x.after)}</div><p class="why">${x.reason}</p></li>`).join('')}</ol>`);
    return `<div class="hintbox">${parts.join('')}</div>`;
  }

  function render() {
    const ok = result === 'ok';
    const showSteps = !ok && attempts >= 3;
    const canCheck = input !== '' && input !== '-' && rel !== null && !ok;
    const nl = ok && p.type === 'PtLSV' ? numberLineSVG(toInterval(sol.rel, sol.value)) + numberLineLegend() : '';
    el.innerHTML = `<div class="screen">
      <div class="chips" role="group" aria-label="Tingkat">${Object.entries(LEVEL_LABEL).map(([k, v]) => `<button class="chip-btn" type="button" data-level="${k}" aria-pressed="${level === k}">${v}</button>`).join('')}</div>
      <div class="chips" role="group" aria-label="Jenis soal">${Object.entries(TYPE_LABEL).map(([k, v]) => `<button class="chip-btn" type="button" data-type="${k}" aria-pressed="${type === k}">${v}</button>`).join('')}</div>
      <p class="tally"><span>Benar <b>${score.correct}</b></span><span>Dicoba <b>${score.tried}</b></span><span>Beruntun <b>${score.streak}</b></span></p>
      <div class="eq sticky"><span class="eq-label">Selesaikan ${p.type === 'PLSV' ? 'persamaan' : 'pertidaksamaan'} ini</span><div class="eq-main">${statementHTML(p)}</div></div>
      <div class="eq answer"><span class="eq-label">Jawabanmu</span>${answerHTML()}</div>
      ${result ? `<p class="fb" data-tone="${ok ? 'ok' : 'warn'}" aria-live="polite"><span class="ic">${ok ? '✓' : '!'}</span><span class="t">${lastMsg}</span></p>` : ''}
      ${nl}
      ${showSteps ? `<div class="hintbox"><p><b>Langkah penyelesaian</b></p><ol class="steps">${sol.steps.map((x) => `<li class="step${x.flipped ? ' flipped' : ''}"><div class="eq-line">${statementHTML(x.after)}</div><p class="why">${x.reason}</p></li>`).join('')}</ol></div>` : hintHTML()}
      ${ok ? '' : keypad()}
      <div class="bottombar">
        ${ok ? '<button class="btn" type="button" data-act="twin">Soal mirip</button><button class="btn primary" type="button" data-act="new">Soal berikutnya ▶</button>'
             : showSteps ? '<button class="btn" type="button" data-act="new">Lewati</button><button class="btn primary" type="button" data-act="twin">Coba soal kembar ▶</button>'
             : `<button class="btn" type="button" data-act="hint" ${hint >= 3 ? 'disabled' : ''}>${hint ? 'Petunjuk lagi' : 'Petunjuk'}</button>
                <button class="btn primary" type="button" data-act="check" ${canCheck ? '' : 'disabled'}>Periksa</button>`}
      </div></div>`;
  }

  function check() {
    const value = Number(input);
    const d = diagnose(p, { rel, value });
    attempts++;
    if (attempts === 1) score.tried++;
    if (d.ok) {
      result = 'ok';
      if (attempts === 1 && hint === 0) score.streak++; else score.streak = 0;
      score.correct++;
      lastMsg = attempts === 1 && hint === 0 ? 'Tepat!' : 'Tepat! Kamu berhasil menemukannya.';
      if (p.type === 'PtLSV') lastMsg += ` Himpunan penyelesaiannya {x | x ${relSymbol(sol.rel)} ${fmtNum(sol.value)}, x ∈ R}.`;
      if (score.correct >= 5) store.markDone('latihan');
    } else {
      result = 'no';
      score.streak = 0;
      if (MSG[d.code]) lastMsg = MSG[d.code];
      else {
        // cek dengan memasukkan jawaban ke soal awal (F7)
        const lv = evalSide(p.left, value), rv = evalSide(p.right, value);
        lastMsg = p.type === 'PLSV'
          ? `Belum tepat. Cek: jika x = ${fmtNum(value)}, ruas kiri = ${fmtNum(lv)} dan ruas kanan = ${fmtNum(rv)}. Keduanya belum sama.`
          : `Belum tepat. Batasnya belum benar. Coba masukkan x = ${fmtNum(value)} ke soal awal: ruas kiri ${fmtNum(lv)}, ruas kanan ${fmtNum(rv)}${holds(p.rel, lv, rv) ? '' : ' (tidak memenuhi)'}.`;
      }
      if (attempts === 2 && hint === 0) lastMsg += ' Kamu boleh membuka <b>Petunjuk</b>.';
      if (attempts >= 3) lastMsg += ' Lihat langkah penyelesaiannya, lalu coba soal kembar dengan angka berbeda.';
    }
    save();
    render();
  }

  const onClick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    if (d.level) { level = d.level; save(); return next(); }
    if (d.type) { type = d.type; save(); return next(); }
    if (d.relp) { rel = d.relp; if (result === 'no') result = null; return render(); }
    if (d.key) {
      if (d.key === '⌫') input = input.slice(0, -1);
      else if (d.key === '±') input = input.startsWith('-') ? input.slice(1) : '-' + input;
      else if (input.replace('-', '').length < 3) input = (input === '0' ? '' : input === '-0' ? '-' : input) + d.key;
      if (result === 'no') result = null;
      return render();
    }
    switch (d.act) {
      case 'check': return check();
      case 'hint': hint = Math.min(3, hint + 1); return render();
      case 'new': return next(false);
      case 'twin': return next(true);
      default:
    }
  };
  el.addEventListener('click', onClick);
  p = practiceProblem(level, type, (Math.random() * 1e9) | 0);
  next(false);
  return () => el.removeEventListener('click', onClick);
}
