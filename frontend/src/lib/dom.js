export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Kotak umpan balik: tone = 'info' | 'ok' | 'warn' (tanpa merah, DESIGN P9)
export function say(el, tone, html) {
  el.dataset.tone = tone;
  el.querySelector('.ic').textContent = tone === 'ok' ? '✓' : tone === 'warn' ? '!' : 'i';
  el.querySelector('.t').innerHTML = html;
}
export const feedbackBox = (id) => `<p class="fb" id="${id}" data-tone="info" aria-live="polite"><span class="ic">i</span><span class="t"></span></p>`;

export const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Panggil fn saat tema terang/gelap berubah. Mengembalikan fungsi untuk berhenti.
export function onThemeChange(fn) {
  const mq = matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', fn);
  const mo = new MutationObserver(fn);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => { mq.removeEventListener('change', fn); mo.disconnect(); };
}
