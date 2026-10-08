import { $, el } from '../lib/dom.js';
import { motionOn } from '../lib/motion.js';
import { discover, onSecret, SECRETS } from '../lib/secrets.js';
import { toast } from '../lib/toast.js';
import { blip } from '../lib/sound.js';

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  // Valor cru (sem JSON): o script inline do <head> o lê antes da primeira pintura.
  try { localStorage.setItem('md:theme', theme); } catch { /* ignorado */ }
  document.querySelector('meta[name="theme-color"]').content = theme === 'light' ? '#f3f1e8' : '#0b0c0a';
  document.dispatchEvent(new CustomEvent('themechange'));
}

// Chuva de 0, 1 e μ. Sai com clique, Esc ou depois de 9 s.
export function matrixRain() {
  const canvas = $('#rain');
  const ctx = canvas.getContext('2d');
  const size = 16;
  let cols = [];
  let raf;
  let stopped = false;
  const resize = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    cols = Array.from({ length: Math.ceil(innerWidth / size) }, () => Math.random() * -40);
  };
  resize();
  canvas.classList.add('is-on');
  const chars = '01μ01ƒ01∑01';
  let last = 0;
  function draw(now) {
    if (stopped) return;
    raf = requestAnimationFrame(draw);
    if (now - last < 45) return;
    last = now;
    ctx.fillStyle = 'rgba(11, 12, 10, 0.12)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `700 ${size}px "JetBrains Mono Variable", monospace`;
    cols.forEach((y, i) => {
      const ch = chars[(Math.random() * chars.length) | 0];
      ctx.fillStyle = Math.random() < 0.06 ? '#ff8f6b' : '#7ee3a2';
      ctx.fillText(ch, i * size, y * size);
      cols[i] = y * size > canvas.height && Math.random() > 0.975 ? 0 : y + 1;
    });
  }
  raf = requestAnimationFrame(draw);
  function stop() {
    stopped = true;
    cancelAnimationFrame(raf);
    canvas.classList.remove('is-on');
    setTimeout(() => ctx.clearRect(0, 0, canvas.width, canvas.height), 600);
    removeEventListener('keydown', onKey);
    removeEventListener('pointerdown', stop);
  }
  const onKey = (e) => { if (e.key === 'Escape') stop(); };
  setTimeout(() => { addEventListener('keydown', onKey); addEventListener('pointerdown', stop); }, 300);
  setTimeout(stop, 9000);
}

// "rm -rf /": tela azul falsa e rollback transacional, como no BanVic.
export function crash() {
  blip('error');
  const lines = [
    'Um problema foi detectado e o portfólio foi desligado para evitar danos.',
    '',
    'PORTFOLIO_FILESYSTEM_DELETED_BY_GUEST',
    '',
    '*** STOP: 0x000000RM (0xRF, 0x2F, 0xMATEUS, 0xDINIZ)',
    '',
    'apagando /projetos ........ ok',
    'apagando /tcc ............. ok',
    'apagando /segredos ........ ok',
  ];
  const pre = el('pre', { text: lines.join('\n') });
  const overlay = el('div', { class: 'crash', role: 'alert' }, pre);
  document.body.append(overlay);
  setTimeout(() => {
    overlay.classList.add('is-restored');
    pre.textContent = 'ROLLBACK\n\npublicação transacional: nenhuma das 7 tabelas foi afetada.\nsnapshot anterior restaurado. tudo continua aqui. 😌';
  }, 2600);
  setTimeout(() => overlay.remove(), 4800);
}

function confetti() {
  if (!motionOn()) return;
  const colors = ['var(--green)', 'var(--coral)', 'var(--violet)', 'var(--amber)'];
  for (let i = 0; i < 60; i++) {
    const node = el('span', { class: 'confetti', text: Math.random() < 0.5 ? '0' : Math.random() < 0.5 ? '1' : 'μ', style: `left:${Math.random() * 100}vw;top:-30px;color:${colors[i % 4]}` });
    document.body.append(node);
    const anim = node.animate([
      { transform: 'translateY(0) rotate(0)', opacity: 1 },
      { transform: `translate(${(Math.random() - 0.5) * 200}px, ${innerHeight + 60}px) rotate(${Math.random() * 720}deg)`, opacity: 0.8 },
    ], { duration: 1800 + Math.random() * 1600, easing: 'cubic-bezier(.2,.6,.4,1)', delay: Math.random() * 500 });
    anim.onfinish = () => node.remove();
  }
}

export function initEggs() {
  // Konami
  const konami = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  let keys = [];
  let typed = '';
  let crtTimer;
  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, textarea')) return;
    const key = e.key.toLowerCase();
    keys = [...keys, key].slice(-konami.length);
    if (keys.join() === konami.join()) {
      document.documentElement.classList.add('is-crt');
      clearTimeout(crtTimer);
      crtTimer = setTimeout(() => document.documentElement.classList.remove('is-crt'), 9000);
      discover('konami');
      toast('Modo fósforo verde por alguns segundos. Nostalgia de terminal CRT.');
    }
    // Digitar "fuzzy" em qualquer lugar
    if (key.length === 1) {
      typed = (typed + key).slice(-5);
      if (typed === 'fuzzy') {
        const root = document.documentElement;
        root.classList.remove('is-fuzzy');
        void root.offsetWidth;
        root.classList.add('is-fuzzy');
        setTimeout(() => root.classList.remove('is-fuzzy'), 2500);
        if (discover('fuzzy')) toast('Tudo é questão de grau. Inclusive o foco.');
      }
    }
  });

  // Sair da aba e voltar
  const title = document.title;
  let leftAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      leftAt = Date.now();
      document.title = 'volta! o pipeline te espera 👀';
    } else {
      document.title = title;
      if (Date.now() - leftAt > 1500 && discover('saudade')) toast('Que bom que você voltou.');
    }
  });

  // Console
  const art = [
    '%c',
    '  ███╗   ███╗██████╗ ',
    '  ████╗ ████║██╔══██╗',
    '  ██╔████╔██║██║  ██║   mateus.diniz',
    '  ██║╚██╔╝██║██║  ██║   entre o 0 e o 1',
    '  ██║ ╚═╝ ██║██████╔╝',
    '  ╚═╝     ╚═╝╚═════╝ ',
  ].join('\n');
  console.log(art, 'color:#7ee3a2;font-family:monospace;font-weight:700');
  console.log('%cOi, dev. Já que você está aqui: digite mateus.segredo()', 'color:#ff8f6b;font-family:monospace');
  window.mateus = {
    segredo() {
      discover('devtools');
      return 'Segredo desbloqueado. Se você inspeciona código assim, a gente deveria conversar: mateusdinizgo@hotmail.com';
    },
    contato: 'mateusdinizgo@hotmail.com',
    stack: ['Java', 'Spring Boot', 'Angular', 'React', 'Python', 'Airflow', 'PostgreSQL', 'Kubernetes'],
  };

  onSecret((_, count) => {
    if (count === SECRETS.length) {
      setTimeout(() => { confetti(); toast('100% dos segredos. Você seria um ótimo QA. 🏆', 'zerou'); }, 900);
    }
  });
}
