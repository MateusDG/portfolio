import { $, el, sleep } from '../lib/dom.js';
import { motionOn } from '../lib/motion.js';
import { discover, SECRETS } from '../lib/secrets.js';

// A abertura é o próprio portfólio rodando como um DAG do Airflow.
export function runBoot(getTotal) {
  const boot = $('#boot');
  const log = $('#boot-log');
  const grid = $('#boot-grid');
  let finished = false;
  let resolveDone;
  const done = new Promise((resolve) => { resolveDone = resolve; });

  function finish(skipped) {
    if (finished) return;
    finished = true;
    if (skipped) discover('impaciente');
    boot.classList.add('is-done');
    document.body.classList.remove('is-booting');
    removeEventListener('keydown', onKey);
    resolveDone();
  }
  const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish(true); };

  if (!motionOn()) {
    boot.classList.add('is-done');
    finished = true;
    resolveDone();
    return done;
  }

  document.body.classList.add('is-booting');
  addEventListener('keydown', onKey);
  $('#boot-skip').addEventListener('click', () => finish(true));
  boot.addEventListener('click', () => finish(true));

  const cells = Array.from({ length: 84 }, () => el('i'));
  grid.replaceChildren(...cells);

  (async () => {
    const steps = [
      ['<span class="b-hl">$ airflow dags trigger mateus_portfolio</span>', 260],
      ['<span class="b-ok">✓</span> wait_for_visitor ........... <span class="b-ok">success</span>', 220],
      ['<span class="b-ok">✓</span> load_cases ................. <span class="b-hl">tcc, banvic</span>', 220],
      [() => `<span class="b-ok">✓</span> load_contributions ......... <span class="b-hl">${getTotal() ? `${getTotal()} linhas` : 'ok'}</span>`, 220],
      ['<span class="b-ok">✓</span> validate_fuzziness ......... <span class="b-co">μ = 0.90</span>', 220],
      [`<span class="b-ok">✓</span> hide_secrets ............... <span class="b-hl">${SECRETS.length} escondidos</span>`, 220],
      ['<span class="b-ok">●</span> publish_page ............... <span class="b-ok">published</span>', 340],
    ];
    let lit = 0;
    for (const [i, [line, wait]] of steps.entries()) {
      if (finished) return;
      log.insertAdjacentHTML('beforeend', `${typeof line === 'function' ? line() : line}\n`);
      const target = Math.round(((i + 1) / steps.length) * cells.length);
      while (lit < target) {
        cells[lit].classList.add('on');
        cells[Math.max(0, lit - 1)].classList.remove('hot');
        cells[lit].classList.add('hot');
        lit += 1;
        if (lit % 3 === 0) await sleep(8);
      }
      await sleep(wait);
    }
    finish(false);
  })();

  return done;
}
