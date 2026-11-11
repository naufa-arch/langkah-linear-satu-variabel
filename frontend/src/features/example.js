// F6 tahap 1: Contoh bertahap. Langkah muncul satu per satu (DESIGN P1, P2, P7).
import { generate, solve, evalSide, holds, check, fmtNum, toInterval, relSymbol, FORMS } from '../math/linear.js';
import { statementHTML } from '../components/mathexpr.js';
import { numberLineSVG, numberLineLegend } from '../components/numberline.js';
import { markDone } from '../lib/store.js';

export const title = 'Contoh Bertahap';

const LABEL = { 'x+b=c': 'x + b ? c', 'ax=c': 'ax ? c', 'ax+b=c': 'ax + b ? c', 'ax+b=cx+d': 'ax + b ? cx + d', 'a(x+b)=c': 'a(x + b) ? c' };
// soal pembuka sama dengan contoh di dokumen perencanaan
const FIRST = {
  PLSV: { form: 'ax+b=c', left: { a: 2, b: 3 }, rel: '=', right: { a: 0, b: 11 } },
  PtLSV: { form: 'ax+b=c', left: { a: -2, b: 0 }, rel: '<', right: { a: 0, b: 6 } },
};

export function mount(el, params) {
  const type = params[0] === 'ptlsv' ? 'PtLSV' : 'PLSV';
  let problem = FIRST[type];
  let form = problem.form;
  let sol = solve(problem);
  let shown = 0;
  let probe = null;

  function newProblem(f) {
    form = f || form;
    problem = generate(form, { type, seed: (Math.random() * 1e9) | 0 });
    sol = solve(problem); shown = 0; probe = null;
    render();
  }

  function resultHTML() {
    const v = sol.value;
    if (type === 'PLSV') {
      const lv = evalSide(problem.left, v), rv = evalSide(problem.right, v);
      return `<div class="result"><p class="eyebrow">Jawaban</p><div class="answer">${statementHTML({ left: { a: 1 }, rel: '=', right: { b: v } })}</div>
        <p class="note">Cek: masukkan x = ${fmtNum(v)} ke soal awal → ruas kiri ${fmtNum(lv)}, ruas kanan ${fmtNum(rv)} ✓</p></div>`;
    }
    const iv = toInterval(sol.rel, v);
    const t = Math.round(v.n / v.d);
    const cands = [t - 2, t, t + 2];
    let probeMsg = 'Pilih satu bilangan, lalu lihat apakah ia memenuhi soal awal.';
    if (probe !== null) {
      const ok = check(problem, probe);
      const inSet = holds(sol.rel, probe, v);
      probeMsg = `x = ${fmtNum(probe)} ${ok ? '<b>memenuhi</b>' : '<b>tidak memenuhi</b>'} soal awal, dan ${fmtNum(probe)} ${inSet ? 'ada di' : 'tidak ada di'} daerah arsiran ${ok === inSet ? '✓ cocok' : ''}`;
    }
    return `<div class="result"><p class="eyebrow">Himpunan penyelesaian</p>
      <div class="answer">HP = {x | x ${relSymbol(sol.rel)} ${fmtNum(v)}, x ∈ R}</div>
      ${numberLineSVG(iv, { probe })}${numberLineLegend()}
      <p class="eyebrow">Cek dengan angka</p>
      <div class="probe">${cands.map((c) => `<button class="btn" type="button" data-probe="${c}" aria-pressed="${probe === c}">x = ${fmtNum(c)}</button>`).join('')}</div>
      <p class="note" aria-live="polite">${probeMsg}</p></div>`;
  }

  function render() {
    const total = sol.steps.length;
    const done = shown >= total;
    const rel = type === 'PLSV' ? '=' : '<';
    const steps = sol.steps.slice(0, shown).map((st, i) => {
      const anim = st.flipped && i === shown - 1 ? 'flip' : '';
      return `<li class="step${st.flipped ? ' flipped' : ''}"><div class="eq-line">${statementHTML(st.after, anim)}</div>
        <p class="why">${st.reason}${st.flipped ? '<span class="tag-flip">tanda dibalik</span>' : ''}</p></li>`;
    }).join('');
    el.innerHTML = `<div class="screen">
      <div class="chips" role="group" aria-label="Bentuk soal">${FORMS.map((f) => `<button class="chip-btn" type="button" data-form="${f}" aria-pressed="${f === form}">${LABEL[f].replace('?', rel === '=' ? '=' : '&lt;')}</button>`).join('')}</div>
      <div class="eq sticky"><span class="eq-label">${type === 'PLSV' ? 'Persamaan' : 'Pertidaksamaan'} · langkah ${Math.min(shown, total)}/${total}</span>
        <div class="eq-main">${statementHTML(problem)}</div></div>
      ${shown === 0 ? `<p class="empty">Tekan <b>Langkah berikutnya</b> untuk melihat langkah pertama. Tujuannya: tinggal <span class="v"><span class="xbox">x</span></span> sendirian di ruas kiri.</p>` : ''}
      <ol class="steps">${steps}</ol>
      ${done ? resultHTML() : ''}
      <div class="bottombar">
        <button class="btn" type="button" data-act="restart" ${shown === 0 ? 'disabled' : ''}>Ulangi</button>
        ${done ? '<button class="btn primary" type="button" data-act="new">Soal lain, angka beda ▶</button>'
               : '<button class="btn primary" type="button" data-act="next">Langkah berikutnya ▶</button>'}
      </div></div>`;
    if (done) markDone(`contoh-${type}`);
    const last = el.querySelector('.step:last-child');
    if (last && shown > 0 && !done) last.scrollIntoView({ block: 'nearest' });
  }

  const onClick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.form) return newProblem(b.dataset.form);
    if (b.dataset.probe !== undefined) { probe = Number(b.dataset.probe); return render(); }
    if (b.dataset.act === 'next') { shown++; return render(); }
    if (b.dataset.act === 'restart') { shown = 0; probe = null; return render(); }
    if (b.dataset.act === 'new') return newProblem();
  };
  el.addEventListener('click', onClick);
  render();
  return () => el.removeEventListener('click', onClick);
}
