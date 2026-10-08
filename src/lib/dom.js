export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const fmt = (n, digits = 0) => n.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
export const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// localStorage pode lançar exceção (modo privado, bloqueio de cookies).
export const store = {
  get(key, fallback = null) {
    try { const value = localStorage.getItem(key); return value === null ? fallback : JSON.parse(value); } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignorado */ }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* ignorado */ }
  },
};

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) if (child != null) node.append(child);
  return node;
}

export function onVisible(target, callback, options = {}) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) callback(entry.isIntersecting, entry);
  }, options);
  observer.observe(target);
  return observer;
}

export function once(target, callback, options = { rootMargin: '0px 0px -15% 0px' }) {
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { observer.disconnect(); callback(); }
  }, options);
  observer.observe(target);
}
