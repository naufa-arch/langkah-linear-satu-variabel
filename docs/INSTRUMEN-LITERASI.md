# Instrumen Mathematical Literacy di aplikasi

Sumber: `Soal_Mathematical_Literacy_PLSV_PtLSV_Revisi.docx` (versi revisi 18-11-2026). Disimpan di
`backend/app/data/instrumen_literasi.json` (lengkap dengan kunci & rubrik, **hanya di server**) dan
`frontend/src/content/literasi.js` (soal saja, tanpa kunci). Pytest memastikan keduanya sama persis dan kunci tidak ikut
ke HP siswa.

> Berkas JSON berisi kunci **tidak di-commit** ke GitHub (lihat `.gitignore`). Simpan cadangannya sendiri.
> Di Render, pasang lewat *Secret Files* ([DEPLOY.md](DEPLOY.md)).

## Perubahan terhadap dokumen
Teks soal, indikator, kunci, dan skor **disalin apa adanya**. Satu-satunya perubahan adalah tipografi:
satu tanda hubung (-) di kunci Soal 5 tahap 4 ditulis sebagai tanda minus (−), sesuai aturan penulisan simbol aplikasi.

## Hasil pemeriksaan
| No | Indikator | Skor per tahap | Maks | Kunci & skor |
|---|---|---|---|---|
| 1 | Mathematical Reasoning | 1-2-1-1-1 | 6 | diperiksa, benar ✓ |
| 2 | Formulating Situations Mathematically | 1-1-2-1-1 | 6 | diperiksa, benar ✓ |
| 3 | Employing Concepts, Facts, and Procedures | 1-1-2-1-1 | 6 | diperiksa, benar ✓ |
| 4 | Interpreting, Applying, and Evaluating | 1-1-1-1-1-1 | 6 | diperiksa, benar ✓ |
| 5 | Interpreting, Applying, and Evaluating | 1-1-1-1-1-1 | 6 | diperiksa, benar ✓ |
| | **Total** | | **30** | |

Semua kunci jawaban (dihitung ulang, termasuk substitusi balik) dan jumlah skor benar, dan setiap soal kontekstual (belanja, tabungan, taksi, internet) kecuali Soal 3
(prosedural murni, sesuai indikator *Employing*).

## Catatan untuk dipertimbangkan peneliti (TIDAK diubah di aplikasi)
1. **Sapaan campur**: Soal 3 dan 4 memakai "Anda", padahal siswa SMP biasanya disapa "kamu". Pertimbangkan diseragamkan.
2. **Soal 1 dan 4 memakai dua variabel / notasi fungsi** (y = 12.000 + 3.000x, C(x)). Ini fungsi linear, sedikit di luar
   PLSV murni. Masih sesuai konteks linear, tetapi perlu dipastikan sesuai kisi-kisi dan materi yang diajarkan.
3. **Soal 2**: kunci tahap 1 menanyakan "banyak minggu *paling sedikit*", sedangkan stimulus hanya menyebut "agar tabungannya
   cukup". Pertimbangkan menambah kata "paling sedikit" di stimulus agar sesuai kunci.
4. **Soal 5**: dalam konteks, waktu tidak mungkin negatif, jadi himpunan penyelesaian sebenarnya juga dibatasi dari bawah
   (x ≥ 0). Pedoman bisa menyebut apakah jawaban yang menuliskan batas bawah itu tetap mendapat skor penuh.
5. Kisi-kisi PDF (`Kisi-Kisi Soal Mathematical Literacy.docx.pdf`) memuat contoh soal yang berbeda (mis. "Memilih Paket
   Buku" Toko A/B/C). Aplikasi memakai versi **Revisi**; pastikan kisi-kisi diperbarui agar cocok.

## Cara pakai dalam penelitian
- **Pre-test / Post-test** (menu Evaluasi): tanpa Tutor AI dan tanpa pembahasan. Indikator tidak ditampilkan agar tidak
  menjadi petunjuk. Jawaban tersimpan otomatis di HP, terkirim saat online.
- **Penskoran**: Dasbor Peneliti → Tes literasi → Nilai. Isi skor tiap tahap sesuai rubrik (tombol 0..maks). Tombol
  "Minta saran skor dari AI" hanya **saran**; skor akhir tetap ditentukan peneliti.
- **Rekap**: Ekspor → *Rekap tes literasi* (CSV): skor per tahap, total, nilai 0–100, teks jawaban, catatan penilai.
- **Latihan literasi**: siswa langsung melihat pembahasan resmi setelah mengumpulkan, dan bisa berdiskusi dengan Tutor AI.

> Catatan: dokumen ini sengaja tidak memuat nilai jawaban karena repo GitHub bersifat publik.
