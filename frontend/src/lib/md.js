// Menampilkan teks jawaban AI dengan aman: semua HTML di-escape dulu, lalu hanya **tebal**,
// *miring*, daftar bernomor/berpoin, dan baris baru yang diubah menjadi tag.
import { esc } from './dom.js';

const inline = (s) => s
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  .replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,!?:;]|$)/g, '$1<i>$2</i>')
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\$+([^$]+)\$+/g, '$1'); // buang tanda LaTeX $...$ bila ada

export function renderMd(text) {
  const lines = esc(String(text || '')).replace(/\r/g, '').split('\n');
  const out = [];
  let list = null;
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const raw of lines) {
    const line = raw.trim();
    const ol = line.match(/^(\d+)[.)]\s+(.*)$/);
    const ul = line.match(/^[-•*]\s+(.*)$/);
    const h = line.match(/^#{1,4}\s+(.*)$/);
    if (ol) { if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol'; } out.push(`<li>${inline(ol[2])}</li>`); }
    else if (ul) { if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; } out.push(`<li>${inline(ul[1])}</li>`); }
    else if (!line) close();
    else if (h) { close(); out.push(`<p><b>${inline(h[1])}</b></p>`); }
    else { close(); out.push(`<p>${inline(line)}</p>`); }
  }
  close();
  return out.join('');
}
