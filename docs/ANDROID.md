# Membuat aplikasi Android (APK) Langkah Linear

Aplikasi Android dibuat dengan **Capacitor**: frontend yang sama (`frontend/`, JavaScript tanpa build) dibungkus menjadi
aplikasi asli Android. Semua materi, latihan, dan mesin matematika ikut di dalam APK, jadi **tetap jalan offline**.
Tutor AI, pengiriman data penelitian, dan pembahasan tes membutuhkan internet ke server (backend FastAPI).

| Pengaturan | Nilai | Berkas |
|---|---|---|
| Nama aplikasi | Langkah Linear | `capacitor.config.json` |
| ID aplikasi | `id.langkahlinear.app` | `capacitor.config.json` |
| Ikon & splash | dibuat dari `assets/*.png` | `backend/scripts/make_android_assets.py` |
| Alamat server | `REMOTE_API` | `frontend/src/config.js` |

## Langkah 1 — Pasang alat (sekali saja)
Buka **PowerShell** (bukan terminal di dalam folder OneDrive juga tidak apa-apa), lalu jalankan:
```
winget install OpenJS.NodeJS.LTS
winget install Google.AndroidStudio
```
Lalu:
1. Buka **Android Studio** sekali. Ikuti wizard *Standard* sampai selesai mengunduh **Android SDK** (±1–2 GB).
2. Tutup dan buka ulang VS Code agar perintah `node` dan `npm` dikenali.
3. Cek: `node -v` (harus v22 atau lebih baru).

## Langkah 2 — Atur alamat server
APK tidak membawa server. Buka `frontend/src/config.js` dan isi `REMOTE_API` dengan link server Anda:
- Setelah deploy ke Render (lihat [DEPLOY.md](DEPLOY.md)): misalnya `https://langkah-linear.onrender.com`
- Untuk uji coba di Wi-Fi yang sama: biarkan saja, lalu di aplikasi buka **Profil → Pengaturan lanjutan → Alamat server**
  dan isi `http://IP-LAPTOP:8000` (server dijalankan dengan `uv run fastapi dev app/main.py --host 0.0.0.0`).

## Langkah 3 — Buat APK
Klik dua kali **`Buat APK Android.bat`** di folder utama proyek, atau di terminal VS Code:
```
powershell -ExecutionPolicy Bypass -File scripts\build-apk.ps1
```
Skrip ini otomatis: `npm install` → `npx cap add android` (sekali) → membuat ikon & splash → `npx cap sync android` →
`gradlew assembleDebug`. Pertama kali butuh 5–15 menit. Hasilnya: **`dist\LangkahLinear.apk`**.

## Langkah 4 — Pasang di HP
1. Kirim `LangkahLinear.apk` ke HP (WhatsApp ke diri sendiri, Google Drive, atau kabel USB).
2. Buka filenya di HP → izinkan **Instal aplikasi dari sumber ini** → **Instal**.
3. Ikon "Langkah Linear" muncul di layar utama.

## Setelah mengubah kode
Cukup jalankan `Buat APK Android.bat` lagi (atau `npx cap sync android` lalu build ulang di Android Studio), kemudian pasang
ulang APK di HP. Progres siswa di HP tetap tersimpan.

## Membuka di Android Studio (opsional)
`npx cap open android` → tunggu Gradle selesai → tombol ▶ **Run** untuk menjalankan di HP yang tersambung kabel USB
(aktifkan *Opsi pengembang → Debug USB* di HP) atau di emulator.

## APK rilis bertanda tangan (untuk dibagikan luas / Play Store)
APK di atas adalah versi *debug*: bisa dipasang langsung dan cukup untuk uji coba penelitian. Untuk versi rilis:
Android Studio → **Build → Generate Signed App Bundle / APK** → buat *keystore* baru → simpan file keystore & kata
sandinya di tempat aman (jangan di-commit; sudah diabaikan oleh `.gitignore`).

## Masalah umum
| Gejala | Penyebab & solusi |
|---|---|
| `node` tidak dikenali | Tutup & buka ulang VS Code setelah memasang Node.js |
| `Java tidak ditemukan` | Pasang Android Studio, buka sekali; skrip memakai Java bawaan (`jbr`) |
| `SDK location not found` | Buka Android Studio → More Actions → SDK Manager → pasang Android SDK Platform terbaru |
| Tutor AI "Tidak bisa terhubung ke server" | Periksa `REMOTE_API` / alamat server di Profil; server Render gratis butuh ±1 menit untuk bangun |
| Pakai `http://IP:8000` tidak tersambung | HP & laptop harus satu Wi-Fi, server dijalankan dengan `--host 0.0.0.0`, izinkan Python di Windows Firewall |
