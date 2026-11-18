// Instrumen Mathematical Literacy (PLSV & PtLSV), versi revisi 18-11-2026.
// Teks soal SAMA PERSIS dengan backend/app/data/instrumen_literasi.json (diuji pytest).
// Berkas ini sengaja TANPA jawaban/rubrik: itu hanya disimpan di server peneliti.
// Jangan diubah manual; ubah JSON di backend lalu salin ulang bagian `soal`.
export const LITERASI = {
  "id": "ML-PLSV-PtLSV-revisi",
  "judul": "Instrumen Soal Mathematical Literacy",
  "materi": "Persamaan dan Pertidaksamaan Linear Satu Variabel (PLSV & PtLSV)",
  "petunjuk": [
    "Bacalah setiap soal dengan teliti.",
    "Tuliskan informasi yang diketahui dan ditanyakan.",
    "Tuliskan model matematika serta langkah penyelesaian secara runtut.",
    "Berikan alasan dan kesimpulan sesuai dengan konteks permasalahan.",
    "Untuk soal pertidaksamaan, perhatikan perubahan tanda ketika kedua ruas dikalikan atau dibagi dengan bilangan negatif."
  ],
  "skor_maks": 30,
  "soal": [
    {
      "id": "S1",
      "indikator": "Mathematical Reasoning",
      "judul": "Memilih Paket Alat Tulis",
      "stimulus": "Alya ingin membeli 7 buku tulis. Toko A menawarkan biaya awal Rp12.000 dan biaya Rp3.000 untuk setiap buku. Toko B menawarkan biaya awal Rp8.000 dan biaya Rp4.000 untuk setiap buku. Alya memiliki uang Rp50.000 dan ingin memilih toko dengan biaya paling murah.",
      "tahap": [
        {
          "pertanyaan": "Tuliskan informasi yang diketahui dan ditanyakan.",
          "skor_maks": 1
        },
        {
          "pertanyaan": "Buatlah model matematika untuk menentukan biaya di Toko A dan Toko B.",
          "skor_maks": 2
        },
        {
          "pertanyaan": "Hitung total biaya pembelian di masing-masing toko.",
          "skor_maks": 1
        },
        {
          "pertanyaan": "Toko mana yang menawarkan biaya lebih murah?",
          "skor_maks": 1
        },
        {
          "pertanyaan": "Jelaskan alasan matematis atas pilihan Alya.",
          "skor_maks": 1
        }
      ]
    },
    {
      "id": "S2",
      "indikator": "Formulating Situations Mathematically",
      "judul": "Menabung untuk Membeli Tas",
      "stimulus": "Dina memiliki tabungan awal Rp30.000 dan menabung Rp20.000 setiap minggu. Ia ingin membeli tas seharga Rp150.000. Tentukan model matematika untuk banyak minggu x agar tabungannya cukup, lalu selesaikan.",
      "tahap": [
        {
          "pertanyaan": "Identifikasi tabungan awal, setoran mingguan, dan harga tas.",
          "skor_maks": 1
        },
        {
          "pertanyaan": "Tentukan variabel yang menyatakan banyak minggu Dina menabung.",
          "skor_maks": 1
        },
        {
          "pertanyaan": "Buatlah model matematika berbentuk pertidaksamaan.",
          "skor_maks": 2
        },
        {
          "pertanyaan": "Selesaikan pertidaksamaan tersebut.",
          "skor_maks": 1
        },
        {
          "pertanyaan": "Tafsirkan hasil penyelesaian dalam konteks permasalahan.",
          "skor_maks": 1
        }
      ]
    },
    {
      "id": "S3",
      "indikator": "Employing Mathematical Concepts, Facts, and Procedures",
      "judul": "Menyelesaikan Persamaan Linear Satu Variabel",
      "stimulus": "Selesaikan persamaan 4(2x − 3) + 5 = 3x + 20. Tunjukkan langkah perhitungan dan periksa jawaban Anda.",
      "tahap": [
        {
          "pertanyaan": "Terapkan sifat distributif pada ruas kiri.",
          "skor_maks": 1
        },
        {
          "pertanyaan": "Sederhanakan bentuk aljabar pada ruas kiri.",
          "skor_maks": 1
        },
        {
          "pertanyaan": "Kelompokkan suku-suku sejenis pada ruas yang sama.",
          "skor_maks": 2
        },
        {
          "pertanyaan": "Tentukan nilai x.",
          "skor_maks": 1
        },
        {
          "pertanyaan": "Periksa jawaban dengan menyubstitusikan nilai x ke persamaan awal.",
          "skor_maks": 1
        }
      ]
    },
    {
      "id": "S4",
      "indikator": "Interpreting, Applying, and Evaluating Mathematical Outcomes",
      "judul": "Mengevaluasi Ongkos Taksi",
      "stimulus": "Untuk ongkos taksi berlaku C(x) = 7.000 + 4.000x, dengan x jarak dalam km. Rina menyatakan bahwa C(−2) = −1.000 berarti ia mendapat uang Rp1.000 dari taksi. Apakah Anda setuju? Jelaskan domain yang masuk akal dan biaya untuk perjalanan 6 km.",
      "tahap": [
        {
          "pertanyaan": "Hitunglah nilai C(−2) secara aljabar.",
          "skor_maks": 1
        },
        {
          "pertanyaan": "Jelaskan apakah nilai x = −2 masuk akal dalam konteks jarak tempuh.",
          "skor_maks": 1
        },
        {
          "pertanyaan": "Tentukan domain yang masuk akal untuk fungsi C(x).",
          "skor_maks": 1
        },
        {
          "pertanyaan": "Tafsirkan apakah nilai −1.000 dapat dianggap sebagai biaya perjalanan.",
          "skor_maks": 1
        },
        {
          "pertanyaan": "Hitunglah biaya perjalanan sejauh 6 km.",
          "skor_maks": 1
        },
        {
          "pertanyaan": "Tuliskan kesimpulan Anda terhadap pernyataan Rina.",
          "skor_maks": 1
        }
      ]
    },
    {
      "id": "S5",
      "indikator": "Interpreting, Applying, and Evaluating Mathematical Outcomes",
      "judul": "Batas Waktu Penggunaan Internet",
      "stimulus": "Sebuah sekolah memberikan batas waktu penggunaan internet untuk kegiatan belajar, yaitu tidak lebih dari 2 jam setiap hari. Rani sudah menggunakan internet selama 35 menit untuk mencari bahan tugas. Setelah itu, Rani berencana menggunakan internet lagi selama x menit. Rani menuliskan model pertidaksamaan 35 + x ≤ 120 dan memperoleh x ≤ 85. Namun, Rani menyimpulkan bahwa ia masih boleh menggunakan internet selama 120 menit lagi.",
      "tahap": [
        {
          "pertanyaan": "Tuliskan informasi yang diketahui dan ditanyakan.",
          "skor_maks": 1
        },
        {
          "pertanyaan": "Jelaskan arti angka 120 dalam model matematika.",
          "skor_maks": 1
        },
        {
          "pertanyaan": "Periksa apakah model pertidaksamaan 35 + x ≤ 120 sudah tepat.",
          "skor_maks": 1
        },
        {
          "pertanyaan": "Tentukan nilai maksimum x.",
          "skor_maks": 1
        },
        {
          "pertanyaan": "Jelaskan kesalahan pada kesimpulan Rani.",
          "skor_maks": 1
        },
        {
          "pertanyaan": "Tuliskan kesimpulan yang benar sesuai konteks soal.",
          "skor_maks": 1
        }
      ]
    }
  ]
};
