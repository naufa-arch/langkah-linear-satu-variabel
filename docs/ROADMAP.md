# ROADMAP

Disusun agar selaras dengan model pengembangan (misalnya ADDIE). Sesuaikan jika memakai 4-D/Plomp (PRD Q2).

## Fase 0 — Analisis (sebagian sudah selesai)
- [x] Wawancara siswa (1 informan) → [ANALISIS-KEBUTUHAN.md](ANALISIS-KEBUTUHAN.md)
- [ ] Tambah 2–4 wawancara siswa + 1 wawancara guru
- [ ] Analisis kurikulum: CP/ATP Fase D sekolah uji coba
- [ ] Jawab Pertanyaan Terbuka Q1–Q6 di [PRD.md](PRD.md#8-pertanyaan-terbuka)
- [ ] Siapkan terjemahan angket beban kognitif & skala usaha mental

## Fase 1 — Desain
- [x] PRD, DESIGN, CONTENT, ARCHITECTURE (draf)
- [ ] Prototipe kertas/Figma untuk 5 layar utama → uji ke 2–3 siswa (≤ 15 menit)
- [x] Prototipe 3D (timbangan + blok, garis bilangan berputar): `prototypes/lab-3d.html`
- [ ] Uji prototipe 3D di HP Android kelas bawah + 2–3 siswa: apakah lebih jelas dari 2D? (PRD Q8)
- [ ] Finalisasi bank soal: ≥ 10 soal per bentuk + ≥ 8 templat soal cerita

## Fase 2 — Pengembangan MVP
| Sprint | Isi | Selesai bila |
|---|---|---|
| S1 ✅ | `frontend/` (JS tanpa build, PWA, token desain, router, beranda, kode siswa, pengaturan) + `backend/` (FastAPI `/health` + menyajikan frontend) | ✅ jalan lokal · ⬜ deploy HTTPS & uji pasang di HP |
| S2 ✅ | `frontend/src/math/linear.js` (solve L1–L5, cek nilai, interval, miskonsepsi M2–M6, generator ber-seed) + `keywords.js`, diuji pytest via V8 | ✅ 34 tes lulus |
| S3 ◐ | `mathexpr`, `numberline`, F6 tahap 1 "Contoh bertahap" (PLSV & PtLSV + cek dengan angka), Kamus kata kunci | ✅ tahap 1 · ⬜ tahap 2–4 fading |
| S4 ◐ | F2 Timbangan + blok aljabar 3D dan F3 Balik tanda 3D (Three.js lazy, render on demand); F6 (PtLSV) | ✅ versi 3D · ⬜ fallback 2D SVG · ⬜ uji ≥ 30 fps di HP |
| S5 | F5 Pembedah Soal Cerita + Kamus, F7 Cek Jawaban | 5 templat soal cerita berjalan |
| S6 | Backend: model DB + Alembic, `/enroll`, `/events/batch`, `/survey/batch`; frontend: F1 Prasyarat, F8 Skala/angket, outbox + sinkronisasi | Uji mode pesawat → online: data masuk DB tanpa duplikat |
| S7 | Backend: login peneliti, kelas, ekspor CSV, ringkasan pandas; frontend: F10 dasbor peneliti | CSV terbuka benar di Excel/Sheets |
| S8 | Poles: aksesibilitas, mode gelap, Lighthouse, keamanan (CORS, rate limit), uji di HP nyata | Lolos anggaran kinerja & daftar cek keamanan |

## Fase 3 — Validasi & Uji Coba (Implementasi)
- [ ] Validasi ahli materi & ahli media (lembar validasi)
- [ ] Revisi
- [ ] Uji coba perorangan (1–3 siswa) → uji kelompok kecil (6–9 siswa) → uji lapangan
- [ ] Kumpulkan: angket kepraktisan, skala usaha mental, angket CL, pre/post test literasi

## Fase 4 — Evaluasi
- [ ] Analisis efektivitas & efisiensi instruksional
- [ ] Revisi akhir, dokumentasi, rilis v1.0

## Backlog v2
- Pecahan & desimal pada koefisien
- Analisis lanjutan di backend (grafik per siswa, pola miskonsepsi per kelas)
- Narasi audio (prinsip modalitas) dengan opsi mati
- Dasbor guru
- Mode berbagi perangkat (banyak siswa, satu HP)
