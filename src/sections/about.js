import { $, $$, once, sleep } from '../lib/dom.js';
import { motionOn } from '../lib/motion.js';
import { blip } from '../lib/sound.js';

const QUERY = [
  ['kw', 'SELECT'], ['', ' nome, cargo, desde, formacao,\n       base, idiomas, erp, especial\n'],
  ['kw', 'FROM'], ['', ' pessoas\n'],
  ['kw', 'WHERE'], ['', ' github = '], ['str', "'MateusDG'"], ['', ';'],
];

// A ficha "executa" como uma consulta SQL quando entra na tela.
export function initAbout() {
  const sql = $('#sql');
  const query = $('#sql-query');
  const status = $('#sql-status');
  const foot = $('#sql-foot');
  const rowsEl = $$('#sql-result tr');

  const render = (chars) => {
    let left = chars;
    let html = '';
    for (const [cls, text] of QUERY) {
      if (left <= 0) break;
      const part = text.slice(0, left);
      left -= text.length;
      const safe = part.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      html += cls ? `<span class="${cls}">${safe}</span>` : safe;
    }
    query.innerHTML = `${html}<span class="caret"></span>`;
  };
  const total = QUERY.reduce((n, [, t]) => n + t.length, 0);

  if (!motionOn()) { render(total); return; }
  sql.classList.add('is-pending');
  render(0);

  once(sql, async () => {
    for (let i = 1; i <= total; i += 2) {
      render(i);
      if (i % 6 === 1) blip('key');
      await sleep(14 + Math.random() * 18);
    }
    render(total);
    status.textContent = 'executando…';
    status.style.color = 'var(--amber)';
    await sleep(420);
    rowsEl.forEach((tr, i) => { tr.style.transitionDelay = `${i * 70}ms`; });
    sql.classList.remove('is-pending');
    status.textContent = 'conectado';
    status.style.color = '';
    foot.textContent = `(1 linha) · ${(Math.random() * 3 + 1.2).toFixed(1)} ms`;
  });
}
