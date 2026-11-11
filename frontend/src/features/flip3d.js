// F3 + F11: Mengali kedua ruas dengan bilangan negatif = memutar garis bilangan 180° di titik 0.
import { createView, hasWebGL, NO_GL_HTML, THREE } from '../three/view.js';
import { tween } from '../lib/tween.js';
import { say, feedbackBox } from '../lib/dom.js';
import { fmtNum, MINUS } from '../math/linear.js';
import { markDone } from '../lib/store.js';

export const title = 'Mengapa Tanda Dibalik?';

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const lt = (r) => (r === '<' ? '&lt;' : '&gt;');

export function mount(el) {
  el.innerHTML = `<div class="screen">
    <div class="eq sticky"><span class="eq-label">Pernyataan</span><div class="eq-main" id="eqB"></div><div class="eq-sub" id="eqSubB"></div></div>
    <div class="stage" id="stageB"><div class="labels"></div>
      <div class="legend"><span class="chip"><i class="sw a"></i>titik A</span><span class="chip"><i class="sw b"></i>titik B</span><span class="chip"><i class="sw ax"></i>poros di 0</span></div>
      <button class="reset" type="button" aria-label="Kembalikan sudut pandang">↺</button>
      <span class="hint3d">geser ke samping untuk memutar</span></div>
    <div class="kwrap"><span class="klabel" id="kLabel">Kalikan kedua ruas dengan <b>k</b> =</span><div class="ks" role="group" aria-labelledby="kLabel" id="ks"></div></div>
    ${feedbackBox('fbB')}
    <div class="q" id="qB" hidden><p>Setelah dikali bilangan negatif, bagaimana posisi titik A dan B?</p>
      <div class="opts">
        <button class="btn opt" type="button" data-ok="0">Tetap: B masih di kanan A</button>
        <button class="btn opt" type="button" data-ok="1">Berbalik: B sekarang di kiri A</button>
        <button class="btn opt" type="button" data-ok="0">A dan B bertemu di titik 0</button>
      </div></div>
    <div class="actions"><button class="btn ghost" id="btnNewB" type="button">Ganti bilangan A dan B</button></div>
  </div>`;
  const $ = (id) => el.querySelector('#' + id);
  if (!hasWebGL()) {
    $('stageB').innerHTML = NO_GL_HTML;
    el.querySelectorAll('.btn').forEach((b) => { b.disabled = true; });
    return null;
  }

  const S = 0.32;
  const V = createView($('stageB'), { target: new THREE.Vector3(0, 0.55, 0), halfW: 16 * S + 0.45, halfH: 1.45, dir: new THREE.Vector3(0, 0.6, 1) });
  const P = V.pivot;
  const mAxis = V.mat('--axis'), mConst = V.mat('--const');
  P.add(new THREE.Mesh(new THREE.BoxGeometry(33 * S, 0.07, 0.07), mAxis));
  const coneG = new THREE.ConeGeometry(0.1, 0.28, 16);
  const cr = new THREE.Mesh(coneG, mAxis); cr.rotation.z = -Math.PI / 2; cr.position.x = 16.5 * S + 0.12; P.add(cr);
  const cl = new THREE.Mesh(coneG, mAxis); cl.rotation.z = Math.PI / 2; cl.position.x = -16.5 * S - 0.12; P.add(cl);
  const tickS = new THREE.BoxGeometry(0.025, 0.16, 0.025), tickL = new THREE.BoxGeometry(0.035, 0.32, 0.035);
  for (let n = -16; n <= 16; n++) {
    const big = n % 5 === 0;
    const t = new THREE.Mesh(big ? tickL : tickS, mAxis); t.position.x = n * S; P.add(t);
    if (big) V.label(t, new THREE.Vector3(0, -0.36, 0), 'tick', fmtNum(n));
  }
  const axisRod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 10), V.mat('--sign', { transparent: true, opacity: 0.45 }));
  axisRod.position.y = 0.95; P.add(axisRod);

  function pin(isA) {
    const g = new THREE.Group();
    const hgt = isA ? 0.8 : 1.25;
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, hgt, 8), mConst); stick.position.y = hgt / 2; g.add(stick);
    const head = new THREE.Mesh(isA ? new THREE.SphereGeometry(0.17, 24, 16) : new THREE.BoxGeometry(0.26, 0.26, 0.26), mConst);
    head.position.y = hgt + 0.08; if (!isA) head.rotation.z = Math.PI / 4; g.add(head);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 16), mConst));
    P.add(g);
    return g;
  }
  const pinA = pin(true), pinB = pin(false);
  const LA = V.label(pinA, new THREE.Vector3(0, 1.25, 0)), LB = V.label(pinB, new THREE.Vector3(0, 1.72, 0));

  const st = { mag: 1, ang: 0 };
  let p = 2, q = 5, k = 1, busy = false, answered = false;
  const fb = $('fbB');
  function apply() {
    const c = Math.cos(st.ang), s = Math.sin(st.ang);
    [[pinA, p], [pinB, q]].forEach(([g, v]) => { const x = v * S * st.mag; g.position.set(x * c, 0, -x * s); });
  }

  const ks = $('ks');
  [-3, -2, -1, 1, 2, 3].forEach((v) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'kbtn'; b.textContent = fmtNum(v); b.dataset.k = v;
    b.addEventListener('click', () => setK(v));
    ks.appendChild(b);
  });
  function marks() {
    ks.querySelectorAll('.kbtn').forEach((b) => { b.setAttribute('aria-pressed', String(+b.dataset.k === k)); b.disabled = busy; });
    $('btnNewB').disabled = busy;
  }

  function update(flipped) {
    const va = p * k, vb = q * k, rel = va < vb ? '<' : '>';
    LA.el.textContent = `A = ${fmtNum(va)}`; LB.el.textContent = `B = ${fmtNum(vb)}`;
    const kk = k < 0 ? `(${fmtNum(k)})` : String(k);
    if (k === 1) {
      $('eqB').innerHTML = `<span class="k">${fmtNum(p)}</span><span class="s">&lt;</span><span class="k">${fmtNum(q)}</span>`;
      $('eqSubB').textContent = 'Pernyataan awal: A di kiri B.';
    } else {
      $('eqB').innerHTML = `<span class="k">${fmtNum(p)} × ${kk}</span><span class="s">${lt(rel)}</span><span class="k">${fmtNum(q)} × ${kk}</span>`;
      $('eqSubB').innerHTML = `hasilnya <span class="k">${fmtNum(va)}</span><span class="s">${lt(rel)}</span><span class="k">${fmtNum(vb)}</span>`;
    }
    if (flipped) { const s = $('eqB').querySelector('.s'); s.classList.remove('flip'); void s.offsetWidth; s.classList.add('flip'); }
    if (k === 1) say(fb, 'info', `A = ${fmtNum(p)} ada di kiri B = ${fmtNum(q)}, jadi ${fmtNum(p)} &lt; ${fmtNum(q)}. Coba kalikan kedua ruas dengan bilangan positif, lalu dengan bilangan negatif.`);
    else if (k > 0) say(fb, 'info', `Dikali ${k} (positif): jarak setiap titik dari 0 menjadi ${k} kali, tetapi urutan A dan B tetap. Tanda tetap &lt;.`);
    else if (!answered) {
      $('qB').hidden = false;
      say(fb, 'info', 'Garis bilangan berputar setengah putaran di titik 0. Perhatikan posisi A dan B sekarang, lalu jawab pertanyaan di bawah.');
    } else say(fb, 'ok', `Dikali ${fmtNum(k)} (negatif): semua titik berpindah ke sisi seberang 0. B sekarang di kiri A, jadi tanda &lt; <b>berbalik</b> menjadi &gt;.`);
    marks();
  }
  async function setK(nk) {
    if (busy || nk === k) return;
    const flipped = (nk < 0) !== (k < 0);
    k = nk; busy = true; marks();
    LA.el.textContent = 'A'; LB.el.textContent = 'B';
    await tween(st, { mag: Math.abs(k), ang: k < 0 ? Math.PI : 0 }, flipped ? 1100 : 600, apply);
    busy = false; update(flipped);
  }
  el.querySelectorAll('#qB .opt').forEach((b) => b.addEventListener('click', () => {
    el.querySelectorAll('#qB .opt').forEach((o) => o.removeAttribute('data-picked'));
    if (b.dataset.ok === '1') {
      b.dataset.picked = 'ok'; answered = true; markDone('balik-tanda');
      say(fb, 'ok', `Tepat. Mengali dengan bilangan negatif membalik posisi semua titik terhadap 0. B yang tadinya di kanan sekarang di kiri, jadi tanda &lt; berbalik menjadi &gt;. Inilah alasan ${MINUS}2x &lt; 6 menjadi x &gt; ${MINUS}3 saat kedua ruas dibagi ${MINUS}2.`);
    } else {
      b.dataset.picked = 'no';
      say(fb, 'warn', 'Belum tepat. Lihat label A dan B: titik mana yang sekarang lebih ke kanan?');
    }
  }));
  $('btnNewB').addEventListener('click', async () => {
    if (busy) return;
    const np = rnd(-5, 3), nq = rnd(np + 2, 5);
    busy = true; marks(); LA.el.textContent = 'A'; LB.el.textContent = 'B';
    await tween(st, { mag: 0.0001 }, 350, apply);
    p = np; q = nq;
    const wasNeg = k < 0; k = 1;
    await tween(st, { mag: 1, ang: 0 }, 600, apply);
    busy = false; update(wasNeg);
  });

  V.theme();
  apply(); update(false);
  return () => V.dispose();
}
