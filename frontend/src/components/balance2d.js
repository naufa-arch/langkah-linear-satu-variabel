// Timbangan aljabar 2D (SVG). Balok biru = x, kubus ungu = 1. Juga calon fallback untuk tampilan 3D.
// tilt dalam derajat: positif = ruas kiri turun.
export function balanceSVG({ left, right, tilt = 0, label = '' }) {
  const W = 320, H = 200, cx = 160, cy = 120, half = 112;
  const rad = (tilt * Math.PI) / 180;
  const L = { x: cx - half * Math.cos(rad), y: cy + half * Math.sin(rad) };
  const R = { x: cx + half * Math.cos(rad), y: cy - half * Math.sin(rad) };
  const out = [];
  out.push(`<line class="b2-metal" x1="${cx}" y1="${cy}" x2="${cx}" y2="${H - 18}"/>`);
  out.push(`<rect class="b2-base" x="${cx - 42}" y="${H - 18}" width="84" height="8" rx="3"/>`);
  out.push(`<line class="b2-metal" x1="${L.x.toFixed(1)}" y1="${L.y.toFixed(1)}" x2="${R.x.toFixed(1)}" y2="${R.y.toFixed(1)}"/>`);
  out.push(`<circle class="b2-pivot" cx="${cx}" cy="${cy}" r="7"/>`);
  for (const [end, items] of [[L, left], [R, right]]) {
    const panY = end.y - 14;
    out.push(`<line class="b2-stem" x1="${end.x.toFixed(1)}" y1="${end.y.toFixed(1)}" x2="${end.x.toFixed(1)}" y2="${panY.toFixed(1)}"/>`);
    out.push(`<rect class="b2-pan" x="${(end.x - 50).toFixed(1)}" y="${panY.toFixed(1)}" width="100" height="6" rx="3"/>`);
    out.push(stack(end.x, panY, items.x || 0, items.u || 0));
  }
  return `<svg class="b2" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label || `Timbangan: kiri ${left.x || 0} balok x dan ${left.u || 0} kubus, kanan ${right.x || 0} balok x dan ${right.u || 0} kubus`}">${out.join('')}</svg>`;
}

// tumpuk benda di atas piringan: baris pertama balok x, lalu kubus 6 per baris
function stack(x0, panY, nx, nu) {
  const out = [];
  const step = 16;
  let y = panY;
  if (nx) {
    const w = nx * step - 2;
    let x = x0 - w / 2;
    for (let i = 0; i < nx; i++, x += step) {
      out.push(`<rect class="b2-x" x="${x.toFixed(1)}" y="${(y - 30).toFixed(1)}" width="14" height="30" rx="2"/>`);
      out.push(`<text class="b2-tx" x="${(x + 7).toFixed(1)}" y="${(y - 11).toFixed(1)}">x</text>`);
    }
    y -= 32;
  }
  for (let row = 0; row * 6 < nu; row++) {
    const n = Math.min(6, nu - row * 6);
    const w = n * step - 2;
    let x = x0 - w / 2;
    for (let i = 0; i < n; i++, x += step) {
      out.push(`<rect class="b2-u" x="${x.toFixed(1)}" y="${(y - 14).toFixed(1)}" width="14" height="14" rx="2"/>`);
      out.push(`<text class="b2-tu" x="${(x + 7).toFixed(1)}" y="${(y - 3.5).toFixed(1)}">1</text>`);
    }
    y -= 16;
  }
  return out.join('');
}
