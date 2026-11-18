// Pembahasan bertahap (RMT): soal dibahas mengikuti 6 langkah berpikir, langkah hitung dibuka satu per satu.
// Langkah & jawaban berasal dari mesin matematika (selalu benar, jalan offline); Tutor AI opsional untuk bertanya "mengapa".
import * as store from '../lib/store.js';
import { esc } from '../lib/dom.js';
import { solve, toInterval, relSymbol, fmtNum, fmtStatement, evalSide } from '../math/linear.js';
import { statementHTML } from '../components/mathexpr.js';
import { numberLineSVG, numberLineLegend } from '../components/numberline.js';
import { icon } from '../components/icons.js';
import { fmtDate } from '../components/ui.js';
import { openTutor } from './tutor.js';

export const title = 'Pembahasan';
export const tab = 'latihan';
export const back = '#/latihan';

const KEY = 'langkah:pembahasan';

export function openPembahasan(problem, answer = null) {
  try { sessionStorage.setItem(KEY, JSON.stringify({ problem, answer })); } catch { /* abaikan */ }
  location.hash = '#/pembahasan';
}

function recentProblems() {
  const seen = new Set();
  const out = [];
  for (const e of store.history()) {
    if (e.kind !== 'latihan.jawab' || !e.data.problem) continue;
    const k = fmtStatement(e.data.problem);
    if (seen.has(k)) continue;
    seen.add(k); out.push({ problem: e.data.problem, ok: e.data.ok, ts: e.ts });
    if (out.length >= 12) break;
  }
  return out;
}

export function mount(el) {
  let off = null;
  const show = () => {
    if (off) off();
    let data = null;
    try { data = JSON.parse(sessionStorage.getItem(KEY)); } catch { /* abaikan */ }
    off = data && data.problem ? detail(el, data, show) : renderList(el, show);
    window.scrollTo(0, 0);
  };
  show();
  return () => { if (off) off(); };
}

function detail(el, data, show) {
  const p = data.problem;
  const sol = solve(p);
  const isEq = p.rel === '=';
  let shown = 0;

  function stage(n, ic, ttl, body) {
    return `<section class="card"><div class="card-head"><span class="m-ic" style="width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:var(--primary-soft);color:var(--primary)">${icon(ic, 18)}</span><h3>${n}. ${ttl}</h3></div>${body}</section>`;
  }

  function render() {
    const done = shown >= sol.steps.length;
    const steps = sol.steps.slice(0, shown).map((x) =>
      `<li class="step${x.flipped ? ' flipped' : ''}"><div class="eq-line">${statementHTML(x.after)}</div><p class="why">${x.reason}${x.flipped ? '<span class="tag-flip">tanda dibalik</span>' : ''}</p></li>`).join('');
    const finalTxt = isEq ? `x = ${fmtNum(sol.value)}` : `x ${relSymbol(sol.rel)} ${fmtNum(sol.value)}`;
    const lv = evalSide(p.left, sol.value), rv = evalSide(p.right, sol.value);
    const ans = data.answer;
    el.innerHTML = `<div class="screen">
      <div class="eq"><span class="eq-label">Soal yang dibahas</span><div class="eq-main">${statementHTML(p)}</div>
        ${ans ? `<div class="eq-sub">Jawabanmu: x ${esc(relSymbol(ans.rel))} ${esc(fmtNum(ans.value))}</div>` : ''}</div>
      ${stage(1, 'eye', 'Pahami', `<p>Yang ditanyakan: nilai <b class="v">x</b> yang membuat kalimat ini <b>benar</b>.</p>`)}
      ${stage(2, 'brain', 'Kenali konsep', `<p>${isEq
        ? 'Ini <b>persamaan</b> (tanda =). Penyelesaiannya satu nilai x.'
        : `Ini <b>pertidaksamaan</b> (tanda ${relSymbol(p.rel)}). Penyelesaiannya banyak nilai x, ditulis sebagai himpunan penyelesaian.`}</p>
        <p class="note">Prinsip timbangan: apa pun yang dilakukan pada ruas kiri, lakukan juga pada ruas kanan.</p>`)}
      ${stage(3, 'steps', `Selesaikan langkah demi langkah (${Math.min(shown, sol.steps.length)}/${sol.steps.length})`, `
        ${shown === 0 ? '<p class="empty">Tekan <b>Langkah berikutnya</b>. Sebelum membuka, coba tebak dulu langkahnya!</p>' : ''}
        <ol class="steps">${steps}</ol>
        ${done ? '' : `<button class="btn primary" type="button" data-act="step">${icon('eye', 18)} Langkah berikutnya</button>`}`)}
      ${done ? stage(4, 'check', 'Periksa & tafsirkan', `
        <p class="callout">${isEq ? `Jadi penyelesaiannya <b>${finalTxt}</b>.` : `Jadi HP = {x | ${finalTxt}, x ∈ R}.`}</p>
        ${isEq ? `<p>Cek: jika x = ${fmtNum(sol.value)}, ruas kiri = <b>${fmtNum(lv)}</b> dan ruas kanan = <b>${fmtNum(rv)}</b>. Sama, jadi jawabannya benar ✓</p>`
               : `${numberLineSVG(toInterval(sol.rel, sol.value))}${numberLineLegend()}<p>Cek batasnya: jika x = ${fmtNum(sol.value)}, ruas kiri = ${fmtNum(lv)} dan ruas kanan = ${fmtNum(rv)}. ${p.rel.includes('=') ? 'Keduanya sama, jadi batas <b>termasuk</b> (●).' : 'Keduanya sama, tetapi tanda tidak memuat "=", jadi batas <b>tidak termasuk</b> (○).'}</p>`}`) : ''}
      <div class="actions">
        <button class="btn soft" type="button" data-act="ask">${icon('spark', 18)} Tanya Tutor AI: “mengapa langkah ini?”</button>
        <a class="btn" href="#/latihan">${icon('target', 18)} Kembali berlatih</a>
        <button class="btn ghost small" type="button" data-act="list">${icon('list', 18)} Pilih soal lain dari riwayat</button>
      </div>
    </div>`;
  }

  const onClick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.act === 'step') { shown++; return render(); }
    if (b.dataset.act === 'list') { try { sessionStorage.removeItem(KEY); } catch { /* */ } return show(); }
    if (b.dataset.act === 'ask') {
      const label = fmtStatement(p);
      return openTutor({
        mode: 'pembahasan', label,
        context: { soal: label, langkah_benar: sol.steps.map((s) => `${fmtStatement(s.after)} (${s.reason.replace(/<[^>]+>/g, '')})`).join(' → ').slice(0, 1400),
          ...(data.answer ? { jawaban_siswa: `x ${relSymbol(data.answer.rel)} ${fmtNum(data.answer.value)}` } : {}) },
        first: shown > 0 ? `Aku sudah melihat ${shown} langkah. Kenapa langkah ke-${shown} dilakukan begitu?` : 'Tolong bahas soal ini tahap demi tahap. Mulai dari tahap 1.',
      });
    }
  };
  el.addEventListener('click', onClick);
  store.log('pembahasan.buka', { problem: p });
  render();
  return () => el.removeEventListener('click', onClick);
}

function renderList(el, show) {
  const items = recentProblems();
  el.innerHTML = `<div class="screen">
    <div class="card soft"><h3>${icon('steps', 20)} Pembahasan bertahap</h3><p class="muted">Pilih soal latihan yang pernah kamu kerjakan. Langkahnya dibuka satu per satu beserta alasannya.</p></div>
    ${items.length ? `<ul class="rows">${items.map((it, i) => `<li><button class="rowbtn" type="button" data-i="${i}">
      <span class="r-ic">${icon(it.ok ? 'check' : 'question', 18)}</span>
      <span class="r-main"><b>${esc(fmtStatement(it.problem))}</b><small>${fmtDate(it.ts)} · ${it.ok ? 'pernah benar' : 'belum tepat'}</small></span>
      <span class="r-end">${icon('chevron', 18)}</span></button></li>`).join('')}</ul>`
      : `<div class="empty-state">${icon('target', 40)}<p>Belum ada soal. Kerjakan latihan dulu, lalu kembali ke sini.</p><a class="btn primary" href="#/latihan">Mulai latihan</a></div>`}
  </div>`;
  const onClick = (e) => {
    const b = e.target.closest('button[data-i]');
    if (!b) return;
    try { sessionStorage.setItem(KEY, JSON.stringify({ problem: items[Number(b.dataset.i)].problem, answer: null })); } catch { /* */ }
    show();
  };
  el.addEventListener('click', onClick);
  return () => el.removeEventListener('click', onClick);
}
