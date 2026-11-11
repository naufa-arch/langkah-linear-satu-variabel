// Fondasi adegan 3D (DESIGN §8): kamera tetap, rotasi terbatas ±25°, label HTML, render on demand.
import * as THREE from '/vendor/three.module.min.js';
import { tween, kick, setRender } from '../lib/tween.js';
import { css, onThemeChange } from '../lib/dom.js';

export { THREE };

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch { return false; }
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// opt = { target: Vector3, halfW, halfH, dir: Vector3 } → kamera diatur agar area itu selalu muat di layar
export function createView(stage, opt) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  stage.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa0a6, 2.6));
  const dl = new THREE.DirectionalLight(0xffffff, 2.1);
  dl.position.set(4, 10, 7);
  scene.add(dl);
  const pivot = new THREE.Group();
  scene.add(pivot);

  const layer = stage.querySelector('.labels');
  const labels = [], themed = [], hooks = [];
  const tmp = new THREE.Vector3();
  let w = 0, h = 0;

  const view = {
    THREE, pivot, scene,
    mat(token, extra) {
      const m = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05, ...(extra || {}) });
      themed.push([m, token]);
      return m;
    },
    label(obj, off, cls, text) {
      const el = document.createElement('div');
      el.className = 'lbl3d ' + (cls || '');
      el.textContent = text || '';
      layer.appendChild(el);
      const L = { el, obj, off: off || new THREE.Vector3() };
      labels.push(L);
      return L;
    },
    onTheme(fn) { hooks.push(fn); },
    theme() { themed.forEach(([m, t]) => m.color.set(css(t))); hooks.forEach((f) => f()); kick(); },
    resize() {
      w = stage.clientWidth; h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const d = Math.max(opt.halfW / (t * camera.aspect), opt.halfH / t) * 1.06;
      camera.position.copy(opt.target).addScaledVector(opt.dir.clone().normalize(), d);
      camera.lookAt(opt.target);
    },
    render() {
      if (!w) return;
      renderer.render(scene, camera);
      for (const L of labels) {
        L.obj.getWorldPosition(tmp); tmp.add(L.off); tmp.project(camera);
        L.el.style.transform = `translate(${((tmp.x + 1) / 2 * w).toFixed(1)}px,${((1 - tmp.y) / 2 * h).toFixed(1)}px) translate(-50%,-50%)`;
      }
    },
    dispose() {
      ro.disconnect(); stopTheme(); setRender(null);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        ms.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
      });
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };

  const ro = new ResizeObserver(() => { view.resize(); kick(); });
  ro.observe(stage);
  const stopTheme = onThemeChange(() => view.theme());

  // geser horizontal = putar sedikit; geser vertikal tetap menggulir halaman (touch-action: pan-y)
  const cv = renderer.domElement;
  let drag = null;
  cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, r: pivot.rotation.y }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => {
    if (!drag) return;
    pivot.rotation.y = clamp(drag.r + (e.clientX - drag.x) * 0.006, -0.44, 0.44);
    kick();
  });
  const end = () => { drag = null; };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
  stage.querySelector('.reset')?.addEventListener('click', () => tween(pivot.rotation, { y: 0 }, 450));

  setRender(() => view.render());
  return view;
}

export function faceTexture(w, h, bg, fg, txt, size, italic) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = fg;
  g.font = `${italic ? 'italic ' : ''}700 ${size}px "Atkinson Hyperlegible", system-ui, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(txt, w / 2, h / 2 + size * 0.04);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export const NO_GL_HTML = '<p class="nogl">HP ini belum mendukung tampilan 3D (WebGL). Versi gambar 2D sedang disiapkan untuk perangkat seperti ini.</p>';
