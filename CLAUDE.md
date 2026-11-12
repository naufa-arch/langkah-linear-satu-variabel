# CLAUDE.md — Panduan untuk Claude Code di proyek *Langkah Linear*

## Apa proyek ini
Aplikasi web (PWA) untuk siswa SMP Fase D yang mempelajari **PLSV & PtLSV**. Aplikasi dirancang berdasarkan
**Cognitive Load Theory** untuk meningkatkan **literasi matematis**. Dibuat oleh mahasiswa S1 Pendidikan
Matematika sebagai produk penelitian pengembangan. Target utama: **HP Android kelas bawah, Chrome, sering offline**.

Baca sebelum mengerjakan fitur:
- [docs/PRD.md](docs/PRD.md): fitur (F0–F11), prioritas, kriteria penerimaan
- [docs/DESIGN.md](docs/DESIGN.md): prinsip P1–P10, token warna, wireframe, aturan 3D (§8)
- [docs/CONTENT.md](docs/CONTENT.md): urutan materi, langkah baku L1–L7, kamus kata kunci, miskonsepsi M1–M7
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): stack, struktur folder, model data, API, sinkronisasi
- [docs/ANALISIS-KEBUTUHAN.md](docs/ANALISIS-KEBUTUHAN.md): temuan wawancara T1–T10
- [docs/ROADMAP.md](docs/ROADMAP.md): sprint yang sedang berjalan

## Stack: **Python + JavaScript** (keputusan pengguna, jangan diganti)
- `frontend/`: **JavaScript murni (ES modules), tanpa build, tanpa Node.js.** CSS biasa, Three.js r160 lokal di `vendor/`, service worker buatan sendiri.
  **Jangan** menambah TypeScript, React, Vite, npm, atau langkah build apa pun tanpa izin pengguna.
- `backend/`: Python 3.12 · FastAPI · pydantic-settings · pytest · mini-racer (V8, untuk menguji JS) · ruff · uv.
  Menyusul di S6: SQLModel, Alembic, PostgreSQL, pandas.
- FastAPI menyajikan API di `/api/v1/...` **dan** folder `frontend/` di `/`.

**Pembagian tugas:** semua pembelajaran & mesin matematika ada di **frontend** (harus jalan offline).
Backend Python **hanya** untuk menyimpan data penelitian, kode kelas, dasbor & ekspor peneliti.

## Perintah (jalankan dari folder `backend/`)
```
uv sync                                   # pasang dependensi (sekali)
uv run fastapi dev app/main.py            # buka http://127.0.0.1:8000
uv run fastapi dev app/main.py --host 0.0.0.0   # agar bisa dibuka dari HP di Wi-Fi yang sama
uv run pytest                             # semua tes, termasuk mesin matematika JS
uv run ruff check . && uv run ruff format .
uv run python scripts/make_icons.py       # buat ulang ikon PWA
```
Catatan: service worker (offline) hanya aktif di `localhost` atau HTTPS, tidak aktif di alamat IP Wi-Fi.

## Aturan pedagogis (wajib, jangan dilanggar tanpa izin pengguna)
1. **Satu ide per layar.** Jangan menambah teks atau elemen ke layar belajar tanpa alasan dari DESIGN.md.
2. **Tidak ada auto-lanjut.** Siswa selalu menekan tombol untuk lanjut.
3. **Kode warna & bentuk konsisten**: x = biru + kotak, konstanta = ungu, tanda relasi & kata kunci = oranye.
   Warna tidak boleh menjadi satu-satunya penanda.
4. **Tidak memakai merah/suara/hukuman untuk jawaban salah.** Umpan balik menyebut bagian yang keliru.
5. **Garis bilangan**: ○ = tidak termasuk (<, >), ● = termasuk (≤, ≥); legenda selalu tampil.
6. Tanda pertidaksamaan dibalik **hanya** saat mengali/membagi kedua ruas dengan bilangan negatif.
7. Teks untuk siswa ditulis dalam **Bahasa Indonesia** yang baku tetapi ramah, berupa kalimat pendek dengan istilah sesuai
   buku Kurikulum Merdeka (ruas, koefisien, konstanta, himpunan penyelesaian, semesta).
8. Tulis simbol dengan karakter yang benar: `−` (U+2212), `≤`, `≥`, `×`, `÷`.

## Aturan teknis — frontend
- File logika yang diuji di V8 (`src/math/*.js`, `src/content/keywords.js`, `src/content/stories.js`) hanya boleh memakai
  **import satu baris dari `linear.js`**, tanpa DOM. Daftarkan file baru di `JS_FILES` (`backend/tests/test_math_engine.py`)
  dengan urutan sesuai ketergantungan. Setiap fungsi baru wajib punya tes.
- Tidak memakai float untuk perhitungan; gunakan bilangan bulat atau rasional `rat(n, d)`.
- Teks materi & soal di `src/content/`, bukan di dalam logika.
- Setiap layar adalah modul di `src/features/` yang mengekspor `title` dan `mount(el, params)`, dan mengembalikan fungsi pembersih.
  Daftarkan rutenya di `src/main.js` dan aktivitasnya di `src/content/modules.js`.
- **Setiap berkas baru di `frontend/` wajib ditambahkan ke `PRECACHE` di `sw.js`**; naikkan `VERSION`. Ada tes yang gagal bila lupa.
- Mobile-first, mulai dari lebar 360 px. Target sentuh ≥ 48 dp. Hormati `prefers-reduced-motion` dan setelan "Kurangi gerakan".
- Jangan memanggil CDN eksternal saat runtime; font & Three.js disimpan lokal.
- **3D** mengikuti DESIGN §8:
  - Pakai `src/three/view.js`: kamera tetap dengan rotasi ±25°, label HTML, render on demand, `dispose()` saat keluar layar.
  - Selalu ada pesan atau fallback bila WebGL tidak tersedia.
  - Prototipe acuan: `prototypes/lab-3d.html`.

## Aturan teknis — backend
- Rute API di bawah `/api/v1`. Static mount frontend harus tetap **paling akhir** di `main.py`.
- Endpoint siswa hanya **menulis** data miliknya; endpoint baca hanya untuk peneliti (JWT).
- `POST .../batch` harus **idempoten** berdasarkan UUID dari klien, dan wajib punya tes untuk itu.
- Perubahan skema DB lewat migrasi Alembic. Rahasia hanya di `.env`, dan perbarui `.env.example`.
- Jangan memakai SQLite di hosting dengan disk tidak permanen (ARCHITECTURE §7).

## Privasi
- Jangan pernah menulis nama asli siswa/informan di kode, konten, data contoh, basis data, atau commit.
  Gunakan kode (S1, S-07, 8B-KDH).
- Tanpa analitik/pelacak pihak ketiga.

## Cara kerja yang diharapkan
- Kerjakan per sprint sesuai ROADMAP; centang tugas di ROADMAP.md setelah selesai.
- Sebelum menyatakan selesai: `uv run pytest` dan `uv run ruff check .` lulus, lalu cek tampilan di lebar 360 px.
- Jika keputusan menyentuh Pertanyaan Terbuka di PRD §8, tanyakan ke pengguna, jangan menebak.
- Pengguna adalah mahasiswa pendidikan matematika, bukan programmer profesional, jadi jelaskan perubahan teknis
  dengan bahasa sederhana dan beri langkah yang bisa diikuti.
