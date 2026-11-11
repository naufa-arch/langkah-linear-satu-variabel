// Animasi sederhana + render "on demand": frame hanya digambar selama ada animasi (hemat baterai).
import { prefersReducedMotion } from './store.js';

const tweens = [];
let raf = 0;
let renderFn = null;

export function setRender(fn) { renderFn = fn; kick(); }
export function kick() { if (!raf) raf = requestAnimationFrame(frame); }
export function cancelAll() { tweens.length = 0; }

export function tween(obj, to, ms, onUpdate) {
  return new Promise((res) => {
    const from = {};
    for (const k in to) from[k] = obj[k];
    tweens.push({ obj, from, to, ms: prefersReducedMotion() ? 1 : ms, t0: performance.now(), res, onUpdate });
    kick();
  });
}

function frame(now) {
  raf = 0;
  for (let i = tweens.length - 1; i >= 0; i--) {
    const t = tweens[i];
    const p = Math.max(0, Math.min(1, (now - t.t0) / t.ms));
    const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    for (const k in t.to) t.obj[k] = t.from[k] + (t.to[k] - t.from[k]) * e;
    if (t.onUpdate) t.onUpdate();
    if (p >= 1) { tweens.splice(i, 1); t.res(); }
  }
  if (renderFn) renderFn();
  if (tweens.length) raf = requestAnimationFrame(frame);
}
