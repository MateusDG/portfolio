import { store } from './dom.js';

// Efeitos opcionais, desligados por padrão. Todo retorno do site também é visual.
let ctx;
let enabled = store.get('md:sound') === 'on';

export const soundOn = () => enabled;
export function setSound(on) {
  enabled = on;
  store.set('md:sound', on ? 'on' : 'off');
  if (on) blip('secret');
}

function tone(freq, start, duration, { type = 'square', volume = 0.04 } = {}) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
  gain.gain.setValueAtTime(volume, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + 0.02);
}

export function blip(kind = 'click') {
  if (!enabled) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    switch (kind) {
      case 'secret': [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.14)); break;
      case 'success': tone(660, 0, 0.09); tone(990, 0.09, 0.16); break;
      case 'error': tone(180, 0, 0.22, { type: 'sawtooth', volume: 0.05 }); break;
      case 'jump': tone(440, 0, 0.06); tone(880, 0.05, 0.08); break;
      case 'key': tone(1400 + Math.random() * 300, 0, 0.012, { volume: 0.015 }); break;
      default: tone(740, 0, 0.04, { volume: 0.03 });
    }
  } catch { /* áudio indisponível */ }
}
