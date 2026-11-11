# Langkah Linear

Aplikasi web (PWA) untuk belajar **Persamaan & Pertidaksamaan Linear Satu Variabel** bagi siswa SMP.
Aplikasi dirancang dengan prinsip **Cognitive Load Theory** untuk mendukung **literasi matematis**, dan
dioptimalkan untuk HP Android.

Stack: **Python** (FastAPI, `backend/`) + **JavaScript** (tanpa build, `frontend/`) + Three.js untuk visual 3D.

## Menjalankan di komputer
Butuh [uv](https://docs.astral.sh/uv/). Node.js **tidak** diperlukan.

```
cd backend
uv sync
uv run fastapi dev app/main.py
```
Buka **http://127.0.0.1:8000** di peramban. Dokumentasi API ada di http://127.0.0.1:8000/docs.

**Mencoba di HP Android** (HP dan laptop di Wi-Fi yang sama):
1. Jalankan `uv run fastapi dev app/main.py --host 0.0.0.0`
2. Cari alamat IP laptop (PowerShell: `ipconfig`, lihat *IPv4 Address*, misalnya 192.168.1.5)
3. Di Chrome HP buka `http://192.168.1.5:8000`

   Jika tidak terbuka, izinkan Python di Windows Firewall untuk jaringan *Private*. Mode offline/pasang aplikasi
   baru aktif setelah di-hosting dengan HTTPS.

## Tes
```
cd backend
uv run pytest
```

## Dokumen
| Berkas | Isi |
|---|---|
| [docs/ANALISIS-KEBUTUHAN.md](docs/ANALISIS-KEBUTUHAN.md) | Temuan wawancara → keputusan desain |
| [docs/PRD.md](docs/PRD.md) | Kebutuhan produk, fitur, kriteria penerimaan |
| [docs/DESIGN.md](docs/DESIGN.md) | Prinsip desain, gaya visual, wireframe, aturan 3D |
| [docs/CONTENT.md](docs/CONTENT.md) | Tujuan pembelajaran, urutan materi, bank soal |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Rancangan teknis |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Tahapan pengembangan & penelitian |
| [CLAUDE.md](CLAUDE.md) | Panduan untuk asisten AI (Claude Code) |
| [prototypes/lab-3d.html](prototypes/lab-3d.html) | Prototipe 3D mandiri |

Lisensi pihak ketiga: Three.js (MIT, `frontend/vendor/THREE-LICENSE.txt`), Atkinson Hyperlegible (SIL OFL, `frontend/fonts/OFL.txt`).
