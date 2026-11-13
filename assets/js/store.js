// store.js — everything the site remembers lives in localStorage, per browser.
// All access is wrapped: private mode or blocked storage must never break a page.
const P = 'ia:';

export function get(key, fallback = null) {
  try {
    const v = localStorage.getItem(P + key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

export function set(key, value) {
  try {
    localStorage.setItem(P + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function getRaw(key) {
  try { return localStorage.getItem(P + key); } catch { return null; }
}
export function setRaw(key, value) {
  try { localStorage.setItem(P + key, value); } catch { /* ignore */ }
}
export function remove(key) {
  try { localStorage.removeItem(P + key); } catch { /* ignore */ }
}

/* lessons: { "algorithms/big-o-notation": 1731400000000 } */
export const lessons = () => get('lessons', {}) || {};
export function setLessonDone(key, done) {
  const all = lessons();
  if (done) all[key] = Date.now();
  else delete all[key];
  set('lessons', all);
  window.dispatchEvent(new CustomEvent('ia:progress'));
}

/* problems: { "matching-receipts": { status: "solved" | "attempted", at, revealed } } */
export const problems = () => get('problems', {}) || {};
export function problemStatus(slug) {
  const p = problems()[slug];
  return p ? p.status : 'todo';
}
export function setProblem(slug, patch) {
  const all = problems();
  const cur = all[slug] || {};
  const next = { ...cur, ...patch, at: Date.now() };
  if (cur.status === 'solved' && patch.status === 'attempted') next.status = 'solved'; // never downgrade
  all[slug] = next;
  set('problems', all);
  window.dispatchEvent(new CustomEvent('ia:progress'));
}

/* recent: [{ url, title, kind, track, at }] newest first */
export const recent = () => get('recent', []) || [];
export function pushRecent(item) {
  const list = recent().filter((r) => r.url !== item.url);
  list.unshift({ ...item, at: Date.now() });
  set('recent', list.slice(0, 8));
}

/* preferred code language for lessons and the editor */
export function lang() {
  const l = getRaw('lang');
  return l === 'py' ? 'py' : 'js';
}
export function setLang(l) {
  setRaw('lang', l);
  document.documentElement.setAttribute('data-lang', l);
  window.dispatchEvent(new CustomEvent('ia:lang', { detail: l }));
}
