# Menaruh Langkah Linear di internet (Render)

Hasil akhirnya adalah satu link HTTPS tetap, misalnya `https://langkah-linear.onrender.com`, yang bisa dibuka di laptop dan HP
dari mana saja. Dengan HTTPS, aplikasi juga bisa **dipasang ke layar utama** dan **jalan offline**.

Biaya: gratis. Server gratis Render "tidur" setelah ±15 menit tidak dipakai, jadi pembukaan pertama setelah itu bisa
lambat (±30–60 detik). Setelah sekali terbuka, PWA tersimpan di HP dan tetap bisa dipakai walau server tidur.

## Langkah 1 — Buat repositori di GitHub (sekali saja)
1. Buat akun di https://github.com (lewati jika sudah punya).
2. Klik **New repository** dengan pengaturan berikut:
   - Nama: `langkah-linear`
   - Pilih **Private**, karena dokumen perencanaan memuat nama dan NIM Anda.
   - **Jangan** centang README, .gitignore, atau license, karena sudah ada.
3. Klik **Create repository**, lalu salin alamatnya, misalnya `https://github.com/NAMA-ANDA/langkah-linear.git`.

## Langkah 2 — Unggah kode dari laptop
Di terminal VS Code:
```
cd C:\Users\Naufa123\Projects\langkah-linear
git remote add origin https://github.com/NAMA-ANDA/langkah-linear.git
git push -u origin main
```
Jika muncul jendela login GitHub, masuk dan izinkan.

## Langkah 3 — Hubungkan ke Render
1. Buat akun di https://render.com, sebaiknya dengan **Sign in with GitHub**.
2. Klik **New → Blueprint**, lalu pilih repositori `langkah-linear`. Jika repositori belum muncul, klik *Configure GitHub*
   dan izinkan Render mengakses repositori itu.
3. Render membaca `render.yaml` secara otomatis. Klik **Apply** atau **Deploy**.
4. Tunggu ±3–5 menit sampai status **Live**. Link aplikasi tampil di bagian atas halaman layanan.

## Setelah itu
- Setiap kali ada perubahan, cukup `git add -A`, `git commit -m "pesan"`, lalu `git push`. Render memperbarui situs secara otomatis.
- Cek server hidup: buka `<link>/api/v1/health`, hasilnya harus `{"status":"ok",...}`.
- Pasang di HP: buka link di Chrome Android → menu ⋮ → **Tambahkan ke layar utama** / **Instal aplikasi**.

## Langkah 4 — Basis data & rahasia (wajib untuk Tutor AI dan data penelitian)
1. Buat basis data PostgreSQL gratis di https://neon.tech (atau Supabase). Salin *connection string*-nya,
   misalnya `postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`.
2. Di Render, buka layanan `langkah-linear` → **Environment**, isi:
   | Nama | Isi |
   |---|---|
   | `DATABASE_URL` | connection string dari Neon/Supabase |
   | `DEEPSEEK_API_KEY` | kunci DeepSeek (kosongkan bila memakai Gemini) |
   | `GEMINI_API_KEY` | kunci Gemini (cadangan) |
   | `RESEARCHER_PASSWORD` | kata sandi dasbor peneliti |
   | `JWT_SECRET` | dibuat otomatis oleh Render |
3. Masih di **Environment**, bagian **Secret Files** → **Add Secret File**:
   - Filename: `instrumen_literasi.json`
   - Contents: salin seluruh isi berkas `backend/app/data/instrumen_literasi.json` dari laptop.
   Berkas ini berisi kunci jawaban & rubrik, sengaja **tidak** di-commit ke GitHub (repo publik). Tanpa ini, tes literasi
   tidak bisa dikumpulkan/dinilai di server online (server memberi pesan "Kunci instrumen literasi belum dipasang").
4. Klik **Save, rebuild, and deploy**. Tabel basis data dibuat otomatis saat server menyala.
5. Cek: `<link>/api/v1/health` harus berisi `"ai":true`.
6. Salin link Render ke `REMOTE_API` di `frontend/src/config.js`, lalu buat ulang APK ([ANDROID.md](ANDROID.md)).

## Catatan
- Kunci API **tidak pernah** dikirim ke HP: aplikasi memanggil `/api/v1/ai/...` di server, server yang memanggil DeepSeek/Gemini.
- Progres siswa tetap tersimpan di HP (per kode siswa) dan dikirim ke server saat online; pengiriman ulang tidak membuat data ganda.
- **Jangan** memakai SQLite di Render gratis karena datanya bisa hilang (ARCHITECTURE §7). Di laptop, SQLite dipakai otomatis
  (`backend/data/langkah.db`).
- Region diatur ke Singapura (`render.yaml`) agar cepat dari Indonesia.
