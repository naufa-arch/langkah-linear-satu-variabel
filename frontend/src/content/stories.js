// Templat soal cerita (docs/CONTENT.md §7) untuk Pembedah Soal Cerita (F5).
// Angka diacak dengan seed, tetapi model & jawaban selalu konsisten (diuji pytest).
// Boleh import dari linear.js hanya dengan import SATU BARIS.
import { mulberry32, div, fmtNum } from '../math/linear.js';

const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const pickFrom = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const shuffle = (rng, arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
// pilihan unik (angka atau teks), yang benar ikut diacak posisinya
function choices(rng, correct, others) {
  const list = [correct];
  for (const o of others) if (!list.includes(o) && list.length < 3) list.push(o);
  const options = shuffle(rng, list);
  return { options, answer: options.indexOf(correct) };
}
const floorDiv = (p, q) => Math.floor(p / q);
const ceilDiv = (p, q) => Math.ceil(p / q);

export const ROLES = { known: 'Diketahui', asked: 'Ditanya', extra: 'Tidak diperlukan' };

const TEMPLATES = [
  {
    id: 'buku', title: 'Uang jajan Rani',
    make(rng) {
      let M, p, b;
      do { M = pickFrom(rng, [40, 45, 50, 60]); p = int(rng, 4, 9); b = int(rng, 6, 12); } while ((M - p) / b < 2);
      const N = floorDiv(M - p, b);
      return {
        unit: 'buku', note: 'Semua harga ditulis dalam ribu rupiah.',
        sentences: [
          { text: `Uang Rani Rp${M}.000.`, role: 'known' },
          { text: `Ia membeli sebuah pulpen seharga Rp${p}.000.`, role: 'known' },
          { text: 'Rani pergi ke toko bersama adiknya.', role: 'extra' },
          { text: `Sisa uangnya dipakai untuk membeli buku tulis seharga Rp${b}.000 per buku.`, role: 'known' },
          { text: 'Berapa buku paling banyak yang dapat dibeli Rani?', role: 'asked' },
        ],
        variable: ['banyak buku tulis yang dibeli', 'harga satu buku tulis', 'uang Rani'],
        keyword: 'paling banyak',
        model: { left: { a: b, b: p }, rel: '<=', right: { a: 0, b: M } },
        others: { x: [p, M], c: [b, M], r: [b, M - p] },
        interpret: {
          correct: `Rani dapat membeli paling banyak ${N} buku tulis.`,
          wrong: [`Rani dapat membeli paling sedikit ${N} buku tulis.`, `Rani dapat membeli paling banyak ${N + 1} buku tulis.`],
          explain: `Banyak buku harus bilangan cacah, jadi pilih bilangan cacah terbesar yang memenuhi: ${N}.`,
        },
      };
    },
  },
  {
    id: 'lift', title: 'Lift barang',
    make(rng) {
      let W, w0, k;
      do { W = pickFrom(rng, [250, 300, 350, 400]); w0 = int(rng, 50, 70); k = pickFrom(rng, [20, 25, 30, 40]); } while ((W - w0) / k < 2);
      const N = floorDiv(W - w0, k);
      return {
        unit: 'kotak', note: 'Semua berat ditulis dalam kilogram.',
        sentences: [
          { text: `Sebuah lift hanya mampu mengangkut beban tidak lebih dari ${W} kg.`, role: 'known' },
          { text: 'Lift itu berada di gedung berlantai delapan.', role: 'extra' },
          { text: `Seorang petugas dengan berat badan ${w0} kg membawa beberapa kotak.`, role: 'known' },
          { text: `Berat setiap kotak ${k} kg.`, role: 'known' },
          { text: 'Berapa kotak paling banyak yang dapat dibawa petugas itu dalam sekali naik?', role: 'asked' },
        ],
        variable: ['banyak kotak yang dibawa', 'berat satu kotak', 'berat badan petugas'],
        keyword: 'tidak lebih dari',
        model: { left: { a: k, b: w0 }, rel: '<=', right: { a: 0, b: W } },
        others: { x: [w0, W], c: [k, W], r: [k, W - w0] },
        interpret: {
          correct: `Petugas dapat membawa paling banyak ${N} kotak.`,
          wrong: [`Petugas dapat membawa paling sedikit ${N} kotak.`, `Petugas dapat membawa paling banyak ${N + 1} kotak.`],
          explain: `Banyak kotak harus bilangan cacah, jadi pilih bilangan cacah terbesar yang memenuhi: ${N}.`,
        },
      };
    },
  },
  {
    id: 'tabungan', title: 'Tabungan Dina',
    make(rng) {
      let s0, w, T;
      do { s0 = pickFrom(rng, [10, 15, 20, 25, 30]); w = int(rng, 4, 8); T = pickFrom(rng, [60, 75, 80, 100]); } while ((T - s0) / w < 2);
      const N = ceilDiv(T - s0, w);
      return {
        unit: 'minggu', note: 'Semua uang ditulis dalam ribu rupiah.',
        sentences: [
          { text: `Dina sudah memiliki tabungan Rp${s0}.000.`, role: 'known' },
          { text: `Setiap minggu ia menabung lagi Rp${w}.000.`, role: 'known' },
          { text: 'Sepatu yang ingin dibeli Dina berwarna biru.', role: 'extra' },
          { text: `Agar bisa membeli sepatu, tabungannya harus minimal Rp${T}.000.`, role: 'known' },
          { text: 'Berapa minggu Dina harus menabung?', role: 'asked' },
        ],
        variable: ['banyak minggu Dina menabung', 'uang yang ditabung setiap minggu', 'harga sepatu'],
        keyword: 'minimal',
        model: { left: { a: w, b: s0 }, rel: '>=', right: { a: 0, b: T } },
        others: { x: [s0, T], c: [w, T], r: [w, T - s0] },
        interpret: {
          correct: `Dina harus menabung paling sedikit ${N} minggu.`,
          wrong: [`Dina harus menabung paling banyak ${N} minggu.`, `Dina harus menabung paling sedikit ${N - 1} minggu.`],
          explain: `Banyak minggu harus bilangan cacah, jadi pilih bilangan cacah terkecil yang memenuhi: ${N}.`,
        },
      };
    },
  },
  {
    id: 'kuota', title: 'Kuota internet Dimas',
    make(rng) {
      const Q = pickFrom(rng, [20, 24, 30, 36]), d = pickFrom(rng, [2, 3]);
      let x; do { x = int(rng, 3, 8); } while (Q - d * x < 2);
      const s = Q - d * x;
      return {
        unit: 'hari', note: 'Semua kuota ditulis dalam GB.',
        sentences: [
          { text: `Kuota internet Dimas ${Q} GB.`, role: 'known' },
          { text: `Setiap hari ia memakai ${d} GB untuk belajar daring.`, role: 'known' },
          { text: 'Dimas suka menonton video sepak bola.', role: 'extra' },
          { text: `Setelah beberapa hari, kuotanya tinggal ${s} GB.`, role: 'known' },
          { text: 'Sudah berapa hari Dimas memakai kuotanya?', role: 'asked' },
        ],
        variable: ['banyak hari Dimas memakai kuota', 'kuota yang dipakai setiap hari', 'sisa kuota'],
        keyword: 'tinggal',
        model: { left: { a: -d, b: Q }, rel: '=', right: { a: 0, b: s } },
        others: { x: [d, Q], c: [d, s], r: [Q, d] },
        interpret: {
          correct: `Dimas sudah memakai kuotanya selama ${x} hari.`,
          wrong: [`Dimas sudah memakai kuotanya selama ${s} hari.`, `Dimas sudah memakai kuotanya selama ${x + 1} hari.`],
          explain: `Kuota berkurang ${d} GB setiap hari, jadi suku x bertanda negatif: ${fmtNum(Q)} ${'−'} ${d}x = ${s}.`,
        },
      };
    },
  },
  {
    id: 'umur', title: 'Umur Budi',
    make(rng) {
      const x = int(rng, 8, 14), k = pickFrom(rng, [2, 3]), c = int(rng, 2, 9);
      const A = k * x + c;
      return {
        unit: 'tahun', note: 'Semua umur ditulis dalam tahun.',
        sentences: [
          { text: `Umur ayah sama dengan ${k} kali umur Budi ditambah ${c} tahun.`, role: 'known' },
          { text: 'Budi bersekolah di SMP dekat rumahnya.', role: 'extra' },
          { text: `Umur ayah sekarang ${A} tahun.`, role: 'known' },
          { text: 'Berapa umur Budi sekarang?', role: 'asked' },
        ],
        variable: ['umur Budi sekarang', 'umur ayah sekarang', 'selisih umur ayah dan Budi'],
        keyword: 'sama dengan',
        model: { left: { a: k, b: c }, rel: '=', right: { a: 0, b: A } },
        others: { x: [c, A], c: [k, A], r: [x, A - c] },
        interpret: {
          correct: `Umur Budi sekarang ${x} tahun.`,
          wrong: [`Umur Budi sekarang ${A} tahun.`, `Umur Budi sekarang ${x + c} tahun.`],
          explain: `Cek: ${k} × ${x} + ${c} = ${A}, sama dengan umur ayah ✓`,
        },
      };
    },
  },
];

export const STORY_COUNT = TEMPLATES.length;

// index = templat ke berapa, seed = pengacak angka
export function makeStory(index, seed) {
  const t = TEMPLATES[((index % TEMPLATES.length) + TEMPLATES.length) % TEMPLATES.length];
  const rng = mulberry32(seed);
  const s = t.make(rng);
  const m = s.model;
  const slots = {
    x: choices(rng, m.left.a, s.others.x),
    c: choices(rng, m.left.b, s.others.c),
    rel: { options: ['=', '<', '>', '<=', '>='], answer: ['=', '<', '>', '<=', '>='].indexOf(m.rel) },
    r: choices(rng, m.right.b, s.others.r),
  };
  return {
    id: `${t.id}:${seed}`, template: t.id, title: t.title,
    sentences: s.sentences, unit: s.unit, note: s.note, keyword: s.keyword, model: m, slots,
    variable: choices(rng, s.variable[0], s.variable.slice(1)),
    interpret: { ...choices(rng, s.interpret.correct, s.interpret.wrong), explain: s.interpret.explain },
    value: div(m.right.b - m.left.b, m.left.a),
  };
}
