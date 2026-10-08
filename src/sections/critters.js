import { $, $$, el, clamp, onVisible } from '../lib/dom.js';
import { motionOn, onMotionChange } from '../lib/motion.js';
import { discover, SECRETS } from '../lib/secrets.js';
import { blip } from '../lib/sound.js';

/*
 * O terrário do hero. Cada bicho tem seu jeito:
 * - Bit: o cubo de dados. Passeia, pula o pato, caça bugs, dorme se ficar sozinho.
 * - Pato de borracha: o colega de debugging. Cada quack é uma dica.
 * - Fuzz: a criatura difusa. Fica mais felpuda quanto menor o μ.
 * - Bug: aparece de vez em quando. Clique para corrigir (o Bit também ajuda).
 * - Servidor: a casa do Bit. Clique para fazer um deploy.
 */
const BIT_PHRASES = [
  'oi! eu sou o Bit.',
  'não sou 0 nem 1. sou fuzzy.',
  'já apertou o trigger do DAG?',
  `psiu… tem ${SECRETS.length} segredos por aqui`,
  'digita help no terminal lá embaixo',
  '↑ ↑ ↓ ↓ ← → ← → B A',
  'o Fuzz é meu primo distante',
  'se aparecer um bug, eu pego!',
];
const DUCK_TIPS = [
  'quack. já tentou explicar o problema em voz alta?',
  'quack. leu a mensagem de erro inteira?',
  'quack. o bug está na linha que você jura que está certa.',
  'quack. é cache. quase sempre é cache.',
  'quack. funciona na minha máquina.',
  'quack. commit pequeno, rollback fácil.',
  'quack. já reiniciou?',
];
const FUZZ_PHRASES = [
  'sou 0,7 gato e 0,3 nuvem.',
  'nem 0 nem 1: sou um talvez.',
  'μ baixo me deixa felpudo.',
  'pertenço um pouco a tudo.',
  'conjunto difuso, prazer.',
];
const SPEED = { walk: 44, chase: 120, bug: 150, fuzz: 26 };

// Um balão por vez: quem fala por último ganha a vez (evita balões sobrepostos).
let speaking = null;
function bubble(node, live) {
  let timer;
  node.setAttribute('aria-hidden', 'true');
  node.removeAttribute('aria-live');
  return (text, ms = 2600) => {
    if (speaking && speaking !== node) speaking.classList.remove('is-on');
    speaking = node;
    node.textContent = text;
    live.textContent = text;
    node.classList.add('is-on');
    clearTimeout(timer);
    timer = setTimeout(() => node.classList.remove('is-on'), ms);
  };
}

// transform direto: mudar uma variável CSS por quadro invalidaria o estilo de todos os descendentes.
const place = (node, x, y = 0) => { node.style.transform = `translate3d(${x.toFixed(1)}px, ${(-y).toFixed(1)}px, 0)`; };
const setVar = (node, name, value) => {
  const v = String(value);
  if (node.dataset[name] === v) return;
  node.dataset[name] = v;
  node.style.setProperty(`--${name}`, v);
};

function restart(node, cls) {
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
}

export function initCritters(hero) {
  const ground = $('#ground');
  const bit = $('#bit');
  const duck = $('#duck');
  const fuzz = $('#fuzz');
  const bug = $('#bug');
  const home = $('#home');
  const hud = $('#ground-hud');
  const bitHit = $('.hit', bit);
  const live = $('#ground-live');
  const say = {
    bit: bubble($('#bit-say'), live),
    duck: bubble(duck.querySelector('.say'), live),
    fuzz: bubble(fuzz.querySelector('.say'), live),
    home: bubble(home.querySelector('.say'), live),
  };

  const state = {
    width: ground.clientWidth,
    left: ground.getBoundingClientRect().left,
    bit: { x: 120, dir: 1, pause: 0, sleeping: false, clicks: 0, phrase: 0, jumpUntil: 0 },
    duck: { x: 0, quacks: 0 },
    fuzz: { x: 0, target: 0, t: Math.random() * 10, burst: 0, phrase: 0 },
    bug: { active: false, x: 0, dir: 1, pause: 0, next: 9 },
    fixed: 0,
    userFixed: 0,
    deploys: 0,
    mu: hero.getMu(),
    lastActivity: performance.now(),
    pointerX: null,
  };

  const homeRight = () => home.offsetLeft + home.offsetWidth + 8;
  const bitMax = () => state.width - bit.offsetWidth;

  function layout() {
    state.width = ground.clientWidth;
    state.left = ground.getBoundingClientRect().left;
    state.duck.x = Math.round(state.width * (state.width < 520 ? 0.78 : 0.7));
    place(duck, state.duck.x);
    state.bit.x = clamp(state.bit.x, homeRight(), bitMax());
    if (!state.fuzz.x) state.fuzz.x = state.fuzz.target = state.width * 0.45;
  }

  // ---------------------------------------------------------------- Bit
  function jump(node) { restart(node, 'is-jumping'); }

  function sleep() {
    state.bit.sleeping = true;
    bit.classList.add('is-sleeping');
    bit.classList.remove('is-walking');
    bitHit.setAttribute('aria-label', 'Bit está dormindo. Clique para acordá-lo');
  }

  bit.addEventListener('click', () => {
    const b = state.bit;
    if (b.sleeping) {
      b.sleeping = false;
      bit.classList.remove('is-sleeping');
      bitHit.setAttribute('aria-label', 'Bit, o mascote. Clique para ele pular');
      say.bit('hã?! eu só tava compilando…');
      discover('bit-sono');
      state.lastActivity = performance.now();
      return;
    }
    jump(bit);
    blip('jump');
    say.bit(BIT_PHRASES[b.phrase++ % BIT_PHRASES.length]);
    b.clicks += 1;
    if (b.clicks === 5 && discover('bit-pulo')) say.bit('ok, agora somos amigos ♥', 3200);
  });

  // ---------------------------------------------------------------- Pato
  duck.addEventListener('click', () => {
    const d = state.duck;
    restart(duck, 'is-squeak');
    blip('jump');
    d.quacks += 1;
    if (d.quacks === 3) {
      say.duck('quack! viu? você resolveu sozinho.', 3200);
      discover('pato');
    } else {
      say.duck(DUCK_TIPS[(d.quacks - 1) % DUCK_TIPS.length], 3200);
    }
  });

  // ---------------------------------------------------------------- Fuzz
  const bits = $$('.fuzz-bits i', fuzz);
  const angles = bits.map((_, i) => (i / bits.length) * Math.PI * 2 + Math.random() * 0.4);
  fuzz.addEventListener('click', () => {
    state.fuzz.burst = 1;
    blip();
    say.fuzz(FUZZ_PHRASES[state.fuzz.phrase++ % FUZZ_PHRASES.length]);
  });
  hero.onMu((mu) => {
    state.mu = mu;
    if (mu < 0.25 && !state.dizzy) { state.dizzy = true; say.bit('tô ficando tonto…'); say.fuzz('aaah, que delícia de μ!'); }
    if (mu > 0.6) state.dizzy = false;
    if (!running) draw(0);
  });

  // ---------------------------------------------------------------- Bug
  function squash(byUser) {
    const g = state.bug;
    if (!g.active || bug.classList.contains('is-squashed')) return;
    bug.classList.add('is-squashed');
    blip('success');
    state.fixed += 1;
    hud.hidden = false;
    hud.textContent = `bugs corrigidos: ${state.fixed}`;
    const pop = el('span', { class: 'fix-pop', text: '✓ fix', style: `--x:${g.x}px` });
    ground.append(pop);
    setTimeout(() => pop.remove(), 900);
    setTimeout(() => { g.active = false; bug.hidden = true; bug.classList.remove('is-squashed'); g.next = 14 + Math.random() * 16; }, 650);
    if (byUser) {
      state.userFixed += 1;
      if (state.userFixed === 3 && discover('bug')) say.bit('3 bugs! você é do time de QA?', 3200);
      else say.bit('valeu pela ajuda!');
    } else {
      say.bit('peguei! bug corrigido ✓');
    }
  }
  bug.addEventListener('click', () => squash(true));

  function spawnBug() {
    const g = state.bug;
    g.active = true;
    g.dir = Math.random() < 0.5 ? 1 : -1;
    g.x = g.dir > 0 ? -30 : state.width + 10;
    g.pause = 0;
    bug.hidden = false;
    setVar(bug, 'dir', g.dir);
    if (!state.bit.sleeping) say.bit(Math.random() < 0.5 ? 'um bug! 🐛' : 'bug em produção!', 1800);
  }

  // ---------------------------------------------------------------- Servidor
  home.addEventListener('click', () => {
    state.deploys += 1;
    restart(home, 'is-deploying');
    blip('success');
    const friday = new Date().getDay() === 5;
    say.home(friday ? 'deploy na sexta-feira? coragem. 😬' : `deploy feito ✓ v1.0.${state.deploys}`, 3000);
    for (const node of [bit, duck, fuzz]) setTimeout(() => jump(node), Math.random() * 250);
    for (let i = 0; i < 10; i++) {
      const p = el('span', { class: 'deploy-px', style: `--x:${home.offsetLeft + 6 + Math.random() * 24}px;--dx:${(Math.random() - 0.5) * 60}px;--d:${Math.random() * 0.3}s` });
      ground.append(p);
      setTimeout(() => p.remove(), 1400);
    }
    discover('deploy');
  });

  // ---------------------------------------------------------------- Loop
  for (const type of ['pointermove', 'keydown', 'scroll', 'touchstart']) {
    addEventListener(type, (e) => {
      state.lastActivity = performance.now();
      if (type === 'pointermove') state.pointerX = e.clientX;
    }, { passive: true });
  }

  function draw(dt) {
    const now = performance.now();
    const animated = motionOn() && dt > 0;
    const b = state.bit;
    const g = state.bug;
    const f = state.fuzz;

    // Bit
    if (!b.sleeping && now - state.lastActivity > 24000) sleep();
    let walking = false;
    if (animated && !b.sleeping) {
      const chasing = g.active && !bug.classList.contains('is-squashed') && Math.abs(g.x - b.x) < 320;
      if (chasing) {
        b.dir = g.x > b.x ? 1 : -1;
        b.x += b.dir * SPEED.chase * dt;
        walking = true;
        if (Math.abs(g.x - b.x) < 16) squash(false);
      } else if (b.pause > 0) {
        b.pause -= dt;
      } else {
        b.x += b.dir * SPEED.walk * dt;
        walking = true;
        if (Math.random() < 0.18 * dt) b.pause = 1 + Math.random() * 2.4;
        if (Math.random() < 0.08 * dt) b.dir *= -1;
      }
      const min = homeRight();
      const max = bitMax();
      if (b.x <= min || b.x >= max) { b.dir = b.x <= min ? 1 : -1; b.x = clamp(b.x, min, max); }
      // Pula o pato no caminho
      const toDuck = state.duck.x + 21 - (b.x + 21);
      if (walking && Math.abs(toDuck) < 34 && Math.sign(toDuck) === b.dir && now > b.jumpUntil) {
        jump(bit);
        b.jumpUntil = now + 900;
      }
    }
    bit.classList.toggle('is-walking', walking);
    place(bit, b.x);
    setVar(bit, 'dir', b.dir);
    // Os olhos acompanham o cursor
    if (state.pointerX !== null && !b.sleeping) {
      const screenX = state.left + b.x + 21;
      const look = clamp((state.pointerX - screenX) / 300, -1, 1) * b.dir;
      setVar(bit, 'look', `${(look * 0.9).toFixed(1)}px`);
    }

    // Bug
    if (animated) {
      if (!g.active) {
        g.next -= dt;
        if (g.next <= 0) spawnBug();
      } else if (!bug.classList.contains('is-squashed')) {
        if (g.pause > 0) g.pause -= dt;
        else {
          g.x += g.dir * SPEED.bug * dt;
          if (Math.random() < 0.6 * dt) g.pause = 0.2 + Math.random() * 0.5;
        }
        if (g.x < -40 || g.x > state.width + 20) { g.active = false; bug.hidden = true; g.next = 12 + Math.random() * 14; }
      }
    }
    if (g.active) place(bug, g.x);

    // Fuzz: flutua, passeia devagar e fica mais felpudo com μ baixo
    f.t += dt;
    if (animated) {
      if (Math.abs(f.target - f.x) < 4 || Math.random() < 0.05 * dt) f.target = 40 + Math.random() * (state.width - 120);
      f.x += clamp(f.target - f.x, -1, 1) * SPEED.fuzz * dt;
    }
    f.burst = Math.max(0, f.burst - dt * 1.4);
    const fuzziness = clamp(1 - state.mu);
    const y = 30 + Math.sin(f.t * 1.6) * (animated ? 6 : 0);
    place(fuzz, f.x, y);
    setVar(fuzz, 'f', fuzziness.toFixed(2));
    const radius = 9 + fuzziness * 22 + f.burst * 26;
    // Com μ alto e sem explosão as partículas ficam invisíveis: nada a atualizar.
    const shown = fuzziness > 0.12 || f.burst > 0;
    if (!shown && !f.bitsShown) return;
    f.bitsShown = shown;
    bits.forEach((node, i) => {
      const wobble = animated ? Math.sin(f.t * (1.3 + i * 0.17) + i) * (2 + fuzziness * 6) : 0;
      const a = angles[i] + (animated ? f.t * 0.25 : 0);
      const r = radius + wobble;
      node.style.transform = `translate(${(Math.cos(a) * r).toFixed(1)}px, ${(Math.sin(a) * r).toFixed(1)}px)`;
      node.style.opacity = clamp((fuzziness - 0.12) * 3 + f.burst).toFixed(2);
    });
  }

  let running = false;
  let visible = false;
  let last = 0;
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    draw(dt);
    requestAnimationFrame(frame);
  }
  function update() {
    const should = visible && !document.hidden && motionOn();
    ground.classList.toggle('is-paused', !visible || document.hidden);
    if (should && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    if (!should) { running = false; draw(0); }
  }
  onVisible(ground, (isIn) => { visible = isIn; update(); });
  document.addEventListener('visibilitychange', update);
  onMotionChange(update);
  addEventListener('resize', () => { layout(); if (!running) draw(0); });

  // Festa no modo Konami
  new MutationObserver(() => ground.classList.toggle('is-party', document.documentElement.classList.contains('is-crt')))
    .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  layout();
  draw(0);
  setTimeout(() => say.bit(BIT_PHRASES[state.bit.phrase++]), 2400);
  setTimeout(() => say.duck('quack.', 1600), 4200);
  return { update };
}
