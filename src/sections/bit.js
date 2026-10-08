import { $, onVisible } from '../lib/dom.js';
import { motionOn } from '../lib/motion.js';
import { discover } from '../lib/secrets.js';
import { blip } from '../lib/sound.js';

const PHRASES = [
  'oi! eu sou o Bit.',
  'não sou 0 nem 1. sou fuzzy.',
  'já apertou o trigger do DAG?',
  'psiu… tem 18 segredos por aqui',
  'digita help no terminal lá embaixo',
  '↑ ↑ ↓ ↓ ← → ← → B A',
  'μ = 0.73 de vontade de trabalhar',
  'o Mateus me fez em 14×14 pixels',
];

export function initBit(hero) {
  const bit = $('#bit');
  const say = $('#bit-say');
  const ground = $('#ground');
  let x = 40;
  let dir = 1;
  let pause = 0;
  let clicks = 0;
  let phrase = 0;
  let sleeping = false;
  let visible = true;
  let lastActivity = performance.now();
  let sayTimer;
  let dizzyShown = false;

  function speak(text, ms = 2600) {
    say.textContent = text;
    say.classList.add('is-on');
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => say.classList.remove('is-on'), ms);
  }

  function sleep() {
    sleeping = true;
    bit.classList.add('is-sleeping');
    bit.classList.remove('is-walking');
    bit.setAttribute('aria-label', 'Bit está dormindo. Clique para acordá-lo');
  }

  bit.addEventListener('click', () => {
    if (sleeping) {
      sleeping = false;
      bit.classList.remove('is-sleeping');
      bit.setAttribute('aria-label', 'Bit, o mascote. Clique para ele pular');
      speak('hã?! eu só tava compilando…');
      discover('bit-sono');
      lastActivity = performance.now();
      return;
    }
    bit.classList.remove('is-jumping');
    void bit.offsetWidth;
    bit.classList.add('is-jumping');
    blip('jump');
    speak(PHRASES[phrase++ % PHRASES.length]);
    clicks += 1;
    if (clicks === 5 && discover('bit-pulo')) speak('ok, agora somos amigos ♥', 3200);
  });

  for (const type of ['pointermove', 'keydown', 'scroll', 'touchstart']) {
    addEventListener(type, () => { lastActivity = performance.now(); }, { passive: true });
  }

  hero.onMu((mu) => {
    if (mu < 0.25 && !dizzyShown) { dizzyShown = true; speak('tô ficando tonto…'); }
    if (mu > 0.6) dizzyShown = false;
  });

  onVisible(ground, (isIn) => { visible = isIn; });

  function tick(now) {
    requestAnimationFrame(tick);
    if (!visible) return;
    const max = ground.clientWidth - bit.offsetWidth;
    if (!sleeping && now - lastActivity > 24000) sleep();
    if (sleeping || !motionOn()) { bit.classList.remove('is-walking'); return; }
    if (pause > 0) {
      pause -= 1;
      bit.classList.remove('is-walking');
      return;
    }
    x += dir * 0.7;
    if (x <= 0 || x >= max) { dir *= -1; x = Math.max(0, Math.min(max, x)); }
    if (Math.random() < 0.003) pause = 60 + Math.random() * 140;
    if (Math.random() < 0.0015) dir *= -1;
    bit.classList.add('is-walking');
    bit.style.setProperty('--x', `${x}px`);
    bit.style.setProperty('--dir', dir);
  }
  requestAnimationFrame(tick);
  setTimeout(() => speak(PHRASES[phrase++]), 2200);
}
