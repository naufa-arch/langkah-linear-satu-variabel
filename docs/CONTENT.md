# CONTENT — Materi, Urutan Belajar, dan Bank Soal

## 1. Capaian & tujuan pembelajaran
Kurikulum Merdeka, **Fase D, elemen Aljabar**: siswa dapat menyelesaikan persamaan dan pertidaksamaan
linear satu variabel serta memodelkan masalah kontekstual.

| Kode | Tujuan pembelajaran (TP) | Modul |
|---|---|---|
| TP1 | Menyederhanakan bentuk aljabar dengan suku sejenis | Prasyarat |
| TP2 | Menjelaskan bahwa penyelesaian PLSV = melakukan operasi yang sama di kedua ruas | PLSV (F2) |
| TP3 | Menyelesaikan PLSV bentuk `ax+b=c`, `ax+b=cx+d`, `a(x+b)=c` | PLSV (F6) |
| TP4 | Menjelaskan mengapa tanda pertidaksamaan berbalik saat dikali/dibagi bilangan negatif | PtLSV (F3) |
| TP5 | Menyelesaikan PtLSV dan menyajikan himpunan penyelesaian di garis bilangan | PtLSV (F4, F6) |
| TP6 | Menerjemahkan soal cerita ke PLSV/PtLSV (*merumuskan*) | Soal Cerita (F5) |
| TP7 | Menafsirkan penyelesaian kembali ke konteks soal (*menafsirkan*) | Soal Cerita (F5) |

> Kalimat TP perlu disesuaikan dengan Modul Ajar/ATP sekolah uji coba.

## 2. Urutan & kadar beban intrinsik
Urutan dari elemen sedikit ke elemen banyak:

1. Prasyarat: bilangan bulat negatif → suku sejenis → distributif
2. PLSV `x + b = c` (1 langkah)
3. PLSV `ax = c` (1 langkah)
4. PLSV `ax + b = c` (2 langkah)
5. PLSV `ax + b = cx + d` (variabel di kedua ruas)
6. PLSV `a(x + b) = c` (tanda kurung)
7. PtLSV dengan koefisien positif (tanpa balik tanda)
8. **Simulasi balik tanda** (konsep)
9. PtLSV dengan koefisien negatif
10. Soal cerita PLSV
11. Soal cerita PtLSV (kata kunci)
12. Campuran

## 3. Langkah baku penyelesaian (dipakai oleh mesin langkah & F6)
| No | Langkah | Teks alasan di aplikasi |
|---|---|---|
| L1 | Hilangkan tanda kurung (jika ada) | "Kalikan bilangan di luar kurung ke setiap suku di dalamnya." |
| L2 | Kumpulkan suku x di ruas kiri | "Kurangi/tambah kedua ruas dengan suku x yang sama." |
| L3 | Kumpulkan konstanta di ruas kanan | "Kurangi/tambah kedua ruas dengan bilangan yang sama." |
| L4 | Sederhanakan | "Jumlahkan suku sejenis." |
| L5 | Bagi dengan koefisien x | "Bagi kedua ruas dengan koefisien x." + **jika negatif:** "Karena membagi dengan bilangan negatif, tanda dibalik." |
| L6 | Tulis himpunan penyelesaian & garis bilangan | (PtLSV saja) |
| L7 | Cek (opsional) | "Masukkan satu nilai ke soal awal." |

Di layar, istilah "pindah ruas" boleh dipakai **setelah** F2, sebagai jembatan ke bahasa guru:
*"tambah 4 di kedua ruas (biasa disebut: −4 pindah ruas menjadi +4)"*.

## 4. Konvensi himpunan penyelesaian
- Notasi: `HP = {x | x < 3, x ∈ R}`, atau untuk bilangan bulat `HP = {…, 0, 1, 2}`.
- Default MVP: **semesta bilangan real** (arsiran sinambung). Soal bulat/cacah/asli diberi label semesta yang jelas
  di atas soal, dan garis bilangan menampilkan titik-titik (keputusan final: PRD Q5).
- ○ dipakai untuk `<` dan `>`; ● dipakai untuk `≤` dan `≥`.

## 5. Kamus Kata Kunci → Tanda (F5)
| Frasa dalam soal | Tanda | Contoh |
|---|---|---|
| paling banyak, maksimal, tidak lebih dari, sebanyak-banyaknya, paling tinggi, tidak melebihi | **≤** | "isi lift paling banyak 8 orang" → `x ≤ 8` |
| paling sedikit, minimal, tidak kurang dari, sekurang-kurangnya, paling rendah | **≥** | "nilai minimal 75" → `x ≥ 75` |
| kurang dari, di bawah, lebih kecil dari | **<** | "suhu di bawah 0°" → `x < 0` |
| lebih dari, melebihi, di atas, lebih besar dari | **>** | "lebih dari 5 kg" → `x > 5` |
| sama dengan, adalah, menjadi, hasilnya, jumlahnya | **=** | "jumlahnya 20" → `… = 20` |

⚠ **Jebakan yang perlu diajarkan eksplisit**: "**tidak lebih dari**" ≠ "lebih dari"; "**tidak kurang dari**" ≠ "kurang dari".
Kamus menampilkan kedua frasa berdampingan.

## 6. Miskonsepsi yang dideteksi
| Kode | Miskonsepsi | Cara deteksi | Umpan balik |
|---|---|---|---|
| M1 | Operasi hanya di satu ruas | Timbangan miring (F2) | "Ruas kanan belum diubah, jadi timbangan tidak seimbang." |
| M2 | Lupa membalik tanda saat dibagi negatif | Jawaban = kebalikan arah | Tawarkan uji nilai (F7) |
| M3 | Membalik tanda saat dikali positif / saat menambah negatif | Jawaban = kebalikan arah, koefisien positif | "Tanda hanya dibalik saat **mengali/membagi** dengan bilangan **negatif**." |
| M4 | Tertukar ○/● | Bulatan salah, batas benar | Lihat DESIGN §6 |
| M5 | Arah arsiran terbalik | Arah salah | Uji nilai di sisi yang dipilih |
| M6 | Salah tanda pada "pindah ruas" (`x + 3 = 7` → `x = 7 + 3`) | Pola jawaban | Kembali ke model timbangan |
| M7 | Salah memilih tanda dari kata kunci | Tanda model salah | Sorot frasa kunci + buka kamus |

## 7. Templat soal cerita (contoh)
Generator mengganti {angka} sambil menjaga penyelesaian tetap bulat dan masuk akal.

1. **Uang jajan** — "Uang Rani Rp{M}. Ia membeli 1 pulpen seharga Rp{p} dan beberapa buku seharga Rp{b} per buku.
   Berapa buku **paling banyak** yang dapat ia beli?" → `b·x + p ≤ M`
2. **Lift** — "Lift mampu mengangkut **tidak lebih dari** {W} kg. Seorang petugas {w0} kg membawa kotak-kotak
   masing-masing {k} kg. Berapa kotak paling banyak yang bisa dibawa sekaligus?" → `k·x + w0 ≤ W`
3. **Nilai minimal** — "Untuk lulus, rata-rata dari 3 ulangan **minimal** 75. Nilai dua ulangan pertama {a} dan {b}.
   Berapa nilai ulangan ketiga paling sedikit?" → `(a + b + x)/3 ≥ 75` *(v2: melibatkan pecahan)*
4. **Kuota** — "Kuota internet Dimas {Q} GB. Setiap hari ia memakai {d} GB. Setelah berapa hari kuotanya
   tinggal {s} GB?" → `Q − d·x = s`
5. **Umur** — "Umur ayah {k} kali umur Budi. Selisih umur mereka {s} tahun. Berapa umur Budi?" → `k·x − x = s`

Setiap templat menyimpan: kalimat (sudah dipecah per kartu), label kartu (Diketahui/Ditanya/Tidak diperlukan),
definisi variabel yang benar beserta pengecohnya, model yang benar, satuan, dan kalimat tafsiran.

## 8. Angket beban kognitif (F8)
Butir disimpan di `src/content/questionnaire.id.json` agar bisa diganti tanpa mengubah kode. Isi awal: placeholder
**hasil adaptasi Klepsch dkk. (2017)** (IL, EL, GL) yang **wajib** diterjemahkan dan divalidasi ahli sebelum dipakai
untuk pengambilan data penelitian. Jangan memakai terjemahan mesin untuk butir final.
