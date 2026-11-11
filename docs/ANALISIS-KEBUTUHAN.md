# Analisis Kebutuhan — dari Wawancara ke Fitur

> Sumber: *Hasil Wawancara Siswa Materi PLSV & PtLSV* (Hashifah Naufa Setiawan, NIM 2225250207).
> Informan disebut **S1** (siswa SMP yang sudah mempelajari PLSV & PtLSV). Nama asli informan
> **tidak** dicantumkan di dokumen proyek maupun di dalam aplikasi.

## 1. Ringkasan konteks

| Aspek | Isi |
|---|---|
| Materi | Persamaan Linear Satu Variabel (PLSV) & Pertidaksamaan Linear Satu Variabel (PtLSV) |
| Fokus | Perpindahan ruas, aturan perkalian/pembagian bilangan negatif pada PtLSV, pemodelan soal cerita |
| Metode | Wawancara kualitatif deskriptif, *probing* netral, ±5 menit 20 detik, daring |
| Kerangka teori | Cognitive Load Theory (Paas, 1992; Leppink dkk., 2013; Klepsch dkk., 2017; Klepsch & Seufert, 2023) |
| Tujuan aplikasi | Menurunkan *extraneous load*, mengelola *intrinsic load*, mendorong *germane load* → meningkatkan literasi matematis |

> ⚠️ **Inkonsistensi yang perlu dicek di dokumen sumber:** Bagian B menyebut informan "kelas VII",
> sedangkan Bagian D menulis "Kelas: 8B". Kemungkinan besar siswa kini kelas VIII dan mempelajari
> materi saat kelas VII (Fase D, Kurikulum Merdeka). Samakan penulisannya di laporan.

## 2. Temuan → jenis beban kognitif → keputusan desain

| # | Temuan wawancara (kutipan/parafrase S1) | Jenis beban | Prinsip yang dipakai | Keputusan fitur |
|---|---|---|---|---|
| T1 | "Yang masih diingat itu cara **pindah ruas** angkanya." → hanya ingat prosedur, bukan alasannya | Intrinsik (skema belum terbentuk) | Bangun skema konseptual sebelum prosedur | **F2 Model Timbangan**: "pindah ruas" ditampilkan sebagai *melakukan operasi yang sama di kedua ruas* |
| T2 | Paling sulit: PtLSV, "kalau dibagi/dikali angka **minus**, tandanya harus **dibalik**" | Intrinsik tinggi (banyak elemen saling terkait) | Isolasi elemen; simulasi interaktif | **F3 Simulasi Balik Tanda**: kalikan kedua ruas dengan bilangan negatif, lihat titik-titik di garis bilangan berbalik |
| T3 | Kata kunci "**paling banyak**" sering terlewat, padahal menentukan tanda ≤ | Ekstrinsik (informasi penting tidak menonjol) | *Signaling* (penanda) | **F5 Pembedah Soal Cerita** + **Kamus Kata Kunci → Tanda** |
| T4 | Harus lancar **operasi aljabar dasar (suku sejenis)**; "kalau dasarnya tidak bisa, susah lanjut" | Intrinsik (prasyarat belum ada) | *Pre-training*, urutan sederhana → kompleks | **F1 Cek Prasyarat** + ulasan singkat suku sejenis & bilangan bulat |
| T5 | Soal cerita "panjang dan muter-muter", bingung "kalimat mana yang jadi bentuk matematika" | Ekstrinsik (*split attention*, teks padat) | *Segmenting*, *chunking*, koherensi | **F5**: soal dipecah per kalimat; siswa memilah *Diketahui / Ditanya / Tidak penting* |
| T6 | Garis bilangan: bingung **bulatan kosong vs bulatan penuh** | Ekstrinsik (konvensi visual tidak dijelaskan) | *Signaling*, konsistensi representasi | **F4 Garis Bilangan Interaktif** dengan legenda tetap: ○ = tidak termasuk, ● = termasuk |
| T7 | Penjelasan guru "lumayan cepat"; saat mencoba sendiri "masih ragu-ragu" | Ekstrinsik (tempo tidak bisa diatur siswa) | *Learner-paced segmenting* | Semua materi **diatur siswa sendiri**: tombol "Langkah berikutnya", bisa diulang |
| T8 | Paling paham dengan **simulasi interaktif** atau **langkah setahap demi setahap yang divisualisasikan** | Germane (mendorong pembentukan skema) | *Worked example*, visualisasi | **F6 Contoh Bertahap** (langkah muncul satu per satu + visual) |
| T9 | "Awalnya cuma hafal aturan. Setelah **dicek pakai garis bilangan**, baru sadar posisinya memang berbalik" | Germane (*self-explanation*, verifikasi) | *Self-explanation prompt*, umpan balik | **F7 Cek Jawaban**: uji nilai pada pertidaksamaan awal, hasilnya tampil di garis bilangan |
| T10 | Mandiri setelah "dibimbing satu soal sampai paham polanya, lalu coba soal yang **beda angkanya**" | Germane (transfer) | *Fading worked examples* → *completion problem* → soal mandiri; variasi angka | **F6** bertahap memudar + **generator soal** dengan angka acak dan pola sama |

## 3. Persona

**Persona utama — "Siswa SMP Fase D" (berdasarkan S1)**
- Usia 12–14 tahun, kelas VII–VIII.
- Belajar lewat buku paket dan penjelasan guru; mengingat prosedur, tapi pemahaman konsepnya rapuh.
- Memakai HP Android milik sendiri atau keluarga; kemungkinan RAM 2–4 GB, layar ±6", kuota terbatas, sinyal kadang lemah.
- Lebih suka visual dan interaksi daripada membaca teks panjang.
- Butuh rasa aman untuk mencoba (tidak dihukum saat salah).

**Persona pendukung — "Guru/Peneliti"**
- Mahasiswa peneliti atau guru matematika yang menjalankan uji coba.
- Butuh data: skor, waktu, skala usaha mental, angket beban kognitif.
- Tidak punya server sendiri; butuh cara ekspor data yang sederhana (CSV/JSON, bagikan lewat WhatsApp/Drive).

## 4. Keterbatasan data kebutuhan
- Data berasal dari **satu informan**, jadi temuan bersifat indikatif. Sebaiknya ditambah 2–4 siswa lagi
  dan/atau wawancara guru sebelum desain dikunci (lihat [ROADMAP.md](ROADMAP.md), Fase 0).
- Wawancara singkat (±5 menit), sehingga hambatan lain (misalnya operasi pecahan, tanda kurung) belum tergali.

## 5. Referensi
Dari dokumen wawancara:
- Leppink, J., Paas, F., Van der Vleuten, C. P. M., Van Gog, T., & Van Merriënboer, J. J. G. (2013). *Behavior Research Methods, 45*, 1058–1072. https://doi.org/10.3758/s13428-013-0334-1
- Klepsch, M., Schmitz, F., & Seufert, T. (2017). *Frontiers in Psychology, 8*, 1997. https://doi.org/10.3389/fpsyg.2017.01997
- Klepsch, M., & Seufert, T. (2023). *Educational Psychology Review*. https://doi.org/10.1007/s10648-023-09738-0
- Paas, F. (1992). *Journal of Educational Psychology, 84*(4), 429–434. https://doi.org/10.1037/0022-0663.84.4.429

Referensi tambahan yang disarankan untuk prinsip desain (cek ulang detailnya sebelum dikutip):
- Sweller, J., van Merriënboer, J. J. G., & Paas, F. (2019). Cognitive architecture and instructional design: 20 years later. *Educational Psychology Review, 31*, 261–292.
- Mayer, R. E. (2021). *Multimedia Learning* (3rd ed.). Cambridge University Press.
- Renkl, A., & Atkinson, R. K. (2003). Structuring the transition from example study to problem solving in cognitive skill acquisition. *Educational Psychologist, 38*(1), 15–22.
- OECD (2023). *PISA 2022 Assessment and Analytical Framework*. OECD Publishing.
