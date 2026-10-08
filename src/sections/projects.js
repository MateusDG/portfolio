import gsap from 'gsap';
import { $, $$, el } from '../lib/dom.js';
import { motionOn } from '../lib/motion.js';

const PROJECTS = [
  {
    name: 'Kouzina Club', kind: 'profissional · desde out/2023', cat: 'profissional', icon: '▦', color: 'coral', wide: true,
    privateRepo: 'Kouzina Club · e-commerce',
    desc: 'E-commerce de eletrodomésticos de embutir em produção. Sou engenheiro de software e analista de sistemas: do requisito à correção de falha em produção, passando pelo front, pelas APIs e pelo ERP.',
    points: [
      'Interfaces em Angular e TypeScript ligadas a APIs REST e microsserviços em Java e Spring Boot',
      'Rotinas agendadas e em lote com Spring Batch, SQL Server e PostgreSQL',
      'ERP Sankhya: consultas SQL no DBExplorer, dicionário de dados, BI e dashboards',
      'Páginas de marca com SEO, testes, code review e CI/CD',
    ],
    tags: ['Java', 'Spring Boot', 'Angular', 'TypeScript', 'SQL Server', 'Sankhya'], href: 'https://www.kouzinaclub.com.br/',
  },
  {
    name: 'Ziro Code', kind: 'freela · página de vendas', cat: 'profissional', icon: '◩', color: 'green',
    privateRepo: 'Ziro Code · página de vendas',
    desc: 'Página de vendas de uma formação em criação com IA: galeria filtrável, comparação de fotos, grade de 40 aulas e SEO validado a cada build.',
    tags: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'], href: 'https://zirocode.com.br',
  },
  {
    name: 'PlayNexus', kind: 'open source', cat: 'opensource', icon: '▶', color: 'violet',
    desc: 'Launcher no estilo Steam para organizar e iniciar jogos de várias fontes, com uma interface simples.',
    tags: ['Python', 'Desktop'], href: 'https://github.com/MateusDG/PlayNexus',
  },
  {
    name: 'AnoNify', kind: 'projeto em equipe · open source', cat: 'opensource', icon: '◎', color: 'blue',
    desc: 'Chat um a um anônimo: as mensagens trafegam pela rede Tor com criptografia ponta a ponta. Feito em equipe, com backlog, sprints e UML.',
    tags: ['Java', 'Tor', 'Criptografia'], href: 'https://github.com/MateusDG/Anonify1',
  },
  {
    name: 'PDI Cafeicultura', kind: 'processamento de imagens', cat: 'academico', icon: '❋', color: 'green',
    desc: 'Mapeamento de cafezais conilon a partir de fotos de drone: ervas daninhas, vigor das folhas e falhas no plantio, tudo num mapa.',
    tags: ['OpenCV', 'FastAPI', 'React', 'Leaflet'], href: 'https://github.com/MateusDG/pdi-cafezais',
  },
  {
    name: 'SystemConilon', kind: 'projeto final', cat: 'academico', icon: '▤', color: 'amber',
    desc: 'Gestão de propriedades de café: fazendas, talhões, safras, financeiro, estoque e relatórios por período e lote.',
    tags: ['FastAPI', 'React', 'TypeScript'], href: 'https://github.com/MateusDG/coffeeconilon-system',
  },
  {
    name: 'Busca Heurística', kind: 'inteligência artificial', cat: 'academico', icon: '✦', color: 'coral',
    desc: 'A* animado: um agente foge de um laboratório coletando os amigos pelo caminho de menor custo.',
    tags: ['Python', 'A*', 'Tkinter'], href: 'https://github.com/MateusDG/Busca-Heuristica',
  },
  {
    name: 'Grafos · caminho mínimo', kind: 'algoritmos', cat: 'academico', icon: '⌁', color: 'violet',
    desc: 'Trabalho de Algoritmos e Estruturas de Dados III: grafos e o problema do caminho mais curto.',
    tags: ['Python', 'Grafos'], href: 'https://github.com/MateusDG/Grafos-Caminho-Mais-Curto',
  },
];

export function initProjects() {
  const container = $('#cards');
  const cards = PROJECTS.map((p) => {
    const external = p.href.startsWith('http');
    const card = el('a', {
      class: `card${p.wide ? ' card-wide' : ''}`, href: p.href, 'data-cat': p.cat, style: `--c: var(--${p.color})`, 'data-reveal': '',
      ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
    }, [
      el('div', { class: 'card-top' }, [
        el('span', { class: 'card-icon', 'aria-hidden': 'true', text: p.icon }),
        el('span', { class: 'card-kind', html: p.kind + (p.privateRepo ? '<br><span class="lock" data-private="' + p.privateRepo + '">🔒 repositório privado</span>' : '') }),
      ]),
      el('h3', { text: p.name }),
      el('p', { text: p.desc }),
      p.points ? el('ul', { class: 'card-points' }, p.points.map((t) => el('li', { text: t }))) : null,
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
