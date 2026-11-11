// Kamus Kata Kunci → Tanda (docs/CONTENT.md §5).
// Juga diuji oleh pytest lewat V8, jadi JANGAN menambah `import` di sini.

export const KEYWORDS = [
  { rel: '<=', sym: '≤', meaning: 'tidak lebih dari batas; batasnya boleh',
    phrases: ['paling banyak', 'maksimal', 'tidak lebih dari', 'sebanyak-banyaknya', 'paling tinggi', 'tidak melebihi'],
    example: '“Isi lift paling banyak 8 orang” → x ≤ 8' },
  { rel: '>=', sym: '≥', meaning: 'tidak kurang dari batas; batasnya boleh',
    phrases: ['paling sedikit', 'minimal', 'tidak kurang dari', 'sekurang-kurangnya', 'paling rendah'],
    example: '“Nilai minimal 75” → x ≥ 75' },
  { rel: '<', sym: '<', meaning: 'di bawah batas; batasnya tidak boleh',
    phrases: ['kurang dari', 'di bawah', 'lebih kecil dari'],
    example: '“Suhu di bawah 0°” → x < 0' },
  { rel: '>', sym: '>', meaning: 'di atas batas; batasnya tidak boleh',
    phrases: ['lebih dari', 'melebihi', 'di atas', 'lebih besar dari'],
    example: '“Lebih dari 5 kg” → x > 5' },
  { rel: '=', sym: '=', meaning: 'tepat sama',
    phrases: ['sama dengan', 'adalah', 'menjadi', 'hasilnya', 'jumlahnya'],
    example: '“Jumlahnya 20” → … = 20' },
];

// Pasangan jebakan yang ditampilkan berdampingan.
export const TRAPS = [
  ['tidak lebih dari', 'lebih dari'],
  ['tidak kurang dari', 'kurang dari'],
];

// Cari frasa kunci di dalam teks soal. Frasa terpanjang dicocokkan dulu,
// supaya "tidak lebih dari" tidak terbaca sebagai "lebih dari".
export function findKeywords(text) {
  const lower = text.toLowerCase();
  const all = [];
  for (const k of KEYWORDS) for (const p of k.phrases) all.push({ phrase: p, rel: k.rel });
  all.sort((x, y) => y.phrase.length - x.phrase.length);
  const taken = new Array(lower.length).fill(false);
  const found = [];
  for (const { phrase, rel } of all) {
    let from = 0;
    for (;;) {
      const i = lower.indexOf(phrase, from);
      if (i < 0) break;
      const end = i + phrase.length;
      const before = i === 0 ? ' ' : lower[i - 1];
      const after = end >= lower.length ? ' ' : lower[end];
      const wordEdge = !/[a-z]/.test(before) && !/[a-z]/.test(after);
      let free = true;
      for (let j = i; j < end; j++) if (taken[j]) { free = false; break; }
      if (wordEdge && free) {
        for (let j = i; j < end; j++) taken[j] = true;
        found.push({ start: i, end, phrase: text.slice(i, end), rel });
      }
      from = i + 1;
    }
  }
  return found.sort((x, y) => x.start - y.start);
}
