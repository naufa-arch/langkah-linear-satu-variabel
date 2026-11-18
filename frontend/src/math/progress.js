// Perhitungan progres, pencapaian (lencana), dan tingkat latihan adaptif. Fungsi murni tanpa DOM.
// Diuji pytest lewat V8 (backend/tests/test_math_engine.py).

// Statistik latihan dari riwayat kejadian 'latihan.jawab' (riwayat terbaru di depan).
export function practiceStats(history) {
  const tries = history.filter((e) => e.kind === 'latihan.jawab');
  const first = tries.filter((e) => e.data && e.data.attempt === 1);
  const firstOk = first.filter((e) => e.data.ok).length;
  const solved = tries.filter((e) => e.data && e.data.ok).length;
  const mis = {};
  for (const e of tries) if (!e.data.ok && e.data.code) mis[e.data.code] = (mis[e.data.code] || 0) + 1;
  // runtun terpanjang benar pada percobaan pertama (urut dari yang lama)
  let best = 0, run = 0;
  for (const e of first.slice().reverse()) { run = e.data.ok ? run + 1 : 0; if (run > best) best = run; }
  return {
    tried: first.length, firstOk, solved, bestStreak: best,
    accuracy: first.length ? Math.round((100 * firstOk) / first.length) : null,
    misconceptions: mis,
  };
}

// Saran tingkat berikutnya dari 8 soal terakhir (percobaan pertama, tanpa petunjuk dianggap kuat).
export function adaptiveLevel(history, current) {
  const order = ['mudah', 'sedang', 'sulit'];
  const recent = history.filter((e) => e.kind === 'latihan.jawab' && e.data && e.data.attempt === 1 && e.data.level === current).slice(0, 8);
  if (recent.length < 5) return { level: current, reason: null };
  const ok = recent.filter((e) => e.data.ok && !e.data.hints).length;
  const i = order.indexOf(current);
  if (ok / recent.length >= 0.8 && i < 2) return { level: order[i + 1], reason: 'naik' };
  if (ok / recent.length < 0.4 && i > 0) return { level: order[i - 1], reason: 'turun' };
  return { level: current, reason: 'tetap' };
}

// Banyak hari berturut-turut (sampai hari ini atau kemarin) yang ada aktivitas belajar.
export function streakDays(history, today) {
  const day = (iso) => iso.slice(0, 10);
  const days = new Set(history.map((e) => day(e.ts)));
  const d = new Date(today + 'T00:00:00Z');
  const key = () => d.toISOString().slice(0, 10);
  if (!days.has(key())) d.setUTCDate(d.getUTCDate() - 1);
  let n = 0;
  while (days.has(key())) { n++; d.setUTCDate(d.getUTCDate() - 1); }
  return n;
}

// Progres keseluruhan dari daftar aktivitas Peta Belajar.
export function overallProgress(modules, progress) {
  const acts = modules.flatMap((m) => m.acts.filter((a) => a.route));
  const done = acts.filter((a) => progress[a.id] === 'done').length;
  return { done, total: acts.length, pct: acts.length ? Math.round((100 * done) / acts.length) : 0 };
}

// Lencana pencapaian. ctx = { progress, stats, streak, attempts, aiCount, rmtDone }
export function badges(ctx) {
  const p = ctx.progress || {};
  const s = ctx.stats || { tried: 0, firstOk: 0, bestStreak: 0 };
  const list = [
    { id: 'mulai', icon: 'flag', title: 'Langkah Pertama', desc: 'Menyelesaikan satu aktivitas', earned: Object.keys(p).length >= 1 },
    { id: 'prasyarat', icon: 'check', title: 'Bekal Siap', desc: 'Menyelesaikan Cek Prasyarat', earned: p['cek-prasyarat'] === 'done' },
    { id: 'timbangan', icon: 'scale', title: 'Penjaga Timbangan', desc: 'Mencoba timbangan aljabar', earned: p.timbangan === 'done' },
    { id: 'plsv', icon: 'book', title: 'Paham PLSV', desc: 'Menyelesaikan Bab 1 materi', earned: p['bab-plsv'] === 'done' },
    { id: 'ptlsv', icon: 'numline', title: 'Ahli Tanda', desc: 'Menyelesaikan Bab 2 materi', earned: p['bab-ptlsv'] === 'done' },
    { id: 'cerita', icon: 'layers', title: 'Pembedah Cerita', desc: 'Menyelesaikan pembedah soal cerita', earned: p.pembedah === 'done' },
    { id: 'latih5', icon: 'target', title: 'Rajin Berlatih', desc: 'Mencoba 5 soal latihan', earned: s.tried >= 5 },
    { id: 'runtun5', icon: 'flame', title: 'Lima Beruntun', desc: '5 soal benar berturut-turut', earned: s.bestStreak >= 5 },
    { id: 'latih20', icon: 'trophy', title: 'Juara Latihan', desc: '20 soal benar pada percobaan pertama', earned: s.firstOk >= 20 },
    { id: 'rmt', icon: 'brain', title: 'Pemikir Teliti', desc: 'Menuntaskan 6 langkah berpikir RMT', earned: (ctx.rmtDone || 0) >= 1 },
    { id: 'tutor', icon: 'spark', title: 'Penanya Hebat', desc: 'Bertanya 3 kali ke Tutor AI', earned: (ctx.aiCount || 0) >= 3 },
    { id: 'literasi', icon: 'medal', title: 'Siap Literasi', desc: 'Mengumpulkan tes literasi', earned: (ctx.attempts || 0) >= 1 },
    { id: 'hari3', icon: 'star', title: 'Tiga Hari Belajar', desc: 'Belajar 3 hari berturut-turut', earned: (ctx.streak || 0) >= 3 },
  ];
  return list;
}
