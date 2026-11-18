// Enam Langkah Berpikir RMT (Rigorous Mathematical Thinking, Kinard & Kozulin).
// Tiga fase RMT dipetakan ke enam langkah:
//   Fase 1 Pengembangan kognitif      → langkah 1–2 (memahami informasi, mengenali konsep)
//   Fase 2 Konten sebagai aktivitas    → langkah 3–4 (menghubungkan representasi, bernalar)
//   Fase 3 Praktik & refleksi          → langkah 5–6 (menyelesaikan runtut, menjelaskan alasan)
// Sama dengan RMT_STAGES di backend/app/ai/prompts.py.
export const RMT_PHASES = [
  { id: 1, title: 'Fase 1 · Membangun cara berpikir', stages: [1, 2] },
  { id: 2, title: 'Fase 2 · Membangun konsep', stages: [3, 4] },
  { id: 3, title: 'Fase 3 · Praktik & refleksi', stages: [5, 6] },
];

export const RMT_STAGES = [
  {
    n: 1, key: 'pahami', icon: 'eye', short: 'Pahami',
    title: 'Pahami informasi',
    ask: 'Tulis apa yang <b>diketahui</b> dan apa yang <b>ditanyakan</b> dari soal ini.',
    tip: 'Baca kalimat satu per satu. Coret informasi yang tidak dibutuhkan.',
    placeholder: 'Diketahui: …\nDitanyakan: …',
  },
  {
    n: 2, key: 'kenali', icon: 'brain', short: 'Kenali',
    title: 'Kenali konsepnya',
    ask: 'Ini soal <b>persamaan</b> (=) atau <b>pertidaksamaan</b> (&lt;, &gt;, ≤, ≥)? Kata kunci apa yang membuatmu yakin?',
    tip: '“Paling banyak”, “tidak lebih dari” → ≤. “Paling sedikit”, “minimal” → ≥. “Sama dengan”, “tepat” → =.',
    placeholder: 'Konsepnya … karena ada kata …',
  },
  {
    n: 3, key: 'hubungkan', icon: 'layers', short: 'Hubungkan',
    title: 'Hubungkan representasi',
    ask: 'Tentukan <b>variabel</b>, lalu ubah cerita menjadi <b>kalimat matematika</b>. Lihat timbangan di bawah sebagai gambaran.',
    tip: 'Konkret (timbangan) → visual (gambar) → simbolik (persamaan). Misalkan x = hal yang ditanyakan.',
    placeholder: 'Misalkan x = …\nModel: …',
  },
  {
    n: 4, key: 'bernalar', icon: 'bulb', short: 'Bernalar',
    title: 'Bernalar: susun rencana',
    ask: 'Langkah apa yang akan kamu lakukan pertama, dan <b>mengapa</b>?',
    tip: 'Ingat prinsip timbangan: apa yang dilakukan pada satu ruas, lakukan juga pada ruas lain.',
    placeholder: 'Pertama aku akan … karena …',
  },
  {
    n: 5, key: 'selesaikan', icon: 'steps', short: 'Selesaikan',
    title: 'Selesaikan dengan runtut',
    ask: 'Tulis langkah penyelesaianmu baris demi baris, lalu isi jawaban akhirnya.',
    tip: 'Satu baris satu langkah. Tanda dibalik hanya saat mengali/membagi dengan bilangan negatif.',
    placeholder: '… = …\n… = …\nx = …',
  },
  {
    n: 6, key: 'jelaskan', icon: 'chat', short: 'Jelaskan',
    title: 'Jelaskan & periksa',
    ask: 'Periksa jawabanmu dengan memasukkan nilai x ke soal awal. Lalu tulis <b>kesimpulan</b> dalam konteks cerita.',
    tip: 'Apakah jawabannya masuk akal? Misalnya banyak barang tidak mungkin negatif atau pecahan.',
    placeholder: 'Periksa: …\nJadi, …',
  },
];
