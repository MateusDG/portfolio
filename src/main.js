import '@fontsource-variable/doto/full.css';
import '@fontsource-variable/jetbrains-mono';
import './styles/base.css';
import './styles/sections.css';
import './styles/widgets.css';

import { $, fmt } from './lib/dom.js';
import { motionOn, setMotion, onMotionChange } from './lib/motion.js';
import { soundOn, setSound, blip } from './lib/sound.js';
import { render as renderSecrets, resetSecrets } from './lib/secrets.js';
import { toast } from './lib/toast.js';
import { initSmooth, lenis, scrollToTarget } from './lib/smooth.js';
import { initReveal } from './lib/reveal.js';
import { initNav } from './lib/nav.js';
import { initCursor } from './lib/cursor.js';
import { runBoot } from './sections/intro.js';
import { initHero } from './sections/hero.js';
import { initBit } from './sections/bit.js';
import { initBanvic } from './sections/banvic.js';
import { initFuzzyLab } from './sections/fuzzylab.js';
import { initProjects, decorateProjects } from './sections/projects.js';
import { initAbout } from './sections/about.js';
import { initContrib } from './sections/contrib.js';
import { initCases } from './sections/cases.js';
import { initTerminal } from './sections/terminal.js';
import { initEggs } from './sections/eggs.js';

const EMAIL = 'mateusdinizgo@hotmail.com';
let github = null;
const githubReady = fetch(`${import.meta.env.BASE_URL}data/github.json`)
  .then((r) => (r.ok ? r.json() : null))
  .then((data) => { github = data; return data; })
  .catch(() => null);

renderSecrets();
const hero = initHero();
initBit(hero);
initNav();
initSmooth();
initCursor();
initProjects();
initBanvic();
initFuzzyLab();
initAbout();
initCases();
initTerminal(() => github);
initEggs();

const booted = runBoot(() => github?.totals?.all);
initReveal(booted);

githubReady.then((data) => {
  if (!data) {
    $('#github').querySelector('.voxels').innerHTML = '<p class="data-note" style="padding:24px">Os dados de contribuição não carregaram. <a href="https://github.com/MateusDG">Ver no GitHub ↗</a></p>';
    return;
  }
  const num = $('#num-contrib');
  num.dataset.count = data.totals.all;
  if (num.textContent !== '0') num.textContent = fmt(data.totals.all);
  const tcc = data.repos.find((r) => r.name.startsWith('TCC'));
  if (tcc) $('#tcc-commits').textContent = tcc.commits;
  decorateProjects(data);
  initContrib(data);
});

booted.then(() => {
  hero.start();
  const id = location.hash.slice(1);
  const target = id && document.getElementById(id);
  if (target && id !== 'top') setTimeout(() => scrollToTarget(target), 300);
});

// Controles flutuantes ------------------------------------------------------
const soundToggle = $('#sound-toggle');
const motionToggle = $('#motion-toggle');
function syncToggles() {
  soundToggle.setAttribute('aria-pressed', String(soundOn()));
  soundToggle.lastChild.textContent = soundOn() ? 'som on' : 'som off';
  motionToggle.setAttribute('aria-pressed', String(motionOn()));
  motionToggle.lastChild.textContent = motionOn() ? 'movimento on' : 'movimento off';
}
soundToggle.addEventListener('click', () => { setSound(!soundOn()); syncToggles(); });
motionToggle.addEventListener('click', () => {
  setMotion(!motionOn());
  syncToggles();
  toast(motionOn() ? 'Animações ligadas.' : 'Animações pausadas. A preferência fica salva neste navegador.');
});
onMotionChange(syncToggles);
syncToggles();

// Segredos ------------------------------------------------------------------
const secretsDialog = $('#secrets-dialog');
$('#secrets-btn').addEventListener('click', () => {
  renderSecrets();
  secretsDialog.showModal();
  lenis?.stop();
});
const resetButton = $('#secrets-reset');
let confirmReset = false;
resetButton.addEventListener('click', () => {
  if (!confirmReset) {
    confirmReset = true;
    resetButton.textContent = 'clique de novo para confirmar';
    setTimeout(() => { confirmReset = false; resetButton.textContent = 'zerar progresso'; }, 3000);
    return;
  }
  resetSecrets();
  confirmReset = false;
  resetButton.textContent = 'zerar progresso';
});

// E-mail --------------------------------------------------------------------
const emailButton = $('#copy-email');
emailButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(EMAIL);
    blip('success');
    emailButton.classList.add('is-copied');
    $('#copy-label').textContent = 'copiado ✓';
    toast('E-mail copiado. Até já!');
    setTimeout(() => { emailButton.classList.remove('is-copied'); $('#copy-label').textContent = 'copiar'; }, 2400);
  } catch {
    location.href = `mailto:${EMAIL}`;
  }
});

// Cartão de status do hero ----------------------------------------------------
const clock = $('#hc-clock');
const tickClock = () => {
  const time = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
  clock.textContent = `João Monlevade · ${time}`;
};
tickClock();
setInterval(tickClock, 20000);
hero.onMu((mu) => { $('#hc-mu').textContent = mu.toFixed(2); });
githubReady.then((data) => {
  const last = data && [...data.days].reverse().find((d) => d.pub + d.prv > 0);
  if (!last) return;
  // Relativo a hoje (não à data da coleta), para não parecer mais recente do que é.
  const days = Math.floor((Date.now() - new Date(`${last.d}T00:00:00-03:00`)) / 86400000);
  $('#hc-last').textContent = days <= 0 ? 'hoje' : days === 1 ? 'ontem' : `há ${days} dias`;
});

// Tempo de execução do "pipeline" no rodapé
const uptime = $('#uptime');
const startedAt = Date.now();
setInterval(() => {
  const s = Math.floor((Date.now() - startedAt) / 1000);
  uptime.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}, 1000);
