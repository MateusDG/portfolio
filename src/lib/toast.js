import { $, el } from './dom.js';

export function toast(message, tag) {
  const zone = $('#toasts');
  const node = el('div', { class: 'toast' }, [tag ? el('span', { class: 't-tag', text: tag }) : null, el('span', { text: message })]);
  zone.append(node);
  while (zone.childElementCount > 3) zone.firstElementChild.remove();
  setTimeout(() => {
    node.classList.add('is-out');
    setTimeout(() => node.remove(), 400);
  }, 4200);
}
