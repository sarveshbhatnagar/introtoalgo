// home.js — home page: hero tracer, continue strip, progress on the four doors.
import * as store from './store.js';
import { initAll } from './components.js';
import { paintTrackProgress } from './progress.js';
import './site.js';

initAll();

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

function paintContinue() {
  const box = document.querySelector('[data-continue]');
  const list = document.querySelector('[data-continue-list]');
  if (!box) return;
  const done = store.lessons();
  const probs = store.problems();
  const items = store.recent().filter((r) => {
    if (r.kind === 'Problem') return true;
    const key = r.url.replace(/^\//, '').replace(/\.html$/, '');
    return !done[key];
  }).slice(0, 3);
  if (!items.length) { box.hidden = true; return; }
  list.innerHTML = items.map((r) => {
    const slug = r.url.split('/').pop().replace('.html', '');
    const status = r.kind === 'Problem' ? probs[slug]?.status : null;
    const kind = r.kind === 'Problem' ? (status === 'solved' ? 'Solved problem' : 'Keep solving') : `Continue ${r.kind.toLowerCase()}`;
    const cls = r.kind === 'Problem' ? 't-prac' : ({ ai: 't-ai', 'system-design': 't-sd' })[r.track] || 't-algo';
    return `<li><a class="continue__item ${cls}" href="${esc(r.url)}"><span class="continue__kind">${esc(kind)}</span><span class="continue__title">${esc(r.title)}</span></a></li>`;
  }).join('');
  box.hidden = false;
}

function paint() {
  paintContinue();
  paintTrackProgress();
  const door = document.querySelector('[data-practice-progress]');
  if (door) {
    const total = +door.dataset.total || 0;
    const solved = Object.values(store.problems()).filter((p) => p.status === 'solved').length;
    door.querySelector('.bar__fill').style.width = total ? `${Math.min(100, (solved / total) * 100)}%` : '0%';
  }
}
window.addEventListener('ia:progress', paint);
paint();
