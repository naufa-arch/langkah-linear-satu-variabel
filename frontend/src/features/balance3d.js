// F2 + F11: Timbangan aljabar dengan blok 3D. Balok biru = x, kubus ungu = 1.
import { createView, hasWebGL, faceTexture, NO_GL_HTML, THREE } from '../three/view.js';
import { tween, kick } from '../lib/tween.js';
import { say, feedbackBox, css } from '../lib/dom.js';
import { fmtExpr, MINUS } from '../math/linear.js';
import { sideHTML } from '../components/mathexpr.js';
import { markDone } from '../lib/store.js';

export const title = 'Timbangan Aljabar';

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

export function mount(el) {
  el.innerHTML = `<div class="screen">
    <div class="eq sticky"><span class="eq-label">Persamaan</span><div class="eq-main" id="eqA"></div><div class="eq-sub" id="eqSubA"></div></div>
    <div class="stage" id="stageA"><div class="labels"></div>
      <div class="legend"><span class="chip"><i class="sw x"></i>balok = <b>x</b></span><span class="chip"><i class="sw u"></i>kubus = <b>1</b></span></div>
      <button class="reset" type="button" aria-label="Kembalikan sudut pandang">↺</button>
      <span class="hint3d">geser ke samping untuk memutar</span></div>
    ${feedbackBox('fbA')}
    <div class="actions">
      <button class="btn primary" id="btnBoth" type="button">Ambil 1 kubus dari kedua ruas</button>
      <button class="btn" id="btnLeft" type="button">Ambil 1 kubus dari ruas kiri saja</button>
      <button class="btn primary" id="btnUndo" type="button" hidden>Kembalikan kubus ke ruas kiri</button>
      <button class="btn" id="btnDiv" type="button">Bagi kedua ruas dengan 2</button>
      <button class="btn ghost" id="btnNew" type="button">Soal baru</button>
    </div>
    <div class="trail"><h2>Jejak langkah</h2><ol class="log" id="logA"></ol></div>
  </div>`;
  const $ = (id) => el.querySelector('#' + id);
  if (!hasWebGL()) {
    $('stageA').innerHTML = NO_GL_HTML;
    el.querySelectorAll('.actions .btn').forEach((b) => { b.disabled = true; });
    return null;
  }

  const V = createView($('stageA'), { target: new THREE.Vector3(0, 2.35, 0), halfW: 5.55, halfH: 2.35, dir: new THREE.Vector3(0, 0.5, 1) });
  const P = V.pivot;
  const mMetal = V.mat('--metal', { metalness: 0.25, roughness: 0.45 });
  const PIV_Y = 2.2, L = 3.6, LIFT = 0.55;

  const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 1.1), mMetal); base.position.y = 0.09; P.add(base);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, PIV_Y, 16), mMetal); post.position.y = PIV_Y / 2 + 0.1; P.add(post);
  const beam = new THREE.Group(); beam.position.y = PIV_Y; P.add(beam);
  beam.add(new THREE.Mesh(new THREE.BoxGeometry(2 * L + 0.3, 0.16, 0.2), mMetal));
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.75, 0.06), V.mat('--sign')); needle.position.y = 0.45; beam.add(needle);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), V.mat('--sign')); hub.position.y = PIV_Y; P.add(hub);

  function mkPan() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.32, 0.14, 40), mMetal));
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, LIFT, 10), mMetal); stem.position.y = -LIFT / 2; g.add(stem);
    const items = new THREE.Group(); items.position.y = 0.07; g.add(items);
    P.add(g);
    return { g, items, list: [] };
  }
  const panL = mkPan(), panR = mkPan();
  V.label(panL.g, new THREE.Vector3(0, -0.55, 1.2), 'side', 'ruas kiri');
  V.label(panR.g, new THREE.Vector3(0, -0.55, 1.2), 'side', 'ruas kanan');

  const tilt = { t: 0 };
  function applyTilt() {
    beam.rotation.z = tilt.t;
    const c = Math.cos(tilt.t), s = Math.sin(tilt.t);
    panL.g.position.set(-L * c, PIV_Y - L * s + LIFT, 0);
    panR.g.position.set(L * c, PIV_Y + L * s + LIFT, 0);
  }
  applyTilt();

  const xSide = new THREE.MeshStandardMaterial({ roughness: 0.5 });
  const xTop = V.mat('--var', { roughness: 0.5 });
  const uMat = new THREE.MeshStandardMaterial({ roughness: 0.5 });
  const xMats = [xSide, xSide, xTop, xTop, xSide, xSide];
  V.onTheme(() => {
    [xSide, uMat].forEach((m) => { if (m.map) m.map.dispose(); });
    xSide.map = faceTexture(96, 224, css('--var'), css('--on-var'), 'x', 80, true);
    uMat.map = faceTexture(96, 96, css('--const'), css('--on-const'), '1', 60, false);
    xSide.needsUpdate = true; uMat.needsUpdate = true;
  });
  const gX = new THREE.BoxGeometry(0.42, 1, 0.42), gU = new THREE.BoxGeometry(0.38, 0.38, 0.38);
  const SL = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) SL.push([(c - 2) * 0.44, (r - 1) * 0.44]);

  function positions(pan) {
    const out = new Map();
    const xs = pan.list.filter((i) => i.t === 'x'), us = pan.list.filter((i) => i.t === 'u');
    xs.forEach((it, i) => out.set(it, [SL[i][0], 0.5, SL[i][1]]));
    const free = SL.slice(xs.length);
    us.forEach((it, j) => { const s = free[j % free.length]; out.set(it, [s[0], 0.19 + Math.floor(j / free.length) * 0.39, s[1]]); });
    return out;
  }
  function layout(pan, anim) {
    const ps = [];
    positions(pan).forEach((p, it) => {
      if (anim) ps.push(tween(it.m.position, { x: p[0], y: p[1], z: p[2] }, 450));
      else it.m.position.set(p[0], p[1], p[2]);
    });
    return Promise.all(ps);
  }
  function add(pan, t) { const m = new THREE.Mesh(t === 'x' ? gX : gU, t === 'x' ? xMats : uMat); const it = { t, m }; pan.list.push(it); pan.items.add(m); return it; }
  function clear(pan) { pan.list.forEach((i) => pan.items.remove(i.m)); pan.list = []; }
  function vanish(pan, it) {
    return Promise.all([tween(it.m.position, { y: it.m.position.y + 1.1 }, 420), tween(it.m.scale, { x: 0.01, y: 0.01, z: 0.01 }, 420)])
      .then(() => pan.items.remove(it.m));
  }
  function removeLastU(pan) {
    for (let i = pan.list.length - 1; i >= 0; i--) if (pan.list[i].t === 'u') return vanish(pan, pan.list.splice(i, 1)[0]);
    return Promise.resolve();
  }
  const count = (pan) => { let x = 0, u = 0; pan.list.forEach((i) => (i.t === 'x' ? x++ : u++)); return { x, u }; };

  let a0, b0, c0, xv, busy = false, balanced = true, done = false, bridged = false;
  let log = [];
  const fb = $('fbA');
  const plain = (x, u, c) => `${fmtExpr({ a: x, b: u })} = ${c}`;

  function show() {
    const l = count(panL), r = count(panR);
    $('eqA').innerHTML = `${sideHTML({ a: l.x, b: l.u })}<span class="s ${balanced ? '' : 'bad'}">${balanced ? '=' : '≠'}</span>${sideHTML({ a: r.x, b: r.u })}`;
    $('eqSubA').textContent = balanced ? 'Timbangan seimbang: kedua ruas sama berat.' : 'Timbangan miring: kedua ruas tidak sama berat lagi.';
    $('btnBoth').disabled = busy || !balanced || done || l.u === 0 || r.u === 0;
    $('btnLeft').hidden = !balanced; $('btnLeft').disabled = busy || done || l.u === 0;
    $('btnUndo').hidden = balanced; $('btnUndo').disabled = busy;
    $('btnDiv').textContent = `Bagi kedua ruas dengan ${Math.max(l.x, 2)}`;
    $('btnDiv').disabled = busy || !balanced || done || l.u > 0 || l.x < 2;
    $('btnNew').disabled = busy;
    $('logA').innerHTML = log.map((s) => `<li>${s}</li>`).join('');
  }
  function tiltTo() {
    const l = count(panL), r = count(panR);
    const d = (l.x * xv + l.u) - (r.x * xv + r.u);
    const t = d === 0 ? 0 : Math.sign(d) * Math.min(0.08 + Math.abs(d) * 0.04, 0.28);
    return tween(tilt, { t }, 650, applyTilt);
  }
  function guide() {
    const l = count(panL), r = count(panR);
    if (l.u === 0 && l.x === 1) {
      done = true; markDone('timbangan');
      say(fb, 'ok', `Selesai. Satu balok x seimbang dengan ${r.u} kubus, jadi <b>x = ${r.u}</b>. Cek: ${a0} × ${r.u} + ${b0} = ${c0} ✓`);
    } else if (l.u === 0) {
      let msg = `Di ruas kiri tinggal ${l.x} balok x. Bagi kedua ruas menjadi ${l.x} kelompok sama banyak, supaya tersisa satu x.`;
      if (!bridged) { msg += `<br>Mengambil ${b0} kubus dari kedua ruas inilah yang biasa disebut “+${b0} pindah ruas menjadi ${MINUS}${b0}”.`; bridged = true; }
      say(fb, 'info', msg);
    } else {
      say(fb, 'info', `Ruas kiri masih punya ${l.u} kubus. Ambil kubus dari kedua ruas sampai di kiri tinggal balok x.`);
    }
    show();
  }
  function newProblem(first) {
    clear(panL); clear(panR);
    if (first) { a0 = 2; xv = 4; b0 = 3; } else { a0 = rnd(2, 3); xv = rnd(1, 5); b0 = rnd(1, 4); }
    c0 = a0 * xv + b0;
    for (let i = 0; i < a0; i++) add(panL, 'x');
    for (let i = 0; i < b0; i++) add(panL, 'u');
    for (let i = 0; i < c0; i++) add(panR, 'u');
    layout(panL, false); layout(panR, false);
    tilt.t = 0; applyTilt();
    balanced = true; done = false; bridged = false;
    log = [`Mulai: ${plain(a0, b0, c0)}`];
    say(fb, 'info', 'Tujuan: tinggal satu balok x di ruas kiri. Timbangan harus tetap seimbang di setiap langkah.');
    show(); kick();
  }

  $('btnBoth').addEventListener('click', async () => {
    busy = true; show();
    await Promise.all([removeLastU(panL), removeLastU(panR)]);
    const l = count(panL), r = count(panR);
    log.push(`Kurangi 1 di kedua ruas → ${plain(l.x, l.u, r.u)}`);
    busy = false; guide();
  });
  $('btnLeft').addEventListener('click', async () => {
    busy = true; show();
    await removeLastU(panL); balanced = false; show();
    await tiltTo(); busy = false;
    say(fb, 'warn', 'Ruas kanan belum diubah, jadi timbangan miring dan persamaannya tidak benar lagi. Kembalikan kubusnya, lalu ambil dari <b>kedua</b> ruas.');
    show();
  });
  $('btnUndo').addEventListener('click', async () => {
    busy = true; show();
    const it = add(panL, 'u'); layout(panL, false); it.m.scale.set(0.01, 0.01, 0.01);
    await tween(it.m.scale, { x: 1, y: 1, z: 1 }, 350);
    balanced = true; await tiltTo(); busy = false;
    say(fb, 'info', 'Timbangan seimbang lagi. Sekarang ambil kubus dari kedua ruas.');
    show();
  });
  $('btnDiv').addEventListener('click', async () => {
    busy = true; show();
    const l = count(panL), r = count(panR), k = l.x, q = r.u / k;
    const xs = panL.list.filter((i) => i.t === 'x').slice(1);
    const us = panR.list.filter((i) => i.t === 'u').slice(q);
    panL.list = panL.list.filter((i) => !xs.includes(i));
    panR.list = panR.list.filter((i) => !us.includes(i));
    await Promise.all([...xs.map((i) => vanish(panL, i)), ...us.map((i) => vanish(panR, i))]);
    await Promise.all([layout(panL, true), layout(panR, true)]);
    log.push(`Bagi kedua ruas dengan ${k} → x = ${q}`);
    busy = false; guide();
  });
  $('btnNew').addEventListener('click', () => newProblem(false));

  V.theme();
  document.fonts?.ready.then(() => V.theme());
  newProblem(true);
  return () => V.dispose();
}
