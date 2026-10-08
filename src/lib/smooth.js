import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { motionOn, onMotionChange } from './motion.js';

gsap.registerPlugin(ScrollTrigger);

export let lenis = null;
const raf = (time) => lenis?.raf(time * 1000);

function start() {
  if (lenis || !motionOn()) return;
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
}

function stop() {
  if (!lenis) return;
  gsap.ticker.remove(raf);
  lenis.destroy();
  lenis = null;
}

export function scrollToTarget(target) {
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
  if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : -header - 12, duration: 1.3 });
  else if (target === 0) scrollTo({ top: 0 });
  else target.scrollIntoView({ block: 'start' });
}

export function initSmooth() {
  start();
  onMotionChange((on) => (on ? start() : stop()));
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || link.closest('dialog')) return;
    const id = link.getAttribute('href').slice(1);
    const target = id && id !== 'top' ? document.getElementById(id) : 0;
    if (target === null) return;
    e.preventDefault();
    scrollToTarget(target);
    if (target && target !== 0) {
      history.replaceState(null, '', `#${id}`);
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });
}
