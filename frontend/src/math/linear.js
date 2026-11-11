// Mesin matematika PLSV & PtLSV.
// Aturan: fungsi murni (tanpa DOM), bilangan bulat atau rasional {n, d}, tidak memakai float.
// File ini juga dijalankan oleh pytest (backend/tests/test_math_engine.py) lewat mesin V8,
// jadi JANGAN menambah `import` di sini.

export const MINUS = '−';

/* ---------------- bilangan rasional ---------------- */
function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { const t = a % b; a = b; b = t; }
  return a || 1;
}
export function rat(n, d = 1) {
  if (d === 0) throw new Error('penyebut tidak boleh nol');
  if (typeof n === 'object') return rat(n.n * d, n.d);
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d);
  return { n: n / g + 0, d: d / g };
}
const R = (v) => (typeof v === 'number' ? { n: v, d: 1 } : v);
export const add = (x, y) => { x = R(x); y = R(y); return rat(x.n * y.d + y.n * x.d, x.d * y.d); };
export const sub = (x, y) => { y = R(y); return add(x, { n: -y.n, d: y.d }); };
export const mul = (x, y) => { x = R(x); y = R(y); return rat(x.n * y.n, x.d * y.d); };
export const div = (x, y) => { x = R(x); y = R(y); return rat(x.n * y.d, x.d * y.n); };
export const cmp = (x, y) => Math.sign(sub(x, y).n);
export const isInt = (v) => R(v).d === 1;

/* ---------------- relasi ---------------- */
export const RELS = ['=', '<', '>', '<=', '>='];
const SYM = { '=': '=', '<': '<', '>': '>', '<=': '≤', '>=': '≥' };
export const relSymbol = (r) => SYM[r];
export function flipRel(r) {
  return { '<': '>', '>': '<', '<=': '>=', '>=': '<=', '=': '=' }[r];
}
export function holds(rel, l, r) {
  const c = cmp(l, r);
  switch (rel) {
    case '=': return c === 0;
    case '<': return c < 0;
    case '>': return c > 0;
    case '<=': return c <= 0;
    case '>=': return c >= 0;
    default: throw new Error('relasi tidak dikenal: ' + rel);
  }
}

/* ---------------- format teks (pakai − U+2212) ---------------- */
export function fmtNum(v) {
  v = R(v);
  const s = v.n < 0 ? MINUS : '';
  const a = Math.abs(v.n);
  return v.d === 1 ? s + a : s + a + '/' + v.d;
}
// e = {a, b} artinya a·x + b
export function fmtExpr(e) {
  const a = e.a || 0;
  const b = R(e.b || 0);
  const parts = [];
  if (a !== 0) parts.push((a === 1 ? '' : a === -1 ? MINUS : fmtNum(a)) + 'x');
  if (b.n !== 0 || a === 0) {
    if (parts.length) parts.push((b.n < 0 ? MINUS : '+') + ' ' + fmtNum({ n: Math.abs(b.n), d: b.d }));
    else parts.push(fmtNum(b));
  }
  return parts.join(' ');
}
// sisi boleh punya faktor kurung k: k(ax + b)
export function fmtSide(s) {
  if (s.k === undefined || s.k === 1) return fmtExpr(s);
  const k = s.k === -1 ? MINUS : fmtNum(s.k);
  return `${k}(${fmtExpr(s)})`;
}
export function fmtStatement(st) {
  return `${fmtSide(st.left)} ${relSymbol(st.rel)} ${fmtSide(st.right)}`;
}

/* ---------------- penyelesaian langkah demi langkah (L1–L5, docs/CONTENT.md §3) ---------------- */
export function solve(problem) {
  let left = { a: problem.left.a || 0, b: problem.left.b || 0 };
  let right = { a: problem.right.a || 0, b: problem.right.b || 0 };
  let rel = problem.rel;
  const k = problem.left.k;
  const steps = [];
  const snap = () => ({ left: { ...left }, rel, right: { ...right } });

  if (k !== undefined && k !== 1) {
    left = { a: k * left.a, b: k * left.b };
    steps.push({ rule: 'L1', reason: 'Kalikan bilangan di luar kurung ke setiap suku di dalamnya.',
      op: { type: 'expand', k }, after: snap(), flipped: false });
  }
  if (right.a !== 0) {
    const t = right.a;
    left.a -= t; right.a = 0;
    steps.push({ rule: 'L2', reason: `${t > 0 ? 'Kurangi' : 'Tambah'} kedua ruas dengan ${fmtExpr({ a: Math.abs(t) })}.`,
      op: { type: 'add', x: -t, c: 0 }, after: snap(), flipped: false });
  }
  if (left.a === 0) {
    // tidak ada x tersisa: benar untuk semua x, atau tidak ada penyelesaian
    return { steps, kind: holds(rel, left.b, right.b) ? 'all' : 'none' };
  }
  if (left.b !== 0) {
    const t = left.b;
    left.b = 0; right.b -= t;
    steps.push({ rule: 'L3', reason: `${t > 0 ? 'Kurangi' : 'Tambah'} kedua ruas dengan ${Math.abs(t)}.`,
      op: { type: 'add', x: 0, c: -t }, after: snap(), flipped: false });
  }
  let value = rat(right.b);
  if (left.a !== 1) {
    const a = left.a;
    value = div(right.b, a);
    const flipped = a < 0 && rel !== '=';
    if (flipped) rel = flipRel(rel);
    steps.push({ rule: 'L5',
      reason: `Bagi kedua ruas dengan ${fmtNum(a)}.` + (flipped ? ' Karena membagi dengan bilangan negatif, tanda dibalik.' : ''),
      op: { type: 'div', by: a }, after: { left: { a: 1, b: 0 }, rel, right: { a: 0, b: value } }, flipped });
  }
  return { steps, kind: 'one', rel, value };
}

/* ---------------- cek nilai (F7) ---------------- */
export function evalSide(s, x) {
  const v = add(mul(s.a || 0, x), s.b || 0);
  return s.k !== undefined ? mul(s.k, v) : v;
}
export function check(problem, x) {
  return holds(problem.rel, evalSide(problem.left, x), evalSide(problem.right, x));
}

/* ---------------- himpunan penyelesaian untuk garis bilangan ---------------- */
export function toInterval(rel, value) {
  if (rel === '=') return { type: 'point', value };
  return { type: 'ray', boundary: value, closed: rel === '<=' || rel === '>=', dir: rel[0] === '<' ? 'left' : 'right' };
}

/* ---------------- deteksi miskonsepsi (docs/CONTENT.md §6) ---------------- */
// ans = { rel, value }
export function diagnose(problem, ans) {
  const sol = solve(problem);
  if (sol.kind !== 'one') return { ok: false, code: 'special' };
  const sameVal = cmp(ans.value, sol.value) === 0;
  if (sameVal && ans.rel === sol.rel) return { ok: true, code: null };
  if (sameVal && problem.rel !== '=') {
    if (ans.rel === flipRel(sol.rel)) {
      return { ok: false, code: sol.steps.some((s) => s.flipped) ? 'M2' : 'M3' };
    }
    const strict = { '<': '<=', '<=': '<', '>': '>=', '>=': '>' };
    if (strict[sol.rel] === ans.rel) return { ok: false, code: 'M4' };
    return { ok: false, code: 'rel' };
  }
  // M6: salah tanda saat "pindah ruas" pada ax + b = c  → x = (c + b) / a
  if (problem.left.k === undefined && !problem.right.a && problem.left.b) {
    const wrong = div(add(problem.right.b, problem.left.b), problem.left.a);
    if (cmp(ans.value, wrong) === 0) return { ok: false, code: 'M6' };
  }
  return { ok: false, code: 'value' };
}

/* ---------------- generator soal dengan seed (F6 tahap mandiri) ---------------- */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const nonZero = (rng, lo, hi) => { let v; do { v = int(rng, lo, hi); } while (v === 0); return v; };

export const FORMS = ['x+b=c', 'ax=c', 'ax+b=c', 'ax+b=cx+d', 'a(x+b)=c'];

export function generate(form, { type = 'PLSV', seed = 1, negative = true } = {}) {
  const rng = mulberry32(seed);
  const coef = () => (negative ? pick(rng, [-5, -4, -3, -2, 2, 3, 4, 5]) : int(rng, 2, 5));
  const rel = type === 'PLSV' ? '=' : pick(rng, ['<', '>', '<=', '>=']);
  const x = int(rng, -9, 9);
  let left;
  let right;
  switch (form) {
    case 'x+b=c': { const b = nonZero(rng, -9, 9); left = { a: 1, b }; right = { a: 0, b: x + b }; break; }
    case 'ax=c': { const a = coef(); left = { a, b: 0 }; right = { a: 0, b: a * x }; break; }
    case 'ax+b=c': { const a = coef(); const b = nonZero(rng, -9, 9); left = { a, b }; right = { a: 0, b: a * x + b }; break; }
    case 'ax+b=cx+d': {
      const a = coef(); let c; do { c = nonZero(rng, -5, 5); } while (c === a);
      const b = nonZero(rng, -9, 9);
      left = { a, b }; right = { a: c, b: (a - c) * x + b }; break;
    }
    case 'a(x+b)=c': { const k = coef(); const b = nonZero(rng, -6, 6); left = { k, a: 1, b }; right = { a: 0, b: k * (x + b) }; break; }
    default: throw new Error('bentuk soal tidak dikenal: ' + form);
  }
  return { id: `${type}:${form}:${seed}`, type, form, left, rel, right, seed };
}
