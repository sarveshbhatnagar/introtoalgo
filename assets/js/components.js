// components.js — interactive lesson components: tracer, quiz, try-it.
// The HTML is fully rendered at build time; this only adds behaviour.
import * as store from './store.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- tracer ---------- */
export function initTracer(el) {
  if (el.dataset.ready !== undefined) return;
  const steps = [...el.querySelectorAll('.tracer__step')];
  if (!steps.length) return;
  const lines = [...el.querySelectorAll('.tracer__code .ln')];
  const range = el.querySelector('.tracer__range');
  const cur = el.querySelector('[data-tr-cur]');
  const prevBtn = el.querySelector('[data-tr="prev"]');
  const nextBtn = el.querySelector('[data-tr="next"]');
  const playBtn = el.querySelector('[data-tr="play"]');
  const loop = el.hasAttribute('data-autoplay');
  let i = 0;
  let timer = null;
  el.dataset.ready = '';

  function show(n) {
    i = Math.max(0, Math.min(steps.length - 1, n));
    steps.forEach((s, k) => s.classList.toggle('is-current', k === i));
    const line = +steps[i].dataset.line || 0;
    lines.forEach((l, k) => l.classList.toggle('is-active', k + 1 === line));
    if (line && lines[line - 1]) {
      const box = lines[line - 1].closest('.tracer__code');
      const top = lines[line - 1].offsetTop;
      if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - 30) box.scrollTop = top - 40;
    }
    range.value = String(i + 1);
    cur.textContent = String(i + 1);
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === steps.length - 1 && !loop;
  }
  function stop() {
    clearInterval(timer);
    timer = null;
    el.classList.remove('is-playing');
    playBtn.setAttribute('aria-label', 'Play');
  }
  function play() {
    if (i === steps.length - 1) show(0);
    el.classList.add('is-playing');
    playBtn.setAttribute('aria-label', 'Pause');
    timer = setInterval(() => {
      if (i === steps.length - 1) {
        if (loop) show(0);
        else stop();
      } else show(i + 1);
    }, loop ? 2200 : 1700);
  }
  prevBtn.addEventListener('click', () => { stop(); show(i - 1); });
  nextBtn.addEventListener('click', () => { stop(); show(i + 1 > steps.length - 1 && loop ? 0 : i + 1); });
  playBtn.addEventListener('click', () => (timer ? stop() : play()));
  range.addEventListener('input', () => { stop(); show(+range.value - 1); });
  el.addEventListener('keydown', (e) => {
    if (e.target === range) return;
    if (e.key === 'ArrowRight') { stop(); show(i + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { stop(); show(i - 1); e.preventDefault(); }
  });
  show(0);

  if (loop && !reduceMotion && 'IntersectionObserver' in window) {
    let userTook = false;
    el.addEventListener('pointerdown', () => (userTook = true));
    el.addEventListener('keydown', () => (userTook = true));
    new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting && !timer && !userTook) play();
        else if (!en.isIntersecting && timer) stop();
      }
    }, { threshold: 0.4 }).observe(el);
  }
}

/* ---------- quiz ---------- */
export function initQuiz(el) {
  el.querySelectorAll('[data-quiz-q]').forEach((q) => {
    const opts = [...q.querySelectorAll('.quiz__opt')];
    opts.forEach((btn) => {
      btn.addEventListener('click', () => {
        const right = btn.dataset.correct === 'true';
        btn.classList.add(right ? 'is-right' : 'is-wrong');
        btn.setAttribute('aria-pressed', 'true');
        const why = btn.parentElement.querySelector('.quiz__why');
        why.hidden = false;
        if (right) opts.forEach((o) => (o.disabled = true));
        else btn.disabled = true;
        // keep focus inside the question for keyboard users
        if (right) why.setAttribute('tabindex', '-1'), why.focus({ preventScroll: true });
      });
    });
  });
}

/* ---------- try it (text is kept per page, on this device) ---------- */
export function initTryits() {
  document.querySelectorAll('[data-tryit]').forEach((box, idx) => {
    const ta = box.querySelector('[data-tryit-input]');
    if (!ta) return;
    const key = `tryit:${location.pathname}:${idx}`;
    const saved = store.getRaw(key);
    if (saved !== null) ta.value = saved;
    let t;
    ta.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => store.setRaw(key, ta.value), 300);
    });
  });
}

export function initAll(root = document) {
  root.querySelectorAll('[data-tracer]').forEach(initTracer);
  root.querySelectorAll('[data-quiz]').forEach(initQuiz);
  initTryits();
}
