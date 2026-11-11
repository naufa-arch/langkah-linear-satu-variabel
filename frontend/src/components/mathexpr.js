// Render persamaan berwarna (DESIGN §3): x biru berbingkai, konstanta ungu, tanda oranye.
import { fmtNum, relSymbol, MINUS } from '../math/linear.js';

const R = (v) => (typeof v === 'number' ? { n: v, d: 1 } : v);
const escRel = (s) => s.replace('<', '&lt;').replace('>', '&gt;');

function xTerm(a) {
  const c = a === 1 ? '' : a === -1 ? MINUS : fmtNum(a);
  return `<span class="v">${c}<span class="xbox">x</span></span>`;
}

export function sideHTML(s) {
  const a = s.a || 0;
  const b = R(s.b || 0);
  const parts = [];
  if (a) parts.push(xTerm(a));
  if (b.n !== 0 || !a) {
    if (parts.length) {
      parts.push(`<span class="op">${b.n < 0 ? MINUS : '+'}</span>`);
      parts.push(`<span class="k">${fmtNum({ n: Math.abs(b.n), d: b.d })}</span>`);
    } else parts.push(`<span class="k">${fmtNum(b)}</span>`);
  }
  let inner = parts.join('');
  if (s.k !== undefined && s.k !== 1) {
    const k = s.k === -1 ? MINUS : fmtNum(s.k);
    inner = `<span class="k">${k}</span><span class="op">(</span>${inner}<span class="op">)</span>`;
  }
  return `<span class="side">${inner}</span>`;
}

export const relHTML = (rel, cls = '') => `<span class="s ${cls}">${escRel(relSymbol(rel))}</span>`;

export function statementHTML(st, relCls = '') {
  return `<span class="stmt">${sideHTML(st.left)}${relHTML(st.rel, relCls)}${sideHTML(st.right)}</span>`;
}
