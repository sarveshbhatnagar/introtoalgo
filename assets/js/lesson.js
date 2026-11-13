// lesson.js — lesson pages: components, mark complete, table of contents.
import * as store from './store.js';
import { initAll } from './components.js';
import './site.js';

initAll();

const article = document.querySelector('[data-lesson]');
if (article) {
  const key = article.dataset.lesson;
  const track = key.split('/')[0];
  const btn = document.querySelector('[data-complete]');
  const label = document.querySelector('[data-complete-label]');
  const badge = document.querySelector('[data-done-badge]');

  const paint = () => {
    const done = !!store.lessons()[key];
    btn.classList.toggle('is-done', done);
    btn.setAttribute('aria-pressed', String(done));
    label.textContent = done ? 'Completed. Click to undo' : 'Mark lesson complete';
    badge.hidden = !done;
  };
  btn.addEventListener('click', () => {
    store.setLessonDone(key, !store.lessons()[key]);
    paint();
  });
  paint();

  store.pushRecent({ url: location.pathname, title: article.dataset.title, kind: track === 'ai' ? 'AI lesson' : 'Lesson', track });

  // highlight the section being read in the side table of contents
  const links = [...document.querySelectorAll('.toc a')];
  const heads = links.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  if (heads.length && 'IntersectionObserver' in window) {
    const visible = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? visible.add(en.target) : visible.delete(en.target)));
      let active = null;
      for (const h of heads) {
        if (h.getBoundingClientRect().top < window.innerHeight * 0.35) active = h;
      }
      links.forEach((a) => a.classList.toggle('is-active', active && a.getAttribute('href') === '#' + active.id));
    }, { rootMargin: '0px 0px -60% 0px' });
    heads.forEach((h) => io.observe(h));
    window.addEventListener('scroll', () => {
      let active = null;
      for (const h of heads) if (h.getBoundingClientRect().top < window.innerHeight * 0.35) active = h;
      links.forEach((a) => a.classList.toggle('is-active', active && a.getAttribute('href') === '#' + active.id));
    }, { passive: true });
  }
}
