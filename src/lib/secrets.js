import { $, el, store } from './dom.js';
import { toast } from './toast.js';
import { blip } from './sound.js';

export const SECRETS = [
  { id: 'impaciente', name: 'Sem paciência para DAG', desc: 'Pulou a intro.', hint: 'Nem todo mundo espera o boot terminar.' },
  { id: 'certeza', name: 'Certeza absoluta', desc: 'Levou μ até 1.00.', hint: 'Até onde vai a nitidez do nome?' },
  { id: 'caos', name: 'Caos total', desc: 'Levou μ até 0.00.', hint: 'E se nada pertencer a nada?' },
  { id: 'explosao', name: 'Big bang', desc: 'Clique triplo no nome.', hint: 'O nome aguenta três cliques seguidos?' },
  { id: 'bit-pulo', name: 'Amigo do Bit', desc: 'Fez o Bit pular cinco vezes.', hint: 'O mascote adora atenção.' },
  { id: 'bit-sono', name: 'Despertador', desc: 'Acordou o Bit.', hint: 'Deixe o Bit sozinho por um tempo.' },
  { id: 'pato', name: 'Rubber duck debugging', desc: 'Conversou com o pato de borracha até resolver.', hint: 'Todo dev precisa de um pato para conversar.' },
  { id: 'bug', name: 'Caçador de bugs', desc: 'Corrigiu três bugs com as próprias mãos.', hint: 'Às vezes algo pequeno corre pelo chão.' },
  { id: 'deploy', name: 'Deploy em produção', desc: 'Fez um deploy pelo servidor do Bit.', hint: 'A casa do Bit tem um botão importante.' },
  { id: 'resiliencia', name: 'Caos controlado', desc: 'Injetou uma falha no DAG do BanVic.', hint: 'Pipeline bom sobrevive a falhas. Teste.' },
  { id: 'r00', name: 'Regra R00', desc: 'Disparou o prior neutro no laboratório fuzzy.', hint: 'O que o recomendador faz sem nenhuma evidência?' },
  { id: 'pico', name: 'Dia de pico', desc: 'Encontrou o dia mais intenso do ano.', hint: 'Um voxel é mais alto que todos.' },
  { id: 'konami', name: 'Modo fósforo', desc: '↑ ↑ ↓ ↓ ← → ← → B A', hint: 'Um código clássico de videogame.' },
  { id: 'fuzzy', name: 'Tudo é questão de grau', desc: 'Digitou "fuzzy" na página.', hint: 'Digite a palavra-chave do TCC, em qualquer lugar.' },
  { id: 'sudo', name: 'Superusuário', desc: 'Pediu permissão de root no terminal.', hint: 'No terminal, peça com autoridade.' },
  { id: 'cafe', name: 'Combustível', desc: 'Pediu café no terminal.', hint: 'Todo dev roda com…' },
  { id: 'matrix', name: 'Siga o coelho branco', desc: 'Entrou na Matrix.', hint: 'Um filme de 1999, digitado no terminal.' },
  { id: 'rm', name: 'Rollback', desc: 'Tentou apagar tudo.', hint: 'O comando mais perigoso do Linux.' },
  { id: 'luz', name: 'Modo claro', desc: 'Trocou o tema pelo terminal.', hint: 'O terminal também muda a aparência.' },
  { id: 'saudade', name: 'Volta sempre', desc: 'Saiu da aba e voltou.', hint: 'Vá dar uma volta e retorne.' },
  { id: 'devtools', name: 'Curiosidade de dev', desc: 'Chamou mateus.segredo() no console.', hint: 'Quem desenvolve abre o DevTools.' },
];

const found = new Set(store.get('md:secrets', []).filter((id) => SECRETS.some((s) => s.id === id)));
const listeners = new Set();

export const isFound = (id) => found.has(id);
export const foundCount = () => found.size;
export const onSecret = (fn) => listeners.add(fn);

export function discover(id) {
  const secret = SECRETS.find((s) => s.id === id);
  if (!secret || found.has(id)) return false;
  found.add(id);
  store.set('md:secrets', [...found]);
  blip('secret');
  toast(`${secret.name} · ${found.size}/${SECRETS.length}`, 'segredo');
  const button = $('#secrets-btn');
  button.classList.remove('is-bump');
  void button.offsetWidth;
  button.classList.add('is-bump');
  render();
  listeners.forEach((fn) => fn(id, found.size));
  return true;
}

export function render() {
  const total = SECRETS.length;
  for (const id of ['#secrets-total', '#secrets-total-2']) $(id).textContent = total;
  for (const id of ['#secrets-count', '#secrets-count-2']) $(id).textContent = found.size;
  $('#secrets-fill').style.width = `${(found.size / total) * 100}%`;
  $('#secrets-list').replaceChildren(...SECRETS.map((s) => {
    const ok = found.has(s.id);
    return el('li', { class: ok ? 'is-found' : '' }, [
      el('i', { 'aria-hidden': 'true' }),
      el('div', {}, [el('b', { text: ok ? s.name : '???' }), el('span', { text: ok ? s.desc : `dica: ${s.hint}` })]),
    ]);
  }));
}

export function resetSecrets() {
  found.clear();
  store.remove('md:secrets');
  render();
}
