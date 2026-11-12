// Ulasan Kilat (PRD F1): maksimal 3 layar per kategori, satu ide per layar.
const X = '<span class="v"><span class="xbox">x</span></span>';
const vx = (c) => `<span class="v">${c}<span class="xbox">x</span></span>`;
const k = (n) => `<span class="k">${n}</span>`;

export const REVIEW = {
  bulat: [
    { title: 'Menambah = bergerak ke kanan',
      body: `<p>Pada garis bilangan, <b>menambah</b> berarti bergerak ke <b>kanan</b>, dan <b>mengurangi</b> berarti bergerak ke <b>kiri</b>.</p>
        <p class="big">${k('−5')} + ${k('3')} = ${k('−2')}</p><p class="note">Mulai di −5, bergerak 3 langkah ke kanan, sampai di −2.</p>` },
    { title: 'Mengurangi bilangan negatif',
      body: `<p>Mengurangi bilangan negatif sama dengan <b>menambah lawannya</b>.</p>
        <p class="big">${k('4')} − ${k('(−3)')} = ${k('4')} + ${k('3')} = ${k('7')}</p>` },
    { title: 'Aturan tanda kali dan bagi',
      body: `<table class="signs"><tr><th></th><th>hasil</th></tr>
        <tr><td>tanda <b>sama</b> (+ dan +, − dan −)</td><td>positif</td></tr>
        <tr><td>tanda <b>berbeda</b> (+ dan −)</td><td>negatif</td></tr></table>
        <p class="big">${k('(−4)')} × ${k('(−2)')} = ${k('8')}</p><p class="big">${k('12')} ÷ ${k('(−3)')} = ${k('−4')}</p>` },
  ],
  sejenis: [
    { title: 'Apa itu suku sejenis?',
      body: `<p>Suku sejenis punya <b>variabel yang sama</b>.</p>
        <p class="big">${vx('3')} dan ${vx('5')} → sejenis</p><p class="big">${vx('3')} dan ${k('5')} → tidak sejenis</p>` },
    { title: 'Jumlahkan koefisiennya',
      body: `<p>Seperti menghitung balok: 3 balok x ditambah 5 balok x menjadi 8 balok x.</p>
        <p class="big">${vx('3')} + ${vx('5')} = (3 + 5)${X} = ${vx('8')}</p>` },
    { title: 'Kelompokkan dulu',
      body: `<p>Gabungkan suku x dengan suku x. Konstanta tetap di tempatnya.</p>
        <p class="big">${vx('7')} − ${k('2')} + ${vx('4')} = ${vx('11')} − ${k('2')}</p>` },
  ],
  distributif: [
    { title: 'Kalikan ke setiap suku',
      body: `<p>Bilangan di luar kurung dikalikan ke <b>setiap</b> suku di dalam kurung.</p>
        <p class="big">${k('2')}(${X} + ${k('4')}) = ${vx('2')} + ${k('8')}</p>` },
    { title: 'Tanda negatif ikut dikalikan',
      body: `<p>Hati-hati jika bilangan di luar kurung negatif. Tandanya ikut dikalikan ke setiap suku.</p>
        <p class="big">${k('−3')}(${X} − ${k('2')}) = ${vx('−3')} + ${k('6')}</p>
        <p class="note">karena (−3) × (−2) = 6</p>` },
  ],
};
