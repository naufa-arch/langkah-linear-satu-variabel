// Hasil Belajar: progres per modul, statistik latihan, miskonsepsi, nilai tes literasi, lencana, dan riwayat.
import * as store from '../lib/store.js';
import { esc } from '../lib/dom.js';
import { api, identity } from '../lib/api.js';
import * as sync from '../lib/sync.js';
import { MODULES } from '../content/modules.js';
import { fmtStatement } from '../math/linear.js';
import { overallProgress, badges } from '../math/progress.js';
import { icon } from '../components/icons.js';
import { ring, minibar, badgeCard, fmtDate, downloadText, toast } from '../components/ui.js';
import { badgeContext } from './home.js';

export const title = 'Hasil Belajar';
export const tab = 'hasil';

const MIS_LABEL = {
  M2: { t: 'Lupa membalik tanda', d: 'saat membagi/mengali dengan bilangan negatif', r: '#/balik-tanda' },
  M3: { t: 'Membalik tanda tanpa perlu', d: 'tanda dibalik hanya untuk bilangan negatif', r: '#/balik-tanda' },
  M4: { t: 'Tertukar < dan ≤', d: 'periksa apakah batas termasuk', r: '#/materi/himpunan' },
  M6: { t: 'Salah memindahkan konstanta', d: 'kurangi/tambah kedua ruas dengan bilangan yang sama', r: '#/timbangan' },
  rel: { t: 'Tanda relasi belum tepat', d: 'perhatikan arah tanda', r: '#/contoh/ptlsv' },
};
const KIND_LABEL = { pretest: 'Pre-test', posttest: 'Post-test', latihan: 'Latihan literasi' };

function describe(e) {
  const d = e.data || {};
  switch (e.kind) {
    case 'latihan.jawab': return { ic: d.ok ? 'check' : 'question', tone: d.ok ? 'ok' : 'warn', t: `${d.ok ? 'Benar' : 'Belum tepat'}: ${d.problem ? fmtStatement(d.problem) : 'soal latihan'}`, s: `Latihan ${d.level || ''} · percobaan ke-${d.attempt}` };
    case 'aktivitas.selesai': return { ic: 'flag', tone: 'ok', t: 'Menyelesaikan aktivitas', s: d.id };
    case 'rmt.selesai': return { ic: 'brain', tone: 'ok', t: 'Menuntaskan 6 langkah berpikir RMT', s: d.source === 'ai' ? 'soal dari Tutor AI' : 'soal cerita' };
    case 'rmt.langkah': return { ic: 'steps', tone: '', t: `Langkah RMT ke-${d.n}`, s: (d.text || '').slice(0, 80) };
    case 'evaluasi.kumpul': return { ic: 'clipboard', tone: 'ok', t: `Mengumpulkan ${KIND_LABEL[d.kind] || 'tes'}`, s: `${d.terisi} bagian terisi` };
    case 'pembahasan.buka': return { ic: 'steps', tone: '', t: 'Membuka pembahasan', s: d.problem ? fmtStatement(d.problem) : '' };
    default:
      if (e.kind.startsWith('ai.')) return { ic: 'spark', tone: '', t: 'Bertanya ke Tutor AI', s: (d.q || '').slice(0, 80) };
      return null;
  }
}

export function mount(el) {
  let view = 'ringkasan';
  let alive = true;

  function summary() {
    const s = store.get();
    const ctx = badgeContext();
    const st = ctx.stats;
    // hanya pola miskonsepsi yang dikenal (kode 'value' = salah hitung biasa, bukan pola)
    const mis = Object.entries(st.misconceptions).filter(([c]) => MIS_LABEL[c]).sort((a, b) => b[1] - a[1]);
    const atts = store.attempts();
    const sy = sync.status();
    return `
      <div class="section-title"><h3>${icon('layers', 18)} Progres per bagian</h3></div>
      <div class="card"><div class="bars">${MODULES.map((m) => {
        const ready = m.acts.filter((a) => a.route);
        const done = ready.filter((a) => s.progress[a.id] === 'done').length;
        return `<div class="b-row"><span>${esc(m.title)}</span><span>${done}/${ready.length}</span>${minibar(ready.length ? Math.round((100 * done) / ready.length) : 0)}</div>`;
      }).join('')}</div></div>

      <div class="section-title"><h3>${icon('target', 18)} Latihan soal</h3><a href="#/pembahasan">Pembahasan</a></div>
      <div class="stats">
        <div class="stat"><b>${st.tried}</b><span>soal dicoba</span></div>
        <div class="stat"><b>${st.accuracy === null ? '–' : st.accuracy + '%'}</b><span>tepat percobaan pertama</span></div>
        <div class="stat"><b>${st.bestStreak}</b><span>runtun terbaik</span></div>
      </div>
      ${mis.length ? `<div class="card"><p><b>Bagian yang perlu diperkuat</b></p><ul class="rows" style="box-shadow:none">${mis.slice(0, 4).map(([code, n]) => {
        const m = MIS_LABEL[code] || { t: code, d: '', r: '#/materi' };
        return `<li><a href="${m.r}"><span class="r-ic" style="background:var(--warn-bg);color:var(--warn)">${icon('bulb', 18)}</span><span class="r-main"><b>${esc(m.t)}</b><small>${esc(m.d)} · ${n}×</small></span><span class="r-end">Ulangi ${icon('chevron', 16)}</span></a></li>`;
      }).join('')}</ul></div>` : st.tried ? '<p class="fb" data-tone="ok"><span class="ic">✓</span><span class="t">Belum ada pola kesalahan yang berulang. Pertahankan!</span></p>' : ''}
      ${s.prereq ? `<div class="card"><p><b>Cek prasyarat</b></p>${Object.entries(s.prereq).map(([k, v]) => `<p class="score-head"><span>${esc({ bulat: 'Bilangan bulat', sejenis: 'Suku sejenis', distributif: 'Distributif' }[k] || k)}</span><span class="pill ${v === 'lancar' ? 'ok' : 'warn'}">${v === 'lancar' ? 'lancar' : 'perlu ulasan'}</span></p>`).join('')}</div>` : ''}

      <div class="section-title"><h3>${icon('clipboard', 18)} Tes literasi</h3><a href="#/evaluasi">Evaluasi</a></div>
      ${atts.length ? `<ul class="rows" id="atts">${atts.map((a) => `<li><a href="#/evaluasi/hasil/${a.id}"><span class="r-ic">${icon('medal', 18)}</span>
        <span class="r-main"><b>${KIND_LABEL[a.kind] || a.kind}</b><small>${fmtDate(a.submittedAt)}</small></span>
        <span class="r-end" data-score="${a.id}">${typeof a.total === 'number' ? `<b>${a.total}/${a.max}</b>` : a.sent ? 'menunggu dinilai' : 'belum terkirim'}</span></a></li>`).join('')}</ul>`
        : `<div class="empty-state">${icon('clipboard', 36)}<p>Belum ada tes yang dikumpulkan.</p></div>`}

      <div class="section-title"><h3>${icon(navigator.onLine ? 'cloud' : 'cloudoff', 18)} Pengiriman data</h3></div>
      <div class="card"><p class="score-head"><span>${sy.pending ? `${sy.pending} catatan menunggu dikirim` : 'Semua data sudah terkirim'}</span><span class="status-dot ${sy.pending ? 'off' : 'on'}"></span></p>
        ${sy.lastError ? `<p class="note">Terakhir gagal: ${esc(sy.lastError)}</p>` : ''}
        <div class="row2"><button class="btn small" type="button" data-act="sync">${icon('refresh', 18)} Kirim sekarang</button>
          <button class="btn small" type="button" data-act="export">${icon('download', 18)} Unduh dataku</button></div>
        <textarea id="exportBox" hidden readonly aria-label="Data belajarku"></textarea></div>`;
  }

  function render() {
    const s = store.get();
    const prog = overallProgress(MODULES, s.progress);
    const bs = badges(badgeContext());
    const hist = store.history().map((e) => ({ e, d: describe(e) })).filter((x) => x.d).slice(0, 60);
    el.innerHTML = `<div class="screen">
      <div class="card" style="flex-direction:row;align-items:center;gap:14px">${ring(prog.pct, { dark: true, label: 'selesai' })}
        <div><p class="eyebrow">${esc(s.studentCode)}${s.classCode ? ' · ' + esc(s.classCode) : ''}</p><h2>${prog.done} dari ${prog.total} aktivitas</h2>
          <p class="muted">${bs.filter((b) => b.earned).length} dari ${bs.length} lencana diraih</p></div></div>
      <div class="segtabs" role="group" aria-label="Bagian">${[['ringkasan', 'Ringkasan'], ['lencana', 'Lencana'], ['riwayat', 'Riwayat']].map(([k, v]) => `<button type="button" data-view="${k}" aria-pressed="${view === k}">${v}</button>`).join('')}</div>
      ${view === 'ringkasan' ? summary() : view === 'lencana'
        ? `<div class="badges">${bs.map(badgeCard).join('')}</div>`
        : hist.length ? `<ul class="timeline">${hist.map(({ e, d }) => `<li class="${d.tone}"><b>${esc(d.t)}</b><small>${fmtDate(e.ts)}${d.s ? ' · ' + esc(d.s) : ''}</small></li>`).join('')}</ul>`
          : `<div class="empty-state">${icon('list', 36)}<p>Riwayat belajarmu akan muncul di sini.</p></div>`}
    </div>`;
  }

  async function refreshScores() {
    for (const a of store.attempts().filter((x) => x.sent && typeof x.total !== 'number')) {
      try {
        const r = await api(`/literasi/attempts/${a.id}/hasil`, { method: 'POST', body: identity(), timeout: 15000 });
        if (r.dinilai) store.updateAttempt(null, a.id, { total: r.total, max: r.maks });
      } catch { return; }
    }
    if (alive && view === 'ringkasan') render();
  }

  const onClick = async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.view) { view = b.dataset.view; return render(); }
    if (b.dataset.act === 'sync') {
      b.disabled = true; b.innerHTML = '<span class="spinner"></span> Mengirim…';
      const st = await sync.flush();
      toast(st.lastError ? st.lastError : 'Data terkirim ✓');
      if (alive) { render(); refreshScores(); }
    }
    if (b.dataset.act === 'export') {
      const s = store.get();
      const data = { kode_siswa: s.studentCode, kode_kelas: s.classCode, diekspor: new Date().toISOString(), progres: s.progress, latihan: s.practice, prasyarat: s.prereq, tes_literasi: store.attempts(), riwayat: store.history() };
      const text = JSON.stringify(data, null, 2);
      if (!downloadText(`langkah-linear-${s.studentCode}.json`, text, 'application/json')) {
        const box = el.querySelector('#exportBox'); box.hidden = false; box.value = text; box.select();
        toast('Salin teks di kotak ini untuk menyimpan datamu.');
      }
    }
  };
  const onSync = () => { if (alive && view === 'ringkasan') render(); };
  el.addEventListener('click', onClick);
  window.addEventListener('langkah:sync', onSync);
  render();
  refreshScores();
  return () => { alive = false; el.removeEventListener('click', onClick); window.removeEventListener('langkah:sync', onSync); };
}
