// Mengirim riwayat belajar & jawaban tes ke server peneliti saat online.
// Data menunggu di HP (per profil siswa) bila offline, lalu dikirim ulang. Server menolak data ganda
// berdasarkan UUID, jadi aman bila terkirim dua kali.
import * as store from './store.js';
import { api } from './api.js';

let busy = false;
let timer = null;
let lastError = '';
let lastOk = null;

export const status = () => ({ pending: store.pendingCount(), lastError, lastOk, busy });

export async function flush() {
  if (busy || !navigator.onLine) return status();
  busy = true;
  try {
    for (const prof of store.pendingProfiles()) {
      const ident = { student_code: prof.studentCode, class_code: prof.classCode || '' };
      for (let i = 0; i < prof.outbox.length; i += 100) {
        const chunk = prof.outbox.slice(i, i + 100);
        const res = await api('/events/batch', { method: 'POST', body: { ...ident, events: chunk } });
        store.ackEvents(prof.key, res.ids);
      }
      for (const att of prof.literasi.filter((a) => !a.sent && a.submittedAt)) {
        await api('/literasi/attempts', {
          method: 'POST',
          body: { ...ident, id: att.id, test_kind: att.kind, started_at: att.startedAt, submitted_at: att.submittedAt, answers: att.answers },
        });
        store.updateAttempt(prof.key, att.id, { sent: true });
      }
    }
    lastError = ''; lastOk = new Date();
  } catch (e) {
    lastError = e.message;
  } finally {
    busy = false;
    window.dispatchEvent(new Event('langkah:sync'));
  }
  return status();
}

export function schedule(ms = 4000) {
  clearTimeout(timer);
  timer = setTimeout(flush, ms);
}

export function start() {
  window.addEventListener('online', () => schedule(500));
  window.addEventListener('langkah:logged', () => schedule());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  schedule(1500);
}
