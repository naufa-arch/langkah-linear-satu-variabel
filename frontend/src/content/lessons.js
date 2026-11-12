// Materi PLSV & PtLSV (PRD F12). Satu ide per layar (DESIGN P1), istilah dikenalkan dulu (P10),
// contoh dibuka langkah demi langkah (P7), lalu satu pertanyaan cek pemahaman (P8).
// Halaman bertipe `example` memakai mesin matematika, sehingga langkahnya selalu benar.
import { statementHTML, sideHTML, relHTML } from '../components/mathexpr.js';
import { numberLineSVG, numberLineLegend, pointsSVG } from '../components/numberline.js';
import { balanceSVG } from '../components/balance2d.js';
import { toInterval } from '../math/linear.js';
import { KEYWORDS } from './keywords.js';

const M = '−';
const X = '<span class="v"><span class="xbox">x</span></span>';
const vx = (c) => `<span class="v">${c}<span class="xbox">x</span></span>`;
const k = (n) => `<span class="k">${n}</span>`;
const s = (r) => relHTML(r);
const E = (left, rel, right) => statementHTML({ left, rel, right });
const big = (html) => `<p class="big">${html}</p>`;
const nl = (rel, v) => numberLineSVG(toInterval(rel, v)) + numberLineLegend();
const ok = '<span class="yes">✓</span>';
const no = '<span class="nope">✗</span>';

export const CHAPTERS = [
  {
    id: 'plsv', title: 'Bab 1 · Persamaan Linear Satu Variabel',
    lessons: [
      {
        id: 'istilah', title: 'Kenalan dengan istilahnya',
        pages: [
          { title: 'Kalimat tertutup dan kalimat terbuka',
            body: `<p><b>Kalimat tertutup</b> sudah jelas benar atau salahnya. <b>Kalimat terbuka</b> belum bisa ditentukan, karena ada nilai yang belum diketahui.</p>
              <ul class="ex-list">
                <li>${k('3')} + ${k('4')} ${s('=')} ${k('7')} <span>tertutup, <b>benar</b></span></li>
                <li>${k('3')} + ${k('4')} ${s('=')} ${k('9')} <span>tertutup, <b>salah</b></span></li>
                <li>${X} + ${k('4')} ${s('=')} ${k('7')} <span>terbuka: tergantung nilai x</span></li>
              </ul>` },
          { title: 'Variabel, koefisien, dan konstanta',
            body: `<div class="anatomy three"><div><span class="big v">2</span><small><b>koefisien</b><br>bilangan di depan variabel</small></div>
              <div><span class="big">${X}</span><small><b>variabel</b><br>lambang bilangan yang belum diketahui</small></div>
              <div><span class="big k">+ 3</span><small><b>konstanta</b><br>bilangan tanpa variabel</small></div></div>
              <p class="note">Di aplikasi ini, x selalu <b class="v">biru</b> dan konstanta selalu <b class="k">ungu</b>.</p>` },
          { title: 'Ruas kiri dan ruas kanan',
            body: `<div class="anatomy three"><div><span class="big">${vx('2')} + ${k('3')}</span><small><b>ruas kiri</b></small></div>
              <div><span class="big">${s('=')}</span><small><b>tanda</b><br>penghubung</small></div>
              <div><span class="big">${k('11')}</span><small><b>ruas kanan</b></small></div></div>
              <p>Tanda <b>=</b> membagi kalimat menjadi dua ruas. Nanti kita akan mengubah kedua ruas secara bersamaan.</p>` },
        ],
        check: { q: `Pada ${vx('5')} ${M} ${k('7')} = ${k('13')}, manakah koefisien x?`,
          options: ['5', `${M}7`, '13', 'x'], answer: 0,
          explain: `Koefisien adalah bilangan di depan variabel, yaitu 5. Bilangan ${M}7 dan 13 adalah konstanta.` },
      },
      {
        id: 'plsv-apa', title: 'Apa itu PLSV?',
        pages: [
          { title: 'Pengertian PLSV',
            body: `<p><b>Persamaan linear satu variabel (PLSV)</b> adalah kalimat terbuka yang:</p>
              <ol class="tight"><li>dihubungkan tanda sama dengan ( = ),</li><li>hanya punya <b>satu variabel</b>,</li><li>pangkat variabelnya <b>satu</b>.</li></ol>
              <div class="formula"><small>Bentuk umum</small>${vx('a')} + ${k('b')} ${s('=')} ${k('c')}<small>dengan a ≠ 0</small></div>` },
          { title: 'PLSV atau bukan?',
            body: `<table class="judge"><tbody>
              <tr><td>${E({ a: 2, b: 3 }, '=', { b: 11 })}</td><td>${ok} PLSV</td></tr>
              <tr><td>${X} + <span class="v">y</span> = ${k('5')}</td><td>${no} ada dua variabel</td></tr>
              <tr><td>${X}² = ${k('9')}</td><td>${no} pangkat x dua</td></tr>
              <tr><td>${E({ a: 3, b: 1 }, '>', { b: 7 })}</td><td>${no} tandanya bukan “=”; ini pertidaksamaan (Bab 2)</td></tr>
              </tbody></table>` },
          { title: 'Apa artinya “penyelesaian”?',
            body: `<p><b>Penyelesaian</b> adalah nilai x yang membuat persamaan menjadi <b>benar</b>. Coba untuk ${E({ a: 1, b: 4 }, '=', { b: 7 })}:</p>
              <table class="judge"><tbody>
                <tr><td>x = 1</td><td>1 + 4 = 5, bukan 7</td><td>${no}</td></tr>
                <tr><td>x = 2</td><td>2 + 4 = 6, bukan 7</td><td>${no}</td></tr>
                <tr><td>x = 3</td><td>3 + 4 = 7</td><td>${ok}</td></tr></tbody></table>
              <p>Jadi penyelesaiannya <b>x = 3</b>. Mencoba satu per satu itu lama, jadi berikutnya kita pelajari cara yang lebih cepat.</p>` },
        ],
        check: { q: 'Manakah yang merupakan PLSV?',
          options: [`4x ${M} 1 = 11`, 'x² + 1 = 5', 'a + b = 7', '2x + 5 < 9'], answer: 0,
          explain: 'Hanya 4x − 1 = 11 yang memakai tanda “=”, punya satu variabel, dan pangkatnya satu.' },
      },
      {
        id: 'prinsip-timbangan', title: 'Prinsip timbangan',
        related: { label: 'Coba sendiri di Timbangan 3D', route: '#/timbangan' },
        pages: [
          { title: 'Persamaan itu seperti timbangan seimbang',
            body: `${balanceSVG({ left: { x: 2, u: 3 }, right: { u: 11 } })}
              ${big(E({ a: 2, b: 3 }, '=', { b: 11 }))}
              <p>Tanda <b>=</b> berarti ruas kiri dan ruas kanan <b>sama berat</b>. Setiap balok x punya berat yang sama, tetapi belum kita ketahui.</p>` },
          { title: 'Lakukan hal yang sama di kedua ruas',
            body: `${balanceSVG({ left: { x: 2 }, right: { u: 8 } })}
              ${big(`${vx('2')} + ${k('3')} ${M} ${k('3')} ${s('=')} ${k('11')} ${M} ${k('3')}`)}
              ${big(E({ a: 2 }, '=', { b: 8 }))}
              <p>Ambil 3 kubus dari <b>kedua</b> ruas. Timbangan tetap seimbang.</p>` },
          { title: 'Kalau hanya satu ruas yang diubah?',
            body: `${balanceSVG({ left: { x: 2 }, right: { u: 11 }, tilt: -9, label: 'Timbangan miring: ruas kanan lebih berat' })}
              ${big(`${vx('2')} <span class="s bad">≠</span> ${k('11')}`)}
              <p>Jika hanya ruas kiri yang dikurangi 3, timbangan <b>miring</b>. Persamaannya tidak benar lagi.</p>` },
          { title: 'Inilah yang disebut “pindah ruas”',
            body: `${big(`${vx('2')} + ${k('3')} ${s('=')} ${k('11')}`)}
              ${big(`${vx('2')} ${s('=')} ${k('11')} ${M} ${k('3')}`)}
              <p>Mengurangi 3 di kedua ruas memberi hasil yang sama dengan “memindahkan +3 ke ruas kanan menjadi ${M}3”.</p>
              <p class="callout">“Pindah ruas” bukan aturan ajaib. Itu cara singkat menulis <b>operasi yang sama di kedua ruas</b>.</p>` },
          { title: 'Bagi kedua ruas',
            body: `${balanceSVG({ left: { x: 1 }, right: { u: 4 } })}
              ${big(`${vx('2')} ${s('=')} ${k('8')} &nbsp;→&nbsp; ${X} ${s('=')} ${k('4')}`)}
              <p>Bagi kedua ruas menjadi 2 kelompok sama banyak. Satu balok x seimbang dengan 4 kubus, jadi <b>x = 4</b>.</p>` },
        ],
        check: { q: `Dari ${E({ a: 1, b: 5 }, '=', { b: 12 })}, apa yang dilakukan agar x tinggal sendiri?`,
          options: ['Kurangi kedua ruas dengan 5', 'Kurangi ruas kiri saja dengan 5', 'Tambah kedua ruas dengan 5'], answer: 0,
          explain: 'Kurangi kedua ruas dengan 5: x + 5 − 5 = 12 − 5, jadi x = 7. Mengubah satu ruas saja membuat timbangan miring.' },
      },
      {
        id: 'langkah-plsv', title: 'Langkah menyelesaikan PLSV',
        related: { label: 'Lihat lebih banyak contoh bertahap', route: '#/contoh/plsv' },
        pages: [
          { title: 'Empat langkah',
            body: `<ol class="tight big-list"><li><b>Hilangkan tanda kurung</b>, jika ada.</li><li><b>Kumpulkan suku x</b> di ruas kiri.</li>
              <li><b>Kumpulkan konstanta</b> di ruas kanan.</li><li><b>Bagi kedua ruas</b> dengan koefisien x.</li></ol>
              <p>Setiap langkah dilakukan pada <b>kedua ruas</b>. Setelah selesai, <b>cek</b> jawabanmu.</p>` },
          { title: 'Contoh 1: bentuk ax + b = c', example: { left: { a: 3, b: -4 }, rel: '=', right: { b: 11 } } },
          { title: 'Contoh 2: x di kedua ruas', example: { left: { a: 5, b: -2 }, rel: '=', right: { a: 2, b: 7 } },
            intro: 'Pindahkan dulu suku x dari ruas kanan dengan mengurangi kedua ruas dengan 2x.' },
          { title: 'Contoh 3: ada tanda kurung', example: { left: { k: 2, a: 1, b: 3 }, rel: '=', right: { b: 14 } } },
          { title: 'Selalu cek jawaban',
            body: `<p>Masukkan x = 3 ke soal Contoh 2, ${E({ a: 5, b: -2 }, '=', { a: 2, b: 7 })}:</p>
              <table class="judge"><tbody><tr><td>ruas kiri</td><td>5 × 3 ${M} 2 = 13</td></tr><tr><td>ruas kanan</td><td>2 × 3 + 7 = 13</td></tr></tbody></table>
              <p>Kedua ruas sama, jadi x = 3 benar ${ok}</p>` },
        ],
        check: { q: `Penyelesaian dari ${E({ a: 4, b: 1 }, '=', { b: 13 })} adalah…`,
          options: ['x = 3', 'x = 7/2', 'x = 12', `x = ${M}3`], answer: 0,
          explain: 'Kurangi kedua ruas dengan 1: 4x = 12. Bagi kedua ruas dengan 4: x = 3. (Jawaban 7/2 muncul jika 1 “dipindah” tanpa mengganti tanda.)' },
      },
    ],
  },
  {
    id: 'ptlsv', title: 'Bab 2 · Pertidaksamaan Linear Satu Variabel',
    lessons: [
      {
        id: 'ptlsv-apa', title: 'Apa itu PtLSV?',
        pages: [
          { title: 'Empat tanda pertidaksamaan',
            body: `<table class="judge signs4"><tbody>
              <tr><td>${s('<')}</td><td>kurang dari</td></tr><tr><td>${s('>')}</td><td>lebih dari</td></tr>
              <tr><td>${s('<=')}</td><td>kurang dari atau sama dengan</td></tr><tr><td>${s('>=')}</td><td>lebih dari atau sama dengan</td></tr></tbody></table>
              <p class="note">Ujung tanda yang terbuka selalu menghadap bilangan yang lebih besar: 2 &lt; 5 dan 5 &gt; 2.</p>` },
          { title: 'Pengertian PtLSV',
            body: `<p><b>Pertidaksamaan linear satu variabel (PtLSV)</b> adalah kalimat terbuka yang dihubungkan tanda ${s('<')}, ${s('>')}, ${s('<=')}, atau ${s('>=')}, dan punya satu variabel berpangkat satu.</p>
              <div class="formula"><small>Contoh bentuk</small>${vx('a')} + ${k('b')} ${s('<')} ${k('c')}<small>(atau dengan &gt;, ≤, ≥)</small></div>` },
          { title: 'Penyelesaiannya banyak',
            body: `<p>PLSV biasanya punya <b>satu</b> penyelesaian. PtLSV punya <b>banyak</b>. Coba ${E({ a: 1, b: 2 }, '<', { b: 5 })}:</p>
              <table class="judge"><tbody>
                <tr><td>x = 0</td><td>2 &lt; 5</td><td>${ok}</td></tr><tr><td>x = 2</td><td>4 &lt; 5</td><td>${ok}</td></tr>
                <tr><td>x = 2,5</td><td>4,5 &lt; 5</td><td>${ok}</td></tr><tr><td>x = 3</td><td>5 &lt; 5</td><td>${no}</td></tr>
                <tr><td>x = 4</td><td>6 &lt; 5</td><td>${no}</td></tr></tbody></table>
              <p>Semua bilangan yang kurang dari 3 memenuhi, jadi ditulis <b>x &lt; 3</b>.</p>` },
        ],
        check: { q: `Untuk ${E({ a: 1, b: 1 }, '>=', { b: 4 })}, apakah x = 3 termasuk penyelesaian?`,
          options: ['Ya, karena 4 ≥ 4 benar', 'Tidak, karena 4 tidak lebih dari 4', 'Tidak bisa ditentukan'], answer: 0,
          explain: 'Tanda ≥ berarti “lebih dari atau sama dengan”. Karena 3 + 1 = 4 dan 4 ≥ 4 benar, x = 3 termasuk.' },
      },
      {
        id: 'sifat', title: 'Sifat-sifat pertidaksamaan',
        related: { label: 'Lihat animasinya: garis bilangan berputar 3D', route: '#/balik-tanda' },
        pages: [
          { title: 'Menambah atau mengurangi: tanda tetap',
            body: `${big(`${k('2')} ${s('<')} ${k('5')}`)}
              <table class="judge"><tbody><tr><td>tambah 3</td><td>2 + 3 &lt; 5 + 3</td><td>5 &lt; 8 ${ok}</td></tr>
              <tr><td>kurangi 4</td><td>2 ${M} 4 &lt; 5 ${M} 4</td><td>${M}2 &lt; 1 ${ok}</td></tr></tbody></table>
              <p>Kedua bilangan bergeser bersama, jadi urutannya tidak berubah.</p>` },
          { title: 'Mengali atau membagi dengan bilangan positif: tanda tetap',
            body: `${big(`${k('2')} ${s('<')} ${k('5')}`)}
              <table class="judge"><tbody><tr><td>kali 3</td><td>2 × 3 &lt; 5 × 3</td><td>6 &lt; 15 ${ok}</td></tr>
              <tr><td>bagi 2</td><td>2 ÷ 2 &lt; 5 ÷ 2</td><td>1 &lt; 2,5 ${ok}</td></tr></tbody></table>` },
          { title: 'Mengali atau membagi dengan bilangan negatif: tanda DIBALIK',
            body: `${big(`${k('2')} × ${k(`(${M}1)`)} &nbsp;?&nbsp; ${k('5')} × ${k(`(${M}1)`)}`)}
              ${pointsSVG([{ v: -5, label: 'B′' }, { v: -2, label: 'A′' }, { v: 2, label: 'A' }, { v: 5, label: 'B' }])}
              ${big(`${k(`${M}2`)} ${s('>')} ${k(`${M}5`)}`)}
              <p>Sebelum dikali, A (2) di kiri B (5). Sesudah dikali ${M}1, A′ (${M}2) justru di <b>kanan</b> B′ (${M}5). Urutannya berbalik, jadi tandanya ikut dibalik.</p>` },
          { title: 'Ringkasan sifat',
            body: `<table class="judge"><thead><tr><th>Operasi pada kedua ruas</th><th>Tanda</th></tr></thead><tbody>
              <tr><td>tambah / kurangi bilangan apa pun</td><td>tetap</td></tr>
              <tr><td>kali / bagi bilangan <b>positif</b></td><td>tetap</td></tr>
              <tr><td>kali / bagi bilangan <b>negatif</b></td><td><b class="sg">dibalik</b></td></tr></tbody></table>` },
        ],
        check: { q: `Kedua ruas ${E({ a: -3 }, '<', { b: 12 })} dibagi ${M}3. Hasilnya…`,
          options: [`x > ${M}4`, `x < ${M}4`, 'x > 4', 'x < 4'], answer: 0,
          explain: `12 ÷ (${M}3) = ${M}4, dan karena membagi dengan bilangan negatif, tanda < dibalik menjadi >. Jadi x > ${M}4.` },
      },
      {
        id: 'himpunan', title: 'Himpunan penyelesaian & garis bilangan',
        pages: [
          { title: 'Bulatan kosong dan bulatan penuh',
            body: `<p><b>x &lt; 3</b>: angka 3 <b>tidak termasuk</b>, jadi bulatannya kosong.</p>${numberLineSVG(toInterval('<', 3))}
              <p><b>x ≤ 3</b>: angka 3 <b>termasuk</b>, jadi bulatannya penuh.</p>${numberLineSVG(toInterval('<=', 3))}${numberLineLegend()}` },
          { title: 'Arah arsiran',
            body: `<p>Arsiran menunjukkan <b>semua</b> bilangan yang memenuhi.</p>
              <p><b>x &gt; ${M}2</b>: bilangan yang lebih besar dari ${M}2 ada di kanan.</p>${nl('>', -2)}
              <p class="callout">Jika x ditulis di kiri, ujung runcing tanda menunjuk arah arsiran: x <b>&lt;</b> ke kiri, x <b>&gt;</b> ke kanan.</p>` },
          { title: 'Menulis himpunan penyelesaian',
            body: `${big('HP = {x | x &lt; 3, x ∈ R}')}
              <p>Dibaca: “himpunan x sedemikian sehingga x kurang dari 3, dengan x bilangan real”.</p>
              <p class="note">R adalah semua bilangan real, termasuk pecahan dan desimal seperti 2,5.</p>` },
          { title: 'Jika semestanya bilangan bulat',
            body: `<p>Jika x hanya boleh bilangan bulat, penyelesaian <b>x &lt; 3</b> adalah titik-titik saja:</p>
              ${pointsSVG([], { min: -4, max: 5, dots: [-4, -3, -2, -1, 0, 1, 2] })}
              ${big('HP = {…, −2, −1, 0, 1, 2}')}
              <p class="note">Selalu baca semesta pada soal: bilangan real, bulat, cacah, atau asli.</p>` },
        ],
        check: { q: `Garis bilangan untuk x ≤ ${M}1 memakai…`,
          options: [`bulatan penuh di ${M}1, arsiran ke kiri`, `bulatan kosong di ${M}1, arsiran ke kiri`, `bulatan penuh di ${M}1, arsiran ke kanan`], answer: 0,
          explain: `Tanda ≤ berarti ${M}1 termasuk (bulatan penuh), dan “kurang dari” berarti ke kiri.` },
      },
      {
        id: 'langkah-ptlsv', title: 'Langkah menyelesaikan PtLSV',
        related: { label: 'Lihat lebih banyak contoh bertahap', route: '#/contoh/ptlsv' },
        pages: [
          { title: 'Sama seperti PLSV, ditambah satu aturan',
            body: `<ol class="tight big-list"><li>Hilangkan tanda kurung, jika ada.</li><li>Kumpulkan suku x di ruas kiri.</li><li>Kumpulkan konstanta di ruas kanan.</li>
              <li>Bagi kedua ruas dengan koefisien x. <b class="sg">Jika koefisiennya negatif, balik tandanya.</b></li><li>Gambar garis bilangan dan tulis HP.</li></ol>` },
          { title: 'Contoh 1: koefisien positif', example: { left: { a: 3, b: -4 }, rel: '<=', right: { b: 5 } } },
          { title: 'Contoh 2: koefisien negatif', example: { left: { a: -2, b: 4 }, rel: '<', right: { b: 10 } },
            intro: 'Perhatikan langkah terakhir: kita membagi dengan bilangan negatif.' },
          { title: 'Contoh 3: x di kedua ruas', example: { left: { a: 1, b: 7 }, rel: '>=', right: { a: 3, b: 1 } } },
          { title: 'Cek dengan angka',
            body: `<p>Dari Contoh 2, ${E({ a: -2, b: 4 }, '<', { b: 10 })}, penyelesaiannya x &gt; ${M}3.</p>
              <table class="judge"><tbody>
                <tr><td>x = 0 (di arsiran)</td><td>${M}2(0) + 4 = 4, dan 4 &lt; 10</td><td>${ok}</td></tr>
                <tr><td>x = ${M}4 (di luar arsiran)</td><td>${M}2(${M}4) + 4 = 12, dan 12 &lt; 10 salah</td><td>${no}</td></tr></tbody></table>
              <p>Hasil cek cocok dengan garis bilangan, jadi jawabannya benar.</p>` },
        ],
        check: { q: `Penyelesaian dari ${E({ a: -1, b: 5 }, '>', { b: 2 })} adalah…`,
          options: ['x < 3', 'x > 3', `x < ${M}3`, `x > ${M}3`], answer: 0,
          explain: `Kurangi kedua ruas dengan 5: ${M}x > ${M}3. Bagi dengan ${M}1 dan balik tandanya: x < 3.` },
      },
    ],
  },
  {
    id: 'cerita', title: 'Bab 3 · Soal Cerita & Ringkasan',
    lessons: [
      {
        id: 'soal-cerita', title: 'Dari soal cerita ke model matematika',
        related: { label: 'Latihan di Pembedah Soal Cerita', route: '#/soal-cerita' },
        pages: [
          { title: 'Matematika dalam kehidupan',
            body: `<div class="cycle"><div><b>1. Rumuskan</b><small>cerita → model matematika</small></div><span aria-hidden="true">→</span>
              <div><b>2. Selesaikan</b><small>model → jawaban</small></div><span aria-hidden="true">→</span>
              <div><b>3. Tafsirkan</b><small>jawaban → arti dalam cerita</small></div></div>
              <p>Inilah <b>literasi matematika</b>: memakai matematika untuk memecahkan masalah sehari-hari.</p>` },
          { title: 'Enam langkah membedah soal cerita',
            body: `<ol class="tight big-list"><li>Pilah kalimat: diketahui, ditanya, tidak diperlukan.</li><li>Misalkan hal yang ditanya sebagai x.</li>
              <li>Cari kata kunci untuk menentukan tanda.</li><li>Susun model matematika.</li><li>Selesaikan.</li><li>Tafsirkan jawabannya ke dalam cerita.</li></ol>` },
          { title: 'Contoh: uang jajan Rani',
            body: `<div class="mini"><p>Uang Rani Rp50.000. Ia membeli pulpen seharga Rp8.000. Sisanya untuk membeli buku seharga Rp12.000 per buku. Berapa buku <mark>paling banyak</mark> yang dapat dibeli?</p></div>
              <table class="judge"><tbody><tr><td>Misalkan</td><td>x = banyak buku</td></tr><tr><td>Kata kunci</td><td>“paling banyak” → ${s('<=')}</td></tr>
              <tr><td>Model (dalam ribu rupiah)</td><td>${E({ a: 12, b: 8 }, '<=', { b: 50 })}</td></tr></tbody></table>` },
          { title: 'Selesaikan modelnya', example: { left: { a: 12, b: 8 }, rel: '<=', right: { b: 50 } },
            outro: 'x ≤ 7/2 artinya x ≤ 3,5. Banyak buku harus bilangan cacah, jadi <b>Rani dapat membeli paling banyak 3 buku</b>.' },
          { title: 'Kata kunci penting',
            body: `<table class="judge"><tbody>${KEYWORDS.map((kw) => `<tr><td>${s(kw.rel)}</td><td>${kw.phrases.slice(0, 3).join(', ')}</td></tr>`).join('')}</tbody></table>
              <p class="note">Daftar lengkap ada di <a href="#/kamus">Kamus kata kunci</a>.</p>` },
        ],
        check: { q: '“Berat muatan truk tidak lebih dari 200 kg.” Tanda yang tepat adalah…',
          options: ['≤', '<', '≥', '>'], answer: 0,
          explain: '“Tidak lebih dari” berarti boleh sama dengan 200 atau kurang, jadi tandanya ≤. Hati-hati: ini berbeda dengan “lebih dari” (>).' },
      },
      {
        id: 'ringkasan', title: 'Ringkasan',
        related: { label: 'Siap berlatih? Buka Latihan Mandiri', route: '#/latihan' },
        pages: [
          { title: 'PLSV dan PtLSV, berdampingan',
            body: `<table class="judge cmp"><thead><tr><th></th><th>PLSV</th><th>PtLSV</th></tr></thead><tbody>
              <tr><td>Tanda</td><td>=</td><td>&lt;, &gt;, ≤, ≥</td></tr>
              <tr><td>Banyak penyelesaian</td><td>biasanya satu</td><td>banyak</td></tr>
              <tr><td>Aturan khusus</td><td>–</td><td>kali/bagi negatif → tanda dibalik</td></tr>
              <tr><td>Jawaban ditulis</td><td>x = 4</td><td>HP + garis bilangan</td></tr></tbody></table>` },
          { title: 'Yang perlu diingat',
            body: `<ol class="tight big-list"><li>Setiap langkah dilakukan di <b>kedua ruas</b>, seperti timbangan.</li>
              <li>“Pindah ruas” adalah singkatan dari operasi yang sama di kedua ruas.</li>
              <li>Tanda pertidaksamaan dibalik <b>hanya</b> saat mengali atau membagi dengan bilangan negatif.</li>
              <li>Bulatan kosong (○) untuk &lt; dan &gt;, sedangkan bulatan penuh (●) untuk ≤ dan ≥.</li>
              <li>Pada soal cerita, cari kata kuncinya dan tafsirkan jawabannya kembali ke cerita.</li></ol>` },
        ],
      },
    ],
  },
];

export const LESSONS = CHAPTERS.flatMap((c) => c.lessons.map((l) => ({ ...l, chapter: c.id })));
export const chapterOf = (id) => CHAPTERS.find((c) => c.lessons.some((l) => l.id === id));
