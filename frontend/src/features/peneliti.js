// Dasbor peneliti/guru: rekap siswa per kelas, penskoran tes literasi dengan rubrik, riwayat siswa, ekspor CSV.
// Butuh login (RESEARCHER_PASSWORD di server). Token hanya disimpan selama tab terbuka.
import { esc } from '../lib/dom.js';
import { api, apiBase } from '../lib/api.js';
import { icon } from '../components/icons.js';
import { toast, fmtDate, downloadText } from '../components/ui.js';
import { fmtStatement } from '../math/linear.js';

export const title = 'Dasbor Peneliti';
export const nav = false;

const TK = 'langkah:peneliti-token';
const KIND = { pretest: 'Pre-test', posttest: 'Post-test', latihan: 'Latihan' };
const MIS = { M2: 'lupa balik tanda', M3: 'balik tanda tanpa perlu', M4: '< vs ≤', M6: 'pindah konstanta', rel: 'tanda relasi', value: 'salah hitung' };

export function mount(el) {
  document.body.classList.add('wide-screen');
  let token = sessionStorage.getItem(TK);
  let view = 'ringkasan';
  let kelas = '';
  let jenis = '';
  let data = null;
  let detail = null; // pengerjaan yang sedang dinilai
  let scores = {};
  let student = null;
  let busy = false;
  let alive = true;

  const call = (path, opt = {}) => api(path, { ...opt, token, timeout: opt.timeout || 40000 }).catch((e) => {
    if (e.status === 401) { sessionStorage.removeItem(TK); token = null; }
    throw e;
  });

  function loginView(msg = '') {
    el.innerHTML = `<form class="screen" id="login">
      <div class="card soft"><h3>${icon('key', 20)} Masuk sebagai peneliti/guru</h3><p class="muted">Untuk melihat rekap, menilai tes literasi, dan mengekspor data. Kata sandi diatur di server (RESEARCHER_PASSWORD).</p></div>
      <div class="field"><label for="pw">Kata sandi peneliti</label><input type="password" id="pw" autocomplete="current-password" required></div>
      ${msg ? `<p class="fb" data-tone="warn"><span class="ic">!</span><span class="t">${esc(msg)}</span></p>` : ''}
      <button class="btn primary" type="submit">${busy ? '<span class="spinner"></span>' : 'Masuk'}</button>
      <p class="note">Server: ${esc(apiBase())}</p>
      <a class="btn ghost small" href="#/">Kembali ke aplikasi siswa</a></form>`;
    el.querySelector('#login').addEventListener('submit', async (e) => {
      e.preventDefault();
      busy = true; loginView();
      try {
        const r = await api('/peneliti/login', { method: 'POST', body: { password: e.target.pw?.value ?? el.querySelector('#pw').value } });
        token = r.token; sessionStorage.setItem(TK, token); busy = false; load();
      } catch (err) { busy = false; loginView(err.message); }
    });
  }

  async function load() {
    el.innerHTML = '<div class="skeleton"><i></i><i></i></div>';
    try {
      const q = kelas ? `?kelas=${encodeURIComponent(kelas)}` : '';
      const [sum, atts] = await Promise.all([call(`/peneliti/ringkasan${q}`), call(`/peneliti/literasi${q}${jenis ? (q ? '&' : '?') + 'jenis=' + jenis : ''}`)]);
      data = { sum, atts };
      if (alive) render();
    } catch (e) { if (alive) (token ? errorView(e.message) : loginView(e.message)); }
  }

  function errorView(msg) {
    el.innerHTML = `<div class="screen"><p class="fb" data-tone="warn"><span class="ic">!</span><span class="t">${esc(msg)}</span></p><button class="btn" type="button" data-act="reload">Coba lagi</button></div>`;
  }

  function header() {
    return `<div class="card-head" style="flex-wrap:wrap;gap:8px">
      <select id="kelas" aria-label="Filter kelas" style="max-width:220px"><option value="">Semua kelas</option>${data.sum.kelas.map((k) => `<option value="${esc(k)}" ${k === kelas ? 'selected' : ''}>${esc(k || '(tanpa kelas)')}</option>`).join('')}</select>
      <div class="segtabs" style="flex:1;min-width:260px">${[['ringkasan', 'Rekap siswa'], ['literasi', `Tes literasi (${data.sum.belum_dinilai} belum dinilai)`], ['ekspor', 'Ekspor']].map(([k, v]) => `<button type="button" data-view="${k}" aria-pressed="${view === k}">${v}</button>`).join('')}</div>
      <button class="btn ghost small" type="button" data-act="logout">${icon('logout', 18)} Keluar</button></div>`;
  }

  function sumView() {
    const rows = data.sum.siswa;
    if (!rows.length) return `<div class="empty-state">${icon('user', 36)}<p>Belum ada data siswa${kelas ? ' di kelas ini' : ''}. Data muncul setelah siswa memakai aplikasi saat online.</p></div>`;
    return `<div class="table-wrap"><table class="data"><thead><tr><th>Kelas</th><th>Kode</th><th>Aktivitas selesai</th><th>Latihan dicoba</th><th>Tepat (1×)</th><th>Miskonsepsi</th><th>Tanya AI</th><th>Pre</th><th>Post</th><th>Terakhir aktif</th><th></th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td>${esc(r.kode_kelas || '–')}</td><td><b>${esc(r.kode_siswa)}</b></td><td>${r.materi_selesai}</td><td>${r.latihan.soal_dicoba}</td>
        <td>${r.latihan.akurasi_pertama_persen === null ? '–' : r.latihan.akurasi_pertama_persen + '%'}</td>
        <td>${Object.entries(r.latihan.miskonsepsi).map(([k, v]) => `${esc(MIS[k] || k)} (${v})`).join(', ') || '–'}</td><td>${r.tanya_ai}</td>
        <td>${lit(r.literasi.pretest)}</td><td>${lit(r.literasi.posttest)}</td><td>${r.terakhir_aktif ? fmtDate(r.terakhir_aktif) : '–'}</td>
        <td><button class="btn small" type="button" data-student="${r.id}">Riwayat</button></td></tr>`).join('')}</tbody></table></div>`;
  }
  const lit = (x) => (!x ? '–' : x.total === null ? `<span class="pill warn">belum dinilai</span>` : `<b>${x.total}</b>/${x.maks}`);

  function attView() {
    return `<div class="segtabs" style="max-width:520px">${[['', 'Semua'], ['pretest', 'Pre-test'], ['posttest', 'Post-test'], ['latihan', 'Latihan']].map(([k, v]) => `<button type="button" data-jenis="${k}" aria-pressed="${jenis === k}">${v}</button>`).join('')}</div>
      ${data.atts.length ? `<div class="table-wrap"><table class="data"><thead><tr><th>Dikumpulkan</th><th>Kelas</th><th>Kode</th><th>Jenis</th><th>Skor</th><th>Saran AI</th><th></th></tr></thead><tbody>
      ${data.atts.map((a) => `<tr><td>${fmtDate(a.dikumpulkan)}</td><td>${esc(a.kode_kelas || '–')}</td><td><b>${esc(a.kode_siswa)}</b></td><td>${KIND[a.jenis_tes]}</td>
        <td>${a.dinilai ? `<b>${a.total}</b>/${a.maks}` : '<span class="pill warn">belum dinilai</span>'}</td><td>${a.ada_saran_ai ? '✓' : ''}</td>
        <td><button class="btn small ${a.dinilai ? '' : 'primary'}" type="button" data-att="${a.id}">${a.dinilai ? 'Lihat/ubah' : 'Nilai'}</button></td></tr>`).join('')}</tbody></table></div>`
      : `<div class="empty-state">${icon('clipboard', 36)}<p>Belum ada tes yang dikumpulkan.</p></div>`}`;
  }

  function expView() {
    const items = [['literasi', 'Rekap tes literasi', 'Skor per tahap, total, nilai 0–100, dan teks jawaban siswa'], ['siswa', 'Rekap per siswa', 'Aktivitas, ketepatan latihan, miskonsepsi, skor pre/post'], ['kejadian', 'Riwayat lengkap', 'Setiap jawaban latihan, langkah RMT, pertanyaan ke AI (data mentah)']];
    return `<ul class="rows">${items.map(([k, t, d]) => `<li><span class="r-ic">${icon('download', 18)}</span><span class="r-main"><b>${t}</b><small>${d}</small></span>
      <button class="btn small" type="button" data-exp="${k}">CSV</button></li>`).join('')}</ul>
      <p class="note">Berkas CSV memakai pemisah titik koma (;) agar langsung terbuka rapi di Excel berbahasa Indonesia${kelas ? `, hanya kelas ${esc(kelas)}` : ''}.</p>`;
  }

  function render() {
    if (!token) return loginView();
    if (detail) return scoreView();
    if (student) return studentView();
    el.innerHTML = `<div class="screen">${header()}
      <div class="stats" style="max-width:520px"><div class="stat"><b>${data.sum.siswa.length}</b><span>siswa</span></div>
        <div class="stat"><b>${data.sum.jumlah_pengerjaan_literasi}</b><span>tes dikumpulkan</span></div>
        <div class="stat"><b>${data.sum.belum_dinilai}</b><span>belum dinilai</span></div></div>
      ${view === 'ringkasan' ? sumView() : view === 'literasi' ? attView() : expView()}</div>`;
    el.querySelector('#kelas')?.addEventListener('change', (e) => { kelas = e.target.value; load(); });
  }

  function scoreView() {
    const ins = detail.instrumen;
    const sug = detail.saran_ai;
    const total = Object.values(scores).flat().reduce((a, b) => a + (b ?? 0), 0);
    const complete = ins.soal.every((s) => (scores[s.id] || []).every((v) => v !== null));
    el.innerHTML = `<div class="screen">
      <button class="btn ghost small" type="button" data-act="closeDetail" style="align-self:flex-start">${icon('back', 18)} Kembali ke daftar</button>
      <div class="card"><h2>${esc(detail.kode_siswa)} · ${KIND[detail.jenis_tes]}</h2><p class="muted">Kelas ${esc(detail.kode_kelas || '–')} · dikumpulkan ${fmtDate(detail.dikumpulkan)}</p>
        <p class="note">${esc(ins.pedoman_umum)}</p>
        <button class="btn soft small" type="button" data-act="suggest" ${busy ? 'disabled' : ''}>${busy ? '<span class="spinner"></span> AI sedang menilai…' : `${icon('spark', 18)} ${sug ? 'Minta ulang saran skor AI' : 'Minta saran skor dari AI'}`}</button>
        ${sug ? `<p class="note"><b>Ringkasan AI:</b> ${esc(sug.ringkasan || '')} <button class="btn ghost small" type="button" data-act="useAI">Pakai semua saran AI</button></p>` : ''}</div>
      ${ins.soal.map((s) => `<section class="card"><span class="indikator">${esc(s.indikator)}</span><h3>Soal ${s.nomor}. ${esc(s.judul)}</h3><p class="muted">${esc(s.stimulus)}</p>
        ${s.tahap.map((t, j) => `<div class="part" style="border-top:1px solid var(--line);padding-top:8px"><b>Tahap ${j + 1}. ${esc(t.pertanyaan)}</b>
          <p><b>Jawaban siswa:</b> ${esc((detail.jawaban[s.id] || [])[j] || '(kosong)')}</p>
          <p class="key"><b>Kunci:</b> ${esc(t.kunci)}</p>
          <div class="score-row">${Array.from({ length: t.skor_maks + 1 }, (_, v) => `<button class="sbtn" type="button" data-s="${s.id}:${j}:${v}" aria-pressed="${scores[s.id][j] === v}">${v}</button>`).join('')}
            <span class="muted">maks ${t.skor_maks}</span>${sug?.soal?.[s.id] ? `<span class="sugg">AI: ${sug.soal[s.id].skor[j]}</span>` : ''}</div></div>`).join('')}
        ${sug?.soal?.[s.id]?.catatan ? `<p class="note"><b>Catatan AI:</b> ${esc(sug.soal[s.id].catatan)}</p>` : ''}</section>`).join('')}
      <div class="field"><label for="note">Catatan penilai (opsional)</label><textarea id="note">${esc(detail.catatan || '')}</textarea></div>
      <div class="bottombar"><span class="big" style="align-self:center">${total}/${detail.maks}</span>
        <button class="btn primary" type="button" data-act="saveScore" ${complete ? '' : 'disabled'}>${complete ? 'Simpan skor' : 'Lengkapi semua tahap'}</button></div></div>`;
  }

  function studentView() {
    const st = student;
    const KL = (e) => {
      const d = e.data || {};
      if (e.jenis === 'latihan.jawab') return `${d.ok ? '✓' : '✗'} ${d.problem ? esc(fmtStatement(d.problem)) : ''} → x ${esc(d.answer ? `${d.answer.rel} ${d.answer.value?.n ?? d.answer.value}` : '')} ${d.code ? `(${esc(MIS[d.code] || d.code)})` : ''} · percobaan ${d.attempt}, petunjuk ${d.hints}`;
      if (e.jenis === 'rmt.langkah') return `Langkah ${d.n}: ${esc((d.text || '').slice(0, 200))} ${d.status ? `[AI: ${esc(d.status)}]` : ''}`;
      if (e.jenis.startsWith('ai.')) return esc((d.q || '').slice(0, 200));
      return esc(JSON.stringify(d).slice(0, 200));
    };
    el.innerHTML = `<div class="screen">
      <button class="btn ghost small" type="button" data-act="closeStudent" style="align-self:flex-start">${icon('back', 18)} Kembali</button>
      <div class="card"><h2>${esc(st.siswa.kode_siswa)} · ${esc(st.siswa.kode_kelas || 'tanpa kelas')}</h2>
        <p class="muted">Latihan: ${st.latihan.soal_dicoba} soal, tepat pada percobaan pertama ${st.latihan.akurasi_pertama_persen ?? '–'}%</p></div>
      <div class="table-wrap"><table class="data"><thead><tr><th>Waktu</th><th>Jenis</th><th>Isi</th></tr></thead><tbody>
        ${st.kejadian.map((e) => `<tr><td>${fmtDate(e.waktu)}</td><td>${esc(e.jenis)}</td><td style="white-space:normal;min-width:260px">${KL(e)}</td></tr>`).join('')}</tbody></table></div></div>`;
  }

  async function openAttempt(id) {
    el.innerHTML = '<div class="skeleton"><i></i></div>';
    try {
      detail = await call(`/peneliti/literasi/${id}`);
      scores = Object.fromEntries(detail.instrumen.soal.map((s) => [s.id, (detail.skor && detail.skor[s.id]) ? [...detail.skor[s.id]] : s.tahap.map(() => null)]));
      render(); window.scrollTo(0, 0);
    } catch (e) { errorView(e.message); }
  }

  async function exportCsv(name) {
    try {
      const q = kelas ? `&kelas=${encodeURIComponent(kelas)}` : '';
      const res = await api(`/peneliti/ekspor/${name}.csv?sep=%3B${q}`, { token, raw: true, timeout: 60000 });
      const text = await res.text();
      const file = `${name}-${kelas || 'semua'}-${new Date().toISOString().slice(0, 10)}.csv`;
      if (!downloadText(file, '﻿' + text.replace(/^﻿/, ''), 'text/csv')) toast('Unduh CSV dari laptop: buka dasbor ini di peramban.');
    } catch (e) { toast(e.message); }
  }

  const onClick = async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    if (d.view) { view = d.view; return render(); }
    if (d.jenis !== undefined) { jenis = d.jenis; return load(); }
    if (d.att) return openAttempt(d.att);
    if (d.exp) return exportCsv(d.exp);
    if (d.student) {
      try { student = await call(`/peneliti/siswa/${d.student}/riwayat`); render(); window.scrollTo(0, 0); } catch (err) { toast(err.message); }
      return undefined;
    }
    if (d.s) { const [sid, j, v] = d.s.split(':'); scores[sid][Number(j)] = Number(v); detail.catatan = el.querySelector('#note')?.value ?? detail.catatan; return render(); }
    switch (d.act) {
      case 'reload': return load();
      case 'logout': sessionStorage.removeItem(TK); token = null; return render();
      case 'closeDetail': detail = null; return load();
      case 'closeStudent': student = null; return render();
      case 'suggest':
        busy = true; detail.catatan = el.querySelector('#note')?.value ?? detail.catatan; render();
        try { detail.saran_ai = await call(`/peneliti/literasi/${detail.id}/saran-ai`, { method: 'POST', timeout: 90000 }); } catch (err) { toast(err.message); }
        busy = false; return alive ? render() : undefined;
      case 'useAI':
        for (const [sid, v] of Object.entries(detail.saran_ai.soal || {})) scores[sid] = [...v.skor];
        return render();
      case 'saveScore':
        try {
          await call(`/peneliti/literasi/${detail.id}/skor`, { method: 'PUT', body: { skor: scores, catatan: el.querySelector('#note').value } });
          toast('Skor tersimpan ✓'); detail = null; view = 'literasi'; return load();
        } catch (err) { toast(err.message); }
        return undefined;
      default:
    }
  };
  el.addEventListener('click', onClick);
  if (token) load(); else loginView();
  return () => { alive = false; document.body.classList.remove('wide-screen'); el.removeEventListener('click', onClick); };
}
