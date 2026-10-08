import gsap from 'gsap';
import { $, $$ } from './dom.js';
import { motionOn, onMotionChange } from './motion.js';

const INTERACTIVE = 'a, button, input[type="range"], summary, [data-cursor], .voxels';

export function initCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const root = document.documentElement;
  const cursor = $('.cursor');
  const dot = $('.cursor-dot');
  const ring = $('.cursor-ring');
  const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });

  const apply = (on) => root.classList.toggle('has-cursor', on);
  apply(motionOn());
  onMotionChange(apply);

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    dotX(e.clientX); dotY(e.clientY); ringX(e.clientX); ringY(e.clientY);
    cursor.classList.remove('is-hidden');
    cursor.classList.toggle('is-hover', Boolean(e.target.closest?.(INTERACTIVE)));
  }, { passive: true });
  addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  addEventListener('pointerup', () => cursor.classList.remove('is-down'));
  document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));

  // Botões magnéticos
  for (const node of $$('[data-magnetic]')) {
    node.addEventListener('pointermove', (e) => {
      if (!motionOn()) return;
      const r = node.getBoundingClientRect();
      gsap.to(node, { x: (e.clientX - r.left - r.width / 2) * 0.22, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.4, ease: 'power3.out' });
    });
    node.addEventListener('pointerleave', () => gsap.to(node, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' }));
  }
}
