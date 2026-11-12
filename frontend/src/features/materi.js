// F12 Materi: daftar isi (#/materi) dan halaman subbab (#/materi/<id>), satu ide per layar.
import { CHAPTERS, LESSONS, chapterOf } from '../content/lessons.js';
import { solve, toInterval, relSymbol, fmtNum } from '../math/linear.js';
import { statementHTML } from '../components/mathexpr.js';
import { numberLineSVG, numberLineLegend } from '../components/numberline.js';
import { esc } from '../lib/dom.js';
import * as store from '../lib/store.js';

export const title = 'Materi';

const lessonDone = (id) => store.isDone(`materi-${id}`);

function renderIndex(el) {
  el.innerHTML = `<div class="screen">
    <p class="lede">Baca materinya dulu, sedikit demi sedikit. Setiap subbab berisi beberapa layar pendek, dan ditutup satu pertanyaan cek pemahaman.</p>
    ${CHAPTERS.map((c) => `<section class="module"><div class="module-head"><h3>${esc(c.title)}</h3>
      <span class="module-state">${c.lessons.filter((l) => lessonDone(l.id)).length}/${c.lessons.length}</span></div>
      <ul class="acts">${c.lessons.map((l, i) => `<li><a class="act${lessonDone(l.id) ? ' done' : ''}" href="#/materi/${l.id}">
        <span class="dot">${lessonDone(l.id) ? '✓' : ''}</span><span class="lbl">${i + 1}. ${esc(l.title)}</span>
        <span class="badge">${l.pages.length} layar</span></a></li>`).join('')}</ul></section>`).join('')}
  </div>`;
  return null;
}

export function mount(el, params) {
  const lesson = LESSONS.find((l) => l.id === params[0]);
  if (!lesson) return renderIndex(el);
  document.getElementById('title').textContent = lesson.title;
  const chapter = chapterOf(lesson.id);
  const pos = LESSONS.indexOf(lesson);
  const nextLesson = LESSONS[pos + 1];
  const total = lesson.pages.length + (lesson.check ? 1 : 0);
  let page = 0, shown = 0, pick = null;

  function exampleBody(pg) {
    const sol = solve(pg.example);
    const steps = sol.steps.slice(0, shown).map((x, i) =>
      `<li class="step${x.flipped ? ' flipped' : ''}"><div class="eq-line">${statementHTML(x.after, x.flipped && i === shown - 1 ? 'flip' : '')}</div>
       <p class="why">${x.reason}${x.flipped ? '<span class="tag-flip">tanda dibalik</span>' : ''}</p></li>`).join('');
    const done = shown >= sol.steps.length;
    let end = '';
    if (done) {
      end = pg.example.rel === '='
        ? `<p class="callout">Jadi penyelesaiannya <b>x = ${fmtNum(sol.value)}</b>.</p>`
        : `<p class="callout">Jadi HP = {x | x ${relSymbol(sol.rel)} ${fmtNum(sol.value)}, x ∈ R}.</p>${numberLineSVG(toInterval(sol.rel, sol.value))}${numberLineLegend()}`;
      if (pg.outro) end += `<p>${pg.outro}</p>`;
    }
    return `${pg.intro ? `<p>${pg.intro}</p>` : ''}
      <div class="eq"><span class="eq-label">Soal · langkah ${Math.min(shown, sol.steps.length)}/${sol.steps.length}</span><div class="eq-main">${statementHTML(pg.example)}</div></div>
      ${shown === 0 ? '<p class="empty">Tekan <b>Tampilkan langkah</b> untuk membuka langkah pertama.</p>' : ''}
      <ol class="steps">${steps}</ol>${end}
      ${done ? '' : '<button class="btn" type="button" data-act="step">Tampilkan langkah ▼</button>'}`;
  }

  function checkBody() {
    const c = lesson.check;
    const right = pick === c.answer;
    return `<h2>Cek pemahaman</h2><p class="qtext">${c.q}</p>
      <div class="opts">${c.options.map((o, j) => {
        const st = pick === null ? '' : j === pick ? (right ? 'ok' : 'no') : '';
        return `<button class="btn opt" type="button" data-pick="${j}" ${st ? `data-picked="${st}"` : ''}>${esc(o)}</button>`;
      }).join('')}</div>
      ${pick !== null ? `<p class="fb" data-tone="${right ? 'ok' : 'warn'}" aria-live="polite"><span class="ic">${right ? '✓' : '!'}</span><span class="t">${right ? 'Tepat. ' : 'Belum tepat, coba pilih lagi. '}${esc(c.explain)}</span></p>` : ''}`;
  }

  function finish() {
    store.markDone(`materi-${lesson.id}`);
    if (chapter.lessons.every((l) => lessonDone(l.id))) store.markDone(`bab-${chapter.id}`);
  }

  function render() {
    const onCheck = lesson.check && page === lesson.pages.length;
    const pg = lesson.pages[page];
    const isExample = !onCheck && pg.example;
    const exampleDone = isExample ? shown >= solve(pg.example).steps.length : true;
    const last = page === total - 1;
    const canNext = onCheck ? pick === lesson.check.answer : exampleDone;
    if (last && canNext) finish();
    el.innerHTML = `<div class="screen lesson">
      <div class="stepper"><p class="eyebrow">${esc(chapter.title)} · layar ${page + 1} dari ${total}</p>
        <div class="progress">${Array.from({ length: total }, (_, j) => `<i class="${j < page ? 'past' : j === page ? 'now' : ''}"></i>`).join('')}</div></div>
      ${onCheck ? checkBody() : `<h2>${esc(pg.title)}</h2>${isExample ? exampleBody(pg) : pg.body}`}
      ${last && canNext ? `<div class="donebox"><p><b>Subbab selesai ✓</b></p>
        ${lesson.related ? `<a class="btn" href="${lesson.related.route}">${esc(lesson.related.label)}</a>` : ''}
        ${nextLesson ? `<a class="btn primary" href="#/materi/${nextLesson.id}">Lanjut: ${esc(nextLesson.title)} ▶</a>` : '<a class="btn primary" href="#/">Kembali ke beranda</a>'}</div>` : ''}
      <div class="bottombar">
        <button class="btn" type="button" data-act="prev">${page === 0 ? 'Daftar isi' : 'Kembali'}</button>
        ${last ? `<a class="btn ${canNext ? '' : 'disabled'}" href="#/materi" ${canNext ? '' : 'aria-disabled="true"'}>Daftar isi materi</a>`
               : `<button class="btn primary" type="button" data-act="next" ${canNext ? '' : 'disabled'}>Berikutnya ▶</button>`}
      </div></div>`;
  }

  const onClick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.pick !== undefined) { pick = Number(b.dataset.pick); return render(); }
    switch (b.dataset.act) {
      case 'step': shown++; return render();
      case 'next': page++; shown = 0; window.scrollTo(0, 0); return render();
      case 'prev':
        if (page === 0) { location.hash = '#/materi'; return undefined; }
        page--; shown = 0; window.scrollTo(0, 0); return render();
      default:
    }
  };
  el.addEventListener('click', onClick);
  render();
  return () => el.removeEventListener('click', onClick);
}
