// components.js — interactive lesson components: tracer, quiz, try-it,
// estimation boxes, self-review checklists, "Your turn" timers and diagram scrolling.
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
    if (el.classList.contains('tracer--arch')) document.dispatchEvent(new CustomEvent('ia:tracer-step'));
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

/* ---------- estimation exercise (nothing is saved) ---------- */
function fmtRatio(r) {
  if (r < 1.5) return 'a little';
  if (r < 10) return `about ${Math.round(r)}x`;
  return `about ${(10 ** Math.round(Math.log10(r))).toLocaleString('en-US')}x`;
}
function judgeEstimate(box, value, cfg) {
  const out = box.querySelector('[data-est-result]');
  let cls, html;
  if (!(value > 0) || !Number.isFinite(value)) {
    cls = '';
    html = 'Type a positive number, like <code>3</code> or <code>2.5e9</code>, and pick a unit.';
  } else if (value >= cfg.lo && value <= cfg.hi) {
    cls = 'is-good';
    html = `<strong>Within range.</strong> The worked estimate is ${cfg.answer}. Open the working to compare your steps.`;
  } else if (value < cfg.lo) {
    cls = 'is-low';
    html = `<strong>Too low,</strong> ${fmtRatio(cfg.ans / value)} below the worked estimate. Check for a missing multiplier (copies, days, bytes per item).`;
  } else {
    cls = 'is-high';
    html = `<strong>Too high,</strong> ${fmtRatio(value / cfg.ans)} above the worked estimate. Check for a double-counted factor or a unit slip.`;
  }
  out.className = `est__result ${cls}`.trim();
  out.innerHTML = html;
}
export function initEstimate(box) {
  let cfg;
  try { cfg = JSON.parse(box.dataset.estimate); } catch { return; }
  const form = box.querySelector('[data-est-form]');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = form.querySelector('[data-est-num]').value.trim().replace(/[,_\s]/g, '').replace(/×10\^?/i, 'e');
      const n = raw === '' ? NaN : Number(raw);
      judgeEstimate(box, n * Number(form.querySelector('[data-est-unit]').value), cfg);
    });
  }
  const choices = [...box.querySelectorAll('[data-est-choice]')];
  choices.forEach((btn) => btn.addEventListener('click', () => {
    const v = Number(btn.dataset.estChoice);
    const right = v >= cfg.lo && v <= cfg.hi;
    btn.classList.add(right ? 'is-right' : 'is-wrong');
    btn.setAttribute('aria-pressed', 'true');
    if (right) choices.forEach((c) => (c.disabled = true));
    else btn.disabled = true;
    judgeEstimate(box, v, cfg);
  }));
}

/* ---------- self-review checklist (saved per lesson, on this device) ---------- */
export function initChecklists() {
  document.querySelectorAll('[data-checklist]').forEach((box, idx) => {
    const key = `checklist:${location.pathname}:${idx}`;
    const items = [...box.querySelectorAll('[data-chk-item]')];
    const count = box.querySelector('[data-chk-count]');
    const fill = box.querySelector('.bar__fill');
    const verdict = box.querySelector('[data-chk-verdict]');
    const saved = new Set(store.get(key, []) || []);
    items.forEach((cb) => (cb.checked = saved.has(+cb.dataset.chkItem)));
    const paint = () => {
      const n = items.filter((c) => c.checked).length;
      const t = items.length;
      count.textContent = `${n} of ${t}`;
      fill.style.width = `${(n / t) * 100}%`;
      verdict.textContent = n === 0 ? '' : n === t ? 'Every box ticked. Try the next design without notes.' : n / t >= 0.75 ? 'Close. Redo the sections you missed out loud.' : 'Worth another attempt after rereading the sections you missed.';
    };
    items.forEach((cb) => cb.addEventListener('change', () => {
      store.set(key, items.filter((c) => c.checked).map((c) => +c.dataset.chkItem));
      paint();
    }));
    box.querySelector('[data-chk-reset]')?.addEventListener('click', () => {
      items.forEach((c) => (c.checked = false));
      store.remove(key);
      paint();
    });
    paint();
  });
}

/* ---------- "Your turn" countdown ---------- */
export function initTimers() {
  document.querySelectorAll('[data-timer]').forEach((btn) => {
    const total = +btn.dataset.timer;
    const label = btn.querySelector('[data-timer-label]');
    const idle = label.textContent;
    let left = 0, t = null;
    const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const stop = (text, cls) => {
      clearInterval(t); t = null;
      btn.classList.remove('is-running');
      if (cls) btn.classList.add(cls);
      label.textContent = text;
    };
    btn.addEventListener('click', () => {
      if (t) { stop(idle); btn.setAttribute('aria-label', `Start a ${total / 60}-minute timer`); return; }
      btn.classList.remove('is-done');
      btn.classList.add('is-running');
      btn.setAttribute('aria-label', 'Stop the timer');
      left = total;
      label.textContent = fmt(left);
      t = setInterval(() => {
        left -= 1;
        if (left <= 0) { stop('Time', 'is-done'); btn.setAttribute('aria-label', 'Time is up. Start the timer again'); }
        else label.textContent = fmt(left);
      }, 1000);
    });
  });
}

/* ---------- diagrams that are wider than the column scroll inside their box ---------- */
export function initArchScroll() {
  const boxes = [...document.querySelectorAll('[data-ar-scroll]')];
  if (!boxes.length) return;
  const check = () => boxes.forEach((b) => {
    if (!b.offsetParent) return; // hidden tracer step
    const over = b.scrollWidth > b.clientWidth + 2;
    b.classList.toggle('is-scrollable', over);
    if (over) { b.tabIndex = 0; b.setAttribute('role', 'region'); b.setAttribute('aria-label', 'Diagram, scrolls sideways'); }
    else { b.removeAttribute('tabindex'); b.removeAttribute('role'); b.removeAttribute('aria-label'); }
    const fig = b.closest('.fig');
    if (!fig) return; // tracers show scroll shadows only
    const hint = fig.querySelector('.ar-hint');
    if (over && !hint) {
      const p = document.createElement('p');
      p.className = 'ar-hint';
      p.textContent = 'Scroll sideways to see the whole diagram';
      b.parentElement.after(p);
    } else if (!over && hint) hint.remove();
  });
  check();
  let raf = 0;
  window.addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(check); });
  document.addEventListener('ia:tracer-step', check);
}

export function initAll(root = document) {
  root.querySelectorAll('[data-tracer]').forEach(initTracer);
  root.querySelectorAll('[data-quiz]').forEach(initQuiz);
  root.querySelectorAll('[data-estimate]').forEach(initEstimate);
  initTryits();
  initChecklists();
  initTimers();
  initArchScroll();
}
