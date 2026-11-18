// Lembar Berpikir RMT: satu soal cerita dikerjakan lewat 6 langkah berpikir, satu langkah per layar.
// Sumber soal: templat bawaan (offline) atau dibuat Tutor AI sesuai kemampuan siswa (jawaban dihitung server).
import * as store from '../lib/store.js';
import { esc } from '../lib/dom.js';
import { api } from '../lib/api.js';
import { renderMd } from '../lib/md.js';
import { makeStory, STORY_COUNT } from '../content/stories.js';
import { RMT_STAGES, RMT_PHASES } from '../content/rmt.js';
import { solve, diagnose, relSymbol, fmtNum, fmtStatement, evalSide, rat, toInterval } from '../math/linear.js';
import { practiceStats, adaptiveLevel } from '../math/progress.js';
import { statementHTML } from '../components/mathexpr.js';
import { numberLineSVG, numberLineLegend } from '../components/numberline.js';
import { icon } from '../components/icons.js';
import { toast } from '../components/ui.js';
import { openTutor } from './tutor.js';

export const title = '6 Langkah Berpikir';
export const tab = 'tutor';
export const nav = false;

const LEVELS = { mudah: 'Mudah', sedang: 'Sedang', sulit: 'Sulit' };
const MIS_FOCUS = { M2: 'lupa membalik tanda saat membagi dengan bilangan negatif', M3: 'membalik tanda padahal tidak perlu', M4: 'tertukar < dengan ≤', M6: 'salah memindahkan konstanta' };

function storyTask(seed) {
  const st = makeStory(seed % STORY_COUNT, seed);
  const asked = st.sentences.filter((s) => s.role === 'asked').map((s) => s.text).join(' ');
  return {
    source: 'templat', id: st.id, title: st.title,
    text: st.sentences.filter((s) => s.role !== 'asked').map((s) => s.text).join(' ') + (st.note ? ` (${st.note})` : ''),
    question: asked, problem: { ...st.model, type: st.model.rel === '=' ? 'PLSV' : 'PtLSV' },
    interpret: st.interpret, unit: st.unit,
  };
}

function aiTask(res) {
  return {
    source: 'ai', id: `ai:${Date.now()}`, title: res.judul, text: res.cerita, question: res.pertanyaan,
    problem: res.problem, unit: res.satuan, conclusion: res.kesimpulan, variable: res.variabel,
  };
}

function parseNum(s) {
  const t = String(s).trim().replace(/−/g, '-').replace(/\s+/g, '').replace(',', '.');
  let m = t.match(/^(-?\d+)\/(\d+)$/);
  if (m && Number(m[2]) !== 0) return rat(Number(m[1]), Number(m[2]));
  m = t.match(/^-?\d+$/);
  if (m) return rat(Number(t), 1);
  m = t.match(/^(-?)(\d+)\.(\d{1,3})$/);
  if (m) { const d = 10 ** m[3].length; return rat(Number(m[1] + m[2] + m[3]), d); }
  return null;
}

export function mount(el) {
  const draft = store.getDraft('rmt');
  let task = draft?.task || null;
  let stage = draft?.stage || 0; // 0 = pilih soal, 1..6 = langkah, 7 = selesai
  let notes = draft?.notes || {};
  let feedback = draft?.feedback || {};
  let final = draft?.final || { rel: null, value: '' , result: null, tries: 0 };
  let pickInterp = draft?.pickInterp ?? null;
  let level = adaptiveLevel(store.history(), store.get().practice?.level || 'sedang').level;
  let loading = false;
  let alive = true;

  const persist = () => store.setDraft('rmt', stage === 0 ? null : { task, stage, notes, feedback, final, pickInterp });

  function stepper() {
    return `<div class="rmt-steps" aria-label="Langkah ${stage} dari 6">${RMT_STAGES.map((s) =>
      `<span class="${s.n < stage ? 'past' : s.n === stage ? 'now' : ''}"><i>${s.n < stage ? '✓' : s.n}</i>${esc(s.short)}</span>`).join('')}</div>`;
  }
  function storyBox(open = true) {
    return `<details class="collapse" ${open ? 'open' : ''}><summary>${icon('book', 18)} ${esc(task.title || 'Soal cerita')}</summary>
      <div><p>${esc(task.text)}</p><p><b>${esc(task.question)}</b></p></div></details>`;
  }

  function representation() {
    // tabel nilai: alat berpikir visual yang menghubungkan cerita dengan simbol
    const L = task.problem.left;
    const xs = [0, 1, 2, 3, 4];
    const val = (x) => fmtNum(evalSide(L, x));
    return `<div class="card"><p><b>Visual:</b> coba beberapa nilai x. Bagaimana nilai ruas kiri berubah?</p>
      <div class="table-wrap"><table class="data" style="min-width:0"><tr><th>x</th>${xs.map((x) => `<td>${x}</td>`).join('')}</tr>
      <tr><th>ruas kiri</th>${xs.map((x) => `<td>${val(x)}</td>`).join('')}</tr></table></div>
      <p class="note">Setiap x bertambah 1, ruas kiri bertambah ${fmtNum(L.a)}. Bilangan itulah <b>koefisien</b> x.</p></div>`;
  }

  function renderPick() {
    const stats = practiceStats(store.history());
    el.innerHTML = `<div class="screen">
      <div class="card soft"><h3>${icon('brain', 20)} Berpikir teliti, langkah demi langkah</h3>
        <p class="muted">Model <b>Rigorous Mathematical Thinking (RMT)</b> melatihmu bukan hanya menemukan jawaban, tetapi juga <b>memahami</b> dan <b>menjelaskan</b> setiap langkah.</p></div>
      <ul class="rows">${RMT_PHASES.map((ph) => `<li><span class="r-ic">${icon(RMT_STAGES[ph.stages[0] - 1].icon, 18)}</span>
        <span class="r-main"><b>${esc(ph.title)}</b><small>${ph.stages.map((n) => esc(RMT_STAGES[n - 1].title)).join(' · ')}</small></span></li>`).join('')}</ul>
      <div class="section-title"><h3>Pilih soal</h3></div>
      <button class="btn primary" type="button" data-act="story">${icon('book', 18)} Soal cerita acak (bisa offline)</button>
      <div class="card">
        <p><b>${icon('spark', 18)} Soal dari Tutor AI sesuai kemampuanmu</b></p>
        <p class="note">Tingkat disarankan dari hasil latihanmu${stats.accuracy !== null ? ` (ketepatan ${stats.accuracy}%)` : ''}.</p>
        <div class="segtabs" role="group" aria-label="Tingkat">${Object.entries(LEVELS).map(([k, v]) => `<button type="button" data-level="${k}" aria-pressed="${level === k}">${v}</button>`).join('')}</div>
        <div class="row2"><button class="btn soft" type="button" data-ai="PLSV" ${loading ? 'disabled' : ''}>${loading ? '<span class="spinner"></span>' : ''} Persamaan</button>
          <button class="btn soft" type="button" data-ai="PtLSV" ${loading ? 'disabled' : ''}>${loading ? '<span class="spinner"></span>' : ''} Pertidaksamaan</button></div>
        <p class="fb" id="aiErr" data-tone="warn" hidden><span class="ic">!</span><span class="t"></span></p>
      </div>
    </div>`;
  }

  function stage5Extra() {
    const sol = solve(task.problem);
    const isEq = task.problem.rel === '=';
    const res = final.result;
    return `<div class="card"><p><b>Jawaban akhir</b></p>
      <div class="answer-row"><span class="v"><span class="xbox">x</span></span>
        ${isEq ? '<span class="s">=</span>' : `<span class="relpick">${['<', '>', '<=', '>='].map((r) => `<button class="kbtn small" type="button" data-rel="${r}" aria-pressed="${final.rel === r}">${relSymbol(r)}</button>`).join('')}</span>`}
        <input type="text" id="finalVal" inputmode="text" autocomplete="off" placeholder="nilai" value="${esc(final.value)}" style="width:7em" aria-label="Nilai x"></div>
      <p class="note">Boleh pecahan, misalnya 23/4.</p>
      <button class="btn" type="button" data-act="checkFinal">${icon('check', 18)} Periksa jawaban</button>
      ${res === 'ok' ? `<p class="fb" data-tone="ok"><span class="ic">✓</span><span class="t">Tepat! ${isEq ? `x = ${fmtNum(sol.value)}` : `HP = {x | x ${relSymbol(sol.rel)} ${fmtNum(sol.value)}}`}.</span></p>
        ${isEq ? '' : numberLineSVG(toInterval(sol.rel, sol.value)) + numberLineLegend()}` : ''}
      ${res && res !== 'ok' ? `<p class="fb" data-tone="warn"><span class="ic">!</span><span class="t">${esc(res)}</span></p>` : ''}
    </div>`;
  }

  function stage6Extra() {
    if (task.source !== 'templat' || !task.interpret) return '';
    const it = task.interpret;
    return `<div class="card"><p><b>Pilih kesimpulan yang tepat</b></p><div class="opts">${it.options.map((o, j) => {
      const st = pickInterp === null ? '' : j === pickInterp ? (j === it.answer ? 'ok' : 'no') : '';
      return `<button class="btn" type="button" data-interp="${j}" ${st ? `data-picked="${st}"` : ''}>${esc(o)}</button>`;
    }).join('')}</div>${pickInterp !== null ? `<p class="fb" data-tone="${pickInterp === it.answer ? 'ok' : 'warn'}"><span class="ic">${pickInterp === it.answer ? '✓' : '!'}</span><span class="t">${pickInterp === it.answer ? 'Tepat. ' : 'Coba lagi. '}${esc(it.explain)}</span></p>` : ''}</div>`;
  }

  function renderStage() {
    const s = RMT_STAGES[stage - 1];
    const fb = feedback[stage];
    const canNext = (notes[stage] || '').trim().length >= 3 && (stage !== 5 || final.result === 'ok' || final.tries >= 3);
    el.innerHTML = `<div class="screen">
      ${stepper()}
      ${storyBox(stage <= 3)}
      <div class="card accent">
        <p class="eyebrow">Langkah ${stage} · ${esc(RMT_PHASES.find((p) => p.stages.includes(stage)).title)}</p>
        <h2>${icon(s.icon, 22)} ${esc(s.title)}</h2>
        <p>${s.ask}</p>
        <details class="collapse"><summary>${icon('bulb', 18)} Butuh petunjuk?</summary><div><p>${s.tip}</p></div></details>
        <textarea id="note" maxlength="1500" placeholder="${esc(s.placeholder)}" aria-label="Jawabanmu untuk langkah ${stage}">${esc(notes[stage] || '')}</textarea>
        <button class="btn soft small" type="button" data-act="ai" ${loading ? 'disabled' : ''}>${loading ? '<span class="spinner"></span> Tutor sedang membaca…' : `${icon('spark', 18)} Minta tanggapan Tutor AI`}</button>
        ${fb ? `<div class="ai-reply" data-status="${fb.status || ''}"><span class="who">${icon(fb.status === 'tepat' ? 'check' : 'spark', 14)} ${fb.status === 'tepat' ? 'Sudah tepat' : 'Tanggapan Tutor'}</span>${renderMd(fb.text)}</div>` : ''}
      </div>
      ${stage === 3 ? representation() : ''}
      ${stage === 5 ? stage5Extra() : ''}
      ${stage === 6 ? stage6Extra() : ''}
      <div class="bottombar">
        <button class="btn" type="button" data-act="prev">${stage === 1 ? 'Ganti soal' : 'Kembali'}</button>
        <button class="btn primary" type="button" data-act="next" ${canNext ? '' : 'disabled'}>${stage === 6 ? 'Selesai ✓' : 'Lanjut ▶'}</button>
      </div></div>`;
    el.querySelector('#note').addEventListener('input', (e) => {
      notes[stage] = e.target.value; persist();
      const nb = el.querySelector('[data-act="next"]');
      nb.disabled = !(e.target.value.trim().length >= 3 && (stage !== 5 || final.result === 'ok' || final.tries >= 3));
    });
    el.querySelector('#finalVal')?.addEventListener('input', (e) => { final.value = e.target.value; persist(); });
  }

  function renderDone() {
    const sol = solve(task.problem);
    el.innerHTML = `<div class="screen">
      <div class="hero"><div><p class="eyebrow">Selesai</p><h2>Kamu menuntaskan 6 langkah berpikir!</h2><p>Bandingkan tulisanmu dengan penyelesaian di bawah.</p></div>
        <div class="ring"><b style="font-size:34px">🏅</b></div></div>
      ${storyBox(false)}
      <div class="card"><p><b>Model matematika:</b></p><p class="big">${statementHTML(task.problem)}</p>
        <ol class="steps">${sol.steps.map((x) => `<li class="step${x.flipped ? ' flipped' : ''}"><div class="eq-line">${statementHTML(x.after)}</div><p class="why">${x.reason}</p></li>`).join('')}</ol>
        ${task.conclusion ? `<p class="callout">${esc(task.conclusion.replace(/\{x\}/g, fmtNum(sol.value)))}</p>` : ''}</div>
      <ul class="rows">${RMT_STAGES.map((s) => `<li><span class="r-ic">${icon(s.icon, 18)}</span><span class="r-main"><b>${s.n}. ${esc(s.title)}</b><small>${esc((notes[s.n] || '–').slice(0, 160))}</small></span>
        ${feedback[s.n]?.status === 'tepat' ? `<span class="pill ok">tepat</span>` : ''}</li>`).join('')}</ul>
      <div class="actions">
        <button class="btn primary" type="button" data-act="again">${icon('refresh', 18)} Soal baru</button>
        <button class="btn soft" type="button" data-act="discussAll">${icon('spark', 18)} Diskusikan dengan Tutor AI</button>
        <a class="btn ghost" href="#/">Kembali ke beranda</a>
      </div></div>`;
  }

  function render() {
    if (stage === 0 || !task) renderPick();
    else if (stage === 7) renderDone();
    else renderStage();
  }

  async function askAI() {
    const text = (notes[stage] || '').trim();
    if (text.length < 3) { toast('Tulis dulu jawabanmu untuk langkah ini.'); return; }
    loading = true; render();
    const sol = solve(task.problem);
    try {
      const res = await api('/ai/chat', {
        method: 'POST', timeout: 60000,
        body: {
          mode: 'rmt',
          messages: [{ role: 'user', content: text }],
          context: {
            soal: `${task.text} ${task.question}`.slice(0, 1400),
            langkah_rmt: stage,
            model_benar_rahasia: fmtStatement(task.problem),
            jawaban_benar_rahasia: `x ${relSymbol(sol.rel)} ${fmtNum(sol.value)}`,
            catatan: 'Jangan sebut model atau jawaban benar kepada siswa; gunakan hanya untuk menilai.',
          },
        },
      });
      feedback[stage] = { text: res.reply, status: res.status };
      store.log('ai.rmt', { n: stage });
    } catch (e) {
      feedback[stage] = { text: e.message, status: '' };
    }
    loading = false; persist();
    if (alive) render();
  }

  async function newAiTask(jenis) {
    loading = true; render();
    const mis = practiceStats(store.history()).misconceptions;
    const top = Object.entries(mis).sort((a, b) => b[1] - a[1])[0];
    try {
      const res = await api('/ai/soal', { method: 'POST', timeout: 70000, body: { level, jenis, fokus: top && MIS_FOCUS[top[0]] ? MIS_FOCUS[top[0]] : '' } });
      task = aiTask(res); startTask();
    } catch (e) {
      loading = false;
      if (!alive) return;
      render();
      const box = el.querySelector('#aiErr'); box.hidden = false; box.querySelector('.t').textContent = e.message;
      return;
    }
    loading = false;
    if (alive) render();
  }

  function startTask() {
    stage = 1; notes = {}; feedback = {}; final = { rel: task.problem.rel === '=' ? '=' : null, value: '', result: null, tries: 0 }; pickInterp = null;
    store.log('rmt.mulai', { source: task.source, problem: task.problem });
    persist(); window.scrollTo(0, 0);
  }

  function checkFinal() {
    const v = parseNum(final.value);
    if (!v || !final.rel) { final.result = 'Pilih tandanya dan tulis nilainya dulu (contoh: 6 atau 23/4).'; return render(); }
    const d = diagnose(task.problem, { rel: final.rel, value: v });
    final.tries++;
    final.result = d.ok ? 'ok' : d.code === 'M2' ? 'Nilainya benar. Periksa tandanya: apakah tadi kamu membagi dengan bilangan negatif?'
      : d.code === 'M3' ? 'Nilainya benar, tetapi tandanya tidak perlu dibalik.' : d.code === 'M4' ? 'Batasnya benar. Apakah batas itu termasuk (≤/≥) atau tidak (</>)?'
      : `Belum tepat. Masukkan nilaimu ke model untuk mengecek.${final.tries >= 3 ? ' Kamu boleh lanjut ke langkah 6 dan melihat pembahasannya di akhir.' : ''}`;
    store.log('rmt.jawab', { problem: task.problem, answer: { rel: final.rel, value: v }, ok: d.ok, code: d.code, attempt: final.tries });
    persist(); render();
  }

  const onClick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    if (d.level) { level = d.level; return render(); }
    if (d.ai) return newAiTask(d.ai);
    if (d.rel) { final.rel = d.rel; final.result = null; persist(); return render(); }
    if (d.interp !== undefined) { pickInterp = Number(d.interp); persist(); return render(); }
    switch (d.act) {
      case 'story': task = storyTask((Math.random() * 1e9) | 0); startTask(); return render();
      case 'ai': return askAI();
      case 'checkFinal': final.value = el.querySelector('#finalVal').value; return checkFinal();
      case 'prev':
        if (stage === 1) { stage = 0; task = null; persist(); return render(); }
        stage--; persist(); window.scrollTo(0, 0); return render();
      case 'next':
        store.log('rmt.langkah', { n: stage, text: (notes[stage] || '').slice(0, 600), status: feedback[stage]?.status || null });
        stage++;
        if (stage === 7) { store.log('rmt.selesai', { source: task.source, problem: task.problem, finalOk: final.result === 'ok' }); store.markDone('rmt'); }
        persist(); window.scrollTo(0, 0); return render();
      case 'again': stage = 0; task = null; persist(); return render();
      case 'discussAll': return openTutor({ mode: 'pembahasan', label: task.title, context: { soal: `${task.text} ${task.question}`.slice(0, 1400), model: fmtStatement(task.problem) }, first: 'Tolong bahas soal ini tahap demi tahap mengikuti 6 langkah berpikir.' });
      default:
    }
  };
  el.addEventListener('click', onClick);
  render();
  return () => { alive = false; el.removeEventListener('click', onClick); };
}
