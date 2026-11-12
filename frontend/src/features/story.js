// F5 Pembedah Soal Cerita: pilah → misalkan x → kata kunci & tanda → susun model → selesaikan → tafsirkan.
import { makeStory, ROLES, STORY_COUNT } from '../content/stories.js';
import { KEYWORDS, findKeywords } from '../content/keywords.js';
import { solve, relSymbol, toInterval, fmtNum } from '../math/linear.js';
import { sideHTML, statementHTML, relHTML } from '../components/mathexpr.js';
import { numberLineSVG, numberLineLegend } from '../components/numberline.js';
import { esc } from '../lib/dom.js';
import { markDone } from '../lib/store.js';

export const title = 'Pembedah Soal Cerita';

const STEPS = ['Pilah kalimat', 'Misalkan x', 'Kata kunci & tanda', 'Susun model', 'Selesaikan', 'Tafsirkan'];
const kwOf = (rel) => KEYWORDS.find((k) => k.rel === rel);

export function mount(el) {
  let idx = 0, s, step, st;
  function load(newIdx) {
    idx = newIdx;
    s = makeStory(idx, (Math.random() * 1e9) | 0);
    step = 0;
    st = { roles: s.sentences.map(() => null), checked: false, varPick: null, relPick: null,
      slots: { x: null, c: null, rel: null, r: null }, modelChecked: false, shown: 0, interpPick: null };
    render();
  }

  // teks soal dengan kata kunci ditandai (hanya kalimat yang diperlukan, setelah langkah 1)
  function storyText({ marks = false, hideExtra = true } = {}) {
    return s.sentences.filter((x) => !(hideExtra && x.role === 'extra')).map((x) => {
      if (!marks) return esc(x.text);
      let out = '', pos = 0;
      for (const f of findKeywords(x.text)) {
        out += esc(x.text.slice(pos, f.start)) + `<mark>${esc(f.phrase)}</mark>`;
        pos = f.end;
      }
      return out + esc(x.text.slice(pos));
    }).join(' ');
  }

  function stepPilah() {
    const cards = s.sentences.map((x, j) => {
      const mine = st.roles[j];
      const ok = st.checked && mine === x.role;
      const tone = st.checked ? (ok ? 'ok' : 'warn') : '';
      const btns = Object.entries(ROLES).map(([r, label]) =>
        `<button class="seg" type="button" data-role="${j}:${r}" aria-pressed="${mine === r}" ${st.checked ? 'disabled' : ''}>${label}</button>`).join('');
      return `<li class="scard ${tone}"><p>${esc(x.text)}</p><div class="segs">${btns}</div>
        ${st.checked && !ok ? `<small>Seharusnya: <b>${ROLES[x.role]}</b></small>` : ''}</li>`;
    }).join('');
    const allSet = st.roles.every((r) => r);
    const wrong = st.roles.filter((r, j) => r !== s.sentences[j].role).length;
    return {
      body: `<p class="lede">Baca satu per satu. Tandai kalimat yang memberi informasi, yang ditanyakan, dan yang tidak diperlukan.</p>
        <ol class="scards">${cards}</ol>
        ${st.checked ? `<p class="fb" data-tone="${wrong ? 'warn' : 'ok'}"><span class="ic">${wrong ? '!' : '✓'}</span><span class="t">${wrong
          ? `${wrong} kalimat belum tepat; label yang benar sudah ditunjukkan. Kalimat "tidak diperlukan" tidak dipakai untuk membuat model.`
          : 'Tepat. Kalimat yang tidak diperlukan akan disembunyikan di langkah berikutnya.'}</span></p>` : ''}`,
      next: st.checked ? { label: 'Lanjut ▶', act: 'next' } : { label: 'Periksa', act: 'checkRoles', disabled: !allSet },
    };
  }

  function choiceList(name, options, picked, answer, render) {
    return `<div class="opts">${options.map((o, j) => {
      const st2 = picked === null ? '' : j === picked ? (j === answer ? 'ok' : 'no') : '';
      return `<button class="btn opt" type="button" data-${name}="${j}" ${st2 ? `data-picked="${st2}"` : ''}>${render(o)}</button>`;
    }).join('')}</div>`;
  }

  function stepVar() {
    const v = s.variable;
    const ok = st.varPick === v.answer;
    return {
      body: `<div class="mini"><p class="eyebrow">Soal</p><p>${storyText()}</p></div>
        <h3>Apa yang dimisalkan sebagai <span class="v"><span class="xbox">x</span></span>?</h3>
        <p class="note">Petunjuk: x biasanya adalah hal yang <b>ditanyakan</b>.</p>
        ${choiceList('var', v.options, st.varPick, v.answer, (o) => `Misalkan x = ${esc(o)}`)}
        ${st.varPick !== null ? `<p class="fb" data-tone="${ok ? 'ok' : 'warn'}"><span class="ic">${ok ? '✓' : '!'}</span><span class="t">${ok
          ? `Tepat. x = ${esc(v.options[v.answer])}.` : 'Belum tepat. Lihat kalimat yang ditanyakan, lalu coba lagi.'}</span></p>` : ''}`,
      next: { label: 'Lanjut ▶', act: 'next', disabled: !ok },
    };
  }

  function stepRel() {
    const rels = ['=', '<', '>', '<=', '>='];
    const ans = rels.indexOf(s.model.rel);
    const ok = st.relPick === ans;
    const kw = kwOf(s.model.rel);
    return {
      body: `<div class="mini"><p class="eyebrow">Soal</p><p class="marked-inline">${storyText({ marks: true })}</p></div>
        <h3>Kata kunci <mark>${esc(s.keyword)}</mark> berarti tanda…</h3>
        <div class="grid5">${rels.map((r, j) => {
          const st2 = st.relPick === null ? '' : j === st.relPick ? (ok ? 'ok' : 'no') : '';
          return `<button class="btn rel-btn" type="button" data-rel="${j}" ${st2 ? `data-picked="${st2}"` : ''}>${relHTML(r)}</button>`;
        }).join('')}</div>
        ${st.relPick !== null ? `<p class="fb" data-tone="${ok ? 'ok' : 'warn'}"><span class="ic">${ok ? '✓' : '!'}</span><span class="t">${ok
          ? `Tepat. “${esc(s.keyword)}” berarti ${esc(kw.meaning)}, jadi tandanya ${esc(kw.sym)}.`
          : 'Belum tepat. Buka <a href="#/kamus">Kamus kata kunci</a> jika ragu, lalu coba lagi.'}</span></p>` : ''}`,
      next: { label: 'Lanjut ▶', act: 'next', disabled: !ok },
    };
  }

  function stepModel() {
    const sl = s.slots;
    const pick = st.slots;
    const val = (k) => (pick[k] === null ? null : sl[k].options[pick[k]]);
    const slot = (k, html) => `<span class="slot ${pick[k] === null ? 'empty' : ''} ${st.modelChecked ? (pick[k] === sl[k].answer ? 'ok' : 'no') : ''}">${html}</span>`;
    const preview = `<span class="stmt">
      ${slot('x', val('x') === null ? '?' : sideHTML({ a: val('x') }))}
      ${slot('c', val('c') === null ? '?' : `<span class="op">+</span> <span class="k">${fmtNum(val('c'))}</span>`)}
      ${slot('rel', val('rel') === null ? '?' : relHTML(val('rel')))}
      ${slot('r', val('r') === null ? '?' : `<span class="k">${fmtNum(val('r'))}</span>`)}</span>`;
    const row = (k, label, render) => `<div class="slotrow"><span class="slotlabel">${label}</span><div class="chips wrap">${sl[k].options.map((o, j) =>
      `<button class="chip-btn" type="button" data-slot="${k}:${j}" aria-pressed="${pick[k] === j}">${render(o)}</button>`).join('')}</div></div>`;
    const allSet = Object.values(pick).every((v) => v !== null);
    const wrongs = Object.keys(pick).filter((k) => pick[k] !== sl[k].answer);
    const names = { x: 'suku x', c: 'konstanta', rel: 'tanda', r: 'ruas kanan' };
    const allOk = st.modelChecked && wrongs.length === 0;
    return {
      body: `<p class="note">Misalkan x = ${esc(s.variable.options[s.variable.answer])}. ${esc(s.note)}</p>
        <div class="eq"><span class="eq-label">Model matematika</span><div class="eq-main">${preview}</div></div>
        ${row('x', 'Suku x', (o) => sideHTML({ a: o }))}
        ${row('c', 'Konstanta', (o) => `+ ${fmtNum(o)}`)}
        ${row('rel', 'Tanda', (o) => esc(relSymbol(o)))}
        ${row('r', 'Ruas kanan', (o) => fmtNum(o))}
        ${st.modelChecked ? `<p class="fb" data-tone="${allOk ? 'ok' : 'warn'}"><span class="ic">${allOk ? '✓' : '!'}</span><span class="t">${allOk
          ? 'Tepat. Model matematikanya sudah benar.'
          : `Periksa lagi bagian: <b>${wrongs.map((k) => names[k]).join(', ')}</b>. Ubah pilihannya, lalu periksa ulang.`}</span></p>` : ''}`,
      next: allOk ? { label: 'Lanjut ▶', act: 'next' } : { label: 'Periksa model', act: 'checkModel', disabled: !allSet },
    };
  }

  function stepSolve() {
    const sol = solve(s.model);
    const total = sol.steps.length;
    const steps = sol.steps.slice(0, st.shown).map((x, i) =>
      `<li class="step${x.flipped ? ' flipped' : ''}"><div class="eq-line">${statementHTML(x.after, x.flipped && i === st.shown - 1 ? 'flip' : '')}</div>
       <p class="why">${x.reason}${x.flipped ? '<span class="tag-flip">tanda dibalik</span>' : ''}</p></li>`).join('');
    const done = st.shown >= total;
    const nl = done && s.model.rel !== '=' ? numberLineSVG(toInterval(sol.rel, sol.value)) + numberLineLegend() : '';
    return {
      body: `<div class="eq"><span class="eq-label">Model · langkah ${Math.min(st.shown, total)}/${total}</span><div class="eq-main">${statementHTML(s.model)}</div></div>
        <ol class="steps">${steps}</ol>${nl}`,
      next: done ? { label: 'Lanjut ▶', act: 'next' } : { label: 'Langkah berikutnya ▶', act: 'show' },
    };
  }

  function stepInterp() {
    const sol = solve(s.model);
    const it = s.interpret;
    const ok = st.interpPick === it.answer;
    if (ok) markDone('pembedah');
    return {
      body: `<div class="mini"><p class="eyebrow">Soal</p><p>${storyText()}</p></div>
        <div class="eq"><span class="eq-label">Hasil penyelesaian</span><div class="eq-main">${statementHTML({ left: { a: 1 }, rel: sol.rel, right: { b: sol.value } })}</div></div>
        <h3>Jadi, apa jawaban soalnya?</h3>
        ${choiceList('interp', it.options, st.interpPick, it.answer, esc)}
        ${st.interpPick !== null ? `<p class="fb" data-tone="${ok ? 'ok' : 'warn'}"><span class="ic">${ok ? '✓' : '!'}</span><span class="t">${ok
          ? `Tepat. ${esc(it.explain)}` : `Belum tepat. Ingat, x adalah ${esc(s.variable.options[s.variable.answer])}. ${esc(it.explain)}`}</span></p>` : ''}`,
      next: ok ? { label: 'Soal cerita lain ▶', act: 'another' } : { label: 'Pilih jawaban dulu', act: 'none', disabled: true },
    };
  }

  function render() {
    const view = [stepPilah, stepVar, stepRel, stepModel, stepSolve, stepInterp][step]();
    el.innerHTML = `<div class="screen">
      <div class="stepper"><p class="eyebrow">${esc(s.title)} · langkah ${step + 1} dari ${STEPS.length}</p>
        <h2>${STEPS[step]}</h2>
        <div class="progress">${STEPS.map((_, j) => `<i class="${j < step ? 'past' : j === step ? 'now' : ''}"></i>`).join('')}</div></div>
      ${view.body}
      <div class="bottombar">
        <button class="btn" type="button" data-act="back" ${step === 0 ? 'disabled' : ''}>Kembali</button>
        <button class="btn primary" type="button" data-act="${view.next.act}" ${view.next.disabled ? 'disabled' : ''}>${view.next.label}</button>
      </div></div>`;
  }

  const onClick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    if (d.role) { const [j, r] = d.role.split(':'); st.roles[+j] = r; return render(); }
    if (d.var !== undefined) { st.varPick = +d.var; return render(); }
    if (d.rel !== undefined) { st.relPick = +d.rel; return render(); }
    if (d.slot) { const [k, j] = d.slot.split(':'); st.slots[k] = +j; st.modelChecked = false; return render(); }
    if (d.interp !== undefined) { st.interpPick = +d.interp; return render(); }
    switch (d.act) {
      case 'checkRoles': st.checked = true; return render();
      case 'checkModel': st.modelChecked = true; return render();
      case 'show': st.shown++; return render();
      case 'next': step++; window.scrollTo(0, 0); return render();
      case 'back': step--; window.scrollTo(0, 0); return render();
      case 'another': window.scrollTo(0, 0); return load((idx + 1) % STORY_COUNT);
      default:
    }
  };
  el.addEventListener('click', onClick);
  load(0);
  return () => el.removeEventListener('click', onClick);
}
