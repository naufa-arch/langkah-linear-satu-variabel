# Langkah Linear

Aplikasi belajar **Persamaan & Pertidaksamaan Linear Satu Variabel** untuk siswa SMP, tersedia sebagai web (PWA) dan
**aplikasi Android (APK)**. Pembelajaran memakai model **Rigorous Mathematical Thinking (RMT)** dengan prinsip
**Cognitive Load Theory**, untuk mendukung **literasi matematis**.

Stack: **Python** (FastAPI, `backend/`) + **JavaScript** (tanpa build, `frontend/`) + Three.js untuk visual 3D +
Capacitor (hanya pembungkus Android).

## Fitur
- **Materi** bertahap (PLSV, PtLSV, soal cerita), timbangan & balik tanda 3D, contoh bertahap, kamus kata kunci
- **Latihan** angka acak 3 tingkat + petunjuk bertingkat, deteksi miskonsepsi, saran tingkat adaptif, **Pembahasan** bertahap
- **Tutor AI** (DeepSeek, cadangan Gemini): menjelaskan materi, menjawab, memberi petunjuk, menganalisis jawaban,
  pembahasan bertahap, membuat soal sesuai kemampuan. Membimbing ala RMT, tidak langsung memberi jawaban.
- **6 Langkah Berpikir (RMT)**: Pahami → Kenali → Hubungkan representasi → Bernalar → Selesaikan → Jelaskan
- **Evaluasi**: instrumen Mathematical Literacy (5 soal, skor 30) untuk pre-test, post-test, dan latihan
- **Hasil belajar**: progres, lencana, statistik, riwayat; **Dasbor peneliti**: rekap, penskoran rubrik (+ saran AI), ekspor CSV
- Identitas siswa hanya **kode** (tanpa nama); satu HP bisa dipakai bergantian tanpa data tertukar

## Menjalankan di komputer
Butuh [uv](https://docs.astral.sh/uv/). Node.js **tidak** diperlukan untuk versi web.
```
cd backend
uv sync
uv run fastapi dev app/main.py
```
Buka **http://127.0.0.1:8000**. Dokumentasi API: http://127.0.0.1:8000/docs.
Kunci AI & kata sandi peneliti dibaca dari `.env` (folder utama atau `backend/`), contoh di [backend/.env.example](backend/.env.example).

**Mencoba di HP Android lewat Wi-Fi**: `uv run fastapi dev app/main.py --host 0.0.0.0`, lalu buka `http://IP-LAPTOP:8000`
di Chrome HP (cari IP dengan `ipconfig`). Atau klik dua kali `Jalankan Langkah Linear.bat` untuk link HTTPS sementara.

## Aplikasi Android (APK)
Lihat [docs/ANDROID.md](docs/ANDROID.md). Singkatnya: pasang Node.js LTS + Android Studio sekali, lalu klik dua kali
**`Buat APK Android.bat`** → hasil di `dist\LangkahLinear.apk`.

## Tes
```
cd backend
uv run pytest
uv run ruff check .
```

## Dokumen
| Berkas | Isi |
|---|---|
| [docs/ANALISIS-KEBUTUHAN.md](docs/ANALISIS-KEBUTUHAN.md) | Temuan wawancara → keputusan desain |
| [docs/PRD.md](docs/PRD.md) | Kebutuhan produk, fitur, kriteria penerimaan |
| [docs/DESIGN.md](docs/DESIGN.md) | Prinsip desain, gaya visual, wireframe, aturan 3D |
| [docs/CONTENT.md](docs/CONTENT.md) | Tujuan pembelajaran, urutan materi, bank soal |
| [docs/INSTRUMEN-LITERASI.md](docs/INSTRUMEN-LITERASI.md) | Instrumen Mathematical Literacy: pemeriksaan & cara pakai |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Rancangan teknis |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Hosting di Render + basis data |
| [docs/ANDROID.md](docs/ANDROID.md) | Membuat & memasang APK |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Tahapan pengembangan & penelitian |
| [CLAUDE.md](CLAUDE.md) | Panduan untuk asisten AI (Claude Code) |

Lisensi pihak ketiga: Three.js (MIT, `frontend/vendor/THREE-LICENSE.txt`), Atkinson Hyperlegible (SIL OFL, `frontend/fonts/OFL.txt`).
