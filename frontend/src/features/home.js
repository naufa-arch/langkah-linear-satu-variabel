import * as store from '../lib/store.js';
import { esc } from '../lib/dom.js';
import { MODULES } from '../content/modules.js';

export const title = 'Langkah Linear';

function findAct(route) {
  for (const m of MODULES) for (const a of m.acts) if (a.route && route && route.startsWith(a.route)) return a;
  return null;
}
function nextAct() {
  for (const m of MODULES) for (const a of m.acts) if (a.route && !store.isDone(a.id)) return a;
  return null;
}

export function mount(el) {
  const s = store.get();
  const resume = findAct(s.last) || nextAct();
  const modules = MODULES.map((m, i) => {
    const ready = m.acts.filter((a) => a.route);
    const done = ready.length > 0 && ready.every((a) => store.isDone(a.id));
    const doneCount = ready.filter((a) => store.isDone(a.id)).length;
    const state = ready.length === 0 ? 'segera' : `${doneCount}/${ready.length} selesai`;
    const acts = m.acts.map((a) => {
      const isDone = store.isDone(a.id);
      if (!a.route) return `<li><span class="act soon"><span class="dot"></span><span class="lbl">${esc(a.label)}</span><span class="badge">segera</span></span></li>`;
      return `<li><a class="act${isDone ? ' done' : ''}" href="${a.route}"><span class="dot">${isDone ? '✓' : ''}</span><span class="lbl">${esc(a.label)}</span><span aria-hidden="true">›</span></a></li>`;
    }).join('');
    return `<li class="module${done ? ' done' : ''}">
      <div class="module-head"><span class="module-num">${done ? '✓' : i + 1}</span><h3>${esc(m.title)}</h3><span class="module-state">${state}</span></div>
      <ul class="acts">${acts}</ul></li>`;
  }).join('');

  el.innerHTML = `<div class="screen">
    <div class="hello"><p class="eyebrow">Kode siswa ${esc(s.studentCode)}${s.classCode ? ' · kelas ' + esc(s.classCode) : ''}</p>
      <h2>Mau belajar apa hari ini?</h2></div>
    ${resume ? `<a class="continue" href="${resume.route}"><span class="t"><small>${findAct(s.last) ? 'Lanjutkan' : 'Mulai dari sini'}</small><b>${esc(resume.label)}</b></span><span class="arrow" aria-hidden="true">▶</span></a>` : ''}
    <ul class="map">${modules}</ul>
  </div>`;
}
