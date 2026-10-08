import { store } from './dom.js';

const media = matchMedia('(prefers-reduced-motion: reduce)');
const listeners = new Set();
let preference = store.get('md:motion'); // 'on' | 'off' | null (segue o sistema)

export const motionOn = () => (preference ? preference === 'on' : !media.matches);

function apply() {
  document.documentElement.classList.toggle('no-motion', !motionOn());
  listeners.forEach((fn) => fn(motionOn()));
}

export function setMotion(on) {
  preference = on ? 'on' : 'off';
  store.set('md:motion', preference);
  apply();
}

export const onMotionChange = (fn) => listeners.add(fn);

media.addEventListener('change', () => { if (!preference) apply(); });
apply();
