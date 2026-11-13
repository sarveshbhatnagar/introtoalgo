// roadmap.js — roadmap pages: progress, and point the main button at the next lesson.
import * as store from './store.js';
import { paintTrackProgress } from './progress.js';
import './site.js';

function paint() {
  paintTrackProgress();
  const btn = document.querySelector('[data-continue-track]');
  if (!btn) return;
  const done = store.lessons();
  const track = btn.dataset.continueTrack;
  const next = [...document.querySelectorAll('.rm-lesson__link[href]')].find((a) => !done[`${track}/${a.getAttribute('href').split('/').pop().replace('.html', '')}`]);
  const anyDone = Object.keys(done).some((k) => k.startsWith(track + '/'));
  if (next && anyDone) {
    btn.href = next.getAttribute('href');
    btn.querySelector('span').textContent = `Continue: ${next.querySelector('.rm-lesson__title').textContent}`;
  }
}
window.addEventListener('ia:progress', paint);
paint();
