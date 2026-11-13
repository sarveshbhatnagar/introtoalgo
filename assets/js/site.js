// site.js — loaded on every page. Theme toggle, code tabs, copy buttons,
// progress dots for lessons and problems.
import * as store from './store.js';

/* ---------- theme ---------- */
const root = document.documentElement;
const media = window.matchMedia('(prefers-color-scheme: dark)');
const currentTheme = () => root.getAttribute('data-theme') || (media.matches ? 'dark' : 'light');

function labelToggle() {
  const btn = document.querySelector('[data-theme-toggle]');
  if (!btn) return;
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  btn.setAttribute('aria-label', `Switch to ${next} theme`);
}
document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  store.setRaw('theme', next);
  labelToggle();
  window.dispatchEvent(new CustomEvent('ia:theme', { detail: next }));
});
media.addEventListener?.('change', labelToggle);
labelToggle();

/* ---------- code tabs (one language choice for the whole site) ---------- */
function syncTabs() {
  const l = store.lang();
  document.querySelectorAll('.code__tab').forEach((t) => {
    const on = t.dataset.setLang === l;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
  });
}
document.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-set-lang]');
  if (!tab) return;
  const before = tab.getBoundingClientRect().top;
  store.setLang(tab.dataset.setLang);
  syncTabs();
  // keep the clicked tab where it was, even if blocks above changed height
  const after = tab.getBoundingClientRect().top;
  if (Math.abs(after - before) > 1) window.scrollBy(0, after - before);
});
document.addEventListener('keydown', (e) => {
  const tab = e.target.closest?.('.code__tab');
  if (!tab || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const tabs = [...tab.parentElement.querySelectorAll('.code__tab')];
  const next = tabs[(tabs.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
  next.click();
  next.focus();
  e.preventDefault();
});
window.addEventListener('ia:lang', syncTabs);
syncTabs();

/* ---------- copy buttons ---------- */
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  const block = btn.closest('.code');
  const panes = [...block.querySelectorAll('.code__pane')];
  const pane = panes.find((p) => p.offsetParent !== null) || panes[0];
  const text = pane.querySelector('code').textContent;
  const label = btn.querySelector('span');
  try {
    await navigator.clipboard.writeText(text);
    label.textContent = 'Copied';
  } catch {
    label.textContent = 'Press Ctrl+C';
    const range = document.createRange();
    range.selectNodeContents(pane.querySelector('code'));
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  setTimeout(() => (label.textContent = 'Copy'), 1600);
});

/* ---------- progress dots ---------- */
export function paintStatus() {
  const done = store.lessons();
  document.querySelectorAll('[data-lstatus]').forEach((el) => {
    const on = !!done[el.dataset.lstatus];
    el.classList.toggle('is-done', on);
  });
  const probs = store.problems();
  document.querySelectorAll('[data-pstatus]').forEach((el) => {
    const s = probs[el.dataset.pstatus]?.status;
    el.classList.toggle('is-solved', s === 'solved');
    el.classList.toggle('is-attempted', s === 'attempted');
    el.setAttribute('title', s === 'solved' ? 'Solved' : s === 'attempted' ? 'Attempted' : 'Not started');
  });
}
window.addEventListener('ia:progress', paintStatus);
window.addEventListener('storage', paintStatus);
paintStatus();
