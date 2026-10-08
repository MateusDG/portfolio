import gsap from 'gsap';
import {
  BoxGeometry,
  Color,
  DirectionalLight,
  DynamicDrawUsage,
  HemisphereLight,
  InstancedMesh,
  MeshLambertMaterial,
  Object3D,
  OrthographicCamera,
  Raycaster,
  Scene,
  Spherical,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { $, $$, cssVar, onVisible } from '../lib/dom.js';
import { motionOn } from '../lib/motion.js';
import { discover } from '../lib/secrets.js';
import { toast } from '../lib/toast.js';

// Carregado sob demanda: só quando a seção do GitHub se aproxima.
export function mountVoxels(data, { countUp, dateLabel, plural }) {
  const container = $('#voxels');
  const stage = $('#voxels-stage');
  const tip = $('#voxels-tip');
  const days = data.days;
  const n = days.length;
  const weeks = Math.ceil(n / 7);
  const max = Math.max(...days.map((d) => d.pub + d.prv), 1);
  const busiestIdx = days.findIndex((d) => d.d === data.busiestDay.date);
  const PITCH = 1.16;

  const dpr = devicePixelRatio || 1;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const renderer = new WebGLRenderer({ antialias: dpr < 2, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(dpr, coarse ? 1.5 : 2));
  stage.append(renderer.domElement);
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, -500, 500);
  scene.add(new HemisphereLight(0xffffff, 0x334433, 1.5));
  const sun = new DirectionalLight(0xffffff, 2.6);
  sun.position.set(-8, 16, 10);
  const fill = new DirectionalLight(0xffffff, 0.7);
  fill.position.set(10, 6, -8);
  scene.add(sun, fill);

  const box = new BoxGeometry(1, 1, 1);
  box.translate(0, 0.5, 0);
  const material = () => new MeshLambertMaterial({ color: 0xffffff });
  const base = new InstancedMesh(box, material(), n);
  const pub = new InstancedMesh(box, material(), n);
  const prv = new InstancedMesh(box, material(), n);
  for (const mesh of [base, pub, prv]) { mesh.instanceMatrix.setUsage(DynamicDrawUsage); scene.add(mesh); }

  // Cores vêm dos tokens CSS, então acompanham o tema.
  const color = new Color();
  const palette = {};
  function readPalette() {
    for (const key of ['line', 'line-2', 'green', 'green-2', 'green-3', 'coral', 'coral-2', 'text']) palette[key] = new Color(cssVar(`--${key}`));
  }
  function paint(i, highlight = false) {
    const d = days[i];
    const t = Math.sqrt((d.pub + d.prv) / max);
    color.copy(highlight ? palette.text : palette[d.pub + d.prv ? 'line-2' : 'line']);
    base.setColorAt(i, color);
    color.copy(palette['green-2']).lerp(palette.green, t);
    if (highlight) color.lerp(palette.text, 0.55);
    pub.setColorAt(i, color);
    color.copy(palette['coral-2']).lerp(palette.coral, t);
    if (highlight) color.lerp(palette.text, 0.55);
    prv.setColorAt(i, color);
  }
  function paintAll() {
    readPalette();
    for (let i = 0; i < n; i++) paint(i, i === hovered);
    for (const mesh of [base, pub, prv]) mesh.instanceColor.needsUpdate = true;
  }

  // Layout: o ano é dividido em 1 a 3 faixas conforme a proporção do container.
  let strips = 0;
  let positions = [];
  let per = weeks;
  function layout(aspect) {
    const next = aspect < 1.4 ? 3 : aspect < 3 ? 2 : 1;
    if (next === strips) return false;
    strips = next;
    per = Math.ceil(weeks / strips);
    positions = days.map((_, i) => {
      const week = Math.floor(i / 7);
      const dow = i % 7;
      const s = Math.floor(week / per);
      return {
        week,
        x: ((week % per) - (per - 1) / 2) * PITCH,
        z: (dow - 3) * PITCH + (s - (strips - 1) / 2) * (7 * PITCH + 2.4),
      };
    });
    return true;
  }

  const state = { build: motionOn() ? 0 : 1, mp: 1, mv: 1 };
  const height = (t) => (t > 0 ? 0.3 + Math.sqrt(t / max) * 7.2 : 0);
  const easeBack = (x) => { const c1 = 1.5; const c3 = c1 + 1; return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2; };
  const dummy = new Object3D();
  function updateBars() {
    for (let i = 0; i < n; i++) {
      const d = days[i];
      const { x, z, week } = positions[i];
      const local = Math.min(1, Math.max(0, state.build * 1.6 - (week / weeks) * 0.6));
      const grow = local >= 1 ? 1 : easeBack(local);
      const pv = d.pub * state.mp;
      const vv = d.prv * state.mv;
      const total = pv + vv;
      const h = height(total) * grow;
      const hp = total ? (h * pv) / total : 0;
      const hv = Math.max(0, h - hp);
      dummy.position.set(x, -0.12, z);
      dummy.scale.set(0.96, 0.12, 0.96);
      dummy.updateMatrix();
      base.setMatrixAt(i, dummy.matrix);
      // Altura zero precisa de escala zero: uma caixa achatada ainda mostra a face de cima.
      dummy.position.set(x, 0, z);
      if (hp > 0.002) dummy.scale.set(0.84, hp, 0.84); else dummy.scale.setScalar(0);
      dummy.updateMatrix();
      pub.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, hp, z);
      if (hv > 0.002) dummy.scale.set(0.84, hv, 0.84); else dummy.scale.setScalar(0);
      dummy.updateMatrix();
      prv.setMatrixAt(i, dummy.matrix);
    }
    for (const mesh of [base, pub, prv]) { mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); }
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.55;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = 1.3;
  controls.target.set(0, 1.4, 0);
  const HOME = { theta: 0.42, phi: 0.98 };
  const sph = new Spherical(80, HOME.phi, HOME.theta);
  camera.position.setFromSpherical(sph).add(controls.target);
  camera.lookAt(controls.target);

  function fit() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    if (layout(aspect)) updateBars();
    // Enquadra projetando os cantos do volume na vista inicial da câmera.
    const view = new Object3D();
    view.position.setFromSpherical(new Spherical(80, HOME.phi, HOME.theta)).add(controls.target);
    view.lookAt(controls.target);
    view.updateMatrixWorld();
    const inverse = view.matrixWorld.clone().invert();
    const sx = (per * PITCH) / 2;
    const sz = (strips * 7 * PITCH + (strips - 1) * 2.4) / 2;
    let halfW = 0;
    let halfH = 0;
    for (const x of [-sx, sx]) for (const y of [0, 5.5]) for (const z of [-sz, sz]) {
      const v = new Vector3(x, y, z).applyMatrix4(inverse);
      halfW = Math.max(halfW, Math.abs(v.x));
      halfH = Math.max(halfH, Math.abs(v.y));
    }
    halfW *= 1.02;
    halfH *= 1.06;
    if (halfW / halfH > aspect) halfH = halfW / aspect; else halfW = halfH * aspect;
    Object.assign(camera, { left: -halfW, right: halfW, top: halfH, bottom: -halfH });
    camera.updateProjectionMatrix();
    dirty = true;
  }

  let dirty = true;
  let hovered = -1;
  let interacting = false;
  let idleSince = performance.now();
  let visible = false;
  let pick = null;

  readPalette();
  fit();
  updateBars();
  paintAll();

  controls.addEventListener('start', () => { interacting = true; tip.hidden = true; });
  controls.addEventListener('end', () => { interacting = false; idleSince = performance.now(); });
  controls.addEventListener('change', () => { dirty = true; });

  const raycaster = new Raycaster();
  const ndc = new Vector2();
  let downAt = null;
  renderer.domElement.addEventListener('pointermove', (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    pick = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (!running) frame();
  });
  renderer.domElement.addEventListener('pointerleave', () => { pick = null; setHover(-1); });
  renderer.domElement.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    pick = { x: e.clientX - r.left, y: e.clientY - r.top };
    const idx = intersect();
    setHover(idx, pick);
    if (idx === busiestIdx && discover('pico')) {
      toast(`Dia de pico: ${dateLabel(data.busiestDay.date)} com ${data.busiestDay.count} contribuições.`);
    }
  });

  function intersect() {
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects([prv, pub, base], false).find((h) => h.instanceId !== undefined);
    return hit ? hit.instanceId : -1;
  }

  function setHover(idx, at) {
    if (idx !== hovered) {
      const prev = hovered;
      hovered = idx;
      if (prev >= 0) paint(prev);
      if (idx >= 0) paint(idx, true);
      for (const mesh of [base, pub, prv]) mesh.instanceColor.needsUpdate = true;
      dirty = true;
    }
    if (idx < 0 || !at) { tip.hidden = true; return; }
    const d = days[idx];
    const parts = [];
    if (d.pub) parts.push(`<span class="p">${plural(d.pub, 'pública', 'públicas')}</span>`);
    if (d.prv) parts.push(`<span class="v">${plural(d.prv, 'privada', 'privadas')}</span>`);
    tip.innerHTML = `<b>${dateLabel(d.d)}</b> · ${parts.join(' · ') || 'sem contribuições'}${idx === busiestIdx ? ' · pico ★' : ''}`;
    tip.style.left = `${Math.min(Math.max(at.x, 110), container.clientWidth - 110)}px`;
    tip.style.top = `${Math.max(at.y, 48)}px`;
    tip.hidden = false;
  }

  // Filtros
  const filterButtons = $$('[data-contrib]');
  filterButtons.forEach((button) => button.addEventListener('click', () => {
    const mode = button.dataset.contrib;
    filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    const target = { mp: mode === 'prv' ? 0 : 1, mv: mode === 'pub' ? 0 : 1 };
    gsap.to(state, { ...target, duration: motionOn() ? 0.9 : 0, ease: 'power3.inOut', onUpdate: () => { updateBars(); dirty = true; if (!running) frame(); }, onStart: wakeUp });
    const total = mode === 'pub' ? data.totals.public : mode === 'prv' ? data.totals.private : data.totals.all;
    countUp($('#cs-total'), total);
    $('#cs-total').nextElementSibling.textContent = mode === 'pub' ? 'contribuições públicas' : mode === 'prv' ? 'commits privados' : 'contribuições no último ano';
  }));

  // Loop: só roda com a seção visível.
  let running = false;
  let lastIdle = 0;
  function frame() {
    const now = performance.now();
    const idle = !interacting && motionOn() && now - idleSince > 3000;
    // Balanço ocioso a ~30 fps; interação e animações seguem a 60 fps.
    if (idle && !pick && now - lastIdle < 32) { if (running) requestAnimationFrame(frame); return; }
    lastIdle = now;
    if (idle) {
      sph.setFromVector3(camera.position.clone().sub(controls.target));
      const theta = HOME.theta + Math.sin(now / 1000 * 0.28) * 0.3;
      sph.theta += (theta - sph.theta) * 0.02;
      sph.phi += (HOME.phi - sph.phi) * 0.02;
      camera.position.setFromSpherical(sph).add(controls.target);
      camera.lookAt(controls.target);
      dirty = true;
    }
    controls.update();
    if (pick && !interacting) setHover(intersect(), pick);
    if (dirty) { renderer.render(scene, camera); dirty = false; }
    if (running) requestAnimationFrame(frame);
  }
  function wakeUp() {
    if (!visible) return;
    if (!motionOn()) { frame(); return; }
    if (!running) { running = true; requestAnimationFrame(frame); }
  }
  onVisible(container, (isIn) => {
    visible = isIn;
    if (isIn) wakeUp(); else running = false;
  });

  new ResizeObserver(() => { fit(); if (!running) frame(); }).observe(container);
  document.addEventListener('themechange', () => { paintAll(); dirty = true; if (!running) frame(); });

  if (motionOn()) {
    gsap.to(state, { build: 1, duration: 2.4, ease: 'none', delay: 0.2, onUpdate: () => { updateBars(); dirty = true; } });
  }
  visible = true;
  wakeUp();
}
