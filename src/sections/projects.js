import gsap from 'gsap';
import { $, $$, el } from '../lib/dom.js';
import { motionOn } from '../lib/motion.js';

const PROJECTS = [
  {
    name: 'Kouzina Club', kind: 'profissional · desde 2023', cat: 'produto', icon: '▦', color: 'coral', privateRepo: 'Kouzina Club · e-commerce',
    desc: 'E-commerce de eletrodomésticos de embutir em produção. Interfaces, APIs REST, microsserviços, rotinas em lote, páginas de marca com SEO e investigação de falhas.',
    tags: ['Java', 'Spring Boot', 'Angular', 'SQL Server'], href: 'https://www.kouzinaclub.com.br/',
  },
  {
    name: 'Kouzina Reco', kind: 'MVP · open source', cat: 'dados', icon: '⌘', color: 'violet',
    desc: 'O lado comercial do TCC: API FastAPI de recomendações, eventos em PostgreSQL, ingestão do catálogo e um widget em JavaScript puro.',
    tags: ['FastAPI', 'PostgreSQL', 'JavaScript', 'Docker'], href: 'https://github.com/MateusDG/saas-fuzzy',
  },
  {
    name: 'PDI Cafeicultura', kind: 'visão computacional', cat: 'dados', icon: '❋', color: 'green',
    desc: 'Mapeamento de cafezais conilon a partir de fotos de drone: ervas daninhas, vigor das folhas e falhas no plantio, tudo num mapa.',
    tags: ['OpenCV', 'FastAPI', 'React', 'Leaflet'], href: 'https://github.com/MateusDG/pdi-cafezais',
  },
  {
    name: 'Corretor rural · ES', kind: 'site para cliente', cat: 'produto', icon: '⌂', color: 'green',
    desc: 'Site estático para um corretor de imóveis rurais. A tese: não vender imóveis, vender o critério de quem os seleciona.',
    tags: ['Astro', 'CSS', 'GitHub Actions'], href: 'https://github.com/MateusDG/landing-page-paulo',
  },
  {
    name: 'Bem de Hoje', kind: 'página de produto', cat: 'produto', icon: '◍', color: 'coral',
    desc: 'Página de produto em Next.js com checkout integrado da InfinitePay, confirmação de pagamento pela API e por webhook.',
    tags: ['Next.js', 'React', 'TypeScript', 'Webhooks'], href: 'https://github.com/MateusDG/bem-estar',
  },
  {
    name: 'SystemConilon', kind: 'projeto acadêmico', cat: 'academico', icon: '▤', color: 'amber',
    desc: 'Gestão de propriedades de café: fazendas, talhões, safras, financeiro, estoque e relatórios por período e lote.',
    tags: ['FastAPI', 'React', 'TypeScript'], href: 'https://github.com/MateusDG/coffeeconilon-system',
  },
  {
    name: 'Busca Heurística', kind: 'inteligência artificial', cat: 'academico', icon: '✦', color: 'blue',
    desc: 'A* animado: um agente foge de um laboratório coletando os amigos pelo caminho de menor custo.',
    tags: ['Python', 'A*', 'Tkinter'], href: 'https://github.com/MateusDG/Busca-Heuristica',
  },
  {
    name: 'PlayNexus', kind: 'open source', cat: 'produto', icon: '▶', color: 'violet',
    desc: 'Launcher no estilo Steam para organizar e iniciar jogos de várias fontes, com uma interface simples.',
    tags: ['Python', 'Desktop'], href: 'https://github.com/MateusDG/PlayNexus',
  },
  {
    name: 'Grafos · caminho mínimo', kind: 'algoritmos', cat: 'academico', icon: '⌁', color: 'amber',
    desc: 'Trabalho de Algoritmos e Estruturas de Dados III: grafos e o problema do caminho mais curto.',
    tags: ['Python', 'Grafos'], href: 'https://github.com/MateusDG/Grafos-Caminho-Mais-Curto',
  },
];

export function initProjects() {
  const container = $('#cards');
  const cards = PROJECTS.map((p) => {
    const external = p.href.startsWith('http');
    const card = el('a', {
      class: 'card', href: p.href, 'data-cat': p.cat, style: `--c: var(--${p.color})`, 'data-reveal': '',
      ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
    }, [
      el('div', { class: 'card-top' }, [
        el('span', { class: 'card-icon', 'aria-hidden': 'true', text: p.icon }),
        el('span', { class: 'card-kind', html: p.kind + (p.privateRepo ? '<br><span class="lock" data-private="' + p.privateRepo + '">🔒 repositório privado</span>' : '') }),
      ]),
      el('h3', { text: p.name }),
      el('p', { text: p.desc }),
      el('ul', { class: 'tags', 'aria-label': 'Tecnologias' }, p.tags.map((t) => el('li', { text: t }))),
      el('span', { class: 'card-go', 'aria-hidden': 'true', text: '↗' }),
      external ? el('span', { class: 'sr-only', text: ' (nova aba)' }) : null,
    ]);
    return card;
  });
  container.replaceChildren(...cards);

  // Inclinação 3D + holofote que segue o cursor
  if (matchMedia('(hover: hover)').matches) {
    for (const card of cards) {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
        if (motionOn()) gsap.to(card, { rotateY: (x - 0.5) * 8, rotateX: (0.5 - y) * 6, transformPerspective: 900, duration: 0.5, ease: 'power3.out' });
      });
      card.addEventListener('pointerleave', () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' }));
    }
  }

  const buttons = $$('[data-filter]');
  buttons.forEach((button) => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    const show = cards.filter((c) => filter === 'all' || c.dataset.cat === filter);
    const hide = cards.filter((c) => !show.includes(c));
    if (!motionOn()) {
      hide.forEach((c) => { c.hidden = true; });
      show.forEach((c) => { c.hidden = false; c.style.opacity = 1; });
      return;
    }
    const reveal = () => {
      hide.forEach((c) => { c.hidden = true; });
      show.forEach((c) => { c.hidden = false; });
      gsap.fromTo(show, { opacity: 0, y: 18, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.05, ease: 'power3.out' });
    };
    if (hide.length) gsap.to(hide, { opacity: 0, scale: 0.96, duration: 0.25, ease: 'power2.in', onComplete: reveal });
    else reveal();
  }));
}

// Mostra os commits reais do repositório privado no card correspondente.
export function decorateProjects(github) {
  for (const lock of $$('[data-private]')) {
    const repo = github?.repos?.find((r) => r.name === lock.dataset.private);
    if (repo) lock.textContent = `🔒 ${repo.commits} commits privados no último ano`;
  }
}
