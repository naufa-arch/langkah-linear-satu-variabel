# PRD — *Langkah Linear*
**Product Requirements Document · v0.1 (draf perencanaan) · 11 November 2026**

> Nama "Langkah Linear" adalah nama kerja dan bisa diganti.

## 1. Latar belakang
Siswa SMP sering hanya menghafal prosedur PLSV/PtLSV ("pindah ruas", "balik tanda") tanpa memahami
alasannya. Mereka juga kesulitan menerjemahkan soal cerita ke model matematika. Wawancara dengan
siswa (lihat [ANALISIS-KEBUTUHAN.md](ANALISIS-KEBUTUHAN.md)) menunjukkan hambatan yang berasal dari
**beban kognitif**: soal cerita yang panjang, kata kunci yang tidak menonjol, konvensi garis bilangan
yang membingungkan, dan tempo penjelasan yang terlalu cepat.

## 2. Tujuan produk
1. **Mengelola beban intrinsik**: materi disusun dari prasyarat → konsep → prosedur → pemodelan.
2. **Mengurangi beban ekstrinsik**: satu ide per layar, penanda visual yang konsisten, tidak ada teks berlebih.
3. **Mendorong beban germane**: contoh bertahap, pertanyaan "mengapa?", verifikasi jawaban, dan variasi soal.
4. **Meningkatkan literasi matematis**: siswa mampu *merumuskan* (soal cerita → model), *menerapkan*
   (menyelesaikan), dan *menafsirkan* (hasil → konteks) sesuai siklus literasi matematis PISA.
5. **Mendukung penelitian**: mencatat skor, waktu, dan skala beban kognitif yang bisa diekspor.

## 3. Ruang lingkup

### Termasuk (MVP)
- Materi PLSV & PtLSV Fase D (kelas VII), elemen Aljabar Kurikulum Merdeka.
- Koefisien dan konstanta bilangan bulat; penyelesaian bulat (pecahan sederhana menyusul di v2).
- Bentuk soal: `ax + b = c`, `ax + b = cx + d`, `a(x + b) = c`, beserta versi pertidaksamaannya (<, >, ≤, ≥).
- Soal cerita kontekstual yang dekat dengan kehidupan siswa (uang jajan, kuota, lift, angkot, dsb.).
- Berjalan di peramban Android (Chrome), bisa dipasang sebagai PWA dan digunakan **offline**.
- **Backend Python (FastAPI)** yang mengumpulkan data penelitian dari semua HP secara otomatis saat online,
  ditambah dasbor & ekspor untuk peneliti.

### Tidak termasuk (MVP)
- Akun/login untuk siswa. Siswa cukup memasukkan **kode kelas + kode siswa**; hanya peneliti yang login.
- Materi SPLDV, persamaan kuadrat, nilai mutlak.
- Fitur sosial/papan peringkat (bisa memicu kecemasan dan menambah beban ekstrinsik).
- Aplikasi native (APK) — cukup PWA.

## 4. Pengguna
- **Siswa** (pengguna utama): lihat persona di [ANALISIS-KEBUTUHAN.md §3](ANALISIS-KEBUTUHAN.md#3-persona).
- **Peneliti/guru**: mengatur kode siswa, membuka data, dan mengekspor hasil.

## 5. Fitur & kebutuhan fungsional

Prioritas: **P0** = wajib ada di MVP, **P1** = penting tetapi bisa menyusul, **P2** = nanti.

| ID | Fitur | Prioritas | Asal temuan |
|---|---|---|---|
| F0 | Beranda & Peta Belajar | P0 | T7 |
| F1 | Cek Prasyarat | P0 | T4 |
| F2 | Model Timbangan (PLSV) | P0 | T1 |
| F3 | Simulasi Balik Tanda (PtLSV) | P0 | T2, T9 |
| F4 | Garis Bilangan Interaktif | P0 | T6, T9 |
| F5 | Pembedah Soal Cerita + Kamus Kata Kunci | P0 | T3, T5 |
| F6 | Contoh Bertahap → Memudar → Mandiri | P0 | T8, T10 |
| F7 | Cek Jawaban (uji nilai) | P1 | T9 |
| F8 | Skala Usaha Mental & Angket Beban Kognitif | P0 (penelitian) | Kerangka CLT |
| F9 | Progres & Ekspor Data | P0 (penelitian) | — |
| F10 | Mode Peneliti | P1 | — |
| F11 | Visualisasi 3D: timbangan + blok aljabar, garis bilangan berputar (Three.js) | P1 | T1, T2, T8, T9 |

### F0 — Beranda & Peta Belajar
- Menampilkan urutan modul: Prasyarat → PLSV → PtLSV → Soal Cerita → Latihan Campuran.
- Modul berikutnya **disarankan**, tetapi tidak dikunci; siswa tetap boleh memilih.
- Tombol "Lanjutkan" membawa siswa ke posisi terakhirnya.
- **Kriteria penerimaan:** dari beranda, siswa bisa melanjutkan pelajaran dengan 1 ketukan.

### F1 — Cek Prasyarat
- 6–8 soal singkat: operasi bilangan bulat (terutama negatif), suku sejenis, distributif sederhana.
- Jika ada kategori dengan ≥ 2 jawaban salah, sarankan **Ulasan Kilat** (≤ 3 layar) untuk kategori tersebut.
- **Kriteria penerimaan:** hasil per kategori tersimpan; siswa bisa melewati ulasan dengan konfirmasi.

### F2 — Model Timbangan (PLSV)
- Timbangan dua lengan: kiri = ruas kiri, kanan = ruas kanan; `x` digambarkan sebagai kotak, konstanta sebagai bulatan.
- Siswa memilih operasi ("kurangi 3 dari kedua ruas", "bagi kedua ruas dengan 2"). Timbangan tetap seimbang
  hanya jika operasi diterapkan di **kedua** ruas.
- Setelah operasi dilakukan, tampilkan padanannya dalam bentuk simbol: `2x + 3 = 11` → `2x = 8`.
- Muncul jembatan konsep: *"Inilah yang biasa disebut 'pindah ruas'."*
- Bilangan negatif ditampilkan dengan model **balon** (gaya angkat) atau cukup dengan simbol. Perlu diputuskan saat validasi ahli (Q4).
- **Kriteria penerimaan:** operasi yang hanya diterapkan pada satu ruas membuat timbangan miring dan memunculkan penjelasan, bukan sekadar "Salah".

### F3 — Simulasi Balik Tanda (PtLSV)
- Mulai dari pernyataan konkret yang benar, misalnya `2 < 5`, dengan kedua titik terlihat di garis bilangan.
- Siswa memakai penggeser (*slider*) untuk mengalikan kedua ruas dengan k ∈ {3, 2, 1, −1, −2, −3}.
- Titik-titik bergerak dengan animasi; saat k negatif, urutan titik **berbalik** dan tanda pertidaksamaan berubah warna dan berbalik.
- Pertanyaan refleksi (*self-explanation*): "Mengapa tandanya harus dibalik?", berupa pilihan ganda alasan.
- Setelah itu, terapkan ke `−2x < 6`.
- **Kriteria penerimaan:** animasi berjalan ≥ 30 fps di HP kelas bawah; ada pilihan "kurangi gerakan".

### F4 — Garis Bilangan Interaktif
- Komponen yang dipakai ulang di F3, F6, dan F7.
- Siswa mengetuk titik batas untuk mengganti ○/● dan mengetuk sisi kiri/kanan untuk memilih arah arsiran.
- Legenda **selalu terlihat**: ○ = "tidak termasuk", ● = "termasuk".
- Mendukung semesta **bilangan real** (arsiran sinambung) dan **bilangan bulat/cacah/asli** (titik-titik). Lihat [CONTENT.md §4](CONTENT.md).
- **Kriteria penerimaan:** target ketuk ≥ 48 dp; jawaban dinilai pada tiga aspek terpisah (letak batas, jenis bulatan, arah), dan umpan balik menyebut aspek yang salah.

### F5 — Pembedah Soal Cerita + Kamus Kata Kunci
- Soal cerita dipecah menjadi **kartu kalimat**, dan siswa mengungkap kartu satu per satu.
- Untuk setiap kartu, siswa menandai: **Diketahui**, **Ditanya**, atau **Tidak diperlukan**.
- Langkah "Pilih variabel": "Misalkan x = …", dipilih dari beberapa opsi.
- Frasa kata kunci (misalnya "paling banyak") bisa diketuk untuk memunculkan tanda yang sesuai (≤) beserta alasannya.
- Langkah "Susun model": kalimat matematika disusun dari kepingan (*drag* atau ketuk), bukan diketik bebas.
- Langkah "Tafsirkan": jawaban dikembalikan ke konteks ("Jadi, Rani bisa membeli paling banyak 4 buku").
- Kamus Kata Kunci bisa dibuka kapan saja dari tombol 📖.
- **Kriteria penerimaan:** tidak ada layar yang menampilkan soal lengkap dan langkah pengerjaan secara terpisah sehingga harus di-*scroll* (hindari *split attention*); soal ringkas tetap menempel di atas.

### F6 — Contoh Bertahap → Memudar → Mandiri
Setiap tipe soal melalui 4 tahap (*fading*):
1. **Contoh penuh**: langkah muncul satu per satu (tombol "Langkah berikutnya"), setiap langkah punya alasan singkat.
2. **Contoh dengan 1 langkah kosong**: siswa mengisi langkah terakhir.
3. **Contoh dengan sebagian besar langkah kosong**.
4. **Mandiri**: soal baru dengan pola sama dan **angka berbeda** (dibangkitkan acak).
- Bantuan bertingkat: *Petunjuk 1* (arah) → *Petunjuk 2* (langkah berikutnya) → *Lihat langkah*.
- Siswa naik tahap setelah 2 jawaban benar berturut-turut, dan bisa kembali ke tahap sebelumnya.
- **Kriteria penerimaan:** generator hanya menghasilkan soal dengan penyelesaian bulat di rentang −20…20 dan tanpa koefisien 0.

### F7 — Cek Jawaban (uji nilai)
- Setelah menjawab, siswa bisa mengetuk "Cek dengan angka": memilih satu nilai di garis bilangan, lalu aplikasi
  menyubstitusikannya ke pertidaksamaan **awal** dan menampilkan ✔/✘.
- Tujuannya menumbuhkan kebiasaan verifikasi, seperti pengalaman S1 (T9).

### F8 — Skala Usaha Mental & Angket Beban Kognitif
- **Skala usaha mental (Paas, 1992)**: skala 9 titik, muncul setelah tiap tahap F6 dan setiap soal cerita F5.
  Label ujung: 1 = "sangat, sangat ringan", 9 = "sangat, sangat berat".
- **Angket beban kognitif** di akhir modul, diadaptasi dari Klepsch dkk. (2017) atau Leppink dkk. (2013):
  butir intrinsik (IL), ekstrinsik (EL), dan germane (GL) dengan skala Likert. Teks butir disimpan
  di berkas konten agar mudah diganti setelah validasi ahli/terjemahan.
- Pengisian angket bersifat opsional bagi siswa dan bisa dimatikan peneliti.

### F9 — Progres, Sinkronisasi & Ekspor Data
- Data disimpan dulu di perangkat (IndexedDB), jadi aplikasi tetap berjalan tanpa internet.
- Tercatat per kejadian: kode kelas, kode siswa, modul, ID soal, jawaban, benar/salah, jumlah petunjuk, waktu (ms), skala usaha mental.
- Saat online, data **dikirim otomatis di latar** ke server Python. Siswa tidak perlu melakukan apa pun.
- Cadangan: ekspor CSV/JSON manual dari HP lewat Web Share API (WhatsApp/Drive).
- **Kriteria penerimaan:** HP yang dipakai dalam mode pesawat selama satu modul, lalu kembali online, mengirim semua data
  tanpa duplikat.

### F10 — Mode Peneliti (dasbor web)
- Peneliti login dengan username + password (di-hash di server).
- Membuat kode kelas, menyalakan/mematikan angket per kelas, melihat progres siswa per modul.
- Mengunduh CSV data mentah (log & angket) dan melihat ringkasan: akurasi, rata-rata usaha mental per tahap,
  skor IL/EL/GL, dan efisiensi instruksional. Ringkasan dihitung dengan pandas.

### F11 — Visualisasi 3D (Three.js)
- **Timbangan + blok aljabar 3D** untuk F2: balok biru = x, kubus ungu = 1, diletakkan di piringan. Siswa mengambil kubus dari kedua ruas
  atau satu ruas saja (timbangan miring), lalu membagi kedua ruas menjadi kelompok sama banyak.
- **Garis bilangan berputar** untuk F3: perkalian kedua ruas dengan k negatif diperlihatkan sebagai putaran 180° di titik 0.
- Mengikuti aturan DESIGN §8: kamera terbatas, kartu persamaan sinkron, fallback 2D.
- **Kriteria penerimaan:** alur 3D dan 2D menghasilkan langkah & log yang sama; ≥ 30 fps di HP uji; aplikasi tetap berjalan
  saat WebGL tidak tersedia.

## 6. Kebutuhan non-fungsional

| Kategori | Kebutuhan |
|---|---|
| Perangkat | Android 8+, Chrome 100+; lebar layar minimum 360 px; tetap nyaman di 320 px |
| Kinerja | Muatan awal ≤ 300 KB JS (gzip); *interaktif* < 3 detik di jaringan 3G; animasi ≥ 30 fps |
| Offline | Setelah dibuka sekali, seluruh materi berjalan tanpa internet (PWA + *service worker*) |
| Bahasa | Bahasa Indonesia baku tetapi ramah siswa; istilah sesuai buku Kurikulum Merdeka |
| Aksesibilitas | Kontras WCAG AA; huruf ≥ 16 px; warna **tidak pernah** menjadi satu-satunya penanda; dukungan *reduce motion* |
| Privasi | Tanpa nama asli (pakai kode siswa); tanpa pelacak/analitik pihak ketiga; data hanya dikirim ke server proyek lewat HTTPS; izin sekolah/orang tua sebelum uji coba |
| Server | Backend tidak wajib hidup agar siswa bisa belajar; jika server mati, data menunggu di HP lalu terkirim belakangan |
| Ketahanan | Progres tersimpan otomatis setiap langkah; aplikasi yang ditutup mendadak tidak kehilangan data |

## 7. Ukuran keberhasilan
**Produk**
- ≥ 80% siswa uji coba menyelesaikan modul PtLSV tanpa bantuan peneliti.
- Skor kepraktisan (angket respons siswa/guru) ≥ kategori "praktis".

**Pembelajaran (untuk penelitian)**
- Rata-rata skala usaha mental menurun dari tahap Contoh → Mandiri, sementara akurasi naik
  (indikasi efisiensi instruksional, Paas & van Merriënboer).
- Skor EL (beban ekstrinsik) rendah pada angket akhir.
- Peningkatan skor tes literasi matematis (pre-test → post-test) pada soal pemodelan.

## 8. Pertanyaan terbuka
| # | Pertanyaan | Dampak |
|---|---|---|
| ~~Q1~~ | ~~Cara pengumpulan data penelitian~~. **Diputuskan:** backend Python (FastAPI) dengan sinkronisasi otomatis; ekspor CSV di HP sebagai cadangan. | Lihat ARCHITECTURE |
| Q8 | Apakah 3D benar-benar menurunkan beban kognitif dibanding 2D? Bisa diuji: sebagian siswa memakai mode 3D, sebagian 2D, lalu bandingkan skala usaha mental & skor. | Bisa menjadi temuan penelitian; aplikasi sudah punya kedua mode |
| Q7 | Hosting backend: Render + Neon (gratis, server "tidur" saat sepi) atau PythonAnywhere? Apakah kampus menyediakan server? | Biaya & keandalan uji coba |
| Q2 | Model penelitian yang dipakai (ADDIE, 4-D, Plomp)? | Menentukan dokumen validasi dan urutan roadmap |
| Q3 | Instrumen beban kognitif mana yang diadaptasi (Leppink 2013 atau Klepsch 2017/2023), dan apakah terjemahannya sudah divalidasi? | Teks butir angket F8 |
| Q4 | Bilangan negatif pada model timbangan: model balon, atau langsung simbolik? | Desain F2 |
| Q5 | Semesta pembicaraan default: bilangan real atau bilangan bulat? (Buku siswa sering memakai keduanya.) | Tampilan F4 |
| Q6 | Berapa sekolah/kelas yang ikut uji coba, dan apakah semua siswa punya HP sendiri? | Kebutuhan mode berbagi perangkat |
