import { $, $$, clamp, el, fmt } from '../lib/dom.js';
import { discover } from '../lib/secrets.js';
import { toast } from '../lib/toast.js';

/*
 * Versão didática do motor do TCC: inferência Mamdani (min/max + centroide)
 * sobre um catálogo ilustrativo de eletrodomésticos de embutir, seguida do
 * ranking híbrido cujo peso fuzzy varia de 0,35 a 0,70 conforme a confiança.
 */
const CATALOG = [
  { n: 'Cooktop de indução 4 zonas', env: 'cozinha', price: 4900, pop: 0.82 },
  { n: 'Forno elétrico de embutir 60 cm', env: 'cozinha', price: 6800, pop: 0.74 },
  { n: 'Coifa de ilha 90 cm', env: 'cozinha', price: 7600, pop: 0.55 },
  { n: 'Lava-louças de embutir 14 serviços', env: 'cozinha', price: 8900, pop: 0.63 },
  { n: 'Micro-ondas de embutir 32 L', env: 'cozinha', price: 3300, pop: 0.7 },
  { n: 'Refrigerador French Door 590 L', env: 'cozinha', price: 14200, pop: 0.6 },
  { n: 'Adega climatizada 40 garrafas', env: 'gourmet', price: 5600, pop: 0.66 },
  { n: 'Churrasqueira a gás de embutir', env: 'gourmet', price: 9800, pop: 0.58 },
  { n: 'Cervejeira 100 L', env: 'gourmet', price: 3900, pop: 0.72 },
  { n: 'Gaveta aquecida 60 cm', env: 'gourmet', price: 2900, pop: 0.35 },
  { n: 'Lava e seca 12 kg', env: 'lavanderia', price: 6200, pop: 0.8 },
  { n: 'Secadora de piso 11 kg', env: 'lavanderia', price: 4300, pop: 0.5 },
  { n: 'Lavadora compacta 8 kg', env: 'lavanderia', price: 2600, pop: 0.62 },
];
const ENV_LABEL = { cozinha: 'cozinha', gourmet: 'área gourmet', lavanderia: 'lavanderia' };
const RELATED = { 'cozinha|gourmet': 0.4, 'gourmet|cozinha': 0.4 };

// Funções de pertinência sobre r = preço / orçamento.
const down = (x, a, b) => (x <= a ? 1 : x >= b ? 0 : (b - x) / (b - a));
const up = (x, a, b) => (x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a));
const trap = (x, a, b, c, d) => Math.max(0, Math.min((x - a) / (b - a), 1, (d - x) / (d - c)));
const PRICE = {
  abaixo: (r) => down(r, 0.3, 0.62),
  compativel: (r) => trap(r, 0.35, 0.68, 1.0, 1.28),
  acima: (r) => up(r, 1.0, 1.45),
};
// Conjuntos de saída (compatibilidade) em [0, 1].
const OUT = {
  baixa: (y) => down(y, 0.05, 0.45),
  media: (y) => trap(y, 0.25, 0.45, 0.55, 0.75),
  alta: (y) => up(y, 0.55, 0.95),
};
const RULES = [
  { id: 'R01', text: 'preço compatível E ambiente preferido → alta', out: 'alta', fire: (m) => Math.min(m.compativel, m.pref) },
  { id: 'R02', text: 'preço compatível E popular → alta', out: 'alta', fire: (m) => Math.min(m.compativel, m.pop) },
  { id: 'R03', text: 'preço compatível E ambiente não preferido → média', out: 'media', fire: (m) => Math.min(m.compativel, m.naoPref) },
  { id: 'R04', text: 'preço abaixo E ambiente preferido → média', out: 'media', fire: (m) => Math.min(m.abaixo, m.pref) },
  { id: 'R05', text: 'preço acima do orçamento → baixa', out: 'baixa', fire: (m) => m.acima },
  { id: 'R06', text: 'ambiente não preferido → baixa', out: 'baixa', fire: (m) => m.naoPref * 0.85 },
  { id: 'R07', text: 'preço abaixo E pouco popular → baixa', out: 'baixa', fire: (m) => Math.min(m.abaixo, 1 - m.pop) },
  { id: 'R00', text: 'sem evidência de preferência → prior neutro (média)', out: 'media', fire: (m) => m.noEvidence },
];
const SAMPLES = Array.from({ length: 101 }, (_, i) => i / 100);

function infer(product, { budget, env, conf }) {
  const r = product.price / budget;
  const noEnv = !env;
  const pref = noEnv ? 0.5 : product.env === env ? 1 : RELATED[`${product.env}|${env}`] || 0;
  const m = {
    abaixo: PRICE.abaixo(r), compativel: PRICE.compativel(r), acima: PRICE.acima(r),
    pref: noEnv ? 0 : pref, naoPref: noEnv ? 0 : 1 - pref, pop: product.pop,
    noEvidence: noEnv ? clamp(1 - conf / 0.25) : 0,
  };
  // Sem ambiente declarado, preço/popularidade ainda contam, mas o ambiente vira prior neutro.
  if (noEnv) { m.pref = 0.5 * clamp(conf / 0.25); m.naoPref = 0; }
  const fired = RULES.map((rule) => ({ ...rule, w: clamp(rule.fire(m)) }));
  let num = 0;
  let den = 0;
  for (const y of SAMPLES) {
    let mu = 0;
    for (const f of fired) if (f.w > 0) mu = Math.max(mu, Math.min(f.w, OUT[f.out](y)));
    num += y * mu;
    den += mu;
  }
  const fuzzy = den ? num / den : 0.5;
  const weight = 0.35 + 0.35 * conf;
  const heuristic = 0.55 * product.pop + 0.45 * pref;
  return { product, r, m, fired, fuzzy, weight, pref, score: weight * fuzzy + (1 - weight) * heuristic };
}

function explain(res, env) {
  const { m, product } = res;
  const parts = [];
  const priceLabel = m.compativel >= Math.max(m.abaixo, m.acima)
    ? el('em', { text: `preço compatível (μ=${m.compativel.toFixed(2)})` })
    : m.acima > m.abaixo
      ? el('span', { class: 'neg', text: `acima do orçamento (μ=${m.acima.toFixed(2)})` })
      : el('span', { text: `bem abaixo do orçamento (μ=${m.abaixo.toFixed(2)})` });
  parts.push(priceLabel);
  if (!env) parts.push(el('span', { text: 'ambiente: prior neutro' }));
  else if (product.env === env) parts.push(el('em', { text: `ambiente: ${ENV_LABEL[env]}` }));
  else if (res.pref > 0) parts.push(el('span', { text: `ambiente relacionado (${ENV_LABEL[product.env]})` }));
  else parts.push(el('span', { class: 'neg', text: `outro ambiente (${ENV_LABEL[product.env]})` }));
  if (product.pop >= 0.7) parts.push(el('span', { text: 'popular no catálogo' }));
  const out = [];
  parts.forEach((p, i) => { if (i) out.push(document.createTextNode(' · ')); out.push(p); });
  return out;
}

export function initFuzzyLab() {
  const budgetInput = $('#lab-budget');
  const confInput = $('#lab-conf');
  const budgetOut = $('#lab-budget-out');
  const confOut = $('#lab-conf-out');
  const envButtons = $$('#lab-env button');
  const svg = $('#lab-svg');
  const top = $('#lab-top');
  const rulesList = $('#lab-rules');
  const ruleBadge = $('#lab-rule');
  let env = 'cozinha';
  let lastTopKey = '';

  confInput.classList.add('is-green');
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs = {}) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
  const W = 520, H = 170, PAD = { l: 8, r: 8, t: 14, b: 26 };
  const MAX_PRICE = 16000;
  const sx = (price) => PAD.l + (price / MAX_PRICE) * (W - PAD.l - PAD.r);
  const sy = (mu) => H - PAD.b - mu * (H - PAD.t - PAD.b);

  // Estrutura fixa do gráfico
  const gGrid = svgEl('g');
  for (let p = 0; p <= MAX_PRICE; p += 4000) {
    gGrid.append(svgEl('line', { x1: sx(p), x2: sx(p), y1: PAD.t, y2: H - PAD.b, class: 'lab-svg-grid' }));
    const label = svgEl('text', { x: sx(p), y: H - 8, class: 'lab-svg-axis', 'text-anchor': p === 0 ? 'start' : p === MAX_PRICE ? 'end' : 'middle' });
    label.textContent = p === 0 ? 'R$ 0' : `${p / 1000} mil`;
    gGrid.append(label);
  }
  gGrid.append(svgEl('line', { x1: PAD.l, x2: W - PAD.r, y1: sy(0), y2: sy(0), class: 'lab-svg-grid' }));
  const areaOk = svgEl('path', { class: 'lab-area', fill: 'var(--green)' });
  const curves = {
    abaixo: svgEl('path', { class: 'lab-curve', stroke: 'var(--blue)' }),
    compativel: svgEl('path', { class: 'lab-curve', stroke: 'var(--green)' }),
    acima: svgEl('path', { class: 'lab-curve', stroke: 'var(--coral)' }),
  };
  const budgetLine = svgEl('line', { class: 'lab-budget-line', y1: PAD.t - 6, y2: H - PAD.b });
  const budgetLabel = svgEl('text', { class: 'lab-svg-axis', y: PAD.t - 8, 'text-anchor': 'middle' });
  budgetLabel.textContent = 'orçamento';
  const gDots = svgEl('g');
  svg.append(gGrid, areaOk, curves.abaixo, curves.compativel, curves.acima, budgetLine, budgetLabel, gDots);
  const dots = CATALOG.map(() => {
    const g = svgEl('g', { class: 'lab-prod' });
    const c = svgEl('rect', { width: 8, height: 8, x: -4, y: -4 });
    const t = svgEl('text', { class: 'lab-svg-axis', y: -9, 'text-anchor': 'middle', fill: 'var(--coral)' });
    g.append(c, t);
    gDots.append(g);
    return { g, c, t };
  });

  function draw(budget, results, ranking) {
    for (const [key, path] of Object.entries(curves)) {
      let d = '';
      for (let i = 0; i <= 120; i++) {
        const price = (i / 120) * MAX_PRICE;
        d += `${i ? 'L' : 'M'}${sx(price).toFixed(1)},${sy(PRICE[key](price / budget)).toFixed(1)}`;
      }
      path.setAttribute('d', d);
      if (key === 'compativel') areaOk.setAttribute('d', `${d}L${sx(MAX_PRICE)},${sy(0)}L${sx(0)},${sy(0)}Z`);
    }
    budgetLine.setAttribute('x1', sx(budget));
    budgetLine.setAttribute('x2', sx(budget));
    budgetLabel.setAttribute('x', Math.min(W - 30, Math.max(30, sx(budget))));
    results.forEach((res, i) => {
      const rank = ranking.indexOf(res);
      const { g, c, t } = dots[i];
      const muPrice = Math.max(res.m.compativel, 0.02);
      g.setAttribute('transform', `translate(${sx(res.product.price).toFixed(1)},${sy(muPrice).toFixed(1)})`);
      c.setAttribute('fill', rank < 3 ? 'var(--coral)' : res.pref >= 1 ? 'var(--text)' : 'var(--dim)');
      g.style.opacity = rank < 3 ? 1 : res.pref >= 1 ? 0.85 : 0.45;
      t.textContent = rank < 3 ? String(rank + 1) : '';
    });
  }

  function update() {
    const budget = Number(budgetInput.value);
    const conf = Number(confInput.value);
    budgetOut.textContent = `R$ ${fmt(budget)}`;
    confOut.textContent = conf.toFixed(2);
    budgetInput.style.setProperty('--p', `${((budget - budgetInput.min) / (budgetInput.max - budgetInput.min)) * 100}%`);
    confInput.style.setProperty('--p', `${conf * 100}%`);

    const results = CATALOG.map((p) => infer(p, { budget, env, conf }));
    const ranking = [...results].sort((a, b) => b.score - a.score);
    draw(budget, results, ranking);

    const best = ranking[0];
    const strongest = [...best.fired].sort((a, b) => b.w - a.w)[0];
    const r00 = best.fired.find((f) => f.id === 'R00');
    ruleBadge.textContent = r00.w > 0.05 ? `R00 ativa · μ=${r00.w.toFixed(2)}` : `${strongest.id} domina · w=${best.weight.toFixed(2)}`;
    ruleBadge.classList.toggle('is-r00', r00.w > 0.05);
    if (r00.w > 0.5 && discover('r00')) toast('R00: sem evidência, o sistema assume um prior neutro em vez de inventar preferência.');

    const key = ranking.slice(0, 3).map((r) => r.product.n).join('|');
    const items = ranking.slice(0, 3).map((res, i) => {
      const fuzzyPart = res.weight * res.fuzzy;
      return el('li', {}, [
        el('span', { class: 'rank', text: String(i + 1) }),
        el('div', {}, [
          el('div', { class: 'pname' }, [document.createTextNode(res.product.n), el('small', { text: `R$ ${fmt(res.product.price)}` })]),
          el('p', { class: 'why' }, explain(res, env)),
          el('div', { class: 'bar', title: 'coral: parcela fuzzy · lilás: parcela híbrida (popularidade e ambiente)' }, [
            el('i', { class: 'bf', style: `width:${fuzzyPart * 100}%` }),
            el('i', { class: 'bh', style: `width:${(res.score - fuzzyPart) * 100}%` }),
          ]),
        ]),
        el('span', { class: 'score', text: res.score.toFixed(2) }),
      ]);
    });
    // Só anima a entrada quando o pódio muda; mover o slider apenas atualiza os valores.
    if (key === lastTopKey) items.forEach((li) => { li.style.animation = 'none'; });
    lastTopKey = key;
    top.replaceChildren(...items);

    rulesList.replaceChildren(...best.fired.map((f) => el('li', { class: f.w > 0.01 ? '' : 'off' }, [
      el('code', { text: f.id }),
      el('span', { text: f.text }),
      el('span', { class: 'act', title: `ativação ${f.w.toFixed(2)}` }, el('i', { style: `width:${f.w * 100}%` })),
    ])));
  }

  budgetInput.addEventListener('input', update);
  confInput.addEventListener('input', update);
  envButtons.forEach((button) => button.addEventListener('click', () => {
    env = env === button.dataset.env ? null : button.dataset.env;
    envButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.env === env)));
    lastTopKey = '';
    update();
  }));
  update();
}
