// workspace.js — the problem page: editor, Run/Submit, results, hints, status.
// User code never runs on this thread: JavaScript runs in a fresh Web Worker per
// run, Python in a Pyodide worker. Both are killed if a test takes too long.
import * as store from './store.js';
import { paintStatus } from './site.js';
import '/assets/js/harness.js';

const H = self.IAHarness;
const data = JSON.parse(document.getElementById('problem-data').textContent);
const slug = data.slug;
const meta = { signature: data.signature, compare: data.compare, mutates: data.mutates, checker: data.checker };
const TIMEOUT = { js: 3000, py: 5000 };
const PY_LOAD_TIMEOUT = 60000;
const PYODIDE_BASE = store.getRaw('pyodide-base') || 'https://cdn.jsdelivr.net/npm/pyodide@314.0.7/';
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

let lang = store.lang();
let editor = null; // CodeMirror view, or null while the plain textarea is in use
let cm = null;
const fallback = $('[data-editor-fallback]');
const resultsEl = $('[data-results]');
const saveState = $('[data-save-state]');
let busy = false;

store.pushRecent({ url: location.pathname, title: data.title, kind: 'Problem', track: 'practice' });

/* ---------------------------------------------------------------------- */
/* code storage                                                            */
/* ---------------------------------------------------------------------- */
const codeKey = (l) => `code:${slug}:${l}`;
const savedCode = (l) => store.getRaw(codeKey(l));
const startCode = (l) => savedCode(l) ?? data.starter[l];
function getCode() { return editor ? editor.state.doc.toString() : fallback.value; }
let saveTimer;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveState.textContent = '';
  saveTimer = setTimeout(() => {
    store.setRaw(codeKey(lang), getCode());
    saveState.textContent = 'Saved';
  }, 400);
}

/* ---------------------------------------------------------------------- */
/* editor                                                                  */
/* ---------------------------------------------------------------------- */
async function loadEditor() {
  try {
    cm = await import('/assets/vendor/codemirror/codemirror.min.js');
  } catch (e) {
    console.warn('Editor failed to load; using a plain text box.', e);
    fallback.addEventListener('input', scheduleSave);
    fallback.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const s = fallback.selectionStart;
        fallback.setRangeText(lang === 'py' ? '    ' : '  ', s, fallback.selectionEnd, 'end');
      }
    });
    return;
  }
  const { EditorView, EditorState, Compartment, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, defaultKeymap, history, historyKeymap, indentWithTab, indentOnInput, bracketMatching, syntaxHighlighting, HighlightStyle, indentUnit, closeBrackets, closeBracketsKeymap, javascript, python, tags: t } = cm;
  const langConf = new Compartment();
  const style = HighlightStyle.define([
    { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.definitionKeyword, t.moduleKeyword], color: 'var(--tk-k)' },
    { tag: [t.string, t.special(t.string), t.regexp], color: 'var(--tk-s)' },
    { tag: [t.number, t.integer, t.float], color: 'var(--tk-n)' },
    { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--tk-c)', fontStyle: 'italic' },
    { tag: [t.function(t.variableName), t.function(t.propertyName), t.function(t.definition(t.variableName))], color: 'var(--tk-f)' },
    { tag: [t.bool, t.null, t.self, t.atom], color: 'var(--tk-l)' },
    { tag: [t.className, t.typeName, t.definition(t.className)], color: 'var(--tk-t)' },
    { tag: [t.standard(t.variableName)], color: 'var(--tk-b)' },
    { tag: [t.operator, t.punctuation, t.bracket], color: 'var(--tk-o)' },
  ]);
  const theme = EditorView.theme({
    '&': { color: 'var(--fg)', backgroundColor: 'var(--code-bg)', height: '100%' },
    '.cm-content': { caretColor: 'var(--fg)', padding: '12px 0' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--fg)', borderLeftWidth: '2px' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: 'color-mix(in srgb, var(--accent) 28%, transparent) !important' },
    '.cm-gutters': { backgroundColor: 'var(--code-bg)', color: 'var(--fg-3)', border: 'none', borderRight: '1px solid var(--code-line)' },
    '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--fg) 5%, transparent)' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--fg)' },
    '.cm-matchingBracket': { backgroundColor: 'color-mix(in srgb, var(--accent) 25%, transparent)', outline: '1px solid var(--accent)' },
    '.cm-nonmatchingBracket': { backgroundColor: 'var(--bad-soft)', color: 'var(--bad)' },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 10px 0 12px' },
    '.cm-errorLine': { backgroundColor: 'var(--bad-soft)' },
  });
  const runKeys = keymap.of([
    { key: 'Mod-Enter', run: () => { execute('run'); return true; } },
    { key: 'Shift-Mod-Enter', run: () => { execute('submit'); return true; } },
  ]);
  const langExt = (l) => [l === 'py' ? python() : javascript(), indentUnit.of(l === 'py' ? '    ' : '  '), EditorState.tabSize.of(l === 'py' ? 4 : 2)];
  const state = (doc, l) => EditorState.create({
    doc,
    extensions: [
      lineNumbers(), highlightActiveLineGutter(), highlightActiveLine(), drawSelection(), history(), indentOnInput(), bracketMatching(), closeBrackets(),
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]), runKeys,
      langConf.of(langExt(l)), syntaxHighlighting(style), theme,
      EditorView.contentAttributes.of({ 'aria-label': 'Code editor. Press Escape then Tab to move focus out.' }),
      EditorView.updateListener.of((u) => { if (u.docChanged) scheduleSave(); }),
    ],
  });
  editor = new EditorView({ state: state(fallback.value, lang), parent: $('[data-editor]') });
  editor._makeState = state;
  fallback.remove();
}

function setDoc(text) {
  if (editor) editor.setState(editor._makeState(text, lang));
  else fallback.value = text;
}

function goToLine(n) {
  if (!editor) {
    const lines = fallback.value.split('\n');
    const pos = lines.slice(0, n - 1).join('\n').length + (n > 1 ? 1 : 0);
    fallback.focus();
    fallback.setSelectionRange(pos, pos + (lines[n - 1] || '').length);
    return;
  }
  const line = editor.state.doc.line(Math.max(1, Math.min(n, editor.state.doc.lines)));
  editor.dispatch({ selection: { anchor: line.from, head: line.to }, scrollIntoView: true });
  editor.focus();
}

// Chrome does not report a line for syntax errors in eval'd code; ask the parser.
function syntaxErrorLine() {
  if (!editor || !cm?.ensureSyntaxTree) return null;
  const tree = cm.ensureSyntaxTree(editor.state, editor.state.doc.length, 500);
  let pos = null;
  tree?.iterate({ enter: (n) => { if (pos === null && n.type.isError) pos = n.from; } });
  return pos === null ? null : editor.state.doc.lineAt(pos).number;
}

/* ---------------------------------------------------------------------- */
/* language switch                                                         */
/* ---------------------------------------------------------------------- */
const langBtns = [...document.querySelectorAll('[data-ws-lang]')];
function paintLang() {
  langBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.wsLang === lang)));
}
function switchLang(l) {
  if (l === lang) return;
  store.setRaw(codeKey(lang), getCode());
  lang = l;
  store.setLang(l);
  setDoc(startCode(l));
  paintLang();
  saveState.textContent = '';
  if (l === 'py') ensurePython();
}
langBtns.forEach((b) => b.addEventListener('click', () => switchLang(b.dataset.wsLang)));

$('[data-reset]').addEventListener('click', () => {
  if (getCode() !== data.starter[lang] && !confirm('Replace your code with the starter code? Your current code will be lost.')) return;
  setDoc(data.starter[lang]);
  store.remove(codeKey(lang));
  saveState.textContent = 'Reset';
});

/* ---------------------------------------------------------------------- */
/* running                                                                 */
/* ---------------------------------------------------------------------- */

// Runs `tests` in `worker`. Resolves { prepare, results[] }. Kills the worker on timeout.
function runIn(worker, code, tests, timeoutMs, onKill) {
  return new Promise((resolve) => {
    const results = new Array(tests.length).fill(null);
    let prepare = null;
    let current = -1;
    let timer = null;
    const arm = () => { clearTimeout(timer); timer = setTimeout(timeout, timeoutMs + (current < 0 ? 1500 : 0)); };
    const finish = () => { clearTimeout(timer); worker.onmessage = worker.onerror = null; resolve({ prepare, results }); };
    function timeout() {
      onKill();
      if (current < 0) prepare = { ok: false, error: `Time limit exceeded while loading your code (${timeoutMs / 1000}s). Is there an infinite loop at the top level?` };
      else {
        results[current] = { ok: false, timeout: true, error: `Time limit exceeded (${timeoutMs / 1000}s). Look for a loop that never ends or recursion without a base case.` };
        for (let k = current + 1; k < tests.length; k++) results[k] = { skipped: true };
      }
      finish();
    }
    worker.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'prepare') { prepare = m; if (!m.ok) finish(); }
      else if (m.type === 'start') { current = m.i; arm(); }
      else if (m.type === 'result') { results[m.i] = m; clearTimeout(timer); }
      else if (m.type === 'done') finish();
    };
    worker.onerror = (e) => {
      e.preventDefault?.();
      onKill();
      const err = { ok: false, error: 'The runner crashed: ' + (e.message || 'unknown error') + '. Deep recursion can do this.' };
      if (current < 0) prepare = err;
      else { results[current] = err; for (let k = current + 1; k < tests.length; k++) results[k] = { skipped: true }; }
      finish();
    };
    arm();
    worker.postMessage({ type: 'run', code, problem: meta, tests });
  });
}

function runJs(code, tests) {
  const w = new Worker('/assets/js/runner/js-worker.js');
  return runIn(w, code, tests, TIMEOUT.js, () => w.terminate()).finally(() => w.terminate());
}

// Python: one warm worker, restarted after a timeout.
let py = null; // { worker, ready: Promise }
function ensurePython() {
  if (py) return py.ready;
  const worker = new Worker('/assets/js/runner/py-worker.js', { type: 'module' });
  const ready = new Promise((resolve, reject) => {
    worker.onmessage = (e) => {
      if (e.data.type === 'ready') resolve();
      else if (e.data.type === 'fatal') reject(new Error(e.data.error));
    };
    worker.onerror = (e) => reject(new Error(e.message || 'Python worker failed to start'));
    // A CDN that never answers must not leave the page stuck on "Loading Python…".
    setTimeout(() => reject(new Error(`Python did not finish loading within ${PY_LOAD_TIMEOUT / 1000} s`)), PY_LOAD_TIMEOUT);
  });
  py = { worker, ready, isReady: false };
  const mine = py;
  ready.then(() => (mine.isReady = true), () => { if (py === mine) py = null; worker.terminate(); });
  worker.postMessage({ type: 'init', base: PYODIDE_BASE });
  return ready;
}
async function runPy(code, tests) {
  if (!py || !py.isReady) showBusy('Loading Python… (about 10 MB the first time, then it is cached)');
  try {
    await ensurePython();
  } catch (e) {
    return { prepare: { ok: false, error: 'Could not load Python in this browser: ' + e.message + '. Check your connection and try again, or switch to JavaScript.' }, results: [] };
  }
  showBusy('Running…');
  const w = py.worker;
  return runIn(w, code, tests, TIMEOUT.py, () => { w.terminate(); py = null; });
}

function showBusy(text) {
  resultsEl.innerHTML = `<div class="results__summary"><span class="results__verdict is-busy"><span class="loader" aria-hidden="true"></span>${esc(text)}</span></div>`;
}

const runBtn = $('[data-run]');
const submitBtn = $('[data-submit]');
function setBusy(b) {
  busy = b;
  [runBtn, submitBtn, $('[data-custom-run]')].forEach((x) => x && (x.disabled = b));
}

async function execute(kind, customTest) {
  if (busy) return;
  setBusy(true);
  showBusy('Running…');
  const code = getCode();
  store.setRaw(codeKey(lang), code);
  const tests = kind === 'run' ? data.tests.filter((t) => t.example) : kind === 'submit' ? data.tests : [customTest];
  const t0 = performance.now();
  let out;
  try {
    out = lang === 'py' ? await runPy(code, tests) : await runJs(code, tests);
  } catch (e) {
    out = { prepare: { ok: false, error: String(e && e.message || e) }, results: [] };
  }
  const elapsed = performance.now() - t0;

  if (kind === 'custom') {
    // Expected output comes from running the reference solution on the same input.
    let expected = null;
    if (out.prepare?.ok && data.refJs) {
      const ref = await runJs(data.refJs, tests).catch(() => null);
      if (ref?.results?.[0]?.ok) expected = ref.results[0].got;
    }
    renderCustom(out, tests[0], expected);
    setBusy(false);
    return;
  }

  const verdicts = tests.map((t, i) => {
    const r = out.results[i];
    if (!r) return { state: 'skip' };
    if (r.skipped) return { state: 'skip', r };
    if (!r.ok) return { state: 'fail', r };
    const c = H.compare(meta, t, r.got);
    return { state: c.pass ? 'pass' : 'fail', r, message: c.message };
  });
  const passed = verdicts.filter((v) => v.state === 'pass').length;
  const allPass = out.prepare?.ok && passed === tests.length;

  if (kind === 'submit') {
    if (allPass) {
      store.setProblem(slug, { status: 'solved' });
      unlockSolution();
    } else store.setProblem(slug, { status: 'attempted' });
  } else if (store.problemStatus(slug) === 'todo') store.setProblem(slug, { status: 'attempted' });
  paintStatus();

  renderResults(kind, tests, out, verdicts, passed, allPass, elapsed);
  setBusy(false);
}

/* ---------------------------------------------------------------------- */
/* results                                                                 */
/* ---------------------------------------------------------------------- */
function lineButton(line) {
  return line ? ` <button type="button" class="btn-text" data-goto-line="${line}">Go to line ${line}</button>` : '';
}

const SVG = (d) => `<svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const MARK = {
  pass: SVG('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  fail: SVG('<path d="M7 7l10 10M17 7 7 17"/>'),
  skip: SVG('<path d="M6 12h12"/>'),
};
const STATE_WORD = { pass: 'passed', fail: 'failed', skip: 'not run' };

function caseLabel(t, i) {
  if (t.example) return `Example ${i + 1}`;
  const n = i - data.tests.filter((x) => x.example).length + 1;
  return `Test ${n}`;
}

function renderPrepareError(p) {
  let line = p.line;
  if (!line && p.syntax) line = syntaxErrorLine();
  const where = line ? ` on line ${line}` : '';
  resultsEl.innerHTML = `<div class="results__summary"><span class="results__verdict is-fail">${p.syntax || /SyntaxError|IndentationError/.test(p.error) ? 'Syntax error' : 'Error'}${where}</span></div>
<div class="rcase__err"><pre class="io">${esc(p.error)}</pre></div>
<p class="rcase__msg">${lineButton(line)}</p>${p.logs ? `<div class="rcase__row"><span>Console output</span><pre class="io">${esc(p.logs)}</pre></div>` : ''}`;
}

function renderResults(kind, tests, out, verdicts, passed, allPass, elapsed) {
  if (!out.prepare?.ok) return renderPrepareError(out.prepare || { error: 'Unknown error' });
  const total = tests.length;
  const timedOut = verdicts.some((v) => v.r?.timeout);
  const errored = verdicts.some((v) => v.state === 'fail' && v.r && !v.r.ok && !v.r.timeout);
  let verdict, cls;
  if (allPass) { verdict = kind === 'submit' ? 'Accepted' : 'Examples pass'; cls = 'is-pass'; }
  else if (timedOut) { verdict = 'Time limit exceeded'; cls = 'is-fail'; }
  else if (errored) { verdict = 'Runtime error'; cls = 'is-fail'; }
  else { verdict = 'Wrong answer'; cls = 'is-fail'; }
  const first = Math.max(0, verdicts.findIndex((v) => v.state !== 'pass'));
  const sel = allPass ? 0 : first;
  const banner = allPass && kind === 'submit'
    ? `<div class="solved-banner">Solved. Every test passes, including the hidden edge cases. <a href="#solution">Read the walkthrough</a></div>`
    : allPass ? `<p class="rcase__msg">The examples pass. Now <strong>Submit</strong> to check the hidden tests too.</p>` : '';
  resultsEl.innerHTML = `${banner}<div class="results__summary"><span class="results__verdict ${cls}">${allPass ? MARK.pass : MARK.fail}${verdict}</span><span class="results__meta">${passed} / ${total} passed · ${Math.round(elapsed)} ms · ${lang === 'py' ? 'Python' : 'JavaScript'}</span></div>
<div class="results__tabs" role="tablist" aria-label="Test cases">${tests.map((t, i) => `<button type="button" role="tab" class="rtab is-${verdicts[i].state}" aria-selected="${i === sel}" data-case="${i}">${MARK[verdicts[i].state] || ''}${caseLabel(t, i)}<span class="sr-only">, ${STATE_WORD[verdicts[i].state] || ''}</span></button>`).join('')}</div>
<div class="rcase" data-case-body></div>`;
  const body = $('[data-case-body]', resultsEl);
  const show = (i) => {
    resultsEl.querySelectorAll('.rtab').forEach((b) => b.setAttribute('aria-selected', String(+b.dataset.case === i)));
    const t = tests[i], v = verdicts[i], r = v.r || {};
    let html = `<div class="rcase__row"><span>Input</span><pre class="io">${esc(H.formatArgs(meta, t))}</pre></div>`;
    html += `<div class="rcase__row"><span>Expected${data.compare === 'checker' ? ' (one valid answer)' : ''}</span><pre class="io">${esc(H.formatValue(t.expected))}</pre></div>`;
    if (v.state === 'skip') html += `<p class="rcase__msg">Not run: an earlier test stopped the run.</p>`;
    else if (!r.ok) html += `<div class="rcase__row rcase__err"><span>Error</span><pre class="io">${esc(r.error)}${r.line ? `\n(line ${r.line})` : ''}</pre></div>${r.line ? `<p class="rcase__msg">${lineButton(r.line)}</p>` : ''}`;
    else html += `<div class="rcase__row rcase__row--got is-${v.state}"><span>Your output <b class="rcase__tag">${v.state === 'pass' ? MARK.pass + 'matches' : MARK.fail + 'does not match'}</b></span><pre class="io">${esc(H.formatValue(r.got))}</pre></div>${v.message ? `<p class="rcase__msg">${esc(v.message)}</p>` : ''}`;
    if (r.logs) html += `<div class="rcase__row"><span>Console output</span><pre class="io">${esc(r.logs)}</pre></div>`;
    body.innerHTML = html;
  };
  resultsEl.querySelectorAll('.rtab').forEach((b) => b.addEventListener('click', () => show(+b.dataset.case)));
  show(sel);
}

function renderCustom(out, t, expected) {
  if (!out.prepare?.ok) return renderPrepareError(out.prepare || { error: 'Unknown error' });
  const r = out.results[0] || {};
  let html = `<div class="results__summary"><span class="results__verdict is-busy">Custom run</span></div>`;
  html += `<div class="rcase"><div class="rcase__row"><span>Input</span><pre class="io">${esc(H.formatArgs(meta, t))}</pre></div>`;
  if (r.ok) {
    let state = '';
    if (expected !== null) state = H.compare(meta, { ...t, expected }, r.got).pass ? 'is-pass' : 'is-fail';
    html += `<div class="rcase__row rcase__row--got ${state}"><span>Your output</span><pre class="io">${esc(H.formatValue(r.got))}</pre></div>`;
    if (expected !== null) html += `<div class="rcase__row"><span>Reference solution's output</span><pre class="io">${esc(H.formatValue(expected))}</pre></div>`;
  } else if (r.skipped || r.timeout || r.error) html += `<div class="rcase__row rcase__err"><span>Error</span><pre class="io">${esc(r.error || 'Not run')}</pre></div>${lineButton(r.line)}`;
  if (r.logs) html += `<div class="rcase__row"><span>Console output</span><pre class="io">${esc(r.logs)}</pre></div>`;
  resultsEl.innerHTML = html + '</div>';
}

resultsEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-goto-line]');
  if (b) goToLine(+b.dataset.gotoLine);
});

runBtn.addEventListener('click', () => execute('run'));
submitBtn.addEventListener('click', () => execute('submit'));

/* custom input */
const customBox = $('[data-custom]');
const customToggle = $('[data-custom-toggle]');
customToggle.addEventListener('click', () => {
  customBox.hidden = !customBox.hidden;
  customToggle.setAttribute('aria-expanded', String(!customBox.hidden));
  if (!customBox.hidden) $('[data-custom-input]').focus();
});
$('[data-custom-run]').addEventListener('click', () => {
  const raw = $('[data-custom-input]').value.split('\n').map((l) => l.trim()).filter(Boolean);
  let test;
  try {
    const vals = raw.map((l) => JSON.parse(l));
    if (meta.signature.class) {
      if (vals.length !== 2 || !Array.isArray(vals[0]) || !Array.isArray(vals[1])) throw new Error('Write two lines: the ops list, then the args list.');
      test = { ops: vals[0], args: vals[1] };
    } else {
      const n = meta.signature.params.length;
      if (vals.length !== n) throw new Error(`Write ${n} line${n === 1 ? '' : 's'}, one JSON value per argument (${meta.signature.params.map((p) => p.name).join(', ')}).`);
      test = { args: vals };
    }
  } catch (e) {
    resultsEl.innerHTML = `<div class="results__summary"><span class="results__verdict is-fail">Could not read the custom input</span></div><p class="rcase__msg">${esc(e.message)}</p>`;
    return;
  }
  execute('custom', test);
});

/* ---------------------------------------------------------------------- */
/* hints + solution                                                        */
/* ---------------------------------------------------------------------- */
const hints = [...document.querySelectorAll('[data-hint]')];
const hintBtn = $('[data-hint-next]');
const hintCount = $('[data-hint-count]');
let shown = Math.min(hints.length, +(store.getRaw(`hints:${slug}`) || 0));
function paintHints() {
  hints.forEach((h, i) => (h.hidden = i >= shown));
  hintCount.textContent = `${shown} of ${hints.length} shown`;
  if (shown >= hints.length) hintBtn.hidden = true;
  else hintBtn.textContent = shown === 0 ? 'Show hint 1' : `Show hint ${shown + 1}`;
}
hintBtn.addEventListener('click', () => {
  shown = Math.min(hints.length, shown + 1);
  store.setRaw(`hints:${slug}`, String(shown));
  paintHints();
  hints[shown - 1].setAttribute('tabindex', '-1');
  hints[shown - 1].focus({ preventScroll: false });
});
paintHints();

function unlockSolution() {
  $('[data-solution-lock]').hidden = true;
  $('[data-solution-body]').hidden = false;
}
$('[data-giveup]').addEventListener('click', () => {
  store.setProblem(slug, { revealed: true, status: store.problemStatus(slug) === 'todo' ? 'attempted' : store.problemStatus(slug) });
  unlockSolution();
  paintStatus();
});
const st = store.problems()[slug];
if (st && (st.status === 'solved' || st.revealed)) unlockSolution();

/* ---------------------------------------------------------------------- */
/* boot                                                                    */
/* ---------------------------------------------------------------------- */
fallback.value = startCode(lang);
paintLang();
await loadEditor();
if (lang === 'py') ensurePython();
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !editor?.hasFocus) {
    e.preventDefault();
    execute(e.shiftKey ? 'submit' : 'run');
  }
});

/* ---------------------------------------------------------------------- */
/* phone: one thumb jump between the statement and the editor              */
/* ---------------------------------------------------------------------- */
(() => {
  const jump = $('[data-ws-jump]');
  const codeEl = document.getElementById('code');
  if (!jump || !codeEl || !('IntersectionObserver' in window)) return;
  const label = $('[data-ws-jump-label]', jump);
  let inCode = false;
  new IntersectionObserver(([en]) => {
    inCode = en.isIntersecting;
    jump.classList.toggle('is-up', inCode);
    jump.setAttribute('href', inCode ? '#problem' : '#code');
    label.textContent = inCode ? 'Read problem' : 'Write code';
  }, { rootMargin: '0px 0px -50% 0px' }).observe(codeEl);
  jump.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(inCode ? 'problem' : 'code');
    target.scrollIntoView({ block: 'start' });
    target.focus({ preventScroll: true });
  });
})();
