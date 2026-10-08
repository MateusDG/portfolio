import { $, clamp, cssVar, onVisible } from '../lib/dom.js';
import { motionOn, onMotionChange } from '../lib/motion.js';
import { discover } from '../lib/secrets.js';
import { toast } from '../lib/toast.js';
import { blip } from '../lib/sound.js';

/**
 * O nome é feito de partículas amostradas da fonte Doto (dot-matrix).
 * μ controla o grau de pertinência de cada partícula à sua posição:
 * em 1 o nome é nítido; perto de 0 vira uma nuvem difusa.
 */
export function initHero() {
  const title = $('.hero-title');
  const canvas = $('#hero-canvas');
  const fallback = $('.hero-fallback');
  const range = $('#mu-range');
  const output = $('#mu-out');
  const ctx = canvas.getContext('2d');
  const listeners = new Set();

  let particles = [];
  let width = 0;
  let height = 0;
  let fontSize = 100;
  let dpr = 1;
  let mu = Number(range.value);
  let visible = true;
  let running = false;
  let colors = {};
  const pointer = { x: -9999, y: -9999 };

  function readColors() {
    colors = { text: cssVar('--text'), green: cssVar('--green'), coral: cssVar('--coral'), violet: cssVar('--violet') };
  }

  function build(scatter = false) {
    const rect = fallback.getBoundingClientRect();
    const textW = Math.round(rect.width);
    const textH = Math.round(rect.height);
    if (!textW || !textH) return;
    const style = getComputedStyle(fallback);
    fontSize = parseFloat(style.fontSize);
    const lineHeight = parseFloat(style.lineHeight) || fontSize * 0.9;
    const lines = Math.max(1, Math.round(textH / lineHeight));
    const text = lines > 1 ? ['Mateus', 'Diniz'] : ['Mateus Diniz'];

    // O canvas sangra além do título para os pontos flutuarem sem serem cortados.
    const bleedX = Math.min(48, Math.max(12, rect.left - 4));
    const bleedY = Math.round(fontSize * 0.55);
    width = textW + bleedX * 2;
    height = textH + bleedY * 2;
    Object.assign(canvas.style, { inset: 'auto', left: `${-bleedX}px`, top: `${-bleedY}px`, width: `${width}px`, height: `${height}px` });
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const off = document.createElement('canvas');
    off.width = textW;
    off.height = textH;
    const octx = off.getContext('2d', { willReadFrequently: true });
    // Amostra num peso fino (pontos bem separados) e desenha com raio uniforme, como no peso 900.
    octx.font = `400 ${fontSize}px ${style.fontFamily}`;
    if ('letterSpacing' in octx) octx.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
    octx.textBaseline = 'middle';
    octx.fillStyle = '#fff';
    text.forEach((line, i) => octx.fillText(line, 0, lineHeight * (i + 0.5) + fontSize * 0.02));

    // Cada ponto da fonte dot-matrix vira uma partícula (componentes conexos da máscara).
    const alpha = octx.getImageData(0, 0, textW, textH).data;
    const mask = new Uint8Array(textW * textH);
    for (let i = 0; i < mask.length; i++) mask[i] = alpha[i * 4 + 3] > 110 ? 1 : 0;
    const dots = [];
    const stack = [];
    for (let seed = 0; seed < mask.length; seed++) {
      if (mask[seed] !== 1) continue;
      let sx = 0;
      let sy = 0;
      let count = 0;
      mask[seed] = 2;
      stack.push(seed);
      while (stack.length) {
        const idx = stack.pop();
        const x = idx % textW;
        const y = (idx - x) / textW;
        sx += x; sy += y; count += 1;
        if (x > 0 && mask[idx - 1] === 1) { mask[idx - 1] = 2; stack.push(idx - 1); }
        if (x < textW - 1 && mask[idx + 1] === 1) { mask[idx + 1] = 2; stack.push(idx + 1); }
        if (y > 0 && mask[idx - textW] === 1) { mask[idx - textW] = 2; stack.push(idx - textW); }
        if (y < textH - 1 && mask[idx + textW] === 1) { mask[idx + textW] = 2; stack.push(idx + textW); }
      }
      if (count > 2) dots.push({ x: sx / count + bleedX, y: sy / count + bleedY, r: Math.sqrt(count / Math.PI) });
    }

    // Raio a partir da distância mediana ao vizinho mais próximo (o passo da grade da fonte).
    const nearest = dots.map((a) => {
      let best = Infinity;
      for (const b of dots) {
        if (a === b) continue;
        const d = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        if (d < best) best = d;
      }
      return Math.sqrt(best);
    }).sort((a, b) => a - b);
    const pitch = nearest[Math.floor(nearest.length / 2)] || fontSize / 8;
    const radius = pitch * 0.44;

    particles = dots.map((d) => {
      const roll = Math.random();
      const tone = roll < 0.06 ? 'green' : roll < 0.12 ? 'coral' : roll < 0.15 ? 'violet' : 'text';
      const start = scatter
        ? { x: Math.random() * width, y: height * (0.5 + (Math.random() - 0.5) * 2.2) }
        : { x: d.x, y: d.y };
      return {
        ox: d.x, oy: d.y, x: start.x, y: start.y, vx: 0, vy: 0, size: radius * (0.92 + Math.random() * 0.16),
        ph: Math.random() * Math.PI * 2, ph2: Math.random() * Math.PI * 2,
        sp: 0.5 + Math.random() * 1.1, r: 0.3 + Math.random() * 0.7, tone,
      };
    });
    title.classList.add('is-canvas');
    wake();
  }

  let time = 0;
  let calm = 0;
  function frame() {
    if (!running) return;
    time += 1 / 60;
    const animated = motionOn();
    const fuzz = Math.pow(1 - mu, 1.6);
    const amp = fuzz * fontSize * 1.25;
    const radius = fontSize * 0.7;
    const r2 = radius * radius;
    let energy = 0;
    if (client.x > -9999) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = client.x - rect.left;
      pointer.y = client.y - rect.top;
    }

    for (const p of particles) {
      const t = animated ? time : 0;
      const tx = p.ox + Math.sin(t * p.sp + p.ph) * p.r * amp;
      const ty = p.oy + Math.cos(t * p.sp * 0.8 + p.ph2) * p.r * amp * 0.75;
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < r2 && animated) {
        const d = Math.sqrt(d2) || 1;
        const force = (1 - d / radius) * 2.4;
        p.vx += (dx / d) * force;
        p.vy += (dy / d) * force;
      }
      if (animated) {
        p.vx = (p.vx + (tx - p.x) * 0.075) * 0.84;
        p.vy = (p.vy + (ty - p.y) * 0.075) * 0.84;
        p.x += p.vx;
        p.y += p.vy;
      } else {
        p.x = tx; p.y = ty; p.vx = p.vy = 0;
      }
      energy += Math.abs(p.vx) + Math.abs(p.vy);
    }

    ctx.clearRect(0, 0, width, height);
    const shrink = 1 - fuzz * 0.35;
    ctx.globalAlpha = 1 - fuzz * 0.3;
    for (const tone of ['text', 'green', 'coral', 'violet']) {
      ctx.fillStyle = colors[tone];
      ctx.beginPath();
      for (const p of particles) {
        if (p.tone !== tone) continue;
        const r = p.size * shrink;
        ctx.moveTo(p.x + r, p.y);
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Dorme quando o nome está estável, nítido e sem interação.
    calm = energy < particles.length * 0.004 && mu > 0.995 ? calm + 1 : 0;
    if (!animated || calm > 30 || !visible) { running = false; return; }
    requestAnimationFrame(frame);
  }

  function wake() {
    calm = 0;
    if (!running && visible) { running = true; requestAnimationFrame(frame); }
  }

  function setMu(value, fromUser) {
    mu = clamp(value);
    range.value = mu;
    output.value = mu.toFixed(2);
    output.textContent = mu.toFixed(2);
    range.style.setProperty('--p', `${mu * 100}%`);
    wake();
    listeners.forEach((fn) => fn(mu));
    if (!fromUser) return;
    if (mu >= 1 && discover('certeza')) toast('μ = 1. Certeza absoluta é rara na lógica fuzzy.');
    if (mu <= 0 && discover('caos')) toast('μ = 0. Nada pertence a nada. Bem-vindo ao caos.');
  }

  range.addEventListener('input', () => setMu(Number(range.value), true));

  const client = { x: -9999, y: -9999 };
  addEventListener('pointermove', (e) => {
    client.x = e.clientX;
    client.y = e.clientY;
    if (visible) wake();
  }, { passive: true });
  const release = () => { client.x = client.y = pointer.x = pointer.y = -9999; wake(); };
  document.addEventListener('pointerleave', release);
  canvas.addEventListener('touchend', release);

  title.addEventListener('click', (e) => {
    if (e.detail !== 3) return;
    if (!motionOn()) return;
    const cx = width / 2;
    const cy = height / 2;
    for (const p of particles) {
      const a = Math.atan2(p.oy - cy, p.ox - cx) + (Math.random() - 0.5);
      const f = 18 + Math.random() * 40;
      p.vx += Math.cos(a) * f;
      p.vy += Math.sin(a) * f;
    }
    blip('jump');
    wake();
    discover('explosao');
  });

  onVisible(title, (isIn) => { visible = isIn; if (isIn) wake(); });
  onMotionChange(() => wake());

  let resizeTimer;
  let lastWidth = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === lastWidth) return; // ignora a barra de endereço do mobile
    lastWidth = innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => build(false), 160);
  });
  document.addEventListener('themechange', () => { readColors(); wake(); });

  readColors();
  setMu(mu, false);

  const ready = document.fonts.load(`900 100px "Doto Variable"`).catch(() => {}).then(() => document.fonts.ready);
  return {
    // Chamado ao fim da intro: as partículas chegam de longe e montam o nome.
    async start() {
      await ready;
      build(motionOn());
    },
    onMu: (fn) => listeners.add(fn),
    getMu: () => mu,
  };
}
