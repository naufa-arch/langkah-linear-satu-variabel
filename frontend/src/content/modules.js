// Peta Belajar (docs/CONTENT.md §2). `route: null` = belum dibuat (ditampilkan "segera").
// `match` = rute lain yang termasuk aktivitas ini (untuk tombol "Lanjutkan").
export const MODULES = [
  { id: 'materi', title: 'Materi: Pahami Dulu', acts: [
    { id: 'bab-plsv', label: 'Bab 1 · Persamaan (PLSV)', route: '#/materi/istilah',
      match: ['#/materi/plsv-apa', '#/materi/prinsip-timbangan', '#/materi/langkah-plsv'] },
    { id: 'bab-ptlsv', label: 'Bab 2 · Pertidaksamaan (PtLSV)', route: '#/materi/ptlsv-apa',
      match: ['#/materi/sifat', '#/materi/himpunan', '#/materi/langkah-ptlsv'] },
    { id: 'bab-cerita', label: 'Bab 3 · Soal cerita & ringkasan', route: '#/materi/soal-cerita',
      match: ['#/materi/ringkasan'] },
  ] },
  { id: 'prasyarat', title: 'Prasyarat', acts: [
    { id: 'cek-prasyarat', label: 'Cek bilangan bulat & suku sejenis', route: '#/prasyarat' },
  ] },
  { id: 'plsv', title: 'Persamaan (PLSV)', acts: [
    { id: 'timbangan', label: 'Timbangan & blok aljabar 3D', route: '#/timbangan' },
    { id: 'contoh-PLSV', label: 'Contoh bertahap PLSV', route: '#/contoh/plsv' },
  ] },
  { id: 'ptlsv', title: 'Pertidaksamaan (PtLSV)', acts: [
    { id: 'balik-tanda', label: 'Mengapa tanda dibalik? (3D)', route: '#/balik-tanda' },
    { id: 'contoh-PtLSV', label: 'Contoh bertahap PtLSV + garis bilangan', route: '#/contoh/ptlsv' },
  ] },
  { id: 'cerita', title: 'Soal Cerita', acts: [
    { id: 'kamus', label: 'Kamus kata kunci → tanda', route: '#/kamus' },
    { id: 'pembedah', label: 'Pembedah soal cerita', route: '#/soal-cerita' },
  ] },
  { id: 'campuran', title: 'Latihan Campuran', acts: [
    { id: 'latihan', label: 'Latihan mandiri (angka acak)', route: '#/latihan' },
  ] },
];
