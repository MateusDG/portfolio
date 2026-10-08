import gsap from 'gsap';
import { $, el, fmt, once } from '../lib/dom.js';
import { motionOn } from '../lib/motion.js';

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const dateLabel = (iso, opts = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', opts).replace(/\./g, '');
const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many}`;

function countUp(node, value, suffix = '') {
  if (!motionOn()) { node.textContent = fmt(value) + suffix; return; }
  const state = { v: Number(node.dataset.value || 0) };
  node.dataset.value = value;
  gsap.to(state, { v: value, duration: 1.2, ease: 'power3.out', onUpdate: () => { node.textContent = fmt(Math.round(state.v)) + suffix; } });
}

export function initContrib(data) {
  const { totals, streak, busiestDay } = data;
  const statsEl = $('#contrib-stats');
  const split = $('#cs-split');
  split.innerHTML = `<span class="p">${fmt(totals.public)} públicas</span> · <span class="v">${fmt(totals.private)} privadas</span>`;
  once(statsEl, () => {
    countUp($('#cs-total'), totals.all);
    countUp($('#cs-active'), totals.activeDays);
    countUp($('#cs-streak'), streak.longest, ' dias');
    countUp($('#cs-peak'), busiestDay.count);
  });
  $('#cs-peak-label').textContent = `contribuições em ${dateLabel(busiestDay.date, { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  $('#contrib-note').textContent = `${$('#contrib-note').textContent} Dados de ${dateLabel(data.range.from, { day: '2-digit', month: '2-digit', year: 'numeric' })} a ${dateLabel(data.range.to, { day: '2-digit', month: '2-digit', year: 'numeric' })}, coletados em ${dateLabel(data.generatedAt.slice(0, 10), { day: '2-digit', month: '2-digit', year: 'numeric' })}.`;

  // Dias da semana
  const maxDay = Math.max(...data.byWeekday, 1);
  const topDay = data.byWeekday.indexOf(maxDay);
  const weekdays = $('#weekday-bars');
  weekdays.replaceChildren(...data.byWeekday.map((v, i) => el('div', { class: i === topDay ? 'is-top' : '', title: `${WEEKDAYS[i]}: ${v}` }, [
    el('em', { text: fmt(v) }), el('b', { style: `--h:${Math.max(3, (v / maxDay) * 100)}%` }), el('span', { text: WEEKDAYS[i] }),
  ])));
  once(weekdays, () => weekdays.classList.add('is-in'));

  $('#voxels-stage').setAttribute('aria-label', `Gráfico 3D: ${totals.all} contribuições no último ano, ${totals.public} públicas e ${totals.private} privadas, em ${totals.activeDays} dias ativos.`);

  once($('#voxels'), () => {
    import('./voxels.js').then(({ mountVoxels }) => mountVoxels(data, { countUp, dateLabel, plural })).catch((error) => {
      console.warn('WebGL indisponível, usando o calendário 2D.', error);
      fallback(data);
    });
  }, { rootMargin: '400px 0px' });
}

function fallback(data) {
  const max = Math.max(...data.days.map((d) => d.pub + d.prv), 1);
  const heat = el('div', { class: 'heat' }, data.days.map((d) => {
    const t = d.pub + d.prv;
    const color = !t ? '' : d.prv > d.pub ? 'var(--coral)' : 'var(--green)';
    return el('i', { title: `${dateLabel(d.d)}: ${d.pub} públicas, ${d.prv} privadas`, style: t ? `background:${color};opacity:${0.35 + 0.65 * (t / max)}` : '' });
  }));
  $('#voxels-stage').replaceChildren(el('div', { class: 'voxels-fallback' }, heat));
}
