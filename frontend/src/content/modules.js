// Peta Belajar (docs/CONTENT.md §2). `route: null` = belum dibuat (ditampilkan "segera").
// `match` = rute lain yang termasuk aktivitas ini (untuk tombol "Lanjutkan").
// `rmt` = fase RMT yang paling ditekankan aktivitas itu (lihat content/rmt.js).
export const MODULES = [
  { id: 'materi', title: 'Materi: Pahami Dulu', icon: 'book', acts: [
    { id: 'bab-plsv', label: 'Bab 1 · Persamaan (PLSV)', route: '#/materi/istilah', rmt: 1,
      match: ['#/materi/plsv-apa', '#/materi/prinsip-timbangan', '#/materi/langkah-plsv'] },
    { id: 'bab-ptlsv', label: 'Bab 2 · Pertidaksamaan (PtLSV)', route: '#/materi/ptlsv-apa', rmt: 1,
      match: ['#/materi/sifat', '#/materi/himpunan', '#/materi/langkah-ptlsv'] },
    { id: 'bab-cerita', label: 'Bab 3 · Soal cerita & ringkasan', route: '#/materi/soal-cerita', rmt: 1,
      match: ['#/materi/ringkasan'] },
  ] },
  { id: 'prasyarat', title: 'Prasyarat', icon: 'check', acts: [
    { id: 'cek-prasyarat', label: 'Cek bilangan bulat & suku sejenis', route: '#/prasyarat', rmt: 1 },
  ] },
  { id: 'plsv', title: 'Persamaan (PLSV)', icon: 'scale', acts: [
    { id: 'timbangan', label: 'Timbangan & blok aljabar 3D', route: '#/timbangan', rmt: 2 },
    { id: 'contoh-PLSV', label: 'Contoh bertahap PLSV', route: '#/contoh/plsv', rmt: 2 },
  ] },
  { id: 'ptlsv', title: 'Pertidaksamaan (PtLSV)', icon: 'numline', acts: [
    { id: 'balik-tanda', label: 'Mengapa tanda dibalik? (3D)', route: '#/balik-tanda', rmt: 2 },
    { id: 'contoh-PtLSV', label: 'Contoh bertahap PtLSV + garis bilangan', route: '#/contoh/ptlsv', rmt: 2 },
  ] },
  { id: 'cerita', title: 'Soal Cerita', icon: 'layers', acts: [
    { id: 'kamus', label: 'Kamus kata kunci → tanda', route: '#/kamus', rmt: 1 },
    { id: 'pembedah', label: 'Pembedah soal cerita', route: '#/soal-cerita', rmt: 2 },
  ] },
  { id: 'rmt', title: 'Berpikir Teliti (RMT)', icon: 'brain', acts: [
    { id: 'rmt', label: '6 Langkah Berpikir: soal cerita', route: '#/rmt', rmt: 3 },
    { id: 'tutor', label: 'Diskusi dengan Tutor AI', route: '#/tutor', rmt: 3 },
  ] },
  { id: 'campuran', title: 'Latihan Campuran', icon: 'target', acts: [
    { id: 'latihan', label: 'Latihan mandiri (angka acak)', route: '#/latihan', rmt: 3 },
  ] },
  { id: 'evaluasi', title: 'Evaluasi Literasi', icon: 'clipboard', acts: [
    { id: 'evaluasi', label: 'Tes Mathematical Literacy (5 soal)', route: '#/evaluasi', rmt: 3 },
  ] },
];
