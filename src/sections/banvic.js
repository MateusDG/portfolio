import { $, $$, el, fmt, sleep } from '../lib/dom.js';
import { motionOn } from '../lib/motion.js';
import { discover } from '../lib/secrets.js';
import { blip } from '../lib/sound.js';
import { toast } from '../lib/toast.js';

// Contagens da fonte oficial verificada (README do projeto, revisão de 05/10/2026).
const TASKS = [
  { id: 'wait_for_zip', op: 'sensor', stage: 0 },
  { id: 'prepare_snapshot', op: 'python', stage: 0 },
  { id: 'load_agencias', label: 'agencias', op: 'meltano', rows: 10, dur: 500, stage: 1, group: true },
  { id: 'load_clientes', label: 'clientes', op: 'meltano', rows: 998, dur: 900, stage: 1 },
  { id: 'load_colaborador_agencia', label: 'colaborador_agencia', op: 'meltano', rows: 100, dur: 650, stage: 1 },
  { id: 'load_colaboradores', label: 'colaboradores', op: 'meltano', rows: 100, dur: 600, stage: 1 },
  { id: 'load_contas', label: 'contas', op: 'meltano', rows: 999, dur: 900, stage: 1 },
  { id: 'load_propostas_credito', label: 'propostas_credito', op: 'meltano', rows: 2000, dur: 1100, stage: 1 },
  { id: 'load_transacoes', label: 'transacoes', op: 'meltano', rows: 71999, dur: 2100, stage: 1 },
  { id: 'validate_all_tables', op: 'python', stage: 3, group: true },
  { id: 'publish_snapshot', op: 'python', stage: 3 },
  { id: 'pipeline_complete', op: 'empty', stage: 4 },
  { id: 'record_failure', op: 'python', stage: 4 },
];
const TOTAL_ROWS = 76206;
const REFERENCE_SECONDS = 55.826;
const PLANNED_MS = 6200; // duração aproximada da simulação de sucesso
const HISTORY = 5;
const CLASS = { queued: 's-queued', running: 's-running', success: 's-success', failed: 's-failed', retry: 's-retry', upstream: 's-upstream', skipped: 's-skipped' };

export function initBanvic() {
  const grid = $('#dag-grid');
  const log = $('#dag-log');
  const stateEl = $('#dag-state');
  const timer = $('#dag-timer');
  const dag = $('#dag');
  const flow = $$('.flow span');
  const buttons = $$('[data-run]');
  const runs = []; // histórico: [{taskId: state}]
  const rows = new Map();
  let running = false;
  let started = 0;
  let clock = new Date('2026-10-05T10:30:52');

  for (const task of TASKS) {
    const squares = Array.from({ length: HISTORY }, () => el('i'));
    const current = el('i', { class: 'cur' });
    const meta = el('span', { class: 'dag-meta', text: task.rows ? fmt(task.rows) : '' });
    const name = task.label
      ? [el('span', { class: 'ind', text: '└' }), el('span', { text: task.label })]
      : [el('span', { text: task.id })];
    const row = el('div', { class: `dag-row${task.group ? ' is-group' : ''}`, role: 'row' }, [
      el('span', { class: 'dag-task', role: 'cell' }, [...name, el('span', { class: 'op', text: task.op })]),
      el('span', { class: 'dag-runs', role: 'cell', 'aria-hidden': 'true' }, [...squares, current]),
      el('span', { role: 'cell' }, meta),
    ]);
    grid.append(row);
    rows.set(task.id, { row, squares, current, meta });
  }

  // Histórico inicial: as execuções das evidências do projeto (inicial, retry, falha permanente, demonstração).
  const ok = () => Object.fromEntries(TASKS.map((t) => [t.id, t.id === 'record_failure' ? 'skipped' : 'success']));
  const failed = Object.fromEntries(TASKS.map((t) => [t.id, t.id === 'load_contas' ? 'failed' : t.stage >= 3 && t.id !== 'record_failure' ? 'upstream' : 'success']));
  runs.push(ok(), ok(), failed, ok());
  paintHistory();

  function paintHistory() {
    const recent = runs.slice(-HISTORY);
    for (const task of TASKS) {
      const { squares } = rows.get(task.id);
      squares.forEach((sq, i) => {
        const run = recent[i - (HISTORY - recent.length)];
        sq.className = run ? CLASS[run[task.id]] : '';
      });
    }
  }

  function set(taskId, state, meta) {
    const r = rows.get(taskId);
    r.current.className = `cur ${CLASS[state] || ''}`;
    r.row.classList.toggle('is-hot', state === 'running');
    if (meta !== undefined) r.meta.textContent = meta;
  }

  function stamp(simMs) {
    const t = new Date(clock.getTime() + simMs);
    return t.toTimeString().slice(0, 8);
  }

  function line(text, kind = '') {
    const simMs = running ? (performance.now() - started) * (REFERENCE_SECONDS * 1000 / PLANNED_MS) : 0;
    log.append(el('li', { class: kind }, [el('span', { class: 'ts', text: stamp(simMs) }), document.createTextNode(text)]));
    while (log.childElementCount > 60) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }

  function hot(stage) { flow.forEach((f, i) => f.classList.toggle('is-hot', i === stage || (stage >= 0 && i === 2))); }

  function setDag(state, label) {
    stateEl.dataset.state = state;
    stateEl.textContent = label;
    dag.classList.toggle('is-running', state === 'running');
  }

  let raf;
  function tickTimer() {
    const elapsed = ((performance.now() - started) / 1000) * (REFERENCE_SECONDS / (PLANNED_MS / 1000));
    timer.textContent = formatTime(elapsed);
    raf = requestAnimationFrame(tickTimer);
  }
  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${(s % 60).toFixed(3).padStart(6, '0')}`;

  async function runTask(task, speed, { fail = 0 } = {}) {
    let attempt = 0;
    while (true) {
      attempt += 1;
      set(task.id, 'running', task.rows ? '0' : '…');
      if (attempt === 1) line(`INFO - ${task.id}: iniciada`);
      const duration = (task.dur || 600) * speed;
      const startT = performance.now();
      const failAt = attempt <= fail ? 0.55 : 2;
      while (performance.now() - startT < duration) {
        const p = (performance.now() - startT) / duration;
        if (p >= failAt) break;
        if (task.rows) rows.get(task.id).meta.textContent = fmt(Math.round(task.rows * p));
        await sleep(40);
      }
      if (attempt <= fail) {
        const last = attempt >= 2;
        set(task.id, last ? 'failed' : 'retry', last ? 'falhou' : `retry ${attempt}`);
        line(`ERROR - ${task.id}: falha injetada (${fail > 1 ? '--fail-always' : '--fail-once'} contas)`, 'err');
        blip('error');
        if (last) return false;
        line(`WARN - ${task.id}: up_for_retry, tentativa ${attempt + 1} em instantes`, 'warn');
        await sleep(900 * speed);
        continue;
      }
      set(task.id, 'success', task.rows ? fmt(task.rows) : 'ok');
      if (task.rows) line(`INFO - ${task.id}: ${fmt(task.rows)} linhas no staging`, 'ok');
      return true;
    }
  }

  async function trigger(mode) {
    if (running) return;
    running = true;
    buttons.forEach((b) => { b.disabled = true; });
    const speed = motionOn() ? 1 : 0.35;
    const fail = mode === 'retry' ? 1 : mode === 'fail' ? 2 : 0;
    log.replaceChildren();
    for (const t of TASKS) set(t.id, 'queued', t.rows ? fmt(0) : '');
    const record = {};
    started = performance.now();
    clock = new Date(clock.getTime() + 86400000);
    tickTimer();
    setDag('running', 'running');
    line(`INFO - trigger manual · run_id manual__${clock.toISOString().slice(0, 10)}`, 'hl');

    hot(0);
    for (const id of ['wait_for_zip', 'prepare_snapshot']) {
      await runTask(TASKS.find((t) => t.id === id), speed);
      record[id] = 'success';
      if (id === 'wait_for_zip') line('INFO - ZIP oficial encontrado · sha256 646aada7…', 'ok');
      else line('INFO - snapshot congelado para esta execução', 'ok');
    }

    hot(1);
    const loads = TASKS.filter((t) => t.stage === 1);
    const results = await Promise.all(loads.map((t) => runTask(t, speed, { fail: t.id === 'load_contas' ? fail : 0 })
      .then((ok) => { record[t.id] = ok ? 'success' : 'failed'; return ok; })));
    const allLoaded = results.every(Boolean);

    if (allLoaded) {
      hot(3);
      await runTask(TASKS.find((t) => t.id === 'validate_all_tables'), speed);
      record.validate_all_tables = 'success';
      line(`INFO - reconciliação: ${fmt(TOTAL_ROWS)} linhas · chaves, vínculos e hashes ok`, 'ok');
      line('WARN - 5 vínculos órfãos da fonte preservados como aviso', 'warn');
      await runTask(TASKS.find((t) => t.id === 'publish_snapshot'), speed);
      record.publish_snapshot = 'success';
      line('INFO - 7 tabelas publicadas na mesma transação', 'ok');
      hot(4);
      await runTask(TASKS.find((t) => t.id === 'pipeline_complete'), speed * 0.5);
      record.pipeline_complete = 'success';
      set('record_failure', 'skipped', 'skip');
      record.record_failure = 'skipped';
      hot(5);
      cancelAnimationFrame(raf);
      timer.textContent = formatTime(REFERENCE_SECONDS);
      setDag('success', 'success');
      line(`INFO - DAG success · ${fmt(TOTAL_ROWS)} linhas · ${fmt(REFERENCE_SECONDS, 3)} s`, 'ok');
      blip('success');
      if (fail === 1) {
        discover('resiliencia');
        toast('Falha transitória recuperada no retry. Nenhuma linha perdida.');
      }
    } else {
      for (const id of ['validate_all_tables', 'publish_snapshot', 'pipeline_complete']) {
        set(id, 'upstream', 'upstream');
        record[id] = 'upstream';
      }
      line('WARN - validate/publish: upstream_failed', 'warn');
      await runTask(TASKS.find((t) => t.id === 'record_failure'), speed);
      record.record_failure = 'success';
      line('INFO - falha registrada em audit.ingestion_runs', 'hl');
      line('INFO - rollback: snapshot anterior preservado, dados intactos', 'ok');
      cancelAnimationFrame(raf);
      setDag('failed', 'failed');
      hot(-1);
      discover('resiliencia');
      toast('Falha permanente: rollback feito e o snapshot anterior continua publicado.');
    }

    runs.push(record);
    paintHistory();
    running = false;
    buttons.forEach((b) => { b.disabled = false; });
  }

  buttons.forEach((b) => b.addEventListener('click', () => { blip(); trigger(b.dataset.run); }));
  line('INFO - DAG pronto. Agendamento diário às 06:00 (America/Sao_Paulo).');
  line('INFO - aperte trigger para executar as 13 tarefas.');
}
