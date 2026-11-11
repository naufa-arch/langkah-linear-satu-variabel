// Pembuat soal Cek Prasyarat (F1) dan Latihan Mandiri (F6 tahap 4). Fungsi murni.
// Boleh import dari linear.js, tetapi hanya dalam bentuk import SATU BARIS (pytest menghapus baris import).
import { mulberry32, fmtNum, MINUS, generate, solve } from './linear.js';

const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const nonZero = (rng, lo, hi) => { let v; do { v = int(rng, lo, hi); } while (v === 0); return v; };
const shuffle = (rng, arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const keyOf = (e) => `${e.a || 0}|${e.b || 0}`;
const par = (n) => (n < 0 ? `(${fmtNum(n)})` : fmtNum(n));
const coefX = (a) => (a === 1 ? 'x' : a === -1 ? MINUS + 'x' : fmtNum(a) + 'x');
const signed = (n, s = '') => `${n < 0 ? MINUS : '+'} ${Math.abs(n)}${s}`;

// 4 pilihan unik: 1 benar + pengecoh dari kesalahan umum, ditambah pengisi bila kurang
function withOptions(rng, correct, wrongs) {
  const seen = new Set([keyOf(correct)]);
  const list = [correct];
  for (const w of wrongs) {
    if (list.length >= 4) break;
    if (!seen.has(keyOf(w))) { seen.add(keyOf(w)); list.push(w); }
  }
  let d = 1;
  while (list.length < 4) {
    const w = { a: correct.a || 0, b: (correct.b || 0) + d };
    if (!seen.has(keyOf(w))) { seen.add(keyOf(w)); list.push(w); }
    d = d > 0 ? -d : -d + 1;
  }
  const options = shuffle(rng, list);
  return { options, answer: options.findIndex((o) => keyOf(o) === keyOf(correct)) };
}

/* ---------------- Cek Prasyarat ---------------- */
function qInt(rng, kind) {
  let prompt, c, wrongs, explain;
  if (kind === 'add') {
    const x = int(rng, -9, -2), y = int(rng, 2, 9);
    c = x + y; prompt = `${fmtNum(x)} + ${fmtNum(y)}`;
    wrongs = [-c, x - y, -(x - y)];
    explain = `Mulai dari ${fmtNum(x)}, lalu bergerak ${y} langkah ke kanan pada garis bilangan, sampai di ${fmtNum(c)}.`;
  } else if (kind === 'sub') {
    const x = int(rng, -6, 9), y = int(rng, -9, -2);
    c = x - y; prompt = `${fmtNum(x)} ${MINUS} ${par(y)}`;
    wrongs = [x + y, -c, -(x + y)];
    explain = `Mengurangi bilangan negatif sama dengan menambah lawannya: ${fmtNum(x)} ${MINUS} ${par(y)} = ${fmtNum(x)} + ${Math.abs(y)} = ${fmtNum(c)}.`;
  } else if (kind === 'mul') {
    const x = nonZero(rng, -9, 9), y = int(rng, -9, -2);
    c = x * y; prompt = `${par(x)} × ${par(y)}`;
    wrongs = [-c, x + y, -(x + y)];
    explain = `Tanda sama menghasilkan positif, tanda berbeda menghasilkan negatif. Jadi ${par(x)} × ${par(y)} = ${fmtNum(c)}.`;
  } else {
    const y = int(rng, -6, -2), q = nonZero(rng, -9, 9), x = q * y;
    c = q; prompt = `${par(x)} ÷ ${par(y)}`;
    wrongs = [-q, x + y, x - y];
    explain = `Aturan tanda pembagian sama dengan perkalian. Jadi ${par(x)} ÷ ${par(y)} = ${fmtNum(c)}.`;
  }
  return { cat: 'bulat', verb: 'Hitung', prompt, explain, ...withOptions(rng, { a: 0, b: c }, wrongs.map((b) => ({ a: 0, b }))) };
}

function qLike(rng, kind) {
  let prompt, correct, wrongs, explain;
  if (kind === 'xx') {
    const a = int(rng, 2, 9); let b; do { b = nonZero(rng, -9, 9); } while (a + b === 0);
    correct = { a: a + b }; prompt = `${a}x ${signed(b, 'x')}`;
    wrongs = [{ a: a - b }, { a: 0, b: a + b }, { a: -(a + b) }];
    explain = `${a}x dan ${coefX(Math.abs(b))} sejenis, jadi jumlahkan koefisiennya: ${a} ${signed(b)} = ${fmtNum(a + b)}.`;
  } else if (kind === 'mixed') {
    const a = int(rng, 2, 9), c = nonZero(rng, -9, 9), d = int(rng, 2, 9);
    correct = { a: a + d, b: c }; prompt = `${a}x ${signed(c)} + ${d}x`;
    wrongs = [{ a: a + d + c, b: 0 }, { a: a + d, b: -c }, { a, b: c + d }];
    explain = `Gabungkan hanya suku x: ${a}x + ${d}x = ${a + d}x. Konstanta ${fmtNum(c)} tidak sejenis dengan x, jadi tetap.`;
  } else {
    const a = int(rng, 2, 6), b = a + int(rng, 1, 5);
    correct = { a: a - b }; prompt = `${a}x ${MINUS} ${b}x`;
    wrongs = [{ a: b - a }, { a: a + b }, { a: -(a + b) }];
    explain = `${a} ${MINUS} ${b} = ${fmtNum(a - b)}, jadi hasilnya ${coefX(a - b)}.`;
  }
  return { cat: 'sejenis', verb: 'Sederhanakan', prompt, explain, ...withOptions(rng, correct, wrongs) };
}

function qDist(rng, negative) {
  const k = negative ? -int(rng, 2, 5) : int(rng, 2, 6);
  const b = nonZero(rng, -7, 7);
  const kTxt = k === -1 ? MINUS : fmtNum(k);
  const prompt = `${kTxt}(x ${signed(b)})`;
  const correct = { a: k, b: k * b };
  const wrongs = [{ a: k, b }, { a: k, b: -k * b }, { a: 1, b: k * b }, { a: -k, b: k * b }];
  const explain = `Kalikan ${fmtNum(k)} ke setiap suku di dalam kurung: ${fmtNum(k)} × x = ${coefX(k)} dan ${par(k)} × ${par(b)} = ${fmtNum(k * b)}.`;
  return { cat: 'distributif', verb: 'Jabarkan', prompt, explain, ...withOptions(rng, correct, wrongs) };
}

export const PREREQ_CATS = {
  bulat: 'Operasi bilangan bulat',
  sejenis: 'Suku sejenis',
  distributif: 'Sifat distributif (tanda kurung)',
};

export function prereqQuiz(seed) {
  const rng = mulberry32(seed);
  const qs = [
    qInt(rng, 'add'), qInt(rng, 'sub'), qInt(rng, rng() < 0.5 ? 'mul' : 'div'),
    qLike(rng, 'xx'), qLike(rng, 'mixed'), qLike(rng, 'neg'),
    qDist(rng, false), qDist(rng, true),
  ];
  return qs.map((q, i) => ({ ...q, id: `pra-${seed}-${i}` }));
}

// "Perlu ulasan" bila salahnya setengah atau lebih (PRD F1: ≥ 2 salah dari 3 soal)
export function prereqSummary(qs, picks) {
  const out = {};
  for (const cat of Object.keys(PREREQ_CATS)) out[cat] = { total: 0, correct: 0, weak: false };
  qs.forEach((q, i) => { out[q.cat].total++; if (picks[i] === q.answer) out[q.cat].correct++; });
  for (const r of Object.values(out)) r.weak = r.total - r.correct >= Math.ceil(r.total / 2);
  return out;
}

/* ---------------- Latihan Mandiri ---------------- */
export const LEVELS = {
  mudah: ['x+b=c', 'ax=c'],
  sedang: ['ax+b=c'],
  sulit: ['ax+b=cx+d', 'a(x+b)=c'],
};

export function practiceProblem(level, type, seed) {
  const rng = mulberry32(seed);
  const forms = LEVELS[level] || LEVELS.sedang;
  const form = forms[Math.floor(rng() * forms.length)];
  const t = type === 'campur' ? (rng() < 0.5 ? 'PLSV' : 'PtLSV') : type;
  return generate(form, { type: t, seed: (seed * 7919 + 13) >>> 0 });
}

const HINT1 = {
  L1: 'Hilangkan tanda kurung dulu: kalikan bilangan di luar kurung ke setiap suku di dalamnya.',
  L2: 'Kumpulkan semua suku x di ruas kiri: kurangi atau tambah kedua ruas dengan suku x yang ada di ruas kanan.',
  L3: 'Pindahkan konstanta ke ruas kanan: kurangi atau tambah kedua ruas dengan bilangan yang sama.',
  L5: 'Bagi kedua ruas dengan koefisien x. Ingat: jika pembaginya negatif, tanda pertidaksamaan dibalik.',
};
// Petunjuk bertingkat (PRD F6): 1 = arah, 2 = langkah pertama, 3 = semua langkah
export function hintFor(problem) {
  const sol = solve(problem);
  const first = sol.steps[0];
  return { arah: first ? HINT1[first.rule] : 'Soal ini sudah dalam bentuk x = …', first, steps: sol.steps };
}
