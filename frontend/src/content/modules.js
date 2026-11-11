// Peta Belajar (docs/CONTENT.md §2). `route: null` = belum dibuat (ditampilkan "segera").
export const MODULES = [
  { id: 'prasyarat', title: 'Prasyarat', acts: [
    { id: 'cek-prasyarat', label: 'Cek bilangan bulat & suku sejenis', route: null },
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
    { id: 'pembedah', label: 'Pembedah soal cerita', route: null },
  ] },
  { id: 'campuran', title: 'Latihan Campuran', acts: [
    { id: 'latihan', label: 'Latihan mandiri (angka acak)', route: null },
  ] },
];
