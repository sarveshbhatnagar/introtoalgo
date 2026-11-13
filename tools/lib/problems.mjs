// Practice problems: load, validate the schema, and run solutions in Node
// (JavaScript via node:vm) and CPython (python3) with the same harness the
// browser uses (assets/js/harness.js and assets/js/runner/harness.py).
import { readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { ROOT, joinLines } from './util.mjs';

const require = createRequire(import.meta.url);
export const H = require(join(ROOT, 'assets/js/harness.js'));
const HARNESS_JS = readFileSync(join(ROOT, 'assets/js/harness.js'), 'utf8');
const HARNESS_PY = join(ROOT, 'assets/js/runner/harness.py');

export const DIFFICULTIES = ['easy', 'medium', 'hard'];
export const COMPARE_MODES = ['exact', 'unordered', 'approx', 'checker'];
const TOP_KEYS = ['slug', 'title', 'topic', 'difficulty', 'pattern', 'aka', 'order', 'story', 'task', 'constraints', 'examples', 'hints', 'bruteForce', 'signature', 'mutates', 'starter', 'tests', 'compare', 'checker', 'solution', 'related'];
const REQUIRED = ['slug', 'title', 'topic', 'difficulty', 'pattern', 'order', 'story', 'task', 'constraints', 'examples', 'hints', 'bruteForce', 'signature', 'starter', 'tests', 'compare', 'solution', 'related'];
const SOLUTION_KEYS = ['js', 'py', 'walkthrough', 'time', 'timeWhy', 'space', 'spaceWhy', 'takeaway'];
const TYPE_RE = /^(int|float|string|bool|any|ListNode|TreeNode)(\[\])*$/;
export const TIMEOUT_MS = 3000;

const isStrOrLines = (v) => (typeof v === 'string' && v.trim() !== '') || (Array.isArray(v) && v.length > 0 && v.every((l) => typeof l === 'string'));

function valueMatches(v, type) {
  if (v === null) return true; // null is allowed everywhere (e.g. "return null when there is no answer")
  if (type === 'any') return true;
  if (type.endsWith('[]')) return Array.isArray(v) && v.every((x) => valueMatches(x, type.slice(0, -2)));
  switch (type) {
    case 'int': return Number.isInteger(v);
    case 'float': return typeof v === 'number' || ['Infinity', '-Infinity', 'NaN'].includes(v);
    case 'string': return typeof v === 'string';
    case 'bool': return typeof v === 'boolean';
    case 'ListNode': return Array.isArray(v) && v.every((x) => x !== null);
    case 'TreeNode': return Array.isArray(v);
    default: return false;
  }
}

/** Normalise a raw problem JSON (join line arrays) for the build and the runners. */
export function normalizeProblem(p) {
  const n = structuredClone(p);
  for (const k of ['story', 'task', 'bruteForce']) n[k] = joinLines(p[k]);
  n.starter = { js: joinLines(p.starter?.js), py: joinLines(p.starter?.py) };
  n.solution = { ...p.solution };
  for (const k of ['js', 'py', 'walkthrough', 'takeaway', 'timeWhy', 'spaceWhy']) n.solution[k] = joinLines(p.solution?.[k]);
  if (p.checker !== undefined) n.checker = joinLines(p.checker);
  n.hints = (p.hints || []).map(joinLines);
  n.examples = (p.examples || []).map((e) => ({ ...e, explanation: joinLines(e.explanation) }));
  n.compare = p.compare || 'exact';
  return n;
}

/** What the browser and runners need: no prose. */
export function runtimeMeta(n) {
  const meta = { slug: n.slug, signature: n.signature, compare: n.compare };
  if (n.mutates) meta.mutates = n.mutates;
  if (n.checker) meta.checker = n.checker;
  return meta;
}

export function allTests(n) {
  const ex = n.examples.map((e) => (n.signature.class ? { ops: e.ops, args: e.args, expected: e.expected } : { args: e.args, expected: e.expected }));
  return [...ex, ...n.tests];
}

/* ---------------------------------------------------------------------- */
/* schema                                                                  */
/* ---------------------------------------------------------------------- */
export function validateProblemSchema(raw, file, cur) {
  const errors = [], warnings = [];
  const E = (m) => errors.push({ line: null, msg: m });
  const W = (m) => warnings.push({ line: null, msg: m });
  const slugFromFile = basename(file, '.json');

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) { E('The file must contain one JSON object.'); return { errors, warnings }; }
  for (const k of Object.keys(raw)) if (!TOP_KEYS.includes(k)) E(`Unknown key "${k}". Allowed keys: ${TOP_KEYS.join(', ')}.`);
  for (const k of REQUIRED) if (raw[k] === undefined && !(k === 'compare')) E(`Missing required key "${k}".`);
  if (REQUIRED.some((k) => raw[k] === undefined && k !== 'compare')) return { errors, warnings };

  if (raw.slug !== slugFromFile) E(`"slug" is "${raw.slug}" but the file is named ${slugFromFile}.json. They must match.`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(raw.slug)) E('"slug" must be lowercase words joined by hyphens, like "matching-receipts".');
  if (cur.lessons.has(raw.slug)) W(`"slug" "${raw.slug}" is also a lesson slug. Pick a distinct problem name to avoid confusion.`);
  if (typeof raw.title !== 'string' || raw.title.length < 3 || raw.title.length > 70) E('"title" must be a string of 3 to 70 characters.');
  if (!cur.topics.has(raw.topic)) E(`"topic" "${raw.topic}" is not a practice topic. Use one of: ${[...cur.topics.keys()].join(', ')}.`);
  if (!DIFFICULTIES.includes(raw.difficulty)) E(`"difficulty" must be one of: ${DIFFICULTIES.join(', ')}.`);
  if (typeof raw.pattern !== 'string' || !raw.pattern.trim() || raw.pattern.length > 40) E('"pattern" must be a short label (max 40 characters), like "hash map".');
  else if (raw.pattern !== raw.pattern.toLowerCase()) W('"pattern" should be lowercase, like "hash map", so filters group nicely.');
  if (raw.aka !== undefined && (typeof raw.aka !== 'string' || !raw.aka.trim())) E('"aka" must be a non-empty string when present.');
  if (!Number.isInteger(raw.order) || raw.order < 1) E('"order" must be a positive integer (position within the topic).');
  for (const k of ['story', 'task', 'bruteForce']) if (!isStrOrLines(raw[k])) E(`"${k}" must be a non-empty string or a list of lines.`);
  if (!Array.isArray(raw.constraints) || !raw.constraints.length || !raw.constraints.every((c) => typeof c === 'string' && c.trim())) E('"constraints" must be a non-empty list of strings.');
  if (!Array.isArray(raw.hints) || raw.hints.length < 3 || raw.hints.length > 5 || !raw.hints.every(isStrOrLines)) E('"hints" must be a list of 3 to 5 hints (strings).');
  if (!Array.isArray(raw.related) || !raw.related.length) E('"related" must list at least one lesson slug.');
  else for (const s of raw.related) if (!cur.lessons.has(s)) E(`"related" lesson "${s}" is not in content/curriculum.json.`);
  if (raw.compare !== undefined && !COMPARE_MODES.includes(raw.compare)) E(`"compare" must be one of: ${COMPARE_MODES.join(', ')}.`);
  const mode = raw.compare || 'exact';
  if (mode === 'checker') {
    if (!isStrOrLines(raw.checker)) E('"compare": "checker" needs a "checker": JavaScript source defining function check(args, got, expected).');
    else try { H.compileChecker(joinLines(raw.checker)); } catch (e) { E('"checker" does not compile: ' + e.message); }
  } else if (raw.checker !== undefined) E('"checker" is only used with "compare": "checker".');

  // starter + solution
  if (!raw.starter || typeof raw.starter !== 'object' || !isStrOrLines(raw.starter.js) || !isStrOrLines(raw.starter.py)) E('"starter" must be {"js": …, "py": …}, each a string or list of lines.');
  else for (const k of Object.keys(raw.starter)) if (!['js', 'py'].includes(k)) E(`"starter": unknown key "${k}".`);
  const sol = raw.solution;
  if (!sol || typeof sol !== 'object') E('"solution" must be an object.');
  else {
    for (const k of Object.keys(sol)) if (!SOLUTION_KEYS.includes(k)) E(`"solution": unknown key "${k}". Allowed: ${SOLUTION_KEYS.join(', ')}.`);
    for (const k of SOLUTION_KEYS) if (!isStrOrLines(sol[k])) E(`"solution.${k}" is required (string or list of lines).`);
    for (const k of ['time', 'space']) if (typeof sol[k] === 'string' && !/^O\(.+\)$/.test(sol[k])) E(`"solution.${k}" must look like "O(n)" or "O(n log n)".`);
  }

  // signature
  const sig = raw.signature;
  const design = !!(sig && typeof sig === 'object' && sig.class !== undefined);
  const checkType = (t, where, allowVoid) => {
    if (typeof t !== 'string' || !(TYPE_RE.test(t.replace(/\s/g, '')) || (allowVoid && t === 'void'))) E(`${where}: type "${t}" is not supported. Use int, float, string, bool, any, ListNode, TreeNode, or any of these with [] (like int[][])${allowVoid ? ', or void' : ''}.`);
    else if (/^(ListNode|TreeNode)\[\]\[\]/.test(t.replace(/\s/g, ''))) E(`${where}: type "${t}" is not supported. ListNode and TreeNode can be nested at most one level (ListNode[], TreeNode[]).`);
    else if (design && /ListNode|TreeNode/.test(t)) E(`${where}: design problems do not support ListNode/TreeNode. Use plain values.`);
  };
  const checkParams = (params, where) => {
    if (!Array.isArray(params)) { E(`${where} must be a list of {"name": …, "type": …}.`); return; }
    params.forEach((p, i) => {
      if (!p || typeof p.name !== 'string' || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(p.name)) E(`${where}[${i}].name must be an identifier.`);
      checkType(p?.type, `${where}[${i}]`, false);
      for (const k of Object.keys(p || {})) if (!['name', 'type'].includes(k)) E(`${where}[${i}]: unknown key "${k}".`);
    });
  };
  if (!sig || typeof sig !== 'object') E('"signature" must be an object.');
  else if (design) {
    for (const k of Object.keys(sig)) if (!['class', 'init', 'methods'].includes(k)) E(`"signature": unknown key "${k}" for a design problem.`);
    if (!/^[A-Z][A-Za-z0-9]*$/.test(sig.class)) E('"signature.class" must be a PascalCase class name.');
    if (sig.init !== undefined) checkParams(sig.init.params || [], 'signature.init.params');
    if (!Array.isArray(sig.methods) || !sig.methods.length) E('"signature.methods" must be a non-empty list.');
    else sig.methods.forEach((m, i) => {
      if (!/^[a-z][A-Za-z0-9]*$/.test(m.name || '')) E(`signature.methods[${i}].name must be camelCase.`);
      checkParams(m.params || [], `signature.methods[${i}].params`);
      checkType(m.returns, `signature.methods[${i}].returns`, true);
    });
    if (raw.mutates) E('"mutates" cannot be used with a design problem.');
    if (mode === 'unordered' || mode === 'approx') W(`"compare": "${mode}" applies to the whole list of outputs in a design problem.`);
  } else {
    for (const k of Object.keys(sig)) if (!['function', 'params', 'returns'].includes(k)) E(`"signature": unknown key "${k}". Use function, params, returns (or class, init, methods for a design problem).`);
    if (!/^[a-z][A-Za-z0-9]*$/.test(sig.function || '')) E('"signature.function" must be a camelCase function name, like "findPair". Python uses the snake_case form (find_pair).');
    checkParams(sig.params, 'signature.params');
    checkType(sig.returns, 'signature.returns', true);
    if (raw.mutates !== undefined) {
      if (sig.returns !== 'void') E('"mutates" requires "signature.returns": "void".');
      if (!Array.isArray(sig.params) || !sig.params.some((p) => p.name === raw.mutates)) E(`"mutates" must name one of the params.`);
    } else if (sig.returns === 'void') E('"signature.returns" is "void" but "mutates" is not set. Name the param that is changed in place.');
    const outT = String(raw.mutates && Array.isArray(sig.params) ? (sig.params.find((p) => p.name === raw.mutates) || {}).type : sig.returns).replace(/\s/g, '');
    if (mode === 'unordered' && !/\[\]$/.test(outT) && outT !== 'any') E(`"compare": "unordered" needs a list result, but the result type is ${outT}.`);
    if (/float/.test(String(sig.returns)) && (mode === 'exact' || mode === 'unordered')) W(`"signature.returns" is ${sig.returns} but "compare" is "${mode}". Floating-point results usually need "compare": "approx".`);
  }
  if (errors.length) return { errors, warnings };

  // examples and tests
  const checkCase = (c, where, isExample) => {
    const allowed = design ? ['ops', 'args', 'expected'] : ['args', 'expected'];
    if (isExample) allowed.push('explanation');
    else allowed.push('note');
    for (const k of Object.keys(c || {})) if (!allowed.includes(k)) E(`${where}: unknown key "${k}". Allowed: ${allowed.join(', ')}.`);
    if (!c || !Array.isArray(c.args)) return E(`${where}: "args" must be a list.`);
    if (!('expected' in c)) return E(`${where}: "expected" is required.`);
    if (isExample && !isStrOrLines(c.explanation)) E(`${where}: "explanation" is required. Walk through WHY this is the answer.`);
    if (design) {
      if (!Array.isArray(c.ops) || c.ops[0] !== sig.class) return E(`${where}: "ops" must be a list starting with "${sig.class}".`);
      if (c.args.length !== c.ops.length) return E(`${where}: "ops" and "args" must have the same length.`);
      if (!Array.isArray(c.expected) || c.expected.length !== c.ops.length) return E(`${where}: "expected" must have one entry per op (use null for the constructor and void methods).`);
      c.ops.forEach((op, i) => {
        const ms = H.methodSig(sig, op);
        if (!ms) return E(`${where}: op "${op}" is not the class or one of its methods.`);
        if (!Array.isArray(c.args[i]) || c.args[i].length !== ms.params.length) return E(`${where}: args for op ${i} ("${op}") must be a list of ${ms.params.length} value(s).`);
        c.args[i].forEach((v, j) => { if (!valueMatches(v, ms.params[j].type)) E(`${where}: op ${i} ("${op}") arg ${j + 1} does not match type ${ms.params[j].type}.`); });
        if (i > 0 && ms.returns !== 'void' && !valueMatches(c.expected[i], ms.returns)) E(`${where}: expected[${i}] does not match ${op}'s return type ${ms.returns}.`);
        if ((i === 0 || ms.returns === 'void') && c.expected[i] !== null) E(`${where}: expected[${i}] must be null (constructor or void method).`);
      });
    } else {
      if (c.args.length !== sig.params.length) return E(`${where}: "args" has ${c.args.length} value(s) but the function takes ${sig.params.length}.`);
      c.args.forEach((v, j) => { if (!valueMatches(v, sig.params[j].type.replace(/\s/g, ''))) E(`${where}: argument ${j + 1} (${sig.params[j].name}) does not match type ${sig.params[j].type}.`); });
      const outType = raw.mutates ? sig.params.find((p) => p.name === raw.mutates).type : sig.returns;
      if (c.expected === null && /^(ListNode|TreeNode)$/.test(outType.replace(/\s/g, ''))) E(`${where}: "expected" is null, but an empty ${outType} is written [] (returning null / None is converted to []).`);
      else if (!valueMatches(c.expected, outType.replace(/\s/g, ''))) E(`${where}: "expected" does not match type ${outType}.`);
    }
    const size = JSON.stringify(c).length;
    if (size > 20000) W(`${where} is large (${size} characters). Keep tests small enough to read; the timeout only catches infinite loops.`);
  };
  if (!Array.isArray(raw.examples) || raw.examples.length < 1 || raw.examples.length > 4) E('"examples" must be a list of 1 to 4 examples.');
  else raw.examples.forEach((c, i) => checkCase(c, `examples[${i}]`, true));
  if (!Array.isArray(raw.tests) || raw.tests.length < 8) E('"tests" must be a list of at least 8 hidden tests (edge cases included).');
  else {
    if (raw.tests.length > 60) E('"tests": at most 60 tests.');
    raw.tests.forEach((c, i) => checkCase(c, `tests[${i}]`, false));
    const seen = new Set();
    for (const [i, c] of [...raw.examples, ...raw.tests].entries()) {
      const key = JSON.stringify([c.ops, c.args]);
      if (seen.has(key)) W(`Test ${i + 1} duplicates an earlier test's input.`);
      seen.add(key);
    }
  }
  return { errors, warnings };
}

/* ---------------------------------------------------------------------- */
/* running                                                                 */
/* ---------------------------------------------------------------------- */

// Returns { prepare: {ok, error, line}, results: [{ok, got, error, line, logs}] }
export function runJs(meta, code, tests, timeout = TIMEOUT_MS) {
  let logs = [];
  const log = (...a) => logs.push(a.map(H.formatLogArg).join(' '));
  const ctx = vm.createContext({ console: { log, info: log, warn: log, error: log, debug: log } });
  vm.runInContext(HARNESS_JS, ctx, { filename: 'harness.js' });
  vm.runInContext('globalThis.ListNode = IAHarness.ListNode; globalThis.TreeNode = IAHarness.TreeNode;', ctx);
  const name = H.entryName(meta.signature, 'js');
  try {
    vm.runInContext(`${code}\n;globalThis.__ia_entry = (typeof ${name} !== 'undefined') ? ${name} : undefined;`, ctx, { filename: 'solution.js', timeout });
  } catch (e) {
    return { prepare: { ok: false, error: H.errorText(e), line: H.errorLine(e) ?? syntaxLine(e) }, results: [] };
  }
  ctx.__problem = JSON.stringify(meta);
  let stopped = false;
  const results = tests.map((t) => {
    // After a timeout the rest would only time out too: skip them, like the browser does.
    if (stopped) return { ok: false, skipped: true, error: 'Not run: an earlier test timed out', line: null, logs: '' };
    logs = [];
    ctx.__test = JSON.stringify(t);
    try {
      const out = vm.runInContext('JSON.stringify(IAHarness.runJsTest(__ia_entry, JSON.parse(__problem), JSON.parse(__test)))', ctx, { filename: 'runner.js', timeout });
      return { ok: true, got: out === undefined ? null : JSON.parse(out), logs: logs.join('\n') };
    } catch (e) {
      const timedOut = e && e.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT';
      if (timedOut) stopped = true;
      return { ok: false, error: timedOut ? `Time limit exceeded (${timeout / 1000}s)` : H.errorText(e), line: timedOut ? null : H.errorLine(e), logs: logs.join('\n') };
    }
  });
  return { prepare: { ok: true }, results };
}

function syntaxLine(e) {
  const m = String(e && e.stack).match(/solution\.js:(\d+)/);
  return m ? +m[1] : null;
}

let pythonOk = null;
export function hasPython() {
  if (pythonOk === null) pythonOk = spawnSync('python3', ['--version']).status === 0;
  return pythonOk;
}

export function runPy(meta, code, tests, timeout = TIMEOUT_MS) {
  const job = { code, problem: meta, tests, timeout: timeout / 1000 };
  const r = spawnSync('python3', ['-I', HARNESS_PY, '--batch'], { input: JSON.stringify(job), encoding: 'utf8', timeout: timeout * (tests.length + 2) + 5000, maxBuffer: 64 * 1024 * 1024 });
  if (r.error) return { prepare: { ok: false, error: 'Could not run python3: ' + r.error.message }, results: [] };
  if (r.status !== 0) return { prepare: { ok: false, error: 'python3 failed: ' + (r.stderr || '').trim().split('\n').slice(-3).join(' ') }, results: [] };
  try { return JSON.parse(r.stdout); } catch { return { prepare: { ok: false, error: 'Bad output from harness.py: ' + r.stdout.slice(0, 200) }, results: [] }; }
}

// Run code against all tests and compare. Returns { passed, total, failures: [...] }
export function judge(n, lang, code) {
  const meta = runtimeMeta(n);
  const tests = allTests(n);
  const run = lang === 'js' ? runJs(meta, code, tests) : runPy(meta, code, tests);
  if (!run.prepare.ok) return { passed: 0, total: tests.length, prepareError: `${run.prepare.error}${run.prepare.line ? ` (line ${run.prepare.line})` : ''}`, failures: [] };
  const failures = [];
  let passed = 0;
  run.results.forEach((r, i) => {
    if (!r.ok) return failures.push({ i, error: `${r.error}${r.line ? ` (line ${r.line})` : ''}` });
    const c = H.compare(meta, tests[i], r.got);
    if (c.pass) passed++;
    else failures.push({ i, expected: tests[i].expected, got: r.got, message: c.message });
  });
  return { passed, total: tests.length, failures };
}

export function describeFailure(f, n) {
  const label = f.i < n.examples.length ? `example ${f.i + 1}` : `test ${f.i - n.examples.length + 1}`;
  if (f.error) return `${label}: ${f.error}`;
  return `${label}: expected ${H.formatValue(f.expected, 200)}, got ${H.formatValue(f.got, 200)}${f.message ? ` (${f.message})` : ''}`;
}

export function checkProblemFile(file, cur, { run = true } = {}) {
  let raw;
  try { raw = JSON.parse(readFileSync(file, 'utf8')); }
  catch (e) { return { errors: [{ line: null, msg: 'Invalid JSON: ' + e.message }], warnings: [] }; }
  const { errors, warnings } = validateProblemSchema(raw, file, cur);
  if (errors.length || !run) return { errors, warnings, problem: errors.length ? null : normalizeProblem(raw) };
  const n = normalizeProblem(raw);
  const E = (m) => errors.push({ line: null, msg: m });

  // the checker must accept the expected answers themselves
  if (n.compare === 'checker') {
    allTests(n).forEach((t, i) => {
      const c = H.compare(runtimeMeta(n), t, t.expected);
      if (!c.pass) E(`checker rejects the "expected" value of test ${i + 1}${c.message ? `: ${c.message}` : ''}.`);
    });
  }

  for (const lang of ['js', 'py']) {
    const L = lang === 'js' ? 'JavaScript' : 'Python';
    if (lang === 'py' && !hasPython()) { warnings.push({ line: null, msg: 'python3 not found; Python solutions were not run.' }); continue; }
    const ref = judge(n, lang, n.solution[lang]);
    if (ref.prepareError) E(`${L} reference solution does not run: ${ref.prepareError}`);
    else if (ref.failures.length) {
      E(`${L} reference solution fails ${ref.failures.length} of ${ref.total} tests:`);
      ref.failures.slice(0, 5).forEach((f) => E('  ' + describeFailure(f, n)));
      if (n.compare === 'exact' && ref.failures.some((f) => !f.error && H.compare({ compare: 'approx' }, { expected: f.expected }, f.got).pass)) E(`  The outputs differ only by floating-point rounding. Use "compare": "approx" for float results.`);
    }
    const st = judge(n, lang, n.starter[lang]);
    if (st.prepareError && /SyntaxError|IndentationError/.test(st.prepareError)) E(`${L} starter code does not parse: ${st.prepareError}`);
    else if (!st.prepareError && st.passed === st.total) E(`${L} starter code already passes every test. The starter must not solve the problem.`);
    if (st.prepareError && /Could not find/.test(st.prepareError)) E(`${L} starter: ${st.prepareError}`);
  }
  return { errors, warnings, problem: n };
}
