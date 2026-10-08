import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $$, fmt, once } from './dom.js';
import { motionOn, onMotionChange } from './motion.js';

const GLYPHS = '01μ░▒▓#%&*+=<>/\\';

// Títulos "descriptografam" ao entrar na tela.
export function scramble(node, duration = 900) {
  const textNode = [...node.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
  if (!textNode) return;
  const final = textNode.textContent;
  const start = performance.now();
  node.setAttribute('aria-label', node.textContent);
  function step(now) {
    const p = Math.min(1, (now - start) / duration);
    const revealed = Math.floor(final.length * p);
    let out = final.slice(0, revealed);
    for (let i = revealed; i < final.length; i++) {
      out += final[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    textNode.textContent = out;
    if (p < 1) requestAnimationFrame(step);
    else { textNode.textContent = final; node.removeAttribute('aria-label'); }
  }
  requestAnimationFrame(step);
}

// `ready` é a promessa do fim da intro: nada anima escondido atrás dela.
export function initReveal(ready = Promise.resolve()) {
  const animated = motionOn();
  const after = (fn) => (...args) => ready.then(() => fn(...args));

  // Entrada em cascata
  const items = $$('[data-reveal]');
  if (animated) {
    gsap.set(items, { opacity: 0, y: 34 });
    ScrollTrigger.batch(items, {
      start: 'top 90%',
      once: true,
      onEnter: after((batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1, stagger: 0.09, ease: 'power3.out', overwrite: true })),
    });
  }
  // Se o movimento for desligado no meio do caminho, nada pode ficar invisível.
  onMotionChange((on) => {
    if (on) return;
    gsap.set(items, { clearProps: 'opacity,transform' });
    gsap.set('.hero-inner', { clearProps: 'all' });
  });

  for (const title of $$('[data-scramble]')) {
    if (animated) once(title, after(() => scramble(title)));
  }

  // Contadores
  for (const node of $$('[data-count]')) {
    once(node, after(() => countTo(node)));
  }

  // Barras do quadro "agora"
  for (const node of $$('.now')) once(node, after(() => node.classList.add('is-in')));

  // Parallax suave no hero
  if (animated) {
    gsap.to('.hero-inner', {
      yPercent: -12, opacity: 0.25, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  }
}

export function countTo(node) {
  const target = Number(node.dataset.count);
  if (!motionOn()) { node.textContent = fmt(target); return; }
  const state = { v: 0 };
  gsap.to(state, {
    v: target, duration: target > 1000 ? 1.8 : 1.1, ease: 'power3.out',
    onUpdate: () => { node.textContent = fmt(Math.round(state.v)); },
  });
}
