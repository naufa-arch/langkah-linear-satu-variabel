// Beranda / dasbor siswa: progres, lanjutkan belajar, menu cepat, pencapaian, dan Peta Belajar.
import * as store from '../lib/store.js';
import { esc } from '../lib/dom.js';
import { MODULES } from '../content/modules.js';
import { RMT_PHASES } from '../content/rmt.js';
import { icon } from '../components/icons.js';
import { ring, minibar, badgeCard } from '../components/ui.js';
import { practiceStats, overallProgress, streakDays, badges } from '../math/progress.js';

export const title = 'Langkah Linear';
export const tab = 'beranda';

function findAct(route) {
  if (!route) return null;
  for (const m of MODULES) for (const a of m.acts) {
    if (a.route && (route === a.route || route.startsWith(a.route + '/') || (a.match || []).includes(route))) {
      return { ...a, route }; // lanjutkan tepat di halaman terakhir
    }
  }
  return null;
}
function nextAct() {
  for (const m of MODULES) for (const a of m.acts) if (a.route && !store.isDone(a.id)) return a;
  return null;
}

function greeting() {
  const h = new Date().getHours();
  return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam';
}

export function badgeContext() {
  const s = store.get();
  const hist = store.history();
  return {
    progress: s.progress, stats: practiceStats(hist), streak: streakDays(hist, new Date().toISOString().slice(0, 10)),
    attempts: store.attempts().filter((a) => a.submittedAt).length,
    aiCount: hist.filter((e) => e.kind.startsWith('ai.')).length,
    rmtDone: hist.filter((e) => e.kind === 'rmt.selesai').length,
  };
}

export function mount(el) {
  const s = store.get();
  const last = findAct(s.last);
  const resume = last || nextAct();
  const prog = overallProgress(MODULES, s.progress);
  const ctx = badgeContext();
  const bs = badges(ctx);
  const earned = bs.filter((b) => b.earned).length;
  const ordered = [...bs.filter((b) => b.earned), ...bs.filter((b) => !b.earned)];

  const modules = MODULES.map((m, i) => {
    const ready = m.acts.filter((a) => a.route);
    const doneCount = ready.filter((a) => store.isDone(a.id)).length;
    const done = ready.length > 0 && doneCount === ready.length;
    const acts = m.acts.map((a) => {
      const isDone = store.isDone(a.id);
      if (!a.route) return `<li><span class="act soon"><span class="dot"></span><span class="lbl">${esc(a.label)}</span><span class="badge">segera</span></span></li>`;
      return `<li><a class="act${isDone ? ' done' : ''}" href="${a.route}"><span class="dot">${isDone ? '✓' : ''}</span><span class="lbl">${esc(a.label)}</span><span aria-hidden="true">›</span></a></li>`;
    }).join('');
    return `<li class="module${done ? ' done' : ''}">
      <div class="module-head"><span class="m-ic">${done ? icon('check', 18) : icon(m.icon || 'book', 18)}</span><h3>${i + 1}. ${esc(m.title)}</h3><span class="module-state">${doneCount}/${ready.length}</span></div>
      ${minibar(ready.length ? Math.round((100 * doneCount) / ready.length) : 0)}
      <ul class="acts">${acts}</ul></li>`;
  }).join('');

  el.innerHTML = `<div class="screen">
    <section class="hero">
      <div><p class="eyebrow">${greeting()} · ${esc(s.studentCode)}${s.classCode ? ' · ' + esc(s.classCode) : ''}</p>
        <h2>${prog.pct === 0 ? 'Yuk, mulai langkah pertamamu!' : prog.pct === 100 ? 'Hebat, semua aktivitas selesai!' : 'Lanjutkan belajarmu, ya!'}</h2>
        <p>${prog.done} dari ${prog.total} aktivitas selesai · ${earned} lencana</p></div>
      ${ring(prog.pct, { label: 'progres' })}
    </section>

    <div class="stats">
      <div class="stat">${icon('target', 20)}<b>${ctx.stats.accuracy === null ? '–' : ctx.stats.accuracy + '%'}</b><span>ketepatan latihan</span></div>
      <div class="stat">${icon('flame', 20)}<b>${ctx.streak}</b><span>hari beruntun</span></div>
      <div class="stat">${icon('trophy', 20)}<b>${ctx.stats.firstOk}</b><span>soal benar</span></div>
    </div>

    ${resume ? `<a class="continue" href="${resume.route}"><span class="t"><small>${last ? 'Lanjutkan' : 'Mulai dari sini'}</small><b>${esc(resume.label)}</b></span><span class="arrow" aria-hidden="true">${icon('play', 18)}</span></a>` : ''}

    <div class="section-title"><h3>Menu belajar</h3></div>
    <div class="tiles">
      <a class="tile" href="#/materi"><span class="t-ic">${icon('book')}</span><div><b>Materi</b><small>PLSV, PtLSV & soal cerita</small></div></a>
      <a class="tile c2" href="#/latihan"><span class="t-ic">${icon('target')}</span><div><b>Latihan Soal</b><small>Angka acak, 3 tingkat</small></div></a>
      <a class="tile c4" href="#/tutor"><span class="tag">AI</span><span class="t-ic">${icon('spark')}</span><div><b>Tutor AI</b><small>Tanya & minta petunjuk</small></div></a>
      <a class="tile c5" href="#/rmt"><span class="t-ic">${icon('brain')}</span><div><b>6 Langkah Berpikir</b><small>Soal cerita model RMT</small></div></a>
      <a class="tile c3" href="#/evaluasi"><span class="t-ic">${icon('clipboard')}</span><div><b>Evaluasi</b><small>Tes literasi matematika</small></div></a>
      <a class="tile c6" href="#/hasil"><span class="t-ic">${icon('chart')}</span><div><b>Hasil Belajar</b><small>Nilai, riwayat, lencana</small></div></a>
    </div>

    <div class="section-title"><h3>Pencapaian</h3><a href="#/hasil">Lihat semua</a></div>
    <div class="badges row">${ordered.slice(0, 8).map(badgeCard).join('')}</div>

    <div class="section-title"><h3>Peta belajar</h3></div>
    <p class="note">Ikuti urutannya. Setiap aktivitas melatih langkah berpikir RMT: ${RMT_PHASES.map((p) => esc(p.title.split(' · ')[1])).join(' → ')}.</p>
    <ul class="map">${modules}</ul>
  </div>`;
}
