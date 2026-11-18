// Tutor AI (DeepSeek lewat server). Membimbing dengan pertanyaan pemandu ala RMT, tidak langsung memberi jawaban.
// Layar lain bisa membuka tutor dengan konteks soal lewat `openTutor(...)`.
import * as store from '../lib/store.js';
import { esc } from '../lib/dom.js';
import { api } from '../lib/api.js';
import { renderMd } from '../lib/md.js';
import { icon } from '../components/icons.js';
import { aiStatus } from '../components/ui.js';

export const title = 'Tutor AI';
export const tab = 'tutor';

const HANDOFF = 'langkah:tutor-handoff';
const MAX_TURNS = 14;

const MODES = {
  tanya: { label: 'Tanya', hello: 'Halo! Aku Tutor Langkah. Tanyakan apa saja tentang persamaan dan pertidaksamaan linear. Aku akan membantumu berpikir, bukan sekadar memberi jawaban.',
    suggest: ['Apa bedanya persamaan dan pertidaksamaan?', 'Kenapa tanda dibalik saat dibagi bilangan negatif?', 'Apa itu himpunan penyelesaian?', 'Bagaimana cara memeriksa jawaban?'] },
  jelaskan: { label: 'Jelaskan materi', hello: 'Pilih materi yang ingin dijelaskan. Aku mulai dari contoh nyata, lalu gambar, lalu simbol.',
    suggest: ['Jelaskan PLSV dengan contoh timbangan', 'Jelaskan PtLSV dan garis bilangan', 'Jelaskan cara mengubah soal cerita jadi model', 'Jelaskan sifat distributif a(x + b)'] },
  petunjuk: { label: 'Bantu soalku', hello: 'Tulis soal yang sedang kamu kerjakan. Aku akan memberi petunjuk sedikit demi sedikit.',
    suggest: ['3x + 5 = 20', '2(x − 4) = 10', '−2x + 6 > 14', 'Uang Dina Rp50.000, harga buku Rp6.000. Paling banyak berapa buku?'] },
  analisis: { label: 'Periksa jawabanku', hello: 'Tulis soal dan langkah jawabanmu. Aku akan menunjukkan bagian yang sudah benar dan bagian yang perlu diperiksa.',
    suggest: ['Soal: 2x + 3 = 11. Jawabanku: 2x = 14, x = 7', 'Soal: −3x < 12. Jawabanku: x < −4'] },
};

// Dipanggil layar lain: buka tutor dengan mode & konteks soal.
export function openTutor({ mode = 'tanya', context = {}, label = '', first = '' }) {
  try { sessionStorage.setItem(HANDOFF, JSON.stringify({ mode, context, label, first })); } catch { /* abaikan */ }
  location.hash = '#/tutor';
}

export function mount(el) {
  let handoff = null;
  try { handoff = JSON.parse(sessionStorage.getItem(HANDOFF)); sessionStorage.removeItem(HANDOFF); } catch { /* abaikan */ }
  const saved = store.getDraft('tutor');
  let state = handoff
    ? { mode: handoff.mode, ctx: handoff.context || {}, label: handoff.label || '', msgs: [] }
    : saved || { mode: 'tanya', ctx: {}, label: '', msgs: [] };
  if (!MODES[state.mode] && !['pembahasan', 'rmt'].includes(state.mode)) state.mode = 'tanya';
  let busy = false;
  let hint = 1;
  let status = null;
  let alive = true;

  const persist = () => store.setDraft('tutor', { ...state, msgs: state.msgs.slice(-MAX_TURNS) });

  function modeTabs() {
    return `<div class="chips" role="group" aria-label="Mode tutor">${Object.entries(MODES).map(([k, m]) =>
      `<button class="chip-btn" type="button" data-mode="${k}" aria-pressed="${state.mode === k}">${esc(m.label)}</button>`).join('')}</div>`;
  }

  function render() {
    const m = MODES[state.mode] || { hello: state.mode === 'pembahasan' ? 'Kita bahas soal ini tahap demi tahap. Ketik "mulai" untuk tahap pertama.' : 'Ayo bahas.', suggest: state.mode === 'pembahasan' ? ['Mulai', 'Lanjut', 'Kenapa begitu?'] : [] };
    const offline = status && !status.available;
    el.innerHTML = `<div class="screen">
      ${modeTabs()}
      ${state.label ? `<div class="ctx">${icon('pencil', 18)}<span class="t"><b>Soal:</b> ${esc(state.label)}</span><button type="button" data-act="clearctx" aria-label="Hapus konteks soal">${icon('x', 18)}</button></div>` : ''}
      ${offline ? `<p class="fb" data-tone="warn"><span class="ic">!</span><span class="t">Tutor AI belum bisa dipakai: ${esc(status.error || 'kunci AI belum diatur di server')}. Fitur belajar lain tetap bisa dipakai offline.</span></p>` : ''}
      <div class="chat" id="chat" aria-live="polite">
        <div class="bubble ai"><span class="who">${icon('spark', 14)} Tutor Langkah</span>${renderMd(m.hello)}</div>
        ${state.msgs.map((x) => x.role === 'note'
          ? `<div class="bubble note">${esc(x.content)}</div>`
          : `<div class="bubble ${x.role === 'user' ? 'me' : 'ai'}">${x.role === 'user' ? esc(x.content).replace(/\n/g, '<br>') : `<span class="who">${icon('spark', 14)} Tutor Langkah</span>${renderMd(x.content)}`}</div>`).join('')}
        ${busy ? `<div class="bubble ai"><span class="typing"><i></i><i></i><i></i></span></div>` : ''}
      </div>
      ${!busy && state.msgs.length === 0 && m.suggest.length ? `<div class="suggest">${m.suggest.map((q) => `<button type="button" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>` : ''}
      ${state.mode === 'petunjuk' && state.msgs.length ? `<div class="suggest"><button type="button" data-q="Aku masih bingung, boleh petunjuk berikutnya?">${icon('bulb', 16)} Petunjuk berikutnya</button></div>` : ''}
      ${state.msgs.length ? `<button class="btn ghost small" type="button" data-act="reset">${icon('refresh', 18)} Mulai percakapan baru</button>` : ''}
      <form class="composer" id="composer">
        <textarea id="ask" rows="1" aria-label="Pertanyaanmu" maxlength="1500" placeholder="${state.mode === 'analisis' ? 'Tulis soal dan langkah jawabanmu…' : 'Tulis pertanyaanmu…'}" ${busy ? 'disabled' : ''}></textarea>
        <button class="send" type="submit" aria-label="Kirim" ${busy ? 'disabled' : ''}>${busy ? '<span class="spinner"></span>' : icon('send', 22)}</button>
      </form>
      <p class="note center">Tutor AI bisa keliru. Selalu periksa dengan memasukkan nilai x ke soal awal.</p>
    </div>`;
    const ta = el.querySelector('#ask');
    ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = Math.min(140, ta.scrollHeight) + 'px'; });
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && matchMedia('(hover: hover)').matches) { e.preventDefault(); send(ta.value); } });
    el.querySelector('#composer').addEventListener('submit', (e) => { e.preventDefault(); send(ta.value); });
    const chat = el.querySelector('#chat');
    chat.lastElementChild?.scrollIntoView({ block: 'end', behavior: store.prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  async function send(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    if (state.mode === 'petunjuk' && !state.label && state.msgs.length === 0) { state.label = text.slice(0, 200); state.ctx = { ...state.ctx, soal: text.slice(0, 600) }; }
    if (/petunjuk berikutnya/i.test(text)) hint = Math.min(3, hint + 1);
    state.msgs.push({ role: 'user', content: text });
    busy = true; render();
    const convo = state.msgs.filter((x) => x.role !== 'note').slice(-MAX_TURNS);
    try {
      const ctx = { ...state.ctx };
      if (state.mode === 'petunjuk') ctx.tingkat_petunjuk = hint;
      const res = await api('/ai/chat', { method: 'POST', body: { mode: state.mode, messages: convo, context: ctx }, timeout: 60000 });
      state.msgs.push({ role: 'assistant', content: res.reply });
      store.log(`ai.${state.mode}`, { q: text.slice(0, 300), ctx: state.label.slice(0, 200) });
      store.markDone('tutor');
    } catch (e) {
      state.msgs.pop();
      state.msgs.push({ role: 'note', content: e.message });
      setTimeout(() => { const ta = el.querySelector('#ask'); if (ta && !ta.value) ta.value = text; }, 0);
    }
    busy = false;
    persist();
    if (alive) render();
  }

  const onClick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.mode) {
      state = { mode: b.dataset.mode, ctx: {}, label: '', msgs: [] }; hint = 1; persist(); return render();
    }
    if (b.dataset.q) return send(b.dataset.q);
    if (b.dataset.act === 'reset') { state.msgs = []; hint = 1; persist(); return render(); }
    if (b.dataset.act === 'clearctx') { state.label = ''; state.ctx = {}; persist(); return render(); }
  };
  el.addEventListener('click', onClick);
  render();
  aiStatus().then((st) => { status = st; if (alive && !st.available) render(); });
  if (handoff && handoff.first) send(handoff.first);
  else if (handoff) persist();
  return () => { alive = false; el.removeEventListener('click', onClick); };
}
