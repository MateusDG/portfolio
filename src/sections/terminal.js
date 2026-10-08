import { $, $$, el, fmt } from '../lib/dom.js';
import { discover, foundCount, SECRETS } from '../lib/secrets.js';
import { blip } from '../lib/sound.js';
import { scrollToTarget } from '../lib/smooth.js';
import { setTheme, matrixRain, crash } from './eggs.js';

const EMAIL = 'mateusdinizgo@hotmail.com';
const LINKS = {
  github: ['@MateusDG no GitHub', 'https://github.com/MateusDG'],
  linkedin: ['/in/mateusdg no LinkedIn', 'https://www.linkedin.com/in/mateusdg/'],
  whatsapp: ['conversar no WhatsApp', 'https://wa.me/5527998619377'],
  email: [EMAIL, `mailto:${EMAIL}`],
};
const COFFEE = String.raw`
   ( (
    ) )
  ........
  |      |]
  \      /
   '----'`;

export function initTerminal(getGithub) {
  const out = $('#terminal-out');
  const body = $('#terminal-body');
  const form = $('#terminal-form');
  const input = $('#terminal-input');
  const history = [];
  let cursor = 0;

  const scroll = () => { body.scrollTop = body.scrollHeight; };
  function print(content, cls = '') {
    const p = el('p', { class: cls });
    if (typeof content === 'string') p.innerHTML = content;
    else p.append(...[].concat(content));
    out.append(p);
    while (out.childElementCount > 80) out.firstElementChild.remove();
    scroll();
    return p;
  }
  const link = (label, href) => {
    const a = el('a', { href, text: label });
    if (href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    return a;
  };
  const links = (...keys) => {
    const nodes = [];
    keys.forEach((k, i) => { if (i) nodes.push(document.createTextNode('  ·  ')); nodes.push(link(...LINKS[k])); });
    print(nodes);
  };
  const go = (id) => { const t = document.getElementById(id); if (t) scrollToTarget(t); };

  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'boa madrugada, dev noturno' : hour < 12 ? 'bom dia' : hour < 18 ? 'boa tarde' : 'boa noite';
  print(`<span class="t-green">${greeting}.</span> este é o terminal do Mateus.`);
  print('digite <span class="t-amber">help</span> para ver os comandos, ou use os atalhos abaixo.');

  const COMMANDS = {
    help: () => {
      print([
        '<span class="t-dim">navegação</span>   sobre · projetos · banvic · tcc · github · agora',
        '<span class="t-dim">contato</span>     contato · email · linkedin · whatsapp',
        '<span class="t-dim">info</span>        stack · whoami · ls · cat · date · uptime · segredos',
        '<span class="t-dim">sistema</span>     clear · history · theme [dark|light] · echo',
        '<span class="t-dim">?</span>           alguns comandos não estão listados. 😉',
      ].join('\n'));
    },
    sobre: () => { print('Mateus Diniz Gottardi · engenheiro de software full stack na Kouzina desde 2023 · Sistemas de Informação na UFOP (dez/2026) · TCC em recomendação com ontologias fuzzy.'); go('sobre'); },
    projetos: () => {
      print([link('BanVic', '#banvic'), document.createTextNode('  ·  '), link('TCC fuzzy', '#tcc'), document.createTextNode('  ·  '), link('outros projetos', '#mais')]);
    },
    banvic: () => { print('<span class="t-green">BanVic</span>: 7 tabelas, 76.206 linhas reconciliadas, publicação transacional. role até lá e aperte o trigger.'); go('banvic'); },
    tcc: () => { print('<span class="t-coral">TCC</span>: ontologia + Mamdani (15 regras + R00) + ranking híbrido explicável.'); go('tcc'); },
    github: () => {
      const g = getGithub();
      if (g) print(`<span class="t-green">${fmt(g.totals.all)}</span> contribuições no último ano: ${fmt(g.totals.public)} públicas + <span class="t-coral">${fmt(g.totals.private)} privadas</span>.`);
      links('github');
    },
    agora: () => go('agora'),
    contato: () => { print('bora conversar sobre software, dados ou aquela ideia parada no papel.'); links('email', 'linkedin', 'whatsapp'); },
    email: () => links('email'),
    linkedin: () => links('linkedin'),
    whatsapp: () => links('whatsapp'),
    stack: () => print([
      '<span class="t-violet">backend</span>   Java · Spring Boot · Spring Batch · REST',
      '<span class="t-violet">frontend</span>  Angular · React · Next.js · TypeScript',
      '<span class="t-violet">dados</span>     Python · SQL · PostgreSQL · Airflow · Meltano · Power BI',
      '<span class="t-violet">infra</span>     Docker · Kubernetes · Terraform · AWS · CI/CD',
      '<span class="t-violet">pesquisa</span>  ontologias · lógica fuzzy · recomendação',
    ].join('\n')),
    whoami: () => print('guest. mas com μ = 0.92 de chance de virar colega de projeto.'),
    ls: () => print('<span class="t-violet">projetos/</span>  <span class="t-violet">tcc/</span>  sobre.txt  contato.txt  curriculo.pdf  <span class="t-dim">.segredos</span>'),
    cat: (arg) => {
      if (arg === 'sobre.txt') return COMMANDS.sobre();
      if (arg === 'contato.txt') return COMMANDS.contato();
      if (arg === 'curriculo.pdf') return print('arquivo binário. melhor pedir por e-mail: ' + EMAIL);
      if (arg === '.segredos') return COMMANDS.segredos();
      print(arg ? `cat: ${arg}: arquivo não encontrado` : 'uso: cat <arquivo>  (tente ls)');
    },
    date: () => print(new Date().toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })),
    uptime: () => print(`página aberta há ${$('#uptime').textContent}. nenhum erro registrado.`),
    pwd: () => print('/home/guest/mateus.diniz'),
    history: () => print(history.map((h, i) => `${String(i + 1).padStart(3)}  ${h}`).join('\n') || '(vazio)'),
    echo: (arg) => print(arg ? arg.replace(/</g, '&lt;') : ''),
    segredos: () => {
      print(`<span class="t-amber">${foundCount()}/${SECRETS.length}</span> segredos encontrados.`);
      $('#secrets-btn').click();
    },
    theme: (arg) => {
      const next = arg === 'light' || arg === 'claro' ? 'light' : arg === 'dark' || arg === 'escuro' ? 'dark' : null;
      if (!next) return print('uso: theme dark | theme light');
      setTheme(next);
      print(next === 'light' ? 'luzes acesas. ☀ (theme dark para voltar)' : 'de volta ao escuro, onde os devs vivem.');
      if (next === 'light') discover('luz');
    },
    // --- não listados ---
    sudo: (arg) => {
      if (/^(hire|contratar)/.test(arg) || arg.includes('mateus')) {
        print('<span class="t-green">[sudo]</span> permissão concedida. iniciando processo de contratação…');
        print('▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%');
        links('email', 'linkedin');
      } else {
        print(`<span class="t-coral">guest não está no arquivo sudoers.</span> este incidente será reportado. (tente: sudo contratar mateus)`);
      }
      discover('sudo');
    },
    cafe: () => { print(COFFEE, 't-ascii'); print('☕ café passado. compilando ideias…'); discover('cafe'); },
    matrix: () => { print('<span class="t-green">wake up, guest…</span> (clique ou aperte esc para sair)'); matrixRain(); discover('matrix'); },
    rm: (arg) => {
      if (/^-[rf]{1,2}/.test(arg)) { crash(); discover('rm'); }
      else print('rm: o que exatamente você quer apagar? 🤨');
    },
    fuzzy: () => { document.documentElement.classList.remove('is-fuzzy'); void document.body.offsetWidth; document.documentElement.classList.add('is-fuzzy'); discover('fuzzy'); print('tudo é questão de grau.'); },
    exit: () => print('não tem saída. só o <a href="#contato">contato</a>. 🙂'),
    ping: () => print('PONG · 64 bytes de mateus.diniz: tempo=0.42 ms'),
    git: (arg) => print(arg.startsWith('log')
      ? '<span class="t-amber">* 2026-12</span> formatura (agendado)\n<span class="t-amber">* 2026-10</span> BanVic validado\n<span class="t-amber">* 2026-07</span> TCC protótipo F1–F8\n<span class="t-amber">* 2023-10</span> entra na Kouzina'
      : `git: '${arg || ''}' não é um comando git. tente git log`),
    hello: () => print('olá! 👋 que bom ter você por aqui.'),
    42: () => print('a resposta. mas qual era a pergunta?'),
    vim: () => print('você entrou no vim. para sair: <span class="t-amber">:q!</span> … brincadeira, aqui é seguro.'),
    konami: () => print('↑ ↑ ↓ ↓ ← → ← → B A  (fora do terminal)'),
    bit: () => print('o Bit mora no chão do topo da página. ele dorme se você deixar ele sozinho.'),
  };
  const ALIASES = {
    about: 'sobre', projects: 'projetos', contact: 'contato', ajuda: 'help', '?': 'help', skills: 'stack', coffee: 'cafe', 'café': 'cafe',
    secrets: 'segredos', oi: 'hello', 'olá': 'hello', ola: 'hello', hi: 'hello', quit: 'exit', sair: 'exit', tema: 'theme', now: 'agora', limpar: 'clear',
  };

  function run(raw) {
    const line = raw.trim();
    if (!line) return;
    history.push(line);
    cursor = history.length;
    const [first, ...rest] = line.split(/\s+/);
    const name = ALIASES[first.toLowerCase()] || first.toLowerCase();
    const arg = rest.join(' ');
    if (name === 'clear') { out.replaceChildren(); return; }
    print(`<span class="t-green">guest</span> ~ $ <b>${line.replace(/</g, '&lt;')}</b>`, 'cmd');
    const command = COMMANDS[name];
    if (command) { blip(); command(name === 'echo' ? arg : arg.toLowerCase().trim()); }
    else { blip('error'); print(`comando não encontrado: ${first.replace(/</g, '&lt;')}. digite <span class="t-amber">help</span>.`); }
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); run(input.value); input.value = ''; });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && history.length) { e.preventDefault(); cursor = Math.max(0, cursor - 1); input.value = history[cursor]; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); cursor = Math.min(history.length, cursor + 1); input.value = history[cursor] || ''; }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const matches = Object.keys(COMMANDS).filter((c) => c.startsWith(input.value.toLowerCase()) && !['sudo', 'rm', 'matrix', 'cafe', 'fuzzy', 'vim', '42'].includes(c));
      if (matches.length === 1) input.value = matches[0];
      else if (matches.length > 1) print(matches.join('  '), 't-dim');
    } else if (e.key.length === 1) blip('key');
  });
  body.addEventListener('click', (e) => { if (!e.target.closest('a') && !getSelection().toString()) input.focus({ preventScroll: true }); });
  $$('[data-cmd]').forEach((b) => b.addEventListener('click', () => run(b.dataset.cmd)));
}
