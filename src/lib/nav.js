import { $, $$ } from './dom.js';

export function initNav() {
  const header = $('#header');
  const nav = $('#nav');
  const toggle = $('#menu-toggle');
  const links = $$('[data-nav]');
  const steps = $$('.dag-progress i');
  const ids = links.map((a) => a.dataset.nav);
  let lastY = scrollY;

  addEventListener('scroll', () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 20);
    const hide = y > innerHeight * 0.9 && y > lastY + 4 && !nav.classList.contains('is-open');
    if (hide) header.classList.add('is-hidden');
    else if (y < lastY - 4) header.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });

  // Seção atual = "running"; anteriores = "success", como tarefas de um DAG.
  const sections = ids.map((id) => document.getElementById(id));
  // Posições absolutas em cache: a rolagem só compara números, sem forçar layout.
  let tops = [];
  const measure = () => { tops = sections.map((s) => s.getBoundingClientRect().top + scrollY); };
  new ResizeObserver(() => { measure(); update(); }).observe(document.body);
  let queued = false;
  function update() {
    queued = false;
    const mark = scrollY + innerHeight * 0.35;
    let current = -1;
    tops.forEach((top, i) => { if (top <= mark) current = i; });
    links.forEach((a, i) => a.classList.toggle('is-active', i === current));
    steps.forEach((s, i) => {
      s.classList.toggle('is-done', i < current);
      s.classList.toggle('is-running', i === current);
    });
  }
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  measure();
  update();

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
}
