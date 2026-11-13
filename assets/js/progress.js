// progress.js — paints track and module progress from localStorage.
import * as store from './store.js';

// <el data-track-progress="algorithms/a algorithms/b" data-total="49">
export function paintTrackProgress() {
  const done = store.lessons();
  document.querySelectorAll('[data-track-progress]').forEach((el) => {
    const keys = el.dataset.trackProgress.split(' ').filter(Boolean);
    const total = +el.dataset.total || keys.length;
    const n = keys.filter((k) => done[k]).length;
    const fill = el.querySelector('.bar__fill');
    if (fill) fill.style.width = total ? `${(n / total) * 100}%` : '0%';
    const bar = el.querySelector('[role="progressbar"]');
    if (bar) bar.setAttribute('aria-valuenow', String(n));
    const num = el.querySelector('[data-progress-done]');
    if (num) num.textContent = String(n);
  });
  document.querySelectorAll('[data-mod-progress]').forEach((el) => {
    const keys = el.dataset.modProgress.split(' ').filter(Boolean);
    const total = +el.dataset.modTotal;
    const n = keys.filter((k) => done[k]).length;
    el.textContent = n ? `${n} of ${total} done` : `${total} lessons`;
    const mod = el.closest('.rm-module');
    if (mod) {
      mod.classList.toggle('is-started', n > 0);
      mod.classList.toggle('is-done', n === total && total > 0);
    }
  });
}
