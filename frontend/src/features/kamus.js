import { KEYWORDS, TRAPS, findKeywords } from '../content/keywords.js';
import { esc } from '../lib/dom.js';
import { markDone } from '../lib/store.js';

export const title = 'Kamus Kata Kunci';

const SAMPLE = 'Uang Rani Rp50.000. Ia membeli 1 pulpen seharga Rp8.000 dan beberapa buku seharga Rp12.000 per buku. Berapa buku paling banyak yang dapat ia beli?';
const symOf = (rel) => KEYWORDS.find((k) => k.rel === rel).sym;

function highlight(text) {
  const found = findKeywords(text);
  let out = '', pos = 0;
  for (const f of found) {
    out += esc(text.slice(pos, f.start));
    out += `<mark>${esc(f.phrase)}<b>${esc(symOf(f.rel))}</b></mark>`;
    pos = f.end;
  }
  out += esc(text.slice(pos));
  return { html: out, count: found.length };
}

export function mount(el) {
  el.innerHTML = `<div class="screen">
    <p class="lede">Kata-kata ini menentukan tanda dalam model matematika. Cari kata kuncinya dulu sebelum menulis tanda.</p>
    ${KEYWORDS.map((k) => `<div class="kw"><span class="s" aria-label="tanda ${esc(k.sym)}">${esc(k.sym)}</span>
      <div class="phr">${k.phrases.map((p) => `<span>${esc(p)}</span>`).join('')}</div>
      <p class="mean">Artinya: ${esc(k.meaning)}.</p><p class="ex">${esc(k.example)}</p></div>`).join('')}
    <div class="trap"><h3>Hati-hati, mirip tapi beda</h3>
      ${TRAPS.map(([a, b]) => `<p>“${a}” → <b>${symOf(findKeywords(a)[0].rel)}</b>, sedangkan “${b}” → <b>${symOf(findKeywords(b)[0].rel)}</b></p>`).join('')}</div>
    <div class="field"><label for="story">Coba: tempel soal cerita, kata kuncinya akan ditandai</label>
      <textarea id="story">${esc(SAMPLE)}</textarea></div>
    <p class="marked" id="marked" aria-live="polite"></p>
  </div>`;
  const ta = el.querySelector('#story');
  const out = el.querySelector('#marked');
  const update = () => {
    const { html, count } = highlight(ta.value);
    out.innerHTML = count ? html : `${html}<br><small>Belum ada kata kunci yang dikenali.</small>`;
  };
  ta.addEventListener('input', update);
  update();
  markDone('kamus');
}
