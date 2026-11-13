// practice.js — the problem list: filters, search and progress summary.
import * as store from './store.js';
import './site.js';

const rows = [...document.querySelectorAll('[data-prob]')];
const sections = [...document.querySelectorAll('[data-topic-section]')];
const f = {
  q: document.querySelector('[data-f="q"]'),
  topic: document.querySelector('[data-f="topic"]'),
  pattern: document.querySelector('[data-f="pattern"]'),
  status: document.querySelector('[data-f="status"]'),
};
const diffBtns = [...document.querySelectorAll('[data-f-diff]')];
const result = document.querySelector('[data-filter-result]');
let diff = '';

// Filters survive a reload in this tab (and come from ?topic=… links).
const params = new URLSearchParams(location.search);
const saved = (() => { try { return JSON.parse(sessionStorage.getItem('ia:filters') || '{}'); } catch { return {}; } })();
for (const k of ['q', 'topic', 'pattern', 'status']) {
  const v = params.get(k) ?? saved[k];
  if (v && f[k]) f[k].value = v;
}
diff = params.get('difficulty') ?? saved.diff ?? '';

function apply() {
  const q = f.q.value.trim().toLowerCase();
  const probs = store.problems();
  let shown = 0;
  rows.forEach((r) => {
    const st = probs[r.dataset.slug]?.status || 'todo';
    const ok = (!q || r.dataset.search.includes(q)) && (!f.topic.value || r.dataset.topic === f.topic.value) && (!f.pattern.value || r.dataset.pattern === f.pattern.value) && (!diff || r.dataset.difficulty === diff) && (!f.status.value || st === f.status.value);
    r.hidden = !ok;
    if (ok) shown++;
  });
  const filtering = q || f.topic.value || f.pattern.value || diff || f.status.value;
  sections.forEach((s) => {
    const any = s.querySelector('[data-prob]:not([hidden])');
    s.hidden = filtering ? !any : false;
  });
  diffBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.fDiff === diff)));
  result.textContent = filtering ? (shown ? `Showing ${shown} of ${rows.length} problems.` : 'No problems match these filters.') : '';
  try { sessionStorage.setItem('ia:filters', JSON.stringify({ q: f.q.value, topic: f.topic.value, pattern: f.pattern.value, status: f.status.value, diff })); } catch { /* ignore */ }
}

function stats() {
  const box = document.querySelector('[data-pstats]');
  if (!box) return;
  const probs = store.problems();
  const counts = { easy: 0, medium: 0, hard: 0 };
  rows.forEach((r) => { if (probs[r.dataset.slug]?.status === 'solved') counts[r.dataset.difficulty]++; });
  box.querySelector('[data-pstat="solved"]').textContent = String(counts.easy + counts.medium + counts.hard);
  for (const d of ['easy', 'medium', 'hard']) {
    box.querySelector(`[data-pstat="${d}"]`).textContent = String(counts[d]);
    const total = +box.dataset[d] || 0;
    box.querySelector(`[data-pstat-bar="${d}"]`).style.width = total ? `${(counts[d] / total) * 100}%` : '0%';
  }
}

Object.values(f).forEach((el) => el?.addEventListener('input', apply));
diffBtns.forEach((b) => b.addEventListener('click', () => { diff = b.dataset.fDiff; apply(); }));
window.addEventListener('ia:progress', () => { apply(); stats(); });
apply();
stats();
