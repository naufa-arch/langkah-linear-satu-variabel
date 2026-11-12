// Garis bilangan 2D (SVG). ○ = tidak termasuk, ● = termasuk (DESIGN §3, CLAUDE.md aturan 5).
import { fmtNum } from '../math/linear.js';

const num = (v) => (typeof v === 'number' ? v : v.n / v.d); // hanya untuk posisi gambar

// interval dari toInterval(); probe = bilangan uji (opsional) yang ditandai segitiga
export function numberLineSVG(interval, { probe = null } = {}) {
  const bv = num(interval.type === 'point' ? interval.value : interval.boundary);
  const lo = Math.floor(bv) - 5;
  const hi = Math.ceil(bv) + 5;
  const W = 340, pad = 20, y = 34;
  const X = (v) => pad + ((v - lo) / (hi - lo)) * (W - 2 * pad);
  const out = [];
  out.push(`<line class="axis" x1="4" y1="${y}" x2="${W - 4}" y2="${y}"/>`);
  for (let n = lo; n <= hi; n++) {
    const x = X(n).toFixed(1);
    const isB = n === bv;
    out.push(`<line class="tick" x1="${x}" y1="${y - 7}" x2="${x}" y2="${y + 7}"/>`);
    out.push(`<text class="num${isB ? ' b' : ''}" x="${x}" y="${y + 26}">${fmtNum(n)}</text>`);
  }
  const bx = X(bv);
  if (interval.type === 'ray') {
    const left = interval.dir === 'left';
    const end = left ? 8 : W - 8;
    out.push(`<line class="ray" x1="${bx.toFixed(1)}" y1="${y}" x2="${(left ? end + 8 : end - 8).toFixed(1)}" y2="${y}"/>`);
    out.push(left
      ? `<polygon class="head" points="${end},${y} ${end + 14},${y - 9} ${end + 14},${y + 9}"/>`
      : `<polygon class="head" points="${end},${y} ${end - 14},${y - 9} ${end - 14},${y + 9}"/>`);
  }
  const closed = interval.type === 'point' || interval.closed;
  out.push(`<circle class="dot${closed ? '' : ' open'}" cx="${bx.toFixed(1)}" cy="${y}" r="8"/>`);
  if (probe !== null && probe >= lo && probe <= hi) {
    const px = X(probe);
    out.push(`<polygon class="probe-mark" points="${px},${y - 12} ${px - 7},${y - 24} ${px + 7},${y - 24}"/>`);
  }
  const label = interval.type === 'point'
    ? `Titik ${fmtNum(interval.value)} pada garis bilangan`
    : `Garis bilangan: arsiran ke ${interval.dir === 'left' ? 'kiri' : 'kanan'} dari ${fmtNum(interval.boundary)}, bulatan ${closed ? 'penuh (termasuk)' : 'kosong (tidak termasuk)'}`;
  return `<svg class="nl" viewBox="0 0 ${W} 72" role="img" aria-label="${label}">${out.join('')}</svg>`;
}

// Garis bilangan dengan titik-titik bernama, misalnya [{ v: -2, label: 'A' }]. dots = titik penuh tanpa label (semesta bulat).
export function pointsSVG(points, { min = -6, max = 6, dots = [] } = {}) {
  const W = 340, pad = 20, y = 46;
  const X = (v) => pad + ((v - min) / (max - min)) * (W - 2 * pad);
  const out = [`<line class="axis" x1="4" y1="${y}" x2="${W - 4}" y2="${y}"/>`];
  for (let n = min; n <= max; n++) {
    const x = X(n).toFixed(1);
    out.push(`<line class="tick" x1="${x}" y1="${y - 7}" x2="${x}" y2="${y + 7}"/>`);
    out.push(`<text class="num" x="${x}" y="${y + 26}">${fmtNum(n)}</text>`);
  }
  for (const v of dots) out.push(`<circle class="dot" cx="${X(v).toFixed(1)}" cy="${y}" r="7"/>`);
  for (const p of points) {
    const x = X(p.v).toFixed(1);
    out.push(`<circle class="pt" cx="${x}" cy="${y}" r="8"/>`);
    out.push(`<text class="ptl" x="${x}" y="${y - 16}">${p.label}</text>`);
  }
  const aria = points.length ? `Titik ${points.map((p) => `${p.label} di ${fmtNum(p.v)}`).join(', ')}` : `Titik-titik ${dots.map(fmtNum).join(', ')}`;
  return `<svg class="nl" viewBox="0 0 ${W} 84" role="img" aria-label="${aria}">${out.join('')}</svg>`;
}

export const numberLineLegend = () =>
  '<div class="nl-legend"><span><i></i>bulatan kosong = tidak termasuk</span><span><i class="full"></i>bulatan penuh = termasuk</span></div>';
